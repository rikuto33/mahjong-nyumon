import { makeTiles } from '../game/arrange';
import { apply, startHand, type HandState, type Response, type Seat } from '../game/hand';

/*
 * 段階 1「まず 1 局やってみる」の台本。
 * 自分は席 0（南家）、親は左の席 3（東家）。他家はツモ切りだけをする。
 * 自分は北を切る → 中をポン → チー → 九萬単騎で聴牌 → ロン（役は中、ドラ 1）。
 */
export const INTRO_DEALER: Seat = 3;

export function introHand(): HandState {
  return startHand({
    roundWind: 1,
    roundNumber: 1,
    dealer: INTRO_DEALER,
    honba: 0,
    riichiSticks: 0,
    scores: [25000, 25000, 25000, 25000],
    tiles: makeTiles({
      dealer: INTRO_DEALER,
      hands: ['234m678s46p77z19m4z', null, null, null],
      draws: '2z1z7z8p3z5p1p9m',
      dora: '1m',
      seed: 7,
    }),
  });
}

export type IntroStep =
  | { kind: 'info'; id: string }
  | { kind: 'ai'; id?: string }
  | { kind: 'discard'; id: string; tile: string }
  | { kind: 'call'; id: string; call: 'pon' | 'chi' }
  | { kind: 'ron'; id: string };

export const INTRO_STEPS: IntroStep[] = [
  { kind: 'info', id: 'welcome' },
  { kind: 'info', id: 'goal' },
  { kind: 'ai', id: 'leftFirst' },
  { kind: 'discard', id: 'yourTurn', tile: '4z' },
  { kind: 'ai', id: 'order' },
  { kind: 'call', id: 'pon', call: 'pon' },
  { kind: 'discard', id: 'afterPon', tile: '1z' },
  { kind: 'ai' },
  { kind: 'ai' },
  { kind: 'ai' },
  { kind: 'call', id: 'chi', call: 'chi' },
  { kind: 'discard', id: 'afterChi', tile: '1m' },
  { kind: 'ai', id: 'waiting' },
  { kind: 'ai' },
  { kind: 'ron', id: 'ron' },
  { kind: 'info', id: 'end' },
];

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
