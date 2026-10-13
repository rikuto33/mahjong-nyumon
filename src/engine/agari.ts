import { decompose } from './decompose';
import { chiitoitsuShanten, kokushiShanten } from './shanten';
import { toCounts, type Tile } from './tile';

export type AgariForm = 'regular' | 'chiitoitsu' | 'kokushi';

/**
 * 和了形の種類をすべて返す（形だけの判定。役の有無は見ない）。
 * 手牌は 14 枚（副露があれば 14 - 3×副露数 枚）。
 */
export function agariForms(tiles: readonly Tile[], openMelds = 0): AgariForm[] {
  const forms: AgariForm[] = [];
  if (tiles.length !== 14 - 3 * openMelds) return forms;
  if (decompose(tiles, true).length > 0) forms.push('regular');
  if (openMelds === 0) {
    const counts = toCounts(tiles);
    if (chiitoitsuShanten(counts) === -1) forms.push('chiitoitsu');
    if (kokushiShanten(counts) === -1) forms.push('kokushi');
  }
  return forms;
}

export function isAgari(tiles: readonly Tile[], openMelds = 0): boolean {
  return agariForms(tiles, openMelds).length > 0;
}
