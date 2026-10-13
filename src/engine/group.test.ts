import { describe, expect, it } from 'vitest';
import { checkGroup } from './group';
import { parseTiles } from './tile';

const g = (s: string) => checkGroup(parseTiles(s));

describe('checkGroup', () => {
  it('順子', () => {
    expect(g('123m')).toEqual({ ok: true, type: 'shuntsu' });
    expect(g('798s')).toEqual({ ok: true, type: 'shuntsu' });
    expect(g('406p')).toEqual({ ok: true, type: 'shuntsu' });
  });

  it('刻子', () => {
    expect(g('555p')).toEqual({ ok: true, type: 'koutsu' });
    expect(g('505p')).toEqual({ ok: true, type: 'koutsu' });
    expect(g('111z')).toEqual({ ok: true, type: 'koutsu' });
  });

  it('対子', () => {
    expect(g('77z')).toEqual({ ok: true, type: 'pair' });
    expect(g('05s')).toEqual({ ok: true, type: 'pair' });
    expect(g('56s')).toEqual({ ok: false, reason: 'pairNotSame' });
  });

  it('不正な組', () => {
    expect(g('1m')).toEqual({ ok: false, reason: 'wrongSize' });
    expect(g('1111m')).toEqual({ ok: false, reason: 'wrongSize' });
    expect(g('12m3p')).toEqual({ ok: false, reason: 'mixedSuits' });
    expect(g('123z')).toEqual({ ok: false, reason: 'honorSequence' });
    expect(g('567z')).toEqual({ ok: false, reason: 'honorSequence' });
    expect(g('891m')).toEqual({ ok: false, reason: 'notConsecutive' });
    expect(g('135p')).toEqual({ ok: false, reason: 'notConsecutive' });
    expect(g('113p')).toEqual({ ok: false, reason: 'notConsecutive' });
  });
});
