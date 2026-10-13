import { describe, expect, it } from 'vitest';
import { isPossibleTileSet, parseTiles, toCounts } from '../engine/tile';
import { discard, fullHand, fullTileSet, isWallEmpty, shuffled, startSolo, tsumoForms } from './solo';

describe('solo', () => {
  it('136 枚・各種 4 枚・赤五 3 枚', () => {
    const all = fullTileSet();
    expect(all).toHaveLength(136);
    expect(toCounts(all).every((c) => c === 4)).toBe(true);
    expect(all.filter((t) => t[0] === '0').sort()).toEqual(['0m', '0p', '0s']);
    expect(isPossibleTileSet(all)).toBe(true);
  });

  it('配牌 13 枚＋ツモ 1 枚', () => {
    const s = startSolo(shuffled(fullTileSet(), () => 0.3));
    expect(s.hand).toHaveLength(13);
    expect(s.drawn).not.toBeNull();
    expect(s.wall).toHaveLength(122);
    expect(s.draws).toBe(1);
  });

  it('打牌すると河に出て次をツモる', () => {
    const wall = parseTiles('123m456p789s11z45s 9m 3s 1z');
    let s = startSolo(wall);
    expect(s.drawn).toBe('9m');
    expect(tsumoForms(s)).toEqual([]);
    s = discard(s, 'drawn');
    expect(s.river).toEqual(['9m']);
    expect(s.drawn).toBe('3s');
    expect(tsumoForms(s)).toEqual(['regular']);
    expect(fullHand(s)).toHaveLength(14);
  });

  it('手牌から打牌するとツモ牌が手牌に入り並べ替わる', () => {
    let s = startSolo(parseTiles('123m456p789s11z45s 1z 2z'));
    s = discard(s, 0); // 1m を切る
    expect(s.river).toEqual(['1m']);
    expect(s.hand).toEqual(parseTiles('23m456p45789s111z'));
    expect(s.drawn).toBe('2z');
  });

  it('山がなくなると終わり', () => {
    let s = startSolo(parseTiles('123m456p789s11z45s 9m'));
    s = discard(s, 'drawn');
    expect(s.drawn).toBeNull();
    expect(isWallEmpty(s)).toBe(true);
  });
});
