import { describe, expect, it } from 'vitest';
import { callOptions, forbiddenAfterCall, toMeld } from '../engine/calls';
import { countDora, doraFromIndicator, scoreWin } from '../engine/score';
import { shanten } from '../engine/shanten';
import { isPossibleTileSet, kindOf, parseTiles, type Tile } from '../engine/tile';
import { waits } from '../engine/waits';
import { translate, type MessageKey } from '../i18n/translate';
import {
  STAGE7_GUIDED,
  STAGE7_QUIZ_CALLS,
  STAGE7_QUIZ_OPEN,
  STAGE7_SLIDES,
  type CallScene,
} from './stage7';
import { COUNT_CHOICES, STAGE8_GUIDED, STAGE8_QUIZ_COUNT, STAGE8_QUIZ_PICK, STAGE8_SLIDES } from './stage8';

const has = (key: string) => {
  for (const lang of ['de', 'ja'] as const) expect(translate(lang, key as MessageKey), `${lang}:${key}`).not.toBe(key);
};
const t1 = (s: string) => parseTiles(s)[0] as Tile;
const opts = (sc: CallScene) => callOptions(parseTiles(sc.hand), t1(sc.tile), { fromLeft: sc.from === 'left' });

describe('stage 7', () => {
  it('スライドの文字列', () => {
    for (const s of STAGE7_SLIDES) {
      has(`stage7.explain.${s.id}.title`);
      has(`stage7.explain.${s.id}.body`);
    }
  });

  it('台本：指示どおりの鳴きができ、鳴いたあと聴牌で役がある', () => {
    for (const g of STAGE7_GUIDED) {
      has(`stage7.guided.${g.id}.prompt`);
      has(`stage7.guided.${g.id}.after`);
      const o = opts(g.scene);
      if (g.action === 'skip') continue;
      expect(o.map((x) => x.type), g.id).toContain(g.action);
      const opt = o.find((x) => x.type === g.action)!;
      const hand = parseTiles(g.scene.hand);
      for (const t of opt.fromHand) hand.splice(hand.indexOf(t), 1);
      const d = t1(g.discard!);
      expect(forbiddenAfterCall(opt.type, opt.fromHand, opt.called)).not.toContain(kindOf(d));
      hand.splice(hand.indexOf(d), 1);
      expect(shanten(hand, 1), g.id).toBe(0);
      // どの待ちでロンしても役がある
      for (const k of waits(hand, 1)) {
        const w = parseTiles(`${(k % 9) + 1}${'mpsz'[Math.floor(k / 9)]}`)[0];
        const r = scoreWin({ hand: [...hand, w], melds: [toMeld(opt)], winTile: w, tsumo: false, seatWind: 2, roundWind: 1 });
        expect(r, `${g.id} wait ${w}`).not.toBeNull();
      }
    }
    // g2：チーのあと 8p は喰い替えで切れない
    const g2 = STAGE7_GUIDED[1];
    const chi = opts(g2.scene).find((x) => x.type === 'chi')!;
    expect(forbiddenAfterCall('chi', chi.fromHand, chi.called)).toContain(kindOf('8p'));
    // g3：対面からはチーできない、g4：チーはできるが鳴くと役がなくなる
    expect(opts(STAGE7_GUIDED[2].scene)).toEqual([]);
    expect(opts(STAGE7_GUIDED[3].scene).map((x) => x.type)).toEqual(['chi']);
  });

  it('練習 A：答えがばらける（なし・ポン・チー・カンをすべて含む）', () => {
    const all = new Set(STAGE7_QUIZ_CALLS.flatMap((sc) => (opts(sc).length ? opts(sc).map((x) => x.type) : ['none'])));
    expect(all).toEqual(new Set(['none', 'pon', 'chi', 'minkan']));
    for (const sc of STAGE7_QUIZ_CALLS) expect(parseTiles(sc.hand)).toHaveLength(13);
  });

  it('練習 B：和了れる手と和了れない手の両方', () => {
    let yes = 0;
    let no = 0;
    for (const item of STAGE7_QUIZ_OPEN) {
      const melds = item.melds.map((m) => ({ type: m.type, tiles: parseTiles(m.tiles) }));
      const w = t1(item.win);
      const all = [...parseTiles(item.hand), w, ...melds.flatMap((m) => m.tiles)];
      expect(isPossibleTileSet(all), item.hand).toBe(true);
      const r = scoreWin({ hand: [...parseTiles(item.hand), w], melds, winTile: w, tsumo: false, seatWind: 2, roundWind: 1 });
      if (r) yes++;
      else no++;
    }
    expect(yes).toBeGreaterThanOrEqual(3);
    expect(no).toBeGreaterThanOrEqual(3);
  });
});

describe('stage 8', () => {
  it('スライドの文字列', () => {
    for (const s of STAGE8_SLIDES) {
      has(`stage8.explain.${s.id}.title`);
      has(`stage8.explain.${s.id}.body`);
    }
    for (const g of STAGE8_GUIDED) {
      has(`stage8.guided.${g.id}.prompt`);
      has(`stage8.guided.${g.id}.after`);
    }
  });

  it('台本・練習 A の表示牌が正しく読める（赤五の表示牌は 5 として扱う）', () => {
    expect(doraFromIndicator('0p')).toBe(kindOf('6p'));
    for (const ind of [...STAGE8_GUIDED.map((g) => g.indicator), ...STAGE8_QUIZ_PICK]) {
      expect(doraFromIndicator(t1(ind))).toBeGreaterThanOrEqual(0);
    }
  });

  it('練習 B：枚数が選択肢の範囲内で、答えがばらける', () => {
    const answers = STAGE8_QUIZ_COUNT.map((item) => {
      const tiles = [...parseTiles(item.hand), ...(item.melds ?? []).flatMap((m) => parseTiles(m.tiles))];
      expect(isPossibleTileSet(tiles), item.hand).toBe(true);
      expect(parseTiles(item.hand).length + 3 * (item.melds?.length ?? 0), item.hand).toBe(14);
      const c = countDora(tiles, item.dora.map(t1), (item.ura ?? []).map(t1));
      return c.dora + c.aka + c.ura;
    });
    for (const a of answers) expect(COUNT_CHOICES).toContain(a);
    expect(new Set(answers).size).toBeGreaterThanOrEqual(4);
    expect(answers).toEqual([3, 4, 3, 1, 2, 0, 5, 3]);
  });
});
