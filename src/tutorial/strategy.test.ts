import { describe, expect, it } from 'vitest';
import { simulateScript } from './script';
import { SCENARIO_ORDER, SCENARIOS } from './strategy';

describe('考えながら打つ：シナリオ', () => {
  for (const id of SCENARIO_ORDER) {
    it(`${id}：台本どおりに打つと、選ぶ牌はどれも効率的で、狙った役で和了する`, () => {
      const h = simulateScript(SCENARIOS[id]);
      expect(h.result?.kind).toBe('win');
    });
  }
});

import { translate, type MessageKey } from '../i18n/translate';
import { STRATEGY_SLIDES } from './strategy';

describe('考えながら打つ：文字列', () => {
  it('すべての説明・シナリオの文字列がある', () => {
    const keys: string[] = STRATEGY_SLIDES.flatMap((s) => [`strategy.explain.${s.id}.title`, `strategy.explain.${s.id}.body`]);
    for (const id of SCENARIO_ORDER) {
      for (const step of SCENARIOS[id].steps) {
        if (!('id' in step) || !step.id) continue;
        if (step.kind === 'choose') keys.push(`strategy.${id}.${step.id}.prompt`, `strategy.${id}.${step.id}.why`);
        else keys.push(`strategy.${id}.${step.id}`);
      }
      keys.push(`strategy.hub.${id}`, `strategy.hub.${id}Desc`);
    }
    for (const lang of ['de', 'ja'] as const) for (const k of keys) expect(translate(lang, k as MessageKey), `${lang}:${k}`).not.toBe(k);
  });
});
