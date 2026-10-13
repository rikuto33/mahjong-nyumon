import { kindOf, type Tile } from './tile';

/*
 * 手牌を「完成した組・あと 1 枚の組・孤立牌」に分ける（考え方の説明用の表示）。
 * 一般形の向聴数（8 - 2×面子 - 搭子 - 雀頭）が最小になる分け方を選ぶ。
 */
export type GroupRole = 'meld' | 'pair' | 'partial' | 'single';
export type HandGroup = { role: GroupRole; kinds: number[] };

type State = { groups: HandGroup[]; score: number };

export function analyzeHand(tiles: readonly Tile[], openMelds = 0, mode: 'regular' | 'pairs' = 'regular'): HandGroup[] {
  const counts = new Array<number>(34).fill(0);
  for (const t of tiles) counts[kindOf(t)]++;

  if (mode === 'pairs') {
    const groups: HandGroup[] = [];
    for (let k = 0; k < 34; k++) {
      if (counts[k] >= 2) groups.push({ role: 'pair', kinds: [k, k] });
      for (let i = 0; i < counts[k] - (counts[k] >= 2 ? 2 : 0); i++) groups.push({ role: 'single', kinds: [k] });
    }
    return groups;
  }

  let best: State | null = null;
  const cur: HandGroup[] = [];
  const evaluate = () => {
    let m = openMelds;
    let t = 0;
    let head = 0;
    for (const g of cur) {
      if (g.role === 'meld') m++;
      else if (g.role === 'pair') {
        if (!head) head = 1;
        else t++;
      } else if (g.role === 'partial') t++;
    }
    const score = 8 - 2 * m - Math.min(t, Math.max(0, 4 - m)) - head;
    // 同点なら組の数が少ない（大きな組でまとまっている）方
    if (!best || score < best.score || (score === best.score && cur.length < best.groups.length)) {
      best = { groups: cur.map((g) => ({ ...g, kinds: [...g.kinds] })), score };
    }
  };
  const dfs = (pos: number) => {
    while (pos < 34 && counts[pos] === 0) pos++;
    if (pos === 34) {
      evaluate();
      return;
    }
    const num = pos < 27;
    const r = pos % 9;
    const tryGroup = (role: GroupRole, kinds: number[]) => {
      for (const k of kinds) counts[k]--;
      cur.push({ role, kinds });
      dfs(pos);
      cur.pop();
      for (const k of kinds) counts[k]++;
    };
    if (counts[pos] >= 3) tryGroup('meld', [pos, pos, pos]);
    if (num && r <= 6 && counts[pos + 1] > 0 && counts[pos + 2] > 0) tryGroup('meld', [pos, pos + 1, pos + 2]);
    if (counts[pos] >= 2) tryGroup('pair', [pos, pos]);
    if (num && r <= 7 && counts[pos + 1] > 0) tryGroup('partial', [pos, pos + 1]);
    if (num && r <= 6 && counts[pos + 2] > 0) tryGroup('partial', [pos, pos + 2]);
    tryGroup('single', [pos]);
  };
  dfs(0);
  return best!.groups;
}

/** 牌ごとの役割（tiles と同じ並び）。表示で各牌の下に色を付けるのに使う */
export function rolesOf(tiles: readonly Tile[], openMelds = 0, mode: 'regular' | 'pairs' = 'regular'): GroupRole[] {
  const groups = analyzeHand(tiles, openMelds, mode);
  const pool = groups.flatMap((g) => g.kinds.map((k) => ({ k, role: g.role })));
  return tiles.map((t) => {
    const i = pool.findIndex((x) => x.k === kindOf(t));
    return pool.splice(i, 1)[0].role;
  });
}
