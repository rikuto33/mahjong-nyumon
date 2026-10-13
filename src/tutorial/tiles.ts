import { ALL_KINDS, RED_FIVES, type Tile } from '../engine/tile';
import type { ExplainSlide } from './types';

export const TILES_SLIDES: ExplainSlide[] = [
  { id: 's1', rows: ['1m 5p 9s 1z 7z'] },
  { id: 's2', rows: ['123456789m'] },
  { id: 's3', rows: ['123456789p'] },
  { id: 's4', rows: ['123456789s'] },
  { id: 's5', rows: ['1234z'] },
  { id: 's6', rows: ['567z'] },
  { id: 's7', rows: ['5m0m 5p0p 5s0s'] },
  { id: 's8', rows: ['123456789m', '123456789p', '123456789s', '1234567z'] },
];

/** 台本チュートリアル：指示された牌をタップする */
export const STAGE1_GUIDED: { id: string; target: Tile }[] = [
  { id: 'g1', target: '1m' },
  { id: 'g2', target: '7p' },
  { id: 'g3', target: '1s' },
  { id: 'g4', target: '1z' },
  { id: 'g5', target: '5z' },
  { id: 'g6', target: '0m' },
];

/** クイズに出る 37 枚（34 種類＋赤五 3 枚） */
export const QUIZ_TILES: readonly Tile[] = [...ALL_KINDS, ...RED_FIVES];

export const QUIZ_LENGTH = 10;
export const QUIZ_PASS = 8;
export const FIND_CHOICES = 6;
export const NAME_CHOICES = 4;

export type QuizQuestion =
  | { type: 'find'; answer: Tile; choices: Tile[] }
  | { type: 'name'; answer: Tile; choices: Tile[] };

type Rng = () => number;

function shuffle<T>(items: readonly T[], rng: Rng): T[] {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** 紛らわしい選択肢を優先する：同じ色（字牌なら字牌）から半分、残りはランダム */
function pickChoices(answer: Tile, n: number, rng: Rng): Tile[] {
  const others = QUIZ_TILES.filter((t) => t !== answer);
  const sameSuit = shuffle(
    others.filter((t) => t[1] === answer[1]),
    rng,
  ).slice(0, Math.ceil((n - 1) / 2));
  const rest = shuffle(
    others.filter((t) => !sameSuit.includes(t)),
    rng,
  ).slice(0, n - 1 - sameSuit.length);
  return shuffle([answer, ...sameSuit, ...rest], rng);
}

export function makeQuiz(rng: Rng = Math.random): QuizQuestion[] {
  const answers = shuffle(QUIZ_TILES, rng).slice(0, QUIZ_LENGTH);
  return answers.map((answer, i) =>
    i % 2 === 0
      ? { type: 'find', answer, choices: pickChoices(answer, FIND_CHOICES, rng) }
      : { type: 'name', answer, choices: pickChoices(answer, NAME_CHOICES, rng) },
  );
}
