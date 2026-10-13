import { makeTiles } from '../game/arrange';
import { apply, handOf, responseOptions, startHand, turnOptions, type HandState, type Response, type Seat } from '../game/hand';
import { shanten } from '../engine/shanten';
import { parseTiles, type Tile } from '../engine/tile';
import type { YakuId } from '../engine/yaku';

/*
 * 台本どおりに打つ局（段階 1「まず 1 局」と「考えながら打つ」のシナリオ）。
 * 自分は席 0。他家はツモ切りだけをする。山は最後まで指定して、想定外の和了が起きないようにする。
 */
export type ScriptSetup = {
  dealer: Seat;
  hands: (string | null)[];
  draws: string;
  dora: string;
  seed?: number;
};

export type ScriptStep =
  | { kind: 'info'; id: string }
  /** 他家のツモ切り。id があれば最初の 1 回だけ説明を読むまで待つ */
  | { kind: 'ai'; id?: string }
  /** 指示どおりに切る */
  | { kind: 'discard'; id: string; tile: string }
  /** 自分で選んで切る。tile が正解、alsoOk は「悪くない」答え（どちらでも最後は tile を切る） */
  | { kind: 'choose'; id: string; tile: string; alsoOk?: string[] }
  | { kind: 'call'; id: string; call: 'pon' | 'chi' }
  /** 鳴ける場面で見送る */
  | { kind: 'pass'; id: string }
  /** 立直して切る */
  | { kind: 'riichi'; id: string; tile: string }
  | { kind: 'ron'; id: string }
  | { kind: 'tsumo'; id: string };

export type Script = { setup: ScriptSetup; steps: ScriptStep[]; expectYaku?: YakuId[] };

export function scriptHand(setup: ScriptSetup): HandState {
  return startHand({
    roundWind: 1,
    roundNumber: 1,
    dealer: setup.dealer,
    honba: 0,
    riichiSticks: 0,
    scores: [25000, 25000, 25000, 25000],
    tiles: makeTiles({ dealer: setup.dealer, hands: setup.hands, draws: setup.draws, dora: setup.dora, seed: setup.seed ?? 7 }),
  });
}

export const tileOf = (s: string) => parseTiles(s)[0] as Tile;

/** 応答待ちを全員パスで流す */
export function passAll(h: HandState): HandState {
  if (h.phase !== 'respond' && h.phase !== 'chankan') return h;
  const from = h.phase === 'chankan' ? h.chankanTile!.from : h.lastDiscard!.from;
  const responses: Response[] = ([0, 1, 2, 3] as Seat[]).filter((s) => s !== from).map((seat) => ({ seat, action: 'pass' }));
  return apply(h, { type: 'respond', responses });
}

/** 他家のツモ切り（応答はまだ流さない） */
export function aiTsumogiri(h: HandState): HandState {
  return apply(h, { type: 'discard', tile: h.players[h.turn].drawn! });
}

/** 自分の応答（他家はパス） */
export function respondHuman(h: HandState, action: 'pon' | 'chi' | 'ron' | 'pass'): HandState {
  const from = h.lastDiscard!.from;
  const others = ([1, 2, 3] as Seat[]).filter((s) => s !== from);
  const mine: Response =
    action === 'ron'
      ? { seat: 0, action: 'ron' }
      : action === 'pass'
        ? { seat: 0, action: 'pass' }
        : { seat: 0, action: 'call', option: responseOptions(h, 0).calls.find((c) => c.type === action)! };
  return apply(h, { type: 'respond', responses: [mine, ...others.map((seat) => ({ seat, action: 'pass' as const }))] });
}

/** 次のステップが自分の応答（鳴き・見送り・ロン）か */
export const waitsForHuman = (next: ScriptStep | undefined) =>
  !!next && (next.kind === 'call' || next.kind === 'pass' || next.kind === 'ron');

/** テスト用：台本を最後まで実行し、各ステップで指示どおりの操作ができるか確かめる */
export function simulateScript(script: Script): HandState {
  let h = scriptHand(script.setup);
  const fail = (i: number, msg: string): never => {
    throw new Error(`step ${i} (${JSON.stringify(script.steps[i])}): ${msg}`);
  };
  const humanDiscard = (i: number, tile: Tile, riichi = false) => {
    if (h.phase !== 'turn' || h.turn !== 0) fail(i, 'not my turn');
    const opts = turnOptions(h);
    if (!(riichi ? opts.riichiDiscards : opts.discards).includes(tile)) fail(i, `cannot discard ${tile}`);
    h = apply(h, { type: 'discard', tile, riichi });
    for (const s of [1, 2, 3] as Seat[]) if (responseOptions(h, s).ron) fail(i, `seat ${s} could ron`);
    h = passAll(h);
  };
  script.steps.forEach((step, i) => {
    const next = script.steps[i + 1];
    switch (step.kind) {
      case 'info':
        break;
      case 'ai': {
        if (h.phase !== 'turn' || h.turn === 0) fail(i, 'expected an AI turn');
        h = aiTsumogiri(h);
        if (!waitsForHuman(next)) {
          if (responseOptions(h, 0).ron) fail(i, 'I could ron unexpectedly');
          h = passAll(h);
        }
        break;
      }
      case 'discard':
        humanDiscard(i, tileOf(step.tile));
        break;
      case 'choose': {
        if (h.turn !== 0 || h.phase !== 'turn') fail(i, 'not my turn');
        const all = handOf(h, 0);
        const melds = h.players[0].melds.length;
        const sh = (t: Tile) => {
          const rest = [...all];
          rest.splice(rest.indexOf(t), 1);
          return shanten(rest, melds);
        };
        const min = Math.min(...all.map(sh));
        const tile = tileOf(step.tile);
        if (sh(tile) !== min) fail(i, `${step.tile} is not an efficient discard (min shanten ${min})`);
        humanDiscard(i, tile);
        break;
      }
      case 'call': {
        const opts = responseOptions(h, 0);
        if (opts.ron) fail(i, 'ron was possible');
        if (!opts.calls.some((c) => c.type === step.call)) fail(i, `cannot ${step.call}`);
        h = respondHuman(h, step.call);
        break;
      }
      case 'pass': {
        const opts = responseOptions(h, 0);
        if (opts.ron) fail(i, 'ron was possible');
        if (opts.calls.length === 0) fail(i, 'nothing to pass');
        h = respondHuman(h, 'pass');
        break;
      }
      case 'riichi':
        humanDiscard(i, tileOf(step.tile), true);
        break;
      case 'ron': {
        const r = responseOptions(h, 0).ron;
        if (!r) fail(i, 'cannot ron');
        for (const y of script.expectYaku ?? []) if (!r!.yaku.some((x) => x.id === y)) fail(i, `missing yaku ${y}`);
        h = respondHuman(h, 'ron');
        break;
      }
      case 'tsumo': {
        const r = turnOptions(h).tsumo;
        if (!r) fail(i, 'cannot tsumo');
        for (const y of script.expectYaku ?? []) if (!r!.yaku.some((x) => x.id === y)) fail(i, `missing yaku ${y}`);
        h = apply(h, { type: 'tsumo' });
        break;
      }
    }
  });
  if (h.phase !== 'ended') throw new Error('script did not end the hand');
  return h;
}
