import { describe, expect, it } from 'vitest';
import { checkGroup } from '../engine/group';
import { decompose, isStandardComplete } from '../engine/decompose';
import { isPossibleTileSet, parseTiles, sortTiles, toCounts } from '../engine/tile';
import { translate, type MessageKey } from '../i18n/translate';
import { FIND_CHOICES, makeQuiz, NAME_CHOICES, QUIZ_LENGTH, QUIZ_TILES, STAGE1_GUIDED, STAGE1_SLIDES } from './stage1';
import { STAGE2_GUIDED, STAGE2_GUIDED_HAND, STAGE2_PUZZLES, STAGE2_SLIDES } from './stage2';

function seeded(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1103515245 + 12345) % 2147483648;
    return s / 2147483648;
  };
}

const has = (key: string) => {
  for (const lang of ['de', 'ja'] as const) {
    expect(translate(lang, key as MessageKey), `${lang}:${key}`).not.toBe(key);
  }
};

describe('stage 1', () => {
  it('スライドと台本の文字列がそろっている', () => {
    for (const s of STAGE1_SLIDES) {
      has(`stage1.explain.${s.id}.title`);
      has(`stage1.explain.${s.id}.body`);
      for (const row of s.rows ?? []) expect(() => parseTiles(row)).not.toThrow();
    }
    for (const g of STAGE1_GUIDED) {
      has(`stage1.guided.${g.id}.prompt`);
      has(`stage1.guided.${g.id}.after`);
      expect(QUIZ_TILES).toContain(g.target);
    }
  });

  it('まとめのスライドに 34 種類すべてが出る', () => {
    const last = STAGE1_SLIDES.find((s) => s.id === 's8')!;
    const tiles = last.rows!.flatMap((r) => parseTiles(r));
    expect(new Set(tiles).size).toBe(34);
  });

  it('クイズ：10 問、答えは重複なし、選択肢に答えを含み重複なし', () => {
    for (let seed = 1; seed <= 50; seed++) {
      const quiz = makeQuiz(seeded(seed));
      expect(quiz).toHaveLength(QUIZ_LENGTH);
      expect(new Set(quiz.map((q) => q.answer)).size).toBe(QUIZ_LENGTH);
      for (const q of quiz) {
        expect(q.choices).toHaveLength(q.type === 'find' ? FIND_CHOICES : NAME_CHOICES);
        expect(q.choices).toContain(q.answer);
        expect(new Set(q.choices).size).toBe(q.choices.length);
      }
    }
  });
});

describe('stage 2', () => {
  it('スライドの文字列と牌', () => {
    for (const s of STAGE2_SLIDES) {
      has(`stage2.explain.${s.id}.title`);
      has(`stage2.explain.${s.id}.body`);
      for (const row of s.rows ?? []) expect(() => parseTiles(row)).not.toThrow();
    }
  });

  it('完成形の例は和了形', () => {
    const ex = STAGE2_SLIDES.find((s) => s.id === 's5')!.rows![0];
    expect(isStandardComplete(parseTiles(ex))).toBe(true);
    for (const part of ex.split(' ')) expect(checkGroup(parseTiles(part)).ok).toBe(true);
  });

  it('台本：組を順に取るとちょうど手牌になり、各組が正しい', () => {
    const hand = parseTiles(STAGE2_GUIDED_HAND);
    expect(isStandardComplete(hand)).toBe(true);
    const groups = STAGE2_GUIDED.map((g) => parseTiles(g.group));
    for (const g of groups) expect(checkGroup(g).ok).toBe(true);
    expect(sortTiles(groups.flat())).toEqual(sortTiles(hand));
    for (const g of STAGE2_GUIDED) {
      has(`stage2.guided.${g.id}.prompt`);
      has(`stage2.guided.${g.id}.after`);
    }
  });

  it('練習問題：14 枚・実在しうる・和了形・七対子形ではない', () => {
    for (const p of STAGE2_PUZZLES) {
      const tiles = parseTiles(p);
      expect(tiles, p).toHaveLength(14);
      expect(isPossibleTileSet(tiles), p).toBe(true);
      expect(decompose(tiles).length, p).toBeGreaterThan(0);
      const pairs = toCounts(tiles).filter((c) => c === 2).length;
      expect(pairs, p).toBeLessThan(7);
    }
    expect(new Set(STAGE2_PUZZLES).size).toBe(STAGE2_PUZZLES.length);
  });
});
