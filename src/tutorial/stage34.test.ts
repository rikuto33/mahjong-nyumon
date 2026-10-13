import { describe, expect, it } from 'vitest';
import { bestDiscards, waits } from '../engine/waits';
import { isAgari } from '../engine/agari';
import { shanten } from '../engine/shanten';
import { isPossibleTileSet, kindOf, parseTiles, toCounts } from '../engine/tile';
import { translate, type MessageKey } from '../i18n/translate';
import { discard, startSolo, tsumoForms } from '../game/solo';
import { STAGE3_GUIDED, STAGE3_GUIDED_HAND, STAGE3_SLIDES } from './stage3';
import { STAGE4_GUIDED, STAGE4_QUIZ_EASY, STAGE4_QUIZ_HARD, STAGE4_SLIDES } from './stage4';

const has = (key: string) => {
  for (const lang of ['de', 'ja'] as const) expect(translate(lang, key as MessageKey), `${lang}:${key}`).not.toBe(key);
};

describe('stage 3', () => {
  it('スライドの文字列', () => {
    for (const s of STAGE3_SLIDES) {
      has(`stage3.explain.${s.id}.title`);
      has(`stage3.explain.${s.id}.body`);
    }
  });

  it('台本：指示どおり切ると最後にツモ和了。各打牌は最善手', () => {
    const wall = parseTiles(STAGE3_GUIDED_HAND + STAGE3_GUIDED.map((g) => g.draw).join(''));
    expect(isPossibleTileSet(wall)).toBe(true);
    let s = startSolo(wall);
    for (const [i, g] of STAGE3_GUIDED.entries()) {
      has(`stage3.guided.${g.id}.prompt`);
      expect(s.drawn).toBe(parseTiles(g.draw)[0]);
      if (g.discard === null) {
        expect(i).toBe(STAGE3_GUIDED.length - 1);
        expect(tsumoForms(s)).toEqual(['regular']);
        break;
      }
      has(`stage3.guided.${g.id}.after`);
      const best = bestDiscards([...s.hand, s.drawn!]).map((o) => o.tile);
      expect(best, g.id).toContain(g.discard);
      expect(tsumoForms(s)).toEqual([]);
      const target = parseTiles(g.discard)[0];
      s = discard(s, s.drawn === target ? 'drawn' : s.hand.indexOf(target));
    }
  });
});

describe('stage 4', () => {
  it('スライド：文字列と、聴牌例が聴牌であること', () => {
    for (const s of STAGE4_SLIDES) {
      has(`stage4.explain.${s.id}.title`);
      has(`stage4.explain.${s.id}.body`);
    }
    const ex = parseTiles(STAGE4_SLIDES[0].rows![0]);
    expect(shanten(ex)).toBe(0);
  });

  it('台本：待ちがエンジンの結果と一致', () => {
    for (const g of STAGE4_GUIDED) {
      has(`stage4.guided.${g.id}.prompt`);
      has(`stage4.guided.${g.id}.after`);
      expect(waits(parseTiles(g.hand)), g.hand).toEqual(parseTiles(g.waits).map(kindOf));
    }
  });

  it('練習問題：13 枚・実在しうる・聴牌・待ち牌を 4 枚使い切っていない・七対子/国士の待ちを含まない', () => {
    const all = [...STAGE4_QUIZ_EASY, ...STAGE4_QUIZ_HARD];
    expect(new Set(all).size).toBe(all.length);
    for (const h of all) {
      const tiles = parseTiles(h);
      expect(tiles, h).toHaveLength(13);
      expect(isPossibleTileSet(tiles), h).toBe(true);
      const ws = waits(tiles);
      expect(ws.length, h).toBeGreaterThan(0);
      const counts = toCounts(tiles);
      // 手牌で使い切っている種類が一般形の待ちに含まれない（純カラ待ちの紛らわしさを避ける）
      for (let k = 0; k < 34; k++) {
        if (counts[k] === 4) {
          const t = [...tiles, tiles.find((x) => kindOf(x) === k)!];
          expect(isAgari(t), h).toBe(false);
        }
      }
      expect(counts.filter((c) => c === 2).length, h).toBeLessThan(6); // 七対子の聴牌ではない
    }
  });

  it('easy は待ちの形が単純（待ち 1〜2 種）、hard は 2 種以上', () => {
    for (const h of STAGE4_QUIZ_EASY) expect(waits(parseTiles(h)).length, h).toBeLessThanOrEqual(2);
    for (const h of STAGE4_QUIZ_HARD) expect(waits(parseTiles(h)).length, h).toBeGreaterThanOrEqual(2);
  });
});
