import type { CalledMeld } from '../engine/score';
import type { ExplainSlide } from './types';

export const STAGE7_SLIDES: ExplainSlide[] = [
  { id: 's1' },
  { id: 's2', rows: ['77p 7p'] },
  { id: 's3', rows: ['45m 6m'] },
  { id: 's4', rows: ['1111z'] },
  { id: 's5' },
  { id: 's6' },
  { id: 's7' },
  { id: 's8' },
  { id: 's9', rows: ['45m 3m'] },
];

export type From = 'left' | 'opposite' | 'right';

/** 鳴きの場面。action は台本で求める操作、discard は鳴いたあとに切る牌 */
export type CallScene = { hand: string; tile: string; from: From };

export const STAGE7_GUIDED: { id: string; scene: CallScene; action: 'pon' | 'chi' | 'skip'; discard?: string }[] = [
  { id: 'g1', scene: { hand: '234m567p34s99p77z1m', tile: '7z', from: 'opposite' }, action: 'pon', discard: '1m' },
  { id: 'g2', scene: { hand: '234m67p345s66s88p1m', tile: '5p', from: 'left' }, action: 'chi', discard: '1m' },
  { id: 'g3', scene: { hand: '234m67p345s66s88p1m', tile: '5p', from: 'opposite' }, action: 'skip' },
  { id: 'g4', scene: { hand: '234m67p345s99p77z1m', tile: '5p', from: 'left' }, action: 'skip' },
];

/** 練習 A：できる鳴きを選ぶ */
export const STAGE7_QUIZ_CALLS: CallScene[] = [
  { hand: '45m77p123s456s789s', tile: '7p', from: 'right' },
  { hand: '45m77p123s456s789s', tile: '3m', from: 'left' },
  { hand: '45m77p123s456s789s', tile: '3m', from: 'opposite' },
  { hand: '111z23m456p789s99s', tile: '1z', from: 'right' },
  { hand: '3467m1p123s456s99s', tile: '5m', from: 'left' },
  { hand: '45m77p123s456s789s', tile: '7p', from: 'left' },
  { hand: '345m789p11s456s77z', tile: '7z', from: 'left' },
  { hand: '12m55p345s678s99s1z', tile: '3m', from: 'left' },
];

/** 練習 B：鳴いた手で和了れるか（ロン、南家・東場） */
export type OpenWinItem = { hand: string; win: string; melds: { type: CalledMeld['type']; tiles: string }[] };
export const STAGE7_QUIZ_OPEN: OpenWinItem[] = [
  { hand: '234m567p55p67s', win: '8s', melds: [{ type: 'chi', tiles: '345s' }] },
  { hand: '234m567p99p78s', win: '9s', melds: [{ type: 'chi', tiles: '345s' }] },
  { hand: '234m567p345s7s', win: '7s', melds: [{ type: 'pon', tiles: '777z' }] },
  { hand: '123m567p55p78s', win: '9s', melds: [{ type: 'pon', tiles: '222p' }] },
  { hand: '234m345p66s78s', win: '6s', melds: [{ type: 'pon', tiles: '444s' }] },
  { hand: '123456m11z78m', win: '9m', melds: [{ type: 'pon', tiles: '999m' }] },
  { hand: '234m567p345s9s', win: '9s', melds: [{ type: 'chi', tiles: '678s' }] },
];
export const QUIZ7_CALLS = 3;
export const QUIZ7_OPEN = 3;
export const QUIZ7_PASS = 5;
