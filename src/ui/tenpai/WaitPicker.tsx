import { ALL_KINDS } from '../../engine/tile';
import { Tile } from '../tile/Tile';

type Props = {
  selected: number[];
  onToggle: (kind: number) => void;
  canTap?: (kind: number) => boolean;
  /** 判定後の印：correct = 正しく選んだ、wrong = 誤り、tip = 選び漏れ */
  marks?: Map<number, 'correct' | 'wrong' | 'tip'>;
};

const ROWS = [ALL_KINDS.slice(0, 9), ALL_KINDS.slice(9, 18), ALL_KINDS.slice(18, 27), ALL_KINDS.slice(27)];

/** 34 種類から待ち牌を選ぶ。選んだ牌は浮き上がる */
export function WaitPicker({ selected, onToggle, canTap, marks }: Props) {
  let kind = 0;
  return (
    <div className="wait-picker">
      {ROWS.map((row, i) => (
        <div key={i} className="tile-grid-row">
          {row.map((tile) => {
            const k = kind++;
            return (
              <Tile
                key={tile}
                tile={tile}
                width="var(--picker-tile)"
                selected={selected.includes(k)}
                mark={marks?.get(k)}
                disabled={canTap ? !canTap(k) : false}
                onTap={() => onToggle(k)}
              />
            );
          })}
        </div>
      ))}
    </div>
  );
}
