import type { ExplainSlide } from './types';

export const STAGE4_SLIDES: ExplainSlide[] = [
  { id: 's1', rows: ['123m 456p 789s 11z 45s'] },
  { id: 's2' },
  { id: 's3', rows: ['45s'] },
  { id: 's4', rows: ['46p', '12m 89m'] },
  { id: 's5', rows: ['55p 77s', '3z'] },
  { id: 's6', rows: ['2345m'] },
];

/** 台本：待ちの形ごとに 1 手。waits は答え（エンジンの結果とテストで照合） */
export const STAGE4_GUIDED: { id: string; hand: string; waits: string }[] = [
  { id: 'g1', hand: '123m456p789s11z45s', waits: '36s' },
  { id: 'g2', hand: '234m567p789s46m11z', waits: '5m' },
  { id: 'g3', hand: '123m456p789s12p55z', waits: '3p' },
  { id: 'g4', hand: '123m456p789s55p77s', waits: '5p7s' },
  { id: 'g5', hand: '123m456p789s111z3z', waits: '3z' },
];

/** 練習問題。easy は待ちの形が 1 つ、hard は複数の読み方がある手 */
export const STAGE4_QUIZ_EASY = [
  '234m567p789s46m11z',
  '67m345p234s55z789m',
  '123p456s789m35s22z',
  '123m456p789s12p55z',
  '345m678m2233p678s',
  '234p567s11z222z89m',
];
export const STAGE4_QUIZ_HARD = [
  '2345m456p789s111z',
  '1234m567p789s111z',
  '23456m345p678s22z',
  '11123m456p789s22z',
  '2223m456p789s111z',
  '5556p123m789s111z',
  '34567s123m456p11z',
];
export const QUIZ4_EASY_COUNT = 2;
export const QUIZ4_HARD_COUNT = 3;
export const QUIZ4_PASS = 4;
