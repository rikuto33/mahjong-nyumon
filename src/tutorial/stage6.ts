import type { Wind } from '../engine/score';
import type { ExplainSlide } from './types';

export const STAGE6_SLIDES: ExplainSlide[] = [{ id: 's1' }, { id: 's2' }, { id: 's3' }, { id: 's4' }, { id: 's5' }];

/** ロンの場面。hand は 13 枚、river は自分の捨て牌、tile は他家の捨て牌 */
export type RonScene = {
  hand: string;
  river: string;
  tile: string;
  riichi?: boolean;
  skippedThisTurn?: boolean;
  skippedAfterRiichi?: boolean;
  seatWind: Wind;
  roundWind: Wind;
};
const s = (hand: string, river: string, tile: string, extra: Partial<RonScene> = {}): RonScene => ({
  hand,
  river,
  tile,
  seatWind: 2,
  roundWind: 1,
  ...extra,
});

/** 台本：ロンできる → フリテン → 役なし の順 */
export const STAGE6_GUIDED: { id: string; scene: RonScene }[] = [
  { id: 'g1', scene: s('234m567p345s55p67s', '1z9m2p', '8s') },
  { id: 'g2', scene: s('234m567p345s55p67s', '1z5s9m', '8s') },
  { id: 'g3', scene: s('111m567p345s99p78s', '1z4z2p', '9s') },
];

export const STAGE6_QUIZ: RonScene[] = [
  s('234m567p345s55p67s', '1z9m', '5s'),
  s('234m567p345s55p67s', '1z8s', '5s'),
  s('234m567p345s55p67s', '1z9m', '9s'),
  s('234m567p345s55p67s', '1z9m', '8s', { skippedThisTurn: true }),
  s('111m567p345s99p78s', '1z4z', '6s'),
  s('111m567p345s99p78s', '1z4z', '6s', { riichi: true }),
  s('111m567p345s99p78s', '1z4z', '9s', { riichi: true, skippedAfterRiichi: true }),
  s('234m567p345s555z7s', '1m9p', '7s'),
  s('234m567p345s555z7s', '1m7s', '7s'),
  s('1133m5577p2299s4z', '1s', '4z'),
  s('123m567p345s99p79s', '1z', '8s'),
  s('223344m567p99s78s', '2z', '9s'),
];
export const QUIZ6_LENGTH = 6;
export const QUIZ6_PASS = 5;
