import { describe, expect, it } from 'vitest';
import { callOptions, forbiddenAfterCall, toMeld } from '../engine/calls';
import { countDora, doraFromIndicator, scoreWin } from '../engine/score';
import { shanten } from '../engine/shanten';
import { isPossibleTileSet, kindOf, parseTiles, type Tile } from '../engine/tile';
import { waits } from '../engine/waits';
import { translate, type MessageKey } from '../i18n/translate';
import {
  STAGE7_GUIDED,
  CALLS_SLIDES,
  type CallScene,
} from './calls';
import { COUNT_CHOICES, STAGE8_GUIDED, STAGE8_QUIZ_COUNT, STAGE8_QUIZ_PICK, DORA_SLIDES } from './dora';

const has = (key: string) => {
  for (const lang of ['de', 'ja'] as const) expect(translate(lang, key as MessageKey), `${lang}:${key}`).not.toBe(key);
};
const t1 = (s: string) => parseTiles(s)[0] as Tile;
const opts = (sc: CallScene) => callOptions(parseTiles(sc.hand), t1(sc.tile), { fromLeft: sc.from === 'left' });

describe('stage 7', () => {
  it('スライドの文字列', () => {
    for (const s of CALLS_SLIDES) {
      has(`calls.explain.${s.id}.title`);
      has(`calls.explain.${s.id}.body`);
    }
  });

  it('台本：指示どおりの鳴きができ、鳴いたあと聴牌で役がある', () => {
    for (const g of STAGE7_GUIDED) {
      has(`calls.guided.${g.id}.prompt`);
      has(`calls.guided.${g.id}.after`);
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

});

describe('stage 8', () => {
  it('スライドの文字列', () => {
    for (const s of DORA_SLIDES) {
      has(`dora.explain.${s.id}.title`);
      has(`dora.explain.${s.id}.body`);
    }
    for (const g of STAGE8_GUIDED) {
      has(`dora.guided.${g.id}.prompt`);
      has(`dora.guided.${g.id}.after`);
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
