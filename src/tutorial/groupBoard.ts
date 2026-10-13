import { decompose } from '../engine/decompose';
import { checkGroup, type GroupInvalidReason, type GroupType } from '../engine/group';
import { kindOf, type Tile } from '../engine/tile';

/** 段階 2 のパズル：手牌を組に分けていく状態。牌の id は tiles の添字 */
export type BoardGroup = { ids: number[]; type: GroupType };
export type Board = { tiles: Tile[]; groups: BoardGroup[] };

export type MakeGroupError = GroupInvalidReason | 'secondPair';

export function newBoard(tiles: Tile[]): Board {
  return { tiles, groups: [] };
}

export function ungroupedIds(board: Board): number[] {
  const used = new Set(board.groups.flatMap((g) => g.ids));
  return board.tiles.map((_, i) => i).filter((i) => !used.has(i));
}

export function makeGroup(
  board: Board,
  ids: number[],
): { ok: true; board: Board; type: GroupType } | { ok: false; reason: MakeGroupError } {
  const check = checkGroup(ids.map((i) => board.tiles[i]));
  if (!check.ok) return { ok: false, reason: check.reason };
  if (check.type === 'pair' && board.groups.some((g) => g.type === 'pair')) {
    return { ok: false, reason: 'secondPair' };
  }
  const sorted = [...ids].sort((a, b) => a - b);
  return { ok: true, type: check.type, board: { ...board, groups: [...board.groups, { ids: sorted, type: check.type }] } };
}

export function dissolveGroup(board: Board, index: number): Board {
  return { ...board, groups: board.groups.filter((_, i) => i !== index) };
}

/** すべての牌が組になっていれば完成（雀頭は 1 つしか作れないので 4 面子 1 雀頭になる） */
export function isSolved(board: Board): boolean {
  return ungroupedIds(board).length === 0 && board.groups.some((g) => g.type === 'pair');
}

/**
 * ヒント：残りの牌で作れる組を 1 つ返す（牌の id）。
 * 今の組み方では完成できないなら null。
 */
export function findTip(board: Board): number[] | null {
  const rest = ungroupedIds(board);
  if (rest.length === 0) return null;
  const needPair = !board.groups.some((g) => g.type === 'pair');
  const sols = decompose(
    rest.map((i) => board.tiles[i]),
    needPair,
  );
  if (sols.length === 0) return null;
  const sol = sols[0];
  const kinds =
    sol.melds.length > 0
      ? sol.melds[0].type === 'koutsu'
        ? [sol.melds[0].kind, sol.melds[0].kind, sol.melds[0].kind]
        : [sol.melds[0].kind, sol.melds[0].kind + 1, sol.melds[0].kind + 2]
      : [sol.pair!, sol.pair!];
  const pool = [...rest];
  return kinds.map((k) => {
    const at = pool.findIndex((i) => kindOf(board.tiles[i]) === k);
    return pool.splice(at, 1)[0];
  });
}
