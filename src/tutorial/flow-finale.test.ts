import { describe, expect, it } from 'vitest';
import { notenPayments } from '../game/hand';
import { afterResult, newMatch } from '../game/match';
import { translate, type MessageKey } from '../i18n/translate';
import { FINALE_SLIDES, STAGE10_TOUR } from './finale';
import { eventResult, STAGE9_GUIDED, FLOW_SLIDES } from './flow';

const has = (key: string) => {
  for (const lang of ['de', 'ja'] as const) expect(translate(lang, key as MessageKey), `${lang}:${key}`).not.toBe(key);
};


describe('stage 9', () => {
  it('文字列', () => {
    for (const s of FLOW_SLIDES) {
      has(`flow.explain.${s.id}.title`);
      has(`flow.explain.${s.id}.body`);
    }
    for (const g of STAGE9_GUIDED) has(`flow.guided.${g.id}`);
  });

  it('台本：各局のあとがエンジンの進行と一致（東1→東1 1本場→東2→東2 1本場→東3 2本場）', () => {
    let m = newMatch(0);
    const labels: string[] = [];
    for (const g of STAGE9_GUIDED) {
      expect(g.scores.reduce((a, b) => a + b, 0)).toBe(100000);
      if (g.event) m = afterResult(m, g.scores, eventResult(g.event, m.dealer), 0);
      labels.push(`${m.roundWind}-${m.roundNumber}-${m.honba}-d${m.dealer}`);
    }
    expect(labels).toEqual(['1-1-0-d0', '1-1-1-d0', '1-2-0-d1', '1-2-1-d1', '1-3-2-d2']);
  });

  it('ノーテン罰符：聴牌 1 人 → 1,000、2 人 → 1,500、3 人 → 3,000', () => {
    expect(notenPayments([true, false, false, false])).toEqual([3000, -1000, -1000, -1000]);
    expect(notenPayments([true, true, false, false])).toEqual([1500, 1500, -1500, -1500]);
    expect(notenPayments([true, true, true, false])).toEqual([1000, 1000, 1000, -3000]);
    expect(notenPayments([true, true, true, true])).toEqual([0, 0, 0, 0]);
  });
});

describe('stage 10', () => {
  it('文字列', () => {
    for (const s of FINALE_SLIDES) {
      has(`finale.explain.${s.id}.title`);
      has(`finale.explain.${s.id}.body`);
    }
    for (const t of STAGE10_TOUR) has(`finale.tour.${t.id}`);
  });
});
