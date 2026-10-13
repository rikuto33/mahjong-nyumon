import type { Wind } from '../engine/score';
import type { ExplainSlide } from './types';

export const RON_SLIDES: ExplainSlide[] = [{ id: 's1' }, { id: 's2' }, { id: 's3' }, { id: 's4' }];

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
  { id: 'g1', scene: s('234m456p678s55p77s', '1z9m2p', '7s') },
  { id: 'g2', scene: s('234m456p678s55p77s', '1z5p9m', '7s') },
  { id: 'g3', scene: s('111m567p345s99p78s', '1z4z2p', '9s') },
];

export const QUIZ6_LENGTH = 6;
export const QUIZ6_PASS = 5;
