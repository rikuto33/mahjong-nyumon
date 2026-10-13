import { describe, expect, it } from 'vitest';
import { furitenReason, isFuriten } from './furiten';
import { parseTiles } from './tile';

const hand = parseTiles('123m456p789s11z45s'); // 3s・6s 待ち

describe('furiten', () => {
  it('待ち牌を捨てていなければフリテンではない', () => {
    expect(furitenReason(hand, 0, { ownDiscards: parseTiles('9m1z') })).toBeNull();
  });

  it('待ちのどれか 1 種でも捨てていれば捨て牌フリテン（赤五も同じ種類）', () => {
    expect(furitenReason(hand, 0, { ownDiscards: parseTiles('6s') })).toBe('discard');
    const h5 = parseTiles('123m456p789s11z46s'); // 5s 待ち
    expect(furitenReason(h5, 0, { ownDiscards: parseTiles('0s') })).toBe('discard');
  });

  it('同巡内フリテン・立直後の見逃し', () => {
    expect(furitenReason(hand, 0, { ownDiscards: [], skippedThisTurn: true })).toBe('temporary');
    expect(furitenReason(hand, 0, { ownDiscards: [], skippedAfterRiichi: true })).toBe('riichi');
  });

  it('聴牌していなければフリテンではない', () => {
    expect(isFuriten(parseTiles('13m456p789s11z469s'), 0, { ownDiscards: parseTiles('2m') })).toBe(false);
  });

  it('副露ありでも判定できる', () => {
    expect(furitenReason(parseTiles('456p789s11z45s'), 1, { ownDiscards: parseTiles('3s') })).toBe('discard');
  });
});
