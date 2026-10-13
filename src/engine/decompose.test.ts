import { describe, expect, it } from 'vitest';
import { decompose, isStandardComplete } from './decompose';
import { kindOf, parseTiles } from './tile';

const d = (s: string, needPair = true) => decompose(parseTiles(s), needPair);

describe('decompose', () => {
  it('単純な和了形', () => {
    const r = d('123m456p789s11122z');
    expect(r).toHaveLength(1);
    expect(r[0].pair).toBe(kindOf('2z'));
    expect(r[0].melds).toHaveLength(4);
  });

  it('複数の分解がある形：111222333m は刻子3つ／順子3つの2通り', () => {
    const r = d('111222333m789p55s');
    expect(r).toHaveLength(2);
    const types = r.map((x) => x.melds.map((m) => m.type).sort().join(','));
    expect(types).toContain('koutsu,koutsu,koutsu,shuntsu');
    expect(types).toContain('shuntsu,shuntsu,shuntsu,shuntsu');
  });

  it('雀頭の候補が複数：11123m は 11+123 のみ', () => {
    const r = d('11123m456p789s222z');
    expect(r).toHaveLength(1);
    expect(r[0].pair).toBe(kindOf('1m'));
  });

  it('一盃口形 223344m', () => {
    const r = d('223344m567p888s11z');
    expect(r.length).toBeGreaterThanOrEqual(1);
    expect(r.every((x) => x.pair === kindOf('1z'))).toBe(true);
  });

  it('赤五を含む', () => {
    expect(d('34055m678p123s999s')).toHaveLength(1);
  });

  it('字牌の順子は作らない・9→1 はつながらない', () => {
    expect(d('123z456z77z111m222m')).toHaveLength(0);
    expect(d('891m234p567s11z222z')).toHaveLength(0);
  });

  it('枚数が合わないと空', () => {
    expect(d('123m')).toHaveLength(0);
    expect(d('12m')).toHaveLength(0);
  });

  it('雀頭なしで残りを面子に分ける', () => {
    expect(d('123m456m', false)).toHaveLength(1);
    expect(d('123m45m', false)).toHaveLength(0);
    expect(d('', false)).toEqual([{ pair: null, melds: [] }]);
  });

  it('七対子は一般形ではない', () => {
    expect(isStandardComplete(parseTiles('1122m3344p5566s77z'))).toBe(false);
  });

  it('isStandardComplete', () => {
    expect(isStandardComplete(parseTiles('123m456p789s11122z'))).toBe(true);
    expect(isStandardComplete(parseTiles('123m456p789s1112z3z'))).toBe(false);
    expect(isStandardComplete(parseTiles('123m456p789s111z'))).toBe(false);
  });
});
