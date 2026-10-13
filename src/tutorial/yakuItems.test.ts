import { describe, expect, it } from 'vitest';
import { isPossibleTileSet, parseTiles } from '../engine/tile';
import { BASIC_YAKU, basicYakuOf, CALLS_QUIZ, onlyBasic, RON_QUIZ, scoreItem, YAKU_QUIZ, type YakuItem } from './yakuItems';

function check(item: YakuItem) {
  const tiles = [...parseTiles(item.hand), ...parseTiles(item.win), ...(item.melds ?? []).flatMap((m) => parseTiles(m.tiles))];
  const label = `${item.hand}+${item.win}`;
  expect(isPossibleTileSet(tiles), label).toBe(true);
  expect(parseTiles(item.hand).length + 1 + 3 * (item.melds?.length ?? 0), label).toBe(14);
  expect(onlyBasic(item), `${label}: ${scoreItem(item)?.yaku.map((y) => y.id)}`).toBe(true);
}

describe('役のクイズ', () => {
  it('段階 6：基本の 6 役と「役なし」がすべて答えに出てくる', () => {
    for (const item of YAKU_QUIZ) check(item);
    const seen = new Set(YAKU_QUIZ.flatMap((i) => (basicYakuOf(i).length ? basicYakuOf(i) : ['none'])));
    expect([...seen].sort()).toEqual([...BASIC_YAKU, 'none'].sort());
    expect(new Set(YAKU_QUIZ.map((i) => JSON.stringify(i))).size).toBe(YAKU_QUIZ.length);
  });

  it('段階 7：すべてロン。役あり・役なしが 3 問以上ずつ', () => {
    for (const item of RON_QUIZ) {
      check(item);
      expect(item.tsumo).toBe(false);
    }
    const yes = RON_QUIZ.filter((i) => scoreItem(i)).length;
    expect(yes).toBeGreaterThanOrEqual(3);
    expect(RON_QUIZ.length - yes).toBeGreaterThanOrEqual(3);
  });

  it('段階 8：すべて鳴いた手のロン。役あり・役なしが 3 問以上ずつ', () => {
    for (const item of CALLS_QUIZ) {
      check(item);
      expect(item.tsumo).toBe(false);
      expect(item.melds?.length).toBeGreaterThan(0);
    }
    const yes = CALLS_QUIZ.filter((i) => scoreItem(i)).length;
    expect(yes).toBeGreaterThanOrEqual(3);
    expect(CALLS_QUIZ.length - yes).toBeGreaterThanOrEqual(3);
  });
});
