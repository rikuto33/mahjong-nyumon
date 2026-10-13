import { describe, expect, it } from 'vitest';
import fixtures from './fixtures/python-mahjong.json';
import { isAgari } from './agari';
import { chiitoitsuShanten, kokushiShanten, regularShanten } from './shanten';
import { parseTiles, toCounts } from './tile';
import { waits } from './waits';

/** Python の mahjong パッケージで作った期待値との照合（tools/gen_engine_fixtures.py） */
type Case = {
  hand: string;
  regular: number;
  chiitoitsu: number;
  kokushi: number;
  agari?: boolean;
  waits?: number[];
};

const cases = fixtures.cases as Case[];

describe(`Python mahjong (${fixtures.source}) との照合: ${cases.length} 手`, () => {
  it('向聴数（一般形・七対子・国士）', () => {
    for (const c of cases) {
      const counts = toCounts(parseTiles(c.hand));
      expect(regularShanten(counts), `regular ${c.hand}`).toBe(c.regular);
      expect(chiitoitsuShanten(counts), `chiitoitsu ${c.hand}`).toBe(c.chiitoitsu);
      expect(kokushiShanten(counts), `kokushi ${c.hand}`).toBe(c.kokushi);
    }
  });

  it('和了判定（14 枚）', () => {
    const with14 = cases.filter((c) => c.agari !== undefined);
    expect(with14.length).toBeGreaterThan(500);
    for (const c of with14) expect(isAgari(parseTiles(c.hand)), c.hand).toBe(c.agari);
  });

  it('待ち（13 枚）', () => {
    const with13 = cases.filter((c) => c.waits !== undefined);
    expect(with13.length).toBeGreaterThan(500);
    for (const c of with13) expect(waits(parseTiles(c.hand)), c.hand).toEqual(c.waits);
  });
});
