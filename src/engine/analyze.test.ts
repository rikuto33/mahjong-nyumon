import { describe, expect, it } from 'vitest';
import { analyzeHand, rolesOf } from './analyze';
import { parseTiles } from './tile';

const roles = (h: string, open = 0, mode: 'regular' | 'pairs' = 'regular') => rolesOf(parseTiles(h), open, mode).join(' ');

describe('analyzeHand', () => {
  it('完成した組・あと 1 枚・孤立牌に分ける', () => {
    // 123m 完成、45p あと 1 枚、99s 対子、1z 孤立
    expect(roles('123m45p99s1z')).toBe('meld meld meld partial partial pair pair single');
  });

  it('向聴数が最小になる分け方を選ぶ（111234m は 111+234）', () => {
    const g = analyzeHand(parseTiles('111234m'));
    expect(g.map((x) => x.role)).toEqual(['meld', 'meld']);
  });

  it('七対子モードは対子と孤立牌', () => {
    expect(roles('1122m3p', 0, 'pairs')).toBe('pair pair pair pair single');
  });
});
