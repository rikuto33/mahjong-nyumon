/**
 * 牌の表現。雀魂・天鳳と同じ mpsz 表記を使う。
 *   1m–9m 萬子 / 1p–9p 筒子 / 1s–9s 索子 / 0m 0p 0s 赤五
 *   1z–7z 字牌（東 南 西 北 白 發 中）
 * 種類番号（kind, 0–33）は赤五を通常の五と同じに扱う。
 */
export type NumberSuit = 'm' | 'p' | 's';
export type Suit = NumberSuit | 'z';
export type NumberTile = `${0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9}${NumberSuit}`;
export type HonorTile = `${1 | 2 | 3 | 4 | 5 | 6 | 7}z`;
export type Tile = NumberTile | HonorTile;

const SUIT_ORDER: Suit[] = ['m', 'p', 's', 'z'];

export function suitOf(tile: Tile): Suit {
  return tile[1] as Suit;
}

/** 赤五は 5 を返す */
export function rankOf(tile: Tile): number {
  const r = Number(tile[0]);
  return r === 0 ? 5 : r;
}

export function isRed(tile: Tile): boolean {
  return tile[0] === '0';
}

export function isHonor(tile: Tile): boolean {
  return suitOf(tile) === 'z';
}

export function isWind(tile: Tile): boolean {
  return isHonor(tile) && rankOf(tile) <= 4;
}

export function isDragon(tile: Tile): boolean {
  return isHonor(tile) && rankOf(tile) >= 5;
}

export function kindOf(tile: Tile): number {
  return SUIT_ORDER.indexOf(suitOf(tile)) * 9 + rankOf(tile) - 1;
}

export function tileOfKind(kind: number): Tile {
  if (!Number.isInteger(kind) || kind < 0 || kind > 33) throw new Error(`invalid kind: ${kind}`);
  return `${(kind % 9) + 1}${SUIT_ORDER[Math.floor(kind / 9)]}` as Tile;
}

/** 34 種類（赤なし）を種類番号順に */
export const ALL_KINDS: readonly Tile[] = Array.from({ length: 34 }, (_, k) => tileOfKind(k));

export const RED_FIVES: readonly Tile[] = ['0m', '0p', '0s'];

export function isTile(s: string): s is Tile {
  return /^[0-9][mps]$/.test(s) || /^[1-7]z$/.test(s);
}

/** "123m55z" → ['1m','2m','3m','5z','5z'] */
export function parseTiles(text: string): Tile[] {
  const out: Tile[] = [];
  let digits: string[] = [];
  for (const ch of text.replace(/\s+/g, '')) {
    if (/[0-9]/.test(ch)) {
      digits.push(ch);
    } else if (/[mpsz]/.test(ch)) {
      if (digits.length === 0) throw new Error(`suit without digits in "${text}"`);
      for (const d of digits) {
        const t = `${d}${ch}`;
        if (!isTile(t)) throw new Error(`invalid tile "${t}" in "${text}"`);
        out.push(t);
      }
      digits = [];
    } else {
      throw new Error(`unexpected "${ch}" in "${text}"`);
    }
  }
  if (digits.length) throw new Error(`trailing digits in "${text}"`);
  return out;
}

/** 種類順。同じ五なら通常の五のあとに赤五 */
export function compareTiles(a: Tile, b: Tile): number {
  return kindOf(a) - kindOf(b) || Number(isRed(a)) - Number(isRed(b));
}

export function sortTiles(tiles: readonly Tile[]): Tile[] {
  return [...tiles].sort(compareTiles);
}

/** 種類ごとの枚数（長さ 34） */
export function toCounts(tiles: readonly Tile[]): number[] {
  const counts = new Array<number>(34).fill(0);
  for (const t of tiles) counts[kindOf(t)]++;
  return counts;
}

/** 1 組の牌として実在しうるか（各種 4 枚以内、赤五は各 1 枚まで） */
export function isPossibleTileSet(tiles: readonly Tile[]): boolean {
  if (toCounts(tiles).some((c) => c > 4)) return false;
  return RED_FIVES.every((r) => tiles.filter((t) => t === r).length <= 1);
}
