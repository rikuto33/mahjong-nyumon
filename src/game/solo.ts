import { agariForms, type AgariForm } from '../engine/agari';
import { ALL_KINDS, RED_FIVES, sortTiles, type Tile } from '../engine/tile';

/**
 * 段階 3 の一人麻雀。役も鳴きもなし、形がそろえばツモ和了。
 * hand は常に 13 枚（並べ替え済み）、drawn はツモった牌（打牌待ちのときだけ）。
 */
export type SoloState = {
  hand: Tile[];
  drawn: Tile | null;
  river: Tile[];
  wall: Tile[];
  /** ツモった回数 */
  draws: number;
};

/** 136 枚（赤五は各色 1 枚） */
export function fullTileSet(): Tile[] {
  const tiles: Tile[] = [];
  for (const t of ALL_KINDS) {
    const red = RED_FIVES.find((r) => r[1] === t[1] && t[0] === '5');
    tiles.push(t, t, t, red ?? t);
  }
  return tiles;
}

export function shuffled<T>(items: readonly T[], rng: () => number = Math.random): T[] {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** wall の先頭 13 枚を配牌にし、続けて 1 枚ツモる */
export function startSolo(wall: readonly Tile[]): SoloState {
  return draw({ hand: sortTiles(wall.slice(0, 13)), drawn: null, river: [], wall: wall.slice(13), draws: 0 });
}

export function draw(s: SoloState): SoloState {
  if (s.drawn || s.wall.length === 0) return s;
  return { ...s, drawn: s.wall[0], wall: s.wall.slice(1), draws: s.draws + 1 };
}

/** 14 枚（手牌＋ツモ牌） */
export function fullHand(s: SoloState): Tile[] {
  return s.drawn ? [...s.hand, s.drawn] : [...s.hand];
}

/** index: 手牌の位置、'drawn' ならツモ切り。打牌後に次の牌をツモる */
export function discard(s: SoloState, index: number | 'drawn'): SoloState {
  if (!s.drawn) return s;
  let hand: Tile[];
  let out: Tile;
  if (index === 'drawn') {
    hand = s.hand;
    out = s.drawn;
  } else {
    out = s.hand[index];
    hand = sortTiles([...s.hand.filter((_, i) => i !== index), s.drawn]);
  }
  return draw({ ...s, hand, drawn: null, river: [...s.river, out] });
}

/** ツモ和了できるなら和了形の種類、できなければ空 */
export function tsumoForms(s: SoloState): AgariForm[] {
  return s.drawn ? agariForms(fullHand(s)) : [];
}

export function isWallEmpty(s: SoloState): boolean {
  return !s.drawn && s.wall.length === 0;
}
