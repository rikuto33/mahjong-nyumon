import { makeTiles } from '../game/arrange';
import { apply, handOf, responseOptions, startHand, turnOptions, visibleCounts, type HandState, type Response, type Seat } from '../game/hand';
import { shanten } from '../engine/shanten';
import { kindOf, parseTiles, type Tile } from '../engine/tile';
import { acceptance, waits } from '../engine/waits';
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
  /**
   * 他家のツモ切り。id があれば最初の 1 回だけ説明を読むまで待つ。
   * feed: 'win' はこの他家が自分の和了牌を切るように、'pairForMe' は次に自分が引く牌が自分の孤立牌と対子になるように、山を差し替える
   * （選び方によって手牌が変わっても台本が成り立つように）
   */
  | { kind: 'ai'; id?: string; feed?: 'win' | 'pairForMe' }
  /** 指示どおりに切る */
  | { kind: 'discard'; id: string; tile: string }
  /** 引いた牌をそのまま切る（立直後など。引く牌は分岐によって変わる） */
  | { kind: 'tsumogiri'; id: string }
  /**
   * 自分で選んで切る。accept はどれも同じくらい良い答え（手牌にあるものだけが対象で、選んだ牌をそのまま切る）。
   * ok は悪くはないが少し劣る答え（説明のあと accept の牌を切ってもらう）
   */
  | { kind: 'choose'; id: string; accept: string[]; ok?: string[]; override?: boolean }
  | { kind: 'call'; id: string; call: 'pon' | 'chi' }
  /** 鳴ける場面で見送る */
  | { kind: 'pass'; id: string }
  /** 立直して切る（accept のどれでもよい） */
  | { kind: 'riichi'; id: string; accept: string[]; ok?: string[]; override?: boolean }
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

/**
 * その場面で正解になる牌：accept のうち手牌にあり、切っても向聴数が最小のままのもの
 * （例：七対子で孤立牌の候補だった牌が対子になっていたら、もう正解ではない）
 */
export function acceptedTiles(h: HandState, accept: string[]): Tile[] {
  const mine = handOf(h, 0);
  const melds = h.players[0].melds.length;
  const sh = (t: Tile) => {
    const rest = [...mine];
    rest.splice(rest.indexOf(t), 1);
    return shanten(rest, melds);
  };
  const min = Math.min(...mine.map(sh));
  return [...new Set(accept.map(tileOf))].filter((t) => mine.includes(t) && sh(t) === min);
}

/** 山の i 番目と j 番目を入れ替える */
function swapWall(h: HandState, i: number, j: number): HandState {
  const wall = [...h.wall];
  [wall[i], wall[j]] = [wall[j], wall[i]];
  return { ...h, wall };
}

/** 他家のツモ牌を、自分の和了牌に差し替える（山の中の同じ種類の牌と交換） */
export function feedWinToAi(h: HandState): HandState {
  const me = h.players[0];
  const ws = waits(me.hand, me.melds.length);
  const i = h.wall.findIndex((t) => ws.includes(kindOf(t)));
  if (i < 0) throw new Error('no winning tile left in the wall');
  const seat = h.turn;
  const drawn = h.players[seat].drawn!;
  const wall = [...h.wall];
  const winTile = wall[i];
  wall[i] = drawn;
  const players = h.players.map((p, s) => (s === seat ? { ...p, drawn: winTile } : p));
  return { ...h, wall, players };
}

/** 次に自分が引く牌（山の先頭）を、自分の孤立牌と対子になる牌にする（数牌の孤立牌を優先し、字牌は待ち用に残す） */
export function feedPairForMe(h: HandState): HandState {
  const counts = new Map<number, number>();
  for (const t of h.players[0].hand) counts.set(kindOf(t), (counts.get(kindOf(t)) ?? 0) + 1);
  const singles = [...counts].filter(([, n]) => n === 1).map(([k]) => k);
  const numberSingles = singles.filter((k) => k < 27);
  const want = numberSingles.length ? numberSingles : singles;
  const i = h.wall.findIndex((t) => want.includes(kindOf(t)));
  if (i < 0) throw new Error('no pairing tile left in the wall');
  return swapWall(h, 0, i);
}

/** 他家のステップを 1 つ進める（差し替え → ツモ切り → 次が自分の応答でなければ全員パス → 必要なら自分のツモを差し替え） */
export function runAiStep(h: HandState, step: Extract<ScriptStep, { kind: 'ai' }>, next: ScriptStep | undefined): HandState {
  if (step.feed === 'win') h = feedWinToAi(h);
  h = aiTsumogiri(h);
  if (waitsForHuman(next)) return h;
  if (step.feed === 'pairForMe') {
    // 応答を流すと自分のツモになるので、その前に山の先頭を差し替える
    h = feedPairForMe(h);
  }
  return passAll(h);
}

/** 次のステップが自分の応答（鳴き・見送り・ロン）か */
export const waitsForHuman = (next: ScriptStep | undefined) =>
  !!next && (next.kind === 'call' || next.kind === 'pass' || next.kind === 'ron');

/**
 * テスト用：台本を最後まで実行し、各ステップで指示どおりの操作ができるか確かめる。
 * 選ぶ場面は accept のすべての選び方を試す（全分岐）。終局した局面をすべて返す。
 */
export function simulateScript(script: Script): HandState[] {
  const results: HandState[] = [];
  const run = (h: HandState, i: number, path: string) => {
    const fail = (msg: string): never => {
      throw new Error(`[${path}] step ${i} (${JSON.stringify(script.steps[i])}): ${msg}`);
    };
    const humanDiscard = (tile: Tile, riichi = false) => {
      if (h.phase !== 'turn' || h.turn !== 0) fail('not my turn');
      const opts = turnOptions(h);
      if (!(riichi ? opts.riichiDiscards : opts.discards).includes(tile)) fail(`cannot discard ${tile}`);
      let n = apply(h, { type: 'discard', tile, riichi });
      for (const s of [1, 2, 3] as Seat[]) if (responseOptions(n, s).ron) fail(`seat ${s} could ron on ${tile}`);
      n = passAll(n);
      return n;
    };
    for (; i < script.steps.length; i++) {
      const step = script.steps[i];
      const next = script.steps[i + 1];
      switch (step.kind) {
        case 'info':
          break;
        case 'ai': {
          if (h.phase !== 'turn' || h.turn === 0) fail('expected an AI turn');
          const before = h;
          h = runAiStep(h, step, next);
          if (!waitsForHuman(next)) {
            // 自分がロンできたのに台本が流していないか（流した直後の状態ではなく、捨てた直後で確認）
            const discarded = aiTsumogiri(step.feed === 'win' ? feedWinToAi(before) : before);
            if (responseOptions(discarded, 0).ron) fail('I could ron unexpectedly');
          }
          break;
        }
        case 'discard':
          h = humanDiscard(tileOf(step.tile));
          break;
        case 'tsumogiri':
          h = humanDiscard(h.players[0].drawn!);
          break;
        case 'choose':
        case 'riichi': {
          if (h.turn !== 0 || h.phase !== 'turn') fail('not my turn');
          const options = acceptedTiles(h, step.accept);
          if (options.length === 0) fail('no accepted tile in hand');
          const all = handOf(h, 0);
          const melds = h.players[0].melds.length;
          const sh = (t: Tile) => {
            const rest = [...all];
            rest.splice(rest.indexOf(t), 1);
            return shanten(rest, melds);
          };
          const min = Math.min(...all.map(sh));
          for (const t of options) if (sh(t) !== min) fail(`${t} is not an efficient discard (min shanten ${min})`);
          // 同じくらい良い牌を不正解にしていないか：向聴数が最小で受け入れ枚数も最大の牌は、必ず正解に含める
          // （七対子の待ち選びのように、狙いに基づく判断で外す場合は override と説明文で理由を示す）
          if (!step.override) {
            const vis = visibleCounts(h, 0);
            const ukeire = (t: Tile) => {
              const rest = [...all];
              rest.splice(rest.indexOf(t), 1);
              return acceptance(rest, melds, vis).count;
            };
            const efficient = [...new Set(all)].filter((t) => sh(t) === min);
            const max = Math.max(...efficient.map(ukeire));
            const best = efficient.filter((t) => ukeire(t) === max);
            for (const t of best) if (!options.includes(t)) fail(`${t} is as good as the answer (ukeire ${max}) but not accepted`);
            for (const t of options) if (ukeire(t) < max) fail(`${t} is accepted but has less ukeire (${ukeire(t)} < ${max})`);
          }
          // 分岐：残りは再帰で
          for (const t of options) {
            const saved = h;
            h = humanDiscard(t, step.kind === 'riichi');
            run(h, i + 1, `${path}${t} `);
            h = saved;
          }
          return;
        }
        case 'call': {
          const opts = responseOptions(h, 0);
          if (opts.ron) fail('ron was possible');
          if (!opts.calls.some((c) => c.type === step.call)) fail(`cannot ${step.call}`);
          h = respondHuman(h, step.call);
          break;
        }
        case 'pass': {
          const opts = responseOptions(h, 0);
          if (opts.ron) fail('ron was possible');
          if (opts.calls.length === 0) fail('nothing to pass');
          h = respondHuman(h, 'pass');
          break;
        }
        case 'ron': {
          const r = responseOptions(h, 0).ron;
          if (!r) fail('cannot ron');
          for (const y of script.expectYaku ?? []) if (!r!.yaku.some((x) => x.id === y)) fail(`missing yaku ${y}`);
          h = respondHuman(h, 'ron');
          break;
        }
        case 'tsumo': {
          const r = turnOptions(h).tsumo;
          if (!r) fail('cannot tsumo');
          for (const y of script.expectYaku ?? []) if (!r!.yaku.some((x) => x.id === y)) fail(`missing yaku ${y}`);
          h = apply(h, { type: 'tsumo' });
          break;
        }
      }
    }
    if (h.phase !== 'ended') throw new Error(`[${path}] script did not end the hand`);
    results.push(h);
  };
  run(scriptHand(script.setup), 0, '');
  return results;
}
