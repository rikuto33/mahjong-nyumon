import { describe, expect, it } from 'vitest';
import {
  ALL_KINDS,
  isPossibleTileSet,
  isRed,
  kindOf,
  parseTiles,
  rankOf,
  sortTiles,
  tileOfKind,
  toCounts,
} from './tile';

describe('tile', () => {
  it('34 種類ある', () => {
    expect(ALL_KINDS).toHaveLength(34);
    expect(new Set(ALL_KINDS).size).toBe(34);
    expect(ALL_KINDS[0]).toBe('1m');
    expect(ALL_KINDS[9]).toBe('1p');
    expect(ALL_KINDS[18]).toBe('1s');
    expect(ALL_KINDS[27]).toBe('1z');
    expect(ALL_KINDS[33]).toBe('7z');
  });

  it('kind と tile が往復する', () => {
    for (let k = 0; k < 34; k++) expect(kindOf(tileOfKind(k))).toBe(k);
  });

  it('赤五は五と同じ種類', () => {
    expect(kindOf('0m')).toBe(kindOf('5m'));
    expect(kindOf('0p')).toBe(kindOf('5p'));
    expect(kindOf('0s')).toBe(kindOf('5s'));
    expect(rankOf('0s')).toBe(5);
    expect(isRed('0p')).toBe(true);
    expect(isRed('5p')).toBe(false);
  });

  it('mpsz 表記を読める', () => {
    expect(parseTiles('123m 0p 77z')).toEqual(['1m', '2m', '3m', '0p', '7z', '7z']);
    expect(() => parseTiles('8z')).toThrow();
    expect(() => parseTiles('0z')).toThrow();
    expect(() => parseTiles('123')).toThrow();
    expect(() => parseTiles('m')).toThrow();
  });

  it('並べ替え：種類順、赤五は五のあと', () => {
    expect(sortTiles(parseTiles('1z0m5m9p1m'))).toEqual(['1m', '5m', '0m', '9p', '1z']);
  });

  it('枚数を数える', () => {
    const c = toCounts(parseTiles('550m'));
    expect(c[kindOf('5m')]).toBe(3);
    expect(c.reduce((a, b) => a + b)).toBe(3);
  });

  it('実在しうる組か', () => {
    expect(isPossibleTileSet(parseTiles('5550m'))).toBe(true);
    expect(isPossibleTileSet(parseTiles('55550m'))).toBe(false);
    expect(isPossibleTileSet(parseTiles('00m'))).toBe(false);
    expect(isPossibleTileSet(parseTiles('11111z'))).toBe(false);
  });
});
