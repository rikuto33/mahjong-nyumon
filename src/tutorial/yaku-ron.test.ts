import { describe, expect, it } from 'vitest';
import { scoreWin } from '../engine/score';
import { bestDiscards } from '../engine/waits';
import { parseTiles, type Tile } from '../engine/tile';
import { translate, type MessageKey } from '../i18n/translate';
import { checkRon } from '../game/ron';
import { discard, startSolo, tsumoForms } from '../game/solo';
import { STAGE5_GUIDED, STAGE5_GUIDED_HAND, STAGE5_ROUND, STAGE5_SEAT, YAKU_SLIDES } from './yaku';
import { STAGE6_GUIDED, RON_SLIDES, type RonScene } from './ron';

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
    for (const s of YAKU_SLIDES) {
      has(`yakuLesson.explain.${s.id}.title`);
      has(`yakuLesson.explain.${s.id}.body`);
      for (const row of s.rows ?? []) expect(() => parseTiles(row)).not.toThrow();
    }
  });

  it('台本：立直→ツモ切り→ツモ和了。立直時は聴牌、最後は立直・門前ツモだけ（一発・平和なし）', () => {
    const wall = parseTiles(STAGE5_GUIDED_HAND + STAGE5_GUIDED.map((g) => g.draw).join(''));
    let st = startSolo(wall);
    for (const g of STAGE5_GUIDED) {
      has(`yakuLesson.guided.${g.id}.prompt`);
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
        expect(r?.yaku.map((y) => y.id).sort()).toEqual(['menzenTsumo', 'riichi']);
        break;
      }
      has(`yakuLesson.guided.${g.id}.after`);
      const tile = t1(g.tile!);
      if (g.action === 'riichi') expect(bestDiscards([...st.hand, st.drawn!]).map((o) => o.tile)).toContain(tile);
      st = discard(st, st.drawn === tile ? 'drawn' : st.hand.indexOf(tile));
    }
  });

});

describe('stage 6', () => {
  it('スライドの文字列', () => {
    for (const s of RON_SLIDES) {
      has(`ron.explain.${s.id}.title`);
      has(`ron.explain.${s.id}.body`);
    }
  });

  it('台本：ロンできる → フリテン → 役なし', () => {
    expect(ron(STAGE6_GUIDED[0].scene).ok).toBe(true);
    expect(ron(STAGE6_GUIDED[1].scene)).toEqual({ ok: false, reason: 'furitenDiscard' });
    expect(ron(STAGE6_GUIDED[2].scene)).toEqual({ ok: false, reason: 'noYaku' });
    for (const g of STAGE6_GUIDED) {
      has(`ron.guided.${g.id}.prompt`);
      has(`ron.guided.${g.id}.after`);
    }
  });


});
