import { describe, expect, it } from 'vitest';
import { scoreWin } from '../engine/score';
import { bestDiscards } from '../engine/waits';
import { parseTiles, type Tile } from '../engine/tile';
import { translate, type MessageKey } from '../i18n/translate';
import { checkRon } from '../game/ron';
import { discard, startSolo, tsumoForms } from '../game/solo';
import { LESSON_YAKU } from './yakuDex';
import { STAGE5_GUIDED, STAGE5_GUIDED_HAND, STAGE5_QUIZ, STAGE5_ROUND, STAGE5_SEAT, STAGE5_SLIDES } from './stage5';
import { STAGE6_GUIDED, STAGE6_QUIZ, STAGE6_SLIDES, type RonScene } from './stage6';

const has = (key: string) => {
  for (const lang of ['de', 'ja'] as const) expect(translate(lang, key as MessageKey), `${lang}:${key}`).not.toBe(key);
};
const t1 = (s: string) => parseTiles(s)[0] as Tile;
const ron = (sc: RonScene) =>
  checkRon({
    hand: parseTiles(sc.hand),
    tile: t1(sc.tile),
    ownDiscards: parseTiles(sc.river),
    seatWind: sc.seatWind,
    roundWind: sc.roundWind,
    riichi: sc.riichi,
    skippedThisTurn: sc.skippedThisTurn,
    skippedAfterRiichi: sc.skippedAfterRiichi,
  });

describe('stage 5', () => {
  it('スライドの文字列と牌', () => {
    for (const s of STAGE5_SLIDES) {
      has(`stage5.explain.${s.id}.title`);
      has(`stage5.explain.${s.id}.body`);
      for (const row of s.rows ?? []) expect(() => parseTiles(row)).not.toThrow();
    }
  });

  it('台本：立直→ツモ切り→ツモ和了。立直時は聴牌、最後は立直・門前ツモ・平和（一発なし）', () => {
    const wall = parseTiles(STAGE5_GUIDED_HAND + STAGE5_GUIDED.map((g) => g.draw).join(''));
    let st = startSolo(wall);
    for (const g of STAGE5_GUIDED) {
      has(`stage5.guided.${g.id}.prompt`);
      expect(st.drawn).toBe(t1(g.draw));
      if (g.action === 'tsumo') {
        expect(tsumoForms(st)).toEqual(['regular']);
        const r = scoreWin({
          hand: [...st.hand, st.drawn!],
          winTile: st.drawn!,
          tsumo: true,
          riichi: true,
          seatWind: STAGE5_SEAT,
          roundWind: STAGE5_ROUND,
        });
        expect(r?.yaku.map((y) => y.id).sort()).toEqual(['menzenTsumo', 'pinfu', 'riichi']);
        break;
      }
      has(`stage5.guided.${g.id}.after`);
      const tile = t1(g.tile!);
      if (g.action === 'riichi') expect(bestDiscards([...st.hand, st.drawn!]).map((o) => o.tile)).toContain(tile);
      st = discard(st, st.drawn === tile ? 'drawn' : st.hand.indexOf(tile));
    }
  });

  it('練習：役はすべてレッスンの役か役なし。重複なし', () => {
    const keys = STAGE5_QUIZ.map((x) => JSON.stringify(x));
    expect(new Set(keys).size).toBe(keys.length);
    let none = 0;
    for (const item of STAGE5_QUIZ) {
      const r = scoreWin({
        hand: [...parseTiles(item.hand), t1(item.win)],
        winTile: t1(item.win),
        tsumo: item.tsumo,
        riichi: item.riichi,
        seatWind: item.seatWind,
        roundWind: item.roundWind,
      });
      if (!r) {
        none++;
        continue;
      }
      for (const y of r.yaku) expect(LESSON_YAKU, `${item.hand}+${item.win}`).toContain(y.id);
    }
    expect(none).toBeGreaterThanOrEqual(2);
  });
});

describe('stage 6', () => {
  it('スライドの文字列', () => {
    for (const s of STAGE6_SLIDES) {
      has(`stage6.explain.${s.id}.title`);
      has(`stage6.explain.${s.id}.body`);
    }
  });

  it('台本：ロンできる → フリテン → 役なし', () => {
    expect(ron(STAGE6_GUIDED[0].scene).ok).toBe(true);
    expect(ron(STAGE6_GUIDED[1].scene)).toEqual({ ok: false, reason: 'furitenDiscard' });
    expect(ron(STAGE6_GUIDED[2].scene)).toEqual({ ok: false, reason: 'noYaku' });
    for (const g of STAGE6_GUIDED) {
      has(`stage6.guided.${g.id}.prompt`);
      has(`stage6.guided.${g.id}.after`);
    }
  });

  it('練習：できる場面とできない場面の両方があり、理由がばらける', () => {
    const results = STAGE6_QUIZ.map(ron);
    expect(results.filter((r) => r.ok).length).toBeGreaterThanOrEqual(3);
    const reasons = new Set(results.filter((r) => !r.ok).map((r) => (r.ok ? '' : r.reason)));
    expect(reasons).toEqual(new Set(['notWait', 'furitenDiscard', 'furitenTemporary', 'furitenRiichi', 'noYaku']));
    for (const reason of reasons) has(`stage6.quiz.reason.${reason}`);
  });
});
