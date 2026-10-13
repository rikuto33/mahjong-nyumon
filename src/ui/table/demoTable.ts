import { parseTiles } from '../../engine/tile';
import type { Discard, TableView } from './types';

const d = (s: string, riichiAt = -1): Discard[] =>
  parseTiles(s).map((tile, i) => (i === riichiAt ? { tile, riichi: true } : { tile }));

/** 卓レイアウト確認用の固定データ */
export const DEMO_TABLE: TableView = {
  roundWind: 1,
  roundNumber: 2,
  honba: 1,
  riichiSticks: 1,
  remaining: 48,
  doraIndicators: parseTiles('3p'),
  seats: [
    {
      wind: 4,
      score: 24000,
      riichi: false,
      discards: d('19m4z2p8s6z7m'),
      melds: [{ tiles: parseTiles('777p'), sideways: 2 }],
      handCount: 10,
    },
    {
      wind: 1,
      score: 31300,
      riichi: false,
      discards: d('1z9p2m7z8m1s5z4s'),
      melds: [{ tiles: parseTiles('666z'), sideways: 0 }],
      handCount: 10,
    },
    { wind: 2, score: 19700, riichi: true, discards: d('9s1p3z8p2s7m4m6s1m9p0s2z', 7), melds: [], handCount: 13 },
    { wind: 3, score: 24000, riichi: false, discards: d('4z9m1s3z8p2p5z'), melds: [], handCount: 13 },
  ],
  myHand: parseTiles('2340m56p346s11z'),
};
