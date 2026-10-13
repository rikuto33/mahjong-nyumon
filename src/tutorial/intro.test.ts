import { describe, expect, it } from 'vitest';
import { apply, responseOptions, type HandState } from '../game/hand';
import { parseTiles, type Tile } from '../engine/tile';
import { translate, type MessageKey } from '../i18n/translate';
import { aiTsumogiri, INTRO_STEPS, introHand, passAll } from './intro';

describe('段階 1：まず 1 局やってみる', () => {
  it('台本どおりに進めると、指示の時点で必ずその操作ができ、最後に中・ドラ・赤ドラでロン和了する', () => {
    let h: HandState = introHand();
    for (const [i, step] of INTRO_STEPS.entries()) {
      const next = INTRO_STEPS[i + 1];
      const waitHuman = next && (next.kind === 'call' || next.kind === 'ron');
      if (step.kind === 'ai') {
        expect(h.phase, `step ${i}`).toBe('turn');
        expect(h.turn, `step ${i}`).not.toBe(0);
        h = aiTsumogiri(h);
        // 自分がロンできる状態で他の操作を指示しない
        if (!waitHuman) {
          expect(responseOptions(h, 0).ron, `step ${i}`).toBeNull();
          h = passAll(h);
        }
      } else if (step.kind === 'discard') {
        expect(h.turn, step.id).toBe(0);
        h = apply(h, { type: 'discard', tile: parseTiles(step.tile)[0] as Tile });
        // 自分の捨て牌で他家がロンできない
        expect(responseOptions(h, 1).ron ?? responseOptions(h, 2).ron ?? responseOptions(h, 3).ron).toBeNull();
        h = passAll(h);
      } else if (step.kind === 'call') {
        const opts = responseOptions(h, 0);
        expect(opts.ron, step.id).toBeNull();
        const option = opts.calls.find((c) => c.type === step.call)!;
        expect(option, step.id).toBeDefined();
        h = apply(h, {
          type: 'respond',
          responses: [1, 2, 3, 0].filter((s) => s !== h.lastDiscard!.from).map((seat) =>
            seat === 0 ? { seat: 0 as const, action: 'call' as const, option } : { seat: seat as 1 | 2 | 3, action: 'pass' as const },
          ),
        });
      } else if (step.kind === 'ron') {
        const r = responseOptions(h, 0).ron;
        expect(r).not.toBeNull();
        expect(r!.yaku.map((y) => y.id)).toEqual(['chun']);
        expect(r!.dora).toBe(1);
        expect(r!.aka).toBe(1);
        h = apply(h, {
          type: 'respond',
          responses: [1, 3, 0].map((seat) => (seat === 0 ? { seat: 0 as const, action: 'ron' as const } : { seat: seat as 1 | 3, action: 'pass' as const })),
        });
        expect(h.result?.kind).toBe('win');
      }
      if ('id' in step && step.id) {
        for (const lang of ['de', 'ja'] as const) {
          const key = `intro.${step.id}` as MessageKey;
          expect(translate(lang, key), `${lang}:${key}`).not.toBe(key);
        }
      }
    }
    expect(h.phase).toBe('ended');
  });
});
