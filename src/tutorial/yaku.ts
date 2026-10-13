import type { Wind } from '../engine/score';
import type { ExplainSlide } from './types';

export const YAKU_SLIDES: ExplainSlide[] = [
  { id: 's1' },
  { id: 's2' },
  { id: 's3' },
  { id: 's4' },
  { id: 's5' },
  { id: 's6', rows: ['234m 567p 345s 678s 55p'] },
  { id: 's7', rows: ['555z 666z 777z', '111z 222z'] },
  { id: 's8', rows: ['222m 555p 888s 777z 99s'] },
  { id: 's9', rows: ['11m 33m 55p 77p 22s 99s 44z'] },
  { id: 's10', rows: ['123m 456p 678s 99p 45s'] },
  { id: 's11' },
];

/** 台本：立直してツモ和了するまで。discard: 'riichi:1z' は立直宣言して 1z を切る */
export const STAGE5_GUIDED_HAND = '234m678p111s99s3s1z';
export const STAGE5_GUIDED: { id: string; draw: string; action: 'riichi' | 'discard' | 'tsumo'; tile?: string }[] = [
  { id: 'g1', draw: '5s', action: 'riichi', tile: '1z' },
  { id: 'g2', draw: '9m', action: 'discard', tile: '9m' },
  { id: 'g3', draw: '4s', action: 'tsumo' },
];
export const STAGE5_SEAT: Wind = 2;
export const STAGE5_ROUND: Wind = 1;

export const QUIZ5_LENGTH = 6;
export const QUIZ5_PASS = 4;
