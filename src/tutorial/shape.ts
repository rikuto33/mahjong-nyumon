import type { ExplainSlide } from './types';

export const SHAPE_SLIDES: ExplainSlide[] = [
  { id: 's1', rows: ['234m 406p 777s 111z 99m'] },
  { id: 's2', rows: ['345p 789m'] },
  { id: 's3', rows: ['777s 222z'] },
  { id: 's4', rows: ['55m 66z'] },
  { id: 's5', rows: ['234m 406p 777s 111z 99m'] },
  { id: 's6' },
];

/** 台本チュートリアルの手牌と、順に作る組 */
export const STAGE2_GUIDED_HAND = '23499m678p333s111z';
export const STAGE2_GUIDED: { id: string; group: string }[] = [
  { id: 'g1', group: '234m' },
  { id: 'g2', group: '678p' },
  { id: 'g3', group: '333s' },
  { id: 'g4', group: '111z' },
  { id: 'g5', group: '99m' },
];

/** 練習問題（すべて一般形の和了形。テストで検証する） */
export const STAGE2_PUZZLES: string[] = [
  '123456m789p222s55z',
  '111234m56667p789s',
  '223344m567p888s11z',
  '123p456s11155577z',
  '11123m456p789s222z',
  '34055m678p123s999s',
  '22345678m456p777s',
  '789m123p406s66677z',
];

export const PUZZLES_TO_CLEAR = 3;
