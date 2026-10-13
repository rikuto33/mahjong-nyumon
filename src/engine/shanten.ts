import { toCounts, type Tile } from './tile';

/*
 * 向聴数。-1 = 和了形、0 = 聴牌、1 = 一向聴 …
 * 手牌は 13 枚か 14 枚（副露があれば 3 枚ずつ少ない）。openMelds は副露の数。
 */

const TERMINAL_HONOR_KINDS = [0, 8, 9, 17, 18, 26, 27, 28, 29, 30, 31, 32, 33];

/*
 * 一般形は色ごとに独立に分解できるので、色ごとに「面子数・搭子数」の組み合わせを
 * 求めてメモ化し、最後に 4 色を合成する。
 * 面子が多いほど・搭子が多いほど向聴数は下がる（単調）ので、支配されない組だけ残す。
 */
type MT = [melds: number, taatsu: number];

const suitMemo = new Map<string, MT[]>();

function pareto(list: MT[]): MT[] {
  const out: MT[] = [];
  for (const [m, t] of list) {
    if (list.some(([m2, t2]) => m2 >= m && t2 >= t && (m2 > m || t2 > t))) continue;
    if (!out.some(([m2, t2]) => m2 === m && t2 === t)) out.push([m, t]);
  }
  return out;
}

/** 1 色分（数牌 9 種または字牌 7 種）で作れる (面子数, 搭子数) の組 */
function suitOptions(c: number[], honor: boolean): MT[] {
  const key = (honor ? 'z' : 'n') + c.join('');
  const hit = suitMemo.get(key);
  if (hit) return hit;
  const found: MT[] = [];
  const n = c.length;
  const dfs = (pos: number, m: number, t: number) => {
    while (pos < n && c[pos] === 0) pos++;
    if (pos === n) {
      found.push([m, t]);
      return;
    }
    if (c[pos] >= 3) {
      c[pos] -= 3;
      dfs(pos, m + 1, t);
      c[pos] += 3;
    }
    if (!honor && pos <= 6 && c[pos + 1] > 0 && c[pos + 2] > 0) {
      c[pos]--, c[pos + 1]--, c[pos + 2]--;
      dfs(pos, m + 1, t);
      c[pos]++, c[pos + 1]++, c[pos + 2]++;
    }
    if (c[pos] >= 2) {
      c[pos] -= 2;
      dfs(pos, m, t + 1);
      c[pos] += 2;
    }
    if (!honor && pos <= 7 && c[pos + 1] > 0) {
      c[pos]--, c[pos + 1]--;
      dfs(pos, m, t + 1);
      c[pos]++, c[pos + 1]++;
    }
    if (!honor && pos <= 6 && c[pos + 2] > 0) {
      c[pos]--, c[pos + 2]--;
      dfs(pos, m, t + 1);
      c[pos]++, c[pos + 2]++;
    }
    const saved = c[pos];
    c[pos] = 0;
    dfs(pos + 1, m, t);
    c[pos] = saved;
  };
  dfs(0, 0, 0);
  const result = pareto(found);
  suitMemo.set(key, result);
  return result;
}

/** 雀頭をこの色から 1 つ取った場合の (面子数, 搭子数) の組。雀頭が取れなければ空 */
function suitOptionsWithHead(c: number[], honor: boolean): MT[] {
  const all: MT[] = [];
  for (let k = 0; k < c.length; k++) {
    if (c[k] < 2) continue;
    c[k] -= 2;
    all.push(...suitOptions(c, honor));
    c[k] += 2;
  }
  return pareto(all);
}

/** 一般形（4 面子 1 雀頭）の向聴数 */
export function regularShanten(counts: readonly number[], openMelds = 0): number {
  const suits = [0, 9, 18, 27].map((from, i) => counts.slice(from, i === 3 ? 34 : from + 9));
  const plain = suits.map((c, i) => suitOptions(c, i === 3));
  const headed = suits.map((c, i) => suitOptionsWithHead(c, i === 3));
  let best = 8;
  // head = 雀頭を取る色（-1 なら雀頭なし）
  for (let head = -1; head < 4; head++) {
    if (head >= 0 && headed[head].length === 0) continue;
    const lists = plain.map((p, i) => (i === head ? headed[i] : p));
    for (const a of lists[0])
      for (const b of lists[1])
        for (const c of lists[2])
          for (const d of lists[3]) {
            const m = a[0] + b[0] + c[0] + d[0] + openMelds;
            const t = Math.min(a[1] + b[1] + c[1] + d[1], 4 - m);
            const s = 8 - 2 * m - Math.max(t, 0) - (head >= 0 ? 1 : 0);
            if (s < best) best = s;
          }
  }
  return best;
}

/** 七対子の向聴数（同じ牌 4 枚は 2 対子と数えない） */
export function chiitoitsuShanten(counts: readonly number[]): number {
  let pairs = 0;
  let kinds = 0;
  for (const n of counts) {
    if (n >= 1) kinds++;
    if (n >= 2) pairs++;
  }
  return 6 - pairs + Math.max(0, 7 - kinds);
}

/** 国士無双の向聴数 */
export function kokushiShanten(counts: readonly number[]): number {
  let kinds = 0;
  let pair = 0;
  for (const k of TERMINAL_HONOR_KINDS) {
    if (counts[k] >= 1) kinds++;
    if (counts[k] >= 2) pair = 1;
  }
  return 13 - kinds - pair;
}

export function shantenOfCounts(counts: readonly number[], openMelds = 0): number {
  const regular = regularShanten(counts, openMelds);
  if (openMelds > 0) return regular;
  return Math.min(regular, chiitoitsuShanten(counts), kokushiShanten(counts));
}

/** 一般形・七対子・国士のうち最小の向聴数（副露があれば一般形のみ） */
export function shanten(tiles: readonly Tile[], openMelds = 0): number {
  return shantenOfCounts(toCounts(tiles), openMelds);
}
