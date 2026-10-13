import { toCounts, type Tile } from './tile';

/** 種類番号で表した面子。shuntsu は先頭の種類、koutsu はその種類 */
export type MeldKinds = { type: 'shuntsu' | 'koutsu'; kind: number };

export type Decomposition = {
  /** 雀頭の種類。needPair=false のときは null */
  pair: number | null;
  melds: MeldKinds[];
};

function canStartShuntsu(kind: number): boolean {
  return kind < 27 && kind % 9 <= 6;
}

/** counts をすべて面子に分ける方法を列挙する（重複なし。小さい種類から取る） */
function meldsOnly(counts: number[], from: number, acc: MeldKinds[], out: MeldKinds[][]): void {
  let k = from;
  while (k < 34 && counts[k] === 0) k++;
  if (k === 34) {
    out.push([...acc]);
    return;
  }
  if (counts[k] >= 3) {
    counts[k] -= 3;
    acc.push({ type: 'koutsu', kind: k });
    meldsOnly(counts, k, acc, out);
    acc.pop();
    counts[k] += 3;
  }
  if (canStartShuntsu(k) && counts[k + 1] > 0 && counts[k + 2] > 0) {
    counts[k]--;
    counts[k + 1]--;
    counts[k + 2]--;
    acc.push({ type: 'shuntsu', kind: k });
    meldsOnly(counts, k, acc, out);
    acc.pop();
    counts[k]++;
    counts[k + 1]++;
    counts[k + 2]++;
  }
}

/**
 * 一般形（面子＋雀頭）への分解をすべて返す。
 * needPair=true なら「雀頭 1 つ＋残り全部面子」、false なら「全部面子」。
 * 枚数が合わなければ空配列。
 */
export function decompose(tiles: readonly Tile[], needPair = true): Decomposition[] {
  const counts = toCounts(tiles);
  const n = tiles.length;
  const out: Decomposition[] = [];
  if (needPair) {
    if (n % 3 !== 2) return out;
    for (let k = 0; k < 34; k++) {
      if (counts[k] < 2) continue;
      counts[k] -= 2;
      const ms: MeldKinds[][] = [];
      meldsOnly(counts, 0, [], ms);
      for (const melds of ms) out.push({ pair: k, melds });
      counts[k] += 2;
    }
  } else {
    if (n % 3 !== 0) return out;
    const ms: MeldKinds[][] = [];
    meldsOnly(counts, 0, [], ms);
    for (const melds of ms) out.push({ pair: null, melds });
  }
  return out;
}

/** 14 枚が一般形の和了形（4 面子 1 雀頭）か。七対子・国士はフェーズ 2 で別途扱う */
export function isStandardComplete(tiles: readonly Tile[]): boolean {
  return tiles.length === 14 && decompose(tiles, true).length > 0;
}
