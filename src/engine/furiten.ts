import { kindOf, type Tile } from './tile';
import { waits } from './waits';

/*
 * フリテン（雀魂ルール、SPEC §5.2）
 * - 捨て牌フリテン：自分の待ち牌が自分の捨て牌（鳴かれた牌も含む）にある
 * - 同巡内フリテン：和了牌を見逃したら、次の自分のツモ番までロンできない（搶槓の見逃しを含む）
 * - 立直後の見逃しフリテン：立直後に和了牌を見逃したら、その局の間ずっとロンできない
 * フリテンでもツモ和了はできる。
 */
export type FuritenState = {
  /** 自分が捨てた牌（鳴かれて河から消えた牌も含める） */
  ownDiscards: Tile[];
  /** この巡に和了牌を見逃した */
  skippedThisTurn?: boolean;
  /** 立直後に和了牌を見逃した */
  skippedAfterRiichi?: boolean;
};

export type FuritenReason = 'discard' | 'temporary' | 'riichi';

/** フリテンの理由（なければ null）。hand は 13 枚（副露分少ない） */
export function furitenReason(hand: readonly Tile[], openMelds: number, state: FuritenState): FuritenReason | null {
  const ws = waits(hand, openMelds);
  if (ws.length === 0) return null;
  const discarded = new Set(state.ownDiscards.map(kindOf));
  if (ws.some((k) => discarded.has(k))) return 'discard';
  if (state.skippedAfterRiichi) return 'riichi';
  if (state.skippedThisTurn) return 'temporary';
  return null;
}

export function isFuriten(hand: readonly Tile[], openMelds: number, state: FuritenState): boolean {
  return furitenReason(hand, openMelds, state) !== null;
}
