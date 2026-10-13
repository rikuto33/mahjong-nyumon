import { parseTiles } from '../../engine/tile';
import { Tile } from './Tile';

/** mpsz 表記の行を図として並べる。行内の空白で組の間をあける */
export function TileRows({ rows, width }: { rows: string[]; width?: string }) {
  return (
    <div className="tile-rows">
      {rows.map((row, i) => (
        <div key={i} className="tile-row">
          {row.split(' ').map((part, j) => (
            <span key={j} className="tile-group">
              {parseTiles(part).map((tile, k) => (
                <Tile key={k} tile={tile} width={width} />
              ))}
            </span>
          ))}
        </div>
      ))}
    </div>
  );
}
