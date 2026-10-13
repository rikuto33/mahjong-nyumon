import type { CalledMeld } from './score';
import { isHonor, kindOf, rankOf, suitOf, type Tile } from './tile';
import { waits } from './waits';

/*
 * 鳴き（雀魂ルール、SPEC §5.2）
 * - チーは上家の捨て牌だけ、ポン・大明槓は誰の捨て牌でも
 * - 喰い替えなし：鳴いた牌と同じ牌（現物）も、チーの反対側の筋の牌も、その巡に切れない
 * - 鳴いたあとに切れる牌が 1 枚もなければ、その鳴きはできない
 * - 立直中は鳴けない。暗槓だけ、ツモった牌で 4 枚そろい、かつ待ちの種類が変わらない場合に可（送り槓不可）
 * - 河底牌（山の最後の牌の捨て牌）は鳴けない。槓は山に牌が残っていて、槓が 4 回未満のときだけ
 */

export type CallType = 'chi' | 'pon' | 'minkan';

export type CallOption = {
  type: CallType;
  /** 手牌から出す牌 */
  fromHand: Tile[];
  called: Tile;
};

export type CallContext = {
  /** 上家（左の人）の捨て牌か（チーできるのは上家からだけ） */
  fromLeft: boolean;
  riichi?: boolean;
  /** 山の残り枚数（0 なら河底牌なので鳴けない） */
  wallRemaining?: number;
  /** これまでの槓の数（場全体） */
  kanCount?: number;
};

function combos<T>(items: T[], n: number): T[][] {
  if (n === 0) return [[]];
  const out: T[][] = [];
  items.forEach((x, i) => {
    for (const rest of combos(items.slice(i + 1), n - 1)) out.push([x, ...rest]);
  });
  return out;
}

/** 同じ牌（赤五の区別を含めて）の組み合わせを重複なく */
function distinctCombos(tiles: Tile[], n: number): Tile[][] {
  const seen = new Set<string>();
  return combos(tiles, n).filter((c) => {
    const key = [...c].sort().join(',');
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/** 鳴いたあとその巡に切れない牌の種類（喰い替え禁止） */
export function forbiddenAfterCall(type: CallType, fromHand: Tile[], called: Tile): number[] {
  const k = kindOf(called);
  if (type === 'minkan') return [];
  if (type === 'pon') return [k];
  const ranks = fromHand.map(rankOf).sort((a, b) => a - b);
  const r = rankOf(called);
  const out = [k];
  // 両面・辺張形で鳴いたとき、反対側の筋（例：45 で 3 をチー → 6 も禁止）
  if (ranks[1] === ranks[0] + 1) {
    if (r === ranks[0] - 1 && ranks[1] + 1 <= 9) out.push(k + 3);
    if (r === ranks[1] + 1 && ranks[0] - 1 >= 1) out.push(k - 3);
  }
  return out;
}

function hasLegalDiscard(hand: Tile[], fromHand: Tile[], forbidden: number[]): boolean {
  const rest = [...hand];
  for (const t of fromHand) rest.splice(rest.indexOf(t), 1);
  return rest.some((t) => !forbidden.includes(kindOf(t)));
}

/** 他家の捨て牌に対してできる鳴き（hand は手の内 13 枚。副露があれば少ない） */
export function callOptions(hand: Tile[], tile: Tile, ctx: CallContext): CallOption[] {
  if (ctx.riichi) return [];
  if ((ctx.wallRemaining ?? 1) <= 0) return [];
  const k = kindOf(tile);
  const out: CallOption[] = [];
  const same = hand.filter((t) => kindOf(t) === k);

  for (const fromHand of distinctCombos(same, 2)) {
    if (hasLegalDiscard(hand, fromHand, forbiddenAfterCall('pon', fromHand, tile))) {
      out.push({ type: 'pon', fromHand, called: tile });
    }
  }
  if (same.length >= 3 && (ctx.kanCount ?? 0) < 4) {
    out.push({ type: 'minkan', fromHand: same.slice(0, 3), called: tile });
  }
  if (ctx.fromLeft && !isHonor(tile)) {
    const s = suitOf(tile);
    const r = rankOf(tile);
    for (const [a, b] of [
      [r - 2, r - 1],
      [r - 1, r + 1],
      [r + 1, r + 2],
    ]) {
      if (a < 1 || b > 9) continue;
      const ta = hand.filter((t) => suitOf(t) === s && rankOf(t) === a);
      const tb = hand.filter((t) => suitOf(t) === s && rankOf(t) === b);
      const seen = new Set<string>();
      for (const x of ta)
        for (const y of tb) {
          const key = `${x}${y}`;
          if (seen.has(key)) continue;
          seen.add(key);
          const fromHand = [x, y];
          if (hasLegalDiscard(hand, fromHand, forbiddenAfterCall('chi', fromHand, tile))) {
            out.push({ type: 'chi', fromHand, called: tile });
          }
        }
    }
  }
  return out;
}

/**
 * 自分の番にできる暗槓の種類。hand はツモ牌を含む手の内。
 * 立直中は、ツモった牌で 4 枚そろい（送り槓不可）、かつ槓のあとも待ちの種類が変わらない場合だけ。
 */
export function ankanOptions(
  hand: Tile[],
  opts: { riichi?: boolean; drawn?: Tile; openMelds?: number; wallRemaining?: number; kanCount?: number } = {},
): number[] {
  if ((opts.wallRemaining ?? 1) <= 0 || (opts.kanCount ?? 0) >= 4) return [];
  const counts = new Map<number, number>();
  for (const t of hand) counts.set(kindOf(t), (counts.get(kindOf(t)) ?? 0) + 1);
  const kinds = [...counts].filter(([, n]) => n === 4).map(([k]) => k);
  if (!opts.riichi) return kinds;
  if (!opts.drawn) return [];
  const dk = kindOf(opts.drawn);
  if (!kinds.includes(dk)) return [];
  const melds = opts.openMelds ?? 0;
  // 立直前の 13 枚（ツモ牌を除く）の待ちと、槓したあとの手の待ちを比べる
  const before = [...hand];
  before.splice(before.indexOf(opts.drawn), 1);
  const after = hand.filter((t) => kindOf(t) !== dk);
  const w1 = waits(before, melds);
  const w2 = waits(after, melds + 1);
  return w1.length > 0 && w1.join(',') === w2.join(',') ? [dk] : [];
}

/** 加槓できる種類（ポンした面子と同じ牌を手に持っている）。立直中は不可 */
export function kakanOptions(hand: Tile[], melds: CalledMeld[], opts: { riichi?: boolean; wallRemaining?: number; kanCount?: number } = {}): number[] {
  if (opts.riichi || (opts.wallRemaining ?? 1) <= 0 || (opts.kanCount ?? 0) >= 4) return [];
  const pons = melds.filter((m) => m.type === 'pon').map((m) => kindOf(m.tiles[0]));
  return [...new Set(hand.map(kindOf).filter((k) => pons.includes(k)))];
}

/** 鳴いた面子を表す CalledMeld を作る */
export function toMeld(option: CallOption): CalledMeld {
  return { type: option.type, tiles: [...option.fromHand, option.called] };
}
