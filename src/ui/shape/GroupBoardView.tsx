import { useI18n } from '../../i18n/I18nContext';
import type { Board } from '../../tutorial/groupBoard';
import { ungroupedIds } from '../../tutorial/groupBoard';
import { Tile } from '../tile/Tile';

type Props = {
  board: Board;
  selected: number[];
  tipIds?: number[];
  /** タップできる牌（省略時は残りすべて） */
  canTap?: (id: number) => boolean;
  onTapTile: (id: number) => void;
  onTapGroup?: (index: number) => void;
};

/** 上に残りの牌、下に作った組を並べる */
export function GroupBoardView({ board, selected, tipIds = [], canTap, onTapTile, onTapGroup }: Props) {
  const { t } = useI18n();
  const rest = ungroupedIds(board);
  return (
    <div className="group-board">
      <div className="board-hand">
        {rest.map((id) => (
          <Tile
            key={id}
            tile={board.tiles[id]}
            width="var(--hand-tile)"
            selected={selected.includes(id)}
            mark={tipIds.includes(id) ? 'tip' : undefined}
            disabled={canTap ? !canTap(id) : false}
            onTap={() => onTapTile(id)}
          />
        ))}
      </div>
      <div className="board-groups">
        {board.groups.map((g, i) => {
          const content = (
            <>
              <span className="group-tiles">
                {g.ids.map((id) => (
                  <Tile key={id} tile={board.tiles[id]} width="var(--group-tile)" />
                ))}
              </span>
              <span className="group-label">{t(`shape.puzzle.${g.type}`)}</span>
            </>
          );
          return onTapGroup ? (
            <button key={i} type="button" className="formed-group tappable" onClick={() => onTapGroup(i)}>
              {content}
            </button>
          ) : (
            <div key={i} className="formed-group">
              {content}
            </div>
          );
        })}
      </div>
    </div>
  );
}
