import { describe, expect, it } from 'vitest';
import { agariForms, isAgari } from './agari';
import { shanten } from './shanten';
import { kindOf, parseTiles, tileOfKind } from './tile';
import { acceptance, bestDiscards, isTenpai, waits } from './waits';

const s = (h: string, open = 0) => shanten(parseTiles(h), open);
const w = (h: string, open = 0) => waits(parseTiles(h), open).map(tileOfKind).join(' ');

describe('shanten（既知の手）', () => {
  it('和了形は -1', () => {
    expect(s('123m456p789s11122z')).toBe(-1);
    expect(s('1122m3344p5566s77z')).toBe(-1); // 七対子
    expect(s('19m19p19s12345677z')).toBe(-1); // 国士
  });

  it('聴牌は 0', () => {
    expect(s('123m456p789s1112z')).toBe(0);
    expect(s('1122m3344p5566s7z')).toBe(0);
    expect(s('19m19p19s1234567z')).toBe(0);
  });

  it('一向聴・二向聴', () => {
    expect(s('123m456p68s11z359s')).toBe(1);
    expect(s('13m468p2479s1234z')).toBe(4);
  });

  it('副露があるときは一般形のみ', () => {
    expect(s('123m456p78s11z', 1)).toBe(0); // 10 枚 + 副露 1
    expect(s('11z', 4)).toBe(-1); // 4 副露 + 雀頭 = 和了形
    expect(s('1z', 4)).toBe(0); // 裸単騎
  });
});

describe('agari', () => {
  it('形の種類', () => {
    expect(agariForms(parseTiles('123m456p789s11122z'))).toEqual(['regular']);
    expect(agariForms(parseTiles('1122m3344p5566s77z'))).toEqual(['chiitoitsu']);
    expect(agariForms(parseTiles('19m19p19s12345677z'))).toEqual(['kokushi']);
    // 二盃口形は一般形でも七対子でもある
    expect(agariForms(parseTiles('112233m445566p77z'))).toEqual(['regular', 'chiitoitsu']);
  });

  it('同じ牌 4 枚は 2 対子にならない', () => {
    expect(isAgari(parseTiles('1111m3344p5566s77z'))).toBe(false);
  });

  it('副露あり', () => {
    expect(isAgari(parseTiles('123m456p11z'), 1)).toBe(false); // 枚数が足りない
    expect(isAgari(parseTiles('123m456p111z22z'), 1)).toBe(true);
  });
});

describe('waits', () => {
  it('両面・嵌張・辺張・双碰・単騎', () => {
    expect(w('45p123m789s11122z')).toBe('3p 6p');
    expect(w('46p123m789s11122z')).toBe('5p');
    expect(w('12p123m789s11122z')).toBe('3p');
    expect(w('55p77s123m789s111z')).toBe('5p 7s');
    expect(w('5p123m456m789s111z')).toBe('5p');
  });

  it('多面待ち', () => {
    expect(w('1112345678999m')).toBe('1m 2m 3m 4m 5m 6m 7m 8m 9m'); // 純正九蓮宝燈
    expect(w('2345m123p789s111z')).toBe('2m 5m');
    expect(w('19m19p19s1234567z')).toBe('1m 9m 1p 9p 1s 9s 1z 2z 3z 4z 5z 6z 7z');
  });

  it('手牌で 4 枚使っている牌は待ちにしない', () => {
    // 1111m の単騎待ち相当：1m では和了れない
    expect(w('1111m234p567s999s')).toBe('');
    expect(isTenpai(parseTiles('1111m234p567s999s'))).toBe(false);
  });
});

describe('acceptance / bestDiscards', () => {
  it('受け入れ：両面は 2 種 8 枚', () => {
    const a = acceptance(parseTiles('45p123m789s11122z'));
    expect(a.kinds.map(tileOfKind)).toEqual(['3p', '6p']);
    expect(a.count).toBe(8);
  });

  it('孤立した字牌を切るのが最善', () => {
    const best = bestDiscards(parseTiles('123m456p78s11z3599s4z'));
    expect(best.map((o) => o.tile)).toContain('4z');
  });

  it('和了形の 14 枚からは向聴数 0 の打牌になる', () => {
    const best = bestDiscards(parseTiles('123m456p789s11122z'));
    expect(best.every((o) => o.shanten === 0)).toBe(true);
    expect(kindOf(best[0].tile)).toBeGreaterThanOrEqual(0);
  });
});
