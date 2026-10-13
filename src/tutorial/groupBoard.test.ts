import { describe, expect, it } from 'vitest';
import { parseTiles } from '../engine/tile';
import { checkGroup } from '../engine/group';
import { dissolveGroup, findTip, isSolved, makeGroup, newBoard, ungroupedIds, type Board } from './groupBoard';
import { STAGE2_PUZZLES } from './shape';

// '11123m456p789s222z' → id: 1m=0,1,2 2m=3 3m=4 4p=5 5p=6 6p=7 7s=8 8s=9 9s=10 2z=11,12,13
const board = () => newBoard(parseTiles('11123m456p789s222z'));

function apply(b: Board, ids: number[]): Board {
  const r = makeGroup(b, ids);
  if (!r.ok) throw new Error(r.reason);
  return r.board;
}

describe('groupBoard', () => {
  it('組を作る・戻す', () => {
    let b = apply(board(), [5, 6, 7]);
    expect(b.groups).toEqual([{ ids: [5, 6, 7], type: 'shuntsu' }]);
    expect(ungroupedIds(b)).not.toContain(6);
    b = dissolveGroup(b, 0);
    expect(b.groups).toEqual([]);
  });

  it('不正な組は理由を返す', () => {
    expect(makeGroup(board(), [0, 5, 8])).toEqual({ ok: false, reason: 'mixedSuits' });
    expect(makeGroup(board(), [11, 12, 3])).toEqual({ ok: false, reason: 'mixedSuits' });
    expect(makeGroup(board(), [0, 3])).toEqual({ ok: false, reason: 'pairNotSame' });
  });

  it('雀頭は 1 つだけ', () => {
    const b = apply(board(), [0, 1]);
    expect(makeGroup(b, [11, 12])).toEqual({ ok: false, reason: 'secondPair' });
  });

  it('完成判定', () => {
    let b = board();
    for (const ids of [[0, 1], [2, 3, 4], [5, 6, 7], [8, 9, 10], [11, 12, 13]]) {
      expect(isSolved(b)).toBe(false);
      b = apply(b, ids);
    }
    expect(isSolved(b)).toBe(true);
  });

  it('ヒント：行き詰まりなら null（111m を刻子にすると 23m が残る）', () => {
    const b = apply(board(), [0, 1, 2]);
    expect(findTip(b)).toBeNull();
  });

  it('ヒントに従うと必ず完成する（全練習問題）', () => {
    for (const p of STAGE2_PUZZLES) {
      let b = newBoard(parseTiles(p));
      for (let i = 0; i < 5; i++) {
        const tip = findTip(b);
        expect(tip, p).not.toBeNull();
        expect(checkGroup(tip!.map((id) => b.tiles[id])).ok).toBe(true);
        b = apply(b, tip!);
      }
      expect(isSolved(b), p).toBe(true);
    }
  });
});
