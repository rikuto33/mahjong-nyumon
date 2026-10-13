import type { CalledMeld } from '../../engine/score';
import { sortTiles, type Tile as TileCode } from '../../engine/tile';
import type { From } from '../../tutorial/calls';
import { Tile } from './Tile';

/** 誰から鳴いたかで横向きにする位置：上家は左、対面は真ん中、下家は右 */
export function sidewaysIndex(from: From, size: number): number {
  return from === 'left' ? 0 : from === 'opposite' ? 1 : size - 1;
}

/**
 * 副露した面子。鳴いた牌（called）を横向きにして、誰から鳴いたかの位置に置く。
 * called を省略したときは先頭の牌を鳴いた牌とみなす。暗槓は両端を裏向きにする。
 */
export function MeldTiles({
  meld,
  from = 'left',
  called,
  width,
  shine,
}: {
  meld: CalledMeld;
  from?: From;
  called?: TileCode;
  width: string;
  shine?: (tile: TileCode) => boolean;
}) {
  const n = meld.tiles.length;
  if (meld.type === 'ankan') {
    return (
      <span className="meld">
        {sortTiles(meld.tiles).map((tile, i) => (
          <Tile key={i} tile={i === 0 || i === n - 1 ? null : tile} width={width} shine={shine?.(tile)} />
        ))}
      </span>
    );
  }
  const c = called ?? meld.tiles[0];
  const rest = [...meld.tiles];
  rest.splice(rest.indexOf(c), 1);
  const order = sortTiles(rest);
  const at = sidewaysIndex(from, n);
  order.splice(at, 0, c);
  return (
    <span className="meld">
      {order.map((tile, i) => (
        <Tile key={i} tile={tile} sideways={i === at} width={width} shine={shine?.(tile)} />
      ))}
    </span>
  );
}
