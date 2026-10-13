import type { Wind } from '../engine/score';
import type { ExplainSlide } from './types';

export const STAGE5_SLIDES: ExplainSlide[] = [
  { id: 's1' },
  { id: 's2' },
  { id: 's3' },
  { id: 's4' },
  { id: 's5', rows: ['234m 567p 345s 678s 55p'] },
  { id: 's6', rows: ['555z 666z 777z', '111z 222z'] },
  { id: 's7', rows: ['123m 567p 345s 99p 78s'] },
  { id: 's8', rows: ['234m 234m'] },
  { id: 's9', rows: ['11m 33m 55p 77p 22s 99s 44z'] },
  { id: 's10' },
];

/** 台本：立直してツモ和了するまで。discard: 'riichi:1z' は立直宣言して 1z を切る */
export const STAGE5_GUIDED_HAND = '234m678p456s99s3s1z';
export const STAGE5_GUIDED: { id: string; draw: string; action: 'riichi' | 'discard' | 'tsumo'; tile?: string }[] = [
  { id: 'g1', draw: '4s', action: 'riichi', tile: '1z' },
  { id: 'g2', draw: '9m', action: 'discard', tile: '9m' },
  { id: 'g3', draw: '2s', action: 'tsumo' },
];
export const STAGE5_SEAT: Wind = 2;
export const STAGE5_ROUND: Wind = 1;

/** 練習：役を当てる。hand は和了牌を除く 13 枚 */
export type YakuQuizItem = {
  hand: string;
  win: string;
  tsumo: boolean;
  riichi?: boolean;
  seatWind: Wind;
  roundWind: Wind;
};
const q = (hand: string, win: string, tsumo: boolean, extra: Partial<YakuQuizItem> = {}): YakuQuizItem => ({
  hand,
  win,
  tsumo,
  seatWind: 2,
  roundWind: 1,
  ...extra,
});
export const STAGE5_QUIZ: YakuQuizItem[] = [
  q('234m567p345s55p78s', '9s', true),
  q('234m567p345s55p67s', '8s', false),
  q('234m567p345s555z7s', '7s', false),
  q('123m567p345s99p78s', '9s', false),
  q('123m567p345s99p79s', '8s', false),
  q('111m567p345s99p78s', '9s', false),
  q('111m567p345s99p78s', '9s', false, { riichi: true }),
  q('1133m5577p2299s4z', '4z', false),
  q('223344m567p99s78s', '6s', false),
  q('234m567p345s333z7s', '7s', false, { seatWind: 3 }),
  q('234m567p345s111z7s', '7s', false),
  q('234m567p345s111z7s', '7s', false, { seatWind: 1 }),
  q('222m567p345s66s78s', '6s', false),
  q('234m567p345s55p67s', '8s', true),
  q('234m567p789s11m99s', '9s', false),
];
export const QUIZ5_LENGTH = 6;
export const QUIZ5_PASS = 5;
