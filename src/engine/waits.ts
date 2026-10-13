import { isAgari } from './agari';
import { shantenOfCounts } from './shanten';
import { tileOfKind, toCounts, type Tile } from './tile';

/**
 * 待ち牌（種類番号）。手牌 13 枚（副露があれば 3 枚ずつ少ない）に 1 枚加えて和了形になる種類。
 * 手牌で 4 枚とも使っている種類は和了れないので含めない。
 */
export function waits(tiles: readonly Tile[], openMelds = 0): number[] {
  const counts = toCounts(tiles);
  const out: number[] = [];
  for (let k = 0; k < 34; k++) {
    if (counts[k] >= 4) continue;
    if (isAgari([...tiles, tileOfKind(k)], openMelds)) out.push(k);
  }
  return out;
}

export function isTenpai(tiles: readonly Tile[], openMelds = 0): boolean {
  return waits(tiles, openMelds).length > 0;
}

export type Acceptance = {
  /** 向聴数を下げる牌の種類 */
  kinds: number[];
  /** その残り枚数の合計（visible に含まれる牌は引いてある） */
  count: number;
};

/**
 * 受け入れ：13 枚（副露分少ない）の手牌で、引くと向聴数が下がる牌。
 * visible は自分から見えている牌の枚数（長さ 34）。省略時は手牌だけ。
 */
export function acceptance(tiles: readonly Tile[], openMelds = 0, visible?: readonly number[]): Acceptance {
  const counts = toCounts(tiles);
  const seen = visible ?? counts;
  const base = shantenOfCounts(counts, openMelds);
  const kinds: number[] = [];
  let count = 0;
  for (let k = 0; k < 34; k++) {
    if (counts[k] >= 4) continue;
    counts[k]++;
    const s = shantenOfCounts(counts, openMelds);
    counts[k]--;
    if (s < base) {
      kinds.push(k);
      count += Math.max(0, 4 - seen[k]);
    }
  }
  return { kinds, count };
}

export type DiscardOption = {
  /** 捨てる牌（同じ種類が複数あれば最初の 1 枚） */
  tile: Tile;
  shanten: number;
  acceptance: Acceptance;
};

/** 14 枚（副露分少ない）の手牌で、種類ごとに打牌後の向聴数と受け入れを評価する */
export function discardOptions(tiles: readonly Tile[], openMelds = 0, visible?: readonly number[]): DiscardOption[] {
  const seenKinds = new Set<string>();
  const out: DiscardOption[] = [];
  tiles.forEach((tile, i) => {
    const key = tile;
    if (seenKinds.has(key)) return;
    seenKinds.add(key);
    const rest = tiles.filter((_, j) => j !== i);
    const vis = visible ?? toCounts(tiles);
    out.push({
      tile,
      shanten: shantenOfCounts(toCounts(rest), openMelds),
      acceptance: acceptance(rest, openMelds, vis),
    });
  });
  return out;
}

/** 最善の打牌：向聴数が最小、その中で受け入れ枚数が最大のもの（同点はすべて） */
export function bestDiscards(tiles: readonly Tile[], openMelds = 0, visible?: readonly number[]): DiscardOption[] {
  const opts = discardOptions(tiles, openMelds, visible);
  const minS = Math.min(...opts.map((o) => o.shanten));
  const atMin = opts.filter((o) => o.shanten === minS);
  const maxA = Math.max(...atMin.map((o) => o.acceptance.count));
  return atMin.filter((o) => o.acceptance.count === maxA);
}
