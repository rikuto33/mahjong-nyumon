import type { ExplainSlide } from './types';

export const CALLS_SLIDES: ExplainSlide[] = [
  { id: 's1' },
  { id: 's2', rows: ['77p 7p'] },
  { id: 's3', rows: ['45m 6m'] },
  { id: 's4', rows: ['1111z'] },
  { id: 's6' },
  { id: 's7' },
  { id: 's8' },
  { id: 's9' },
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

export const QUIZ7_LENGTH = 6;
export const QUIZ7_PASS = 5;
