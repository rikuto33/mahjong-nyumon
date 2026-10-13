import { kindOf, parseTiles, type Tile } from '../engine/tile';
import type { Seat } from './hand';
import { fullTileSet, shuffled } from './solo';

export function seeded(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * テスト用に 136 枚の並びを作る。
 * hands は席 0〜3 の配牌（13 枚未満なら残りをランダムで埋める。null なら全部ランダム）、
 * draws はツモ順（親から順に引く牌）、dora・ura・rinshan は王牌に置く牌。
 */
export function makeTiles(opts: {
  dealer: Seat;
  hands: (string | null)[];
  draws?: string;
  dora?: string;
  ura?: string;
  rinshan?: string;
  seed?: number;
}): Tile[] {
  const pool = fullTileSet();
  const take = (t: Tile): Tile => {
    let i = pool.indexOf(t);
    if (i < 0) i = pool.findIndex((x) => kindOf(x) === kindOf(t));
    if (i < 0) throw new Error(`no more ${t}`);
    return pool.splice(i, 1)[0];
  };
  const hands: Tile[][] = opts.hands.map((h) => parseTiles(h ?? '').map(take));
  const draws = parseTiles(opts.draws ?? '').map(take);
  const dead: (Tile | undefined)[] = new Array(14);
  parseTiles(opts.rinshan ?? '').forEach((t, i) => (dead[i] = take(t)));
  if (opts.dora) dead[4] = take(parseTiles(opts.dora)[0]);
  if (opts.ura) dead[9] = take(parseTiles(opts.ura)[0]);
  const rest = shuffled(pool, seeded(opts.seed ?? 1));
  for (const h of hands) {
    if (h.length > 13) throw new Error('too many tiles in hand');
    while (h.length < 13) h.push(rest.pop()!);
  }
  for (let i = 0; i < 14; i++) if (!dead[i]) dead[i] = rest.pop()!;
  const dealt: Tile[] = [];
  for (let i = 0; i < 4; i++) dealt.push(...hands[(opts.dealer + i) % 4]);
  return [...dealt, ...draws, ...rest, ...(dead as Tile[])];
}
