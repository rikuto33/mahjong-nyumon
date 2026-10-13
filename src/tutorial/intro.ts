import { makeTiles } from '../game/arrange';
import { apply, startHand, type HandState, type Response, type Seat } from '../game/hand';

/*
 * 段階 1「まず 1 局やってみる」の台本。
 * 自分は席 0（南家）、親は左の席 3（東家）。他家はツモ切りだけをする。
 * 何巡か打って手を整え、途中で中をポン・赤五筒をチーして 5・8 索待ちで聴牌、八索でロン
 * （役は中、ドラ 1・赤ドラ 1）。他家のツモは最後まで指定して、途中で想定外の和了やフリテンが起きないようにする。
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
      hands: ['239m46p6s77z14z9p3z1m', null, null, null],
      // 席 3 → 0 → 1 → 2 の順にツモる（ポン・チーのあとは自分の次の席から）
      draws: '6z4m9s5m3p9m2s8m6m7s3m5z7p2z7z4s1p0p2p3s6p1s9s8s',
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
  { kind: 'discard', id: 'yourTurn', tile: '1z' },
  { kind: 'ai', id: 'order' },
  { kind: 'ai' },
  { kind: 'ai' },
  { kind: 'discard', id: 'turn2', tile: '4z' },
  { kind: 'info', id: 'dora' },
  { kind: 'ai', id: 'keepGoing' },
  { kind: 'ai' },
  { kind: 'ai' },
  { kind: 'discard', id: 'turn3', tile: '1m' },
  { kind: 'ai', id: 'keepGoing' },
  { kind: 'ai' },
  { kind: 'ai' },
  { kind: 'discard', id: 'turn4', tile: '2z' },
  { kind: 'ai' },
  { kind: 'call', id: 'pon', call: 'pon' },
  { kind: 'discard', id: 'afterPon', tile: '3z' },
  { kind: 'ai', id: 'keepGoing' },
  { kind: 'ai' },
  { kind: 'ai' },
  { kind: 'call', id: 'chi', call: 'chi' },
  { kind: 'discard', id: 'afterChi', tile: '9p' },
  { kind: 'ai', id: 'waiting' },
  { kind: 'ai' },
  { kind: 'ai' },
  { kind: 'discard', id: 'turn5', tile: '1s' },
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
