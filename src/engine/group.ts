import { isHonor, kindOf, rankOf, suitOf, type Tile } from './tile';

/** 面子・雀頭の種類。槓子は副露とあわせてフェーズ 4 で扱う */
export type GroupType = 'shuntsu' | 'koutsu' | 'pair';

export type GroupInvalidReason =
  | 'wrongSize' // 2 枚でも 3 枚でもない
  | 'pairNotSame' // 2 枚が同じ牌でない
  | 'mixedSuits' // 3 枚の色がそろっていない
  | 'honorSequence' // 字牌で順子を作ろうとした
  | 'notConsecutive'; // 同じ色だが連続していない

export type GroupCheck =
  | { ok: true; type: GroupType }
  | { ok: false; reason: GroupInvalidReason };

/** 選んだ牌が順子・刻子・対子のどれになるか判定する（赤五は通常の五と同じ） */
export function checkGroup(tiles: readonly Tile[]): GroupCheck {
  const kinds = tiles.map(kindOf).sort((a, b) => a - b);
  if (tiles.length === 2) {
    return kinds[0] === kinds[1] ? { ok: true, type: 'pair' } : { ok: false, reason: 'pairNotSame' };
  }
  if (tiles.length !== 3) return { ok: false, reason: 'wrongSize' };
  if (kinds[0] === kinds[2]) return { ok: true, type: 'koutsu' };
  const suits = new Set(tiles.map(suitOf));
  if (suits.size > 1) return { ok: false, reason: 'mixedSuits' };
  if (tiles.some(isHonor)) return { ok: false, reason: 'honorSequence' };
  const ranks = tiles.map(rankOf).sort((a, b) => a - b);
  if (ranks[1] === ranks[0] + 1 && ranks[2] === ranks[1] + 1) return { ok: true, type: 'shuntsu' };
  return { ok: false, reason: 'notConsecutive' };
}
