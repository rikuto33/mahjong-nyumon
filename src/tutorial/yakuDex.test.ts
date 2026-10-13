import { describe, expect, it } from 'vitest';
import { scoreWin } from '../engine/score';
import { parseTiles, type Tile } from '../engine/tile';
import { YAKU_LIST } from '../engine/yaku';
import { translate, type MessageKey } from '../i18n/translate';
import { DEX_EXAMPLES } from './yakuDex';

describe('役図鑑', () => {
  it('すべての役に例があり、エンジンでその役が付く', () => {
    for (const info of YAKU_LIST) {
      const ex = DEX_EXAMPLES[info.id];
      expect(ex, info.id).toBeDefined();
      const win = parseTiles(ex.win)[0] as Tile;
      const r = scoreWin({
        hand: [...parseTiles(ex.hand), win],
        melds: (ex.melds ?? []).map((m) => ({ type: m.type, tiles: parseTiles(m.tiles) })),
        winTile: win,
        tsumo: false,
        seatWind: 2,
        roundWind: 1,
        ...ex.ctx,
      });
      expect(r, info.id).not.toBeNull();
      expect(r!.yaku.map((y) => y.id), info.id).toContain(info.id);
    }
  });

  it('すべての役に名前と説明がある（de / ja）', () => {
    for (const info of YAKU_LIST) {
      for (const lang of ['de', 'ja'] as const) {
        for (const part of ['name', 'desc']) {
          const key = `yaku.${info.id}.${part}` as MessageKey;
          expect(translate(lang, key), `${lang}:${key}`).not.toBe(key);
        }
      }
    }
  });
});
