import { describe, expect, it } from 'vitest';
import { translate, type MessageKey } from '../i18n/translate';
import { INTRO_SCRIPT } from './intro';
import { simulateScript } from './script';

describe('段階 1：まず 1 局やってみる', () => {
  it('台本どおりに進めると、指示の時点で必ずその操作ができ、最後に中・ドラ・赤ドラでロン和了する', () => {
    const [h] = simulateScript(INTRO_SCRIPT);
    expect(h.result?.kind).toBe('win');
    if (h.result?.kind === 'win') {
      const r = h.result.wins[0].result;
      expect(r.yaku.map((y) => y.id)).toEqual(['chun']);
      expect(r.dora).toBe(1);
      expect(r.aka).toBe(1);
    }
  });

  it('文字列がそろっている', () => {
    for (const step of INTRO_SCRIPT.steps) {
      if (!('id' in step) || !step.id) continue;
      for (const lang of ['de', 'ja'] as const) {
        const key = `intro.${step.id}` as MessageKey;
        expect(translate(lang, key), `${lang}:${key}`).not.toBe(key);
      }
    }
  });
});
