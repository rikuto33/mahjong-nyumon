import { describe, expect, it } from 'vitest';
import { nextPart, STAGE_ORDER, STAGE_PARTS } from './stages';

describe('次に進む画面', () => {
  it('同じ段階の次の部分 → 次の段階の最初 → 最後は null', () => {
    expect(nextPart('tiles', 'explain')).toEqual({ stage: 'tiles', part: 'guided' });
    expect(nextPart('tiles', 'guided')).toEqual({ stage: 'tiles', part: 'practice' });
    expect(nextPart('tiles', 'practice')).toEqual({ stage: 'shape', part: 'explain' });
    expect(nextPart('intro', 'play')).toEqual({ stage: 'tiles', part: 'explain' });
    expect(nextPart('flow', 'guided')).toEqual({ stage: 'finale', part: 'explain' });
    expect(nextPart('finale', 'practice')).toBeNull();
  });

  it('すべての段階を順にたどれる', () => {
    let cur: ReturnType<typeof nextPart> = { stage: 'intro', part: 'play' };
    const visited: string[] = [];
    while (cur) {
      visited.push(`${cur.stage}:${cur.part}`);
      cur = nextPart(cur.stage, cur.part);
    }
    expect(visited.length).toBe(STAGE_ORDER.reduce((n, s) => n + STAGE_PARTS[s].length, 0));
  });
});
