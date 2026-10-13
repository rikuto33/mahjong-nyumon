import type { CalledMeld } from '../engine/score';
import type { ExplainSlide } from './types';

export const DORA_SLIDES: ExplainSlide[] = [
  { id: 's1', rows: ['3m 4m'] },
  { id: 's2', rows: ['9m 1m', '4z 1z', '7z 5z'] },
  { id: 's3' },
  { id: 's4', rows: ['0m0p0s'] },
  { id: 's5' },
  { id: 's6' },
];

/** 台本：ドラ表示牌を見て、ドラの牌をタップする */
export const STAGE8_GUIDED: { id: string; indicator: string }[] = [
  { id: 'g1', indicator: '3m' },
  { id: 'g2', indicator: '9p' },
  { id: 'g3', indicator: '4z' },
  { id: 'g4', indicator: '7z' },
  { id: 'g5', indicator: '5z' },
];

/** 練習 A：ドラを選ぶ */
export const STAGE8_QUIZ_PICK = ['6s', '9m', '2z', '4z', '6z', '7z', '0p', '8p'];

/** 練習 B：ドラの合計枚数（ドラ＋赤ドラ＋裏ドラ）を数える。hand は手の内 14 枚（副露分少ない） */
export type DoraCountItem = {
  hand: string;
  melds?: { type: CalledMeld['type']; tiles: string }[];
  dora: string[];
  ura?: string[];
};
export const STAGE8_QUIZ_COUNT: DoraCountItem[] = [
  { hand: '234m567p345s55p78s9s', dora: ['4p'] },
  { hand: '234m067p345s55p78s9s', dora: ['4p'] },
  { hand: '123m456p789s11122z', dora: ['4z'] },
  { hand: '123s456m789p11z222z', dora: ['9s'] },
  { hand: '234m567p345s55p78s9s', dora: ['1m'], ura: ['8s'] },
  { hand: '234m567p345s66p78s9s', dora: ['7z'] },
  { hand: '234m567p345s99s', melds: [{ type: 'ankan', tiles: '1111z' }], dora: ['3m', '4z'] },
  { hand: '340m340p340s11122z', dora: ['2z'] },
];
export const QUIZ8_PICK = 3;
export const QUIZ8_COUNT = 3;
export const QUIZ8_PASS = 5;
export const COUNT_CHOICES = [0, 1, 2, 3, 4, 5, 6];
