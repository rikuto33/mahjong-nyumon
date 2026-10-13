import { describe, expect, it } from 'vitest';
import { parseTiles, type Tile } from '../engine/tile';
import { checkRon, type RonSituation } from './ron';

const base = (over: Partial<RonSituation>): RonSituation => ({
  hand: parseTiles('234m567p345s55p67s'), // 断幺九・平和、5s・8s 待ち
  tile: '8s' as Tile,
  ownDiscards: [],
  seatWind: 2,
  roundWind: 1,
  ...over,
});

describe('checkRon', () => {
  it('役があり待ち牌ならロンできる', () => {
    const r = checkRon(base({}));
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.result.yaku.map((y) => y.id).sort()).toEqual(['pinfu', 'tanyao']);
  });
  it('待ち牌でない', () => {
    expect(checkRon(base({ tile: '9s' }))).toEqual({ ok: false, reason: 'notWait' });
  });
  it('捨て牌フリテン（もう一方の待ちを捨てている）', () => {
    expect(checkRon(base({ ownDiscards: parseTiles('5s') }))).toEqual({ ok: false, reason: 'furitenDiscard' });
  });
  it('同巡内・立直後の見逃し', () => {
    expect(checkRon(base({ skippedThisTurn: true }))).toEqual({ ok: false, reason: 'furitenTemporary' });
    expect(checkRon(base({ riichi: true, skippedAfterRiichi: true }))).toEqual({ ok: false, reason: 'furitenRiichi' });
  });
  it('役がない', () => {
    expect(checkRon(base({ hand: parseTiles('111m567p345s99p78s'), tile: '9s' }))).toEqual({ ok: false, reason: 'noYaku' });
    expect(checkRon(base({ hand: parseTiles('111m567p345s99p78s'), tile: '9s', riichi: true })).ok).toBe(true);
  });
});
