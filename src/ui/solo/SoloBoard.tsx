import { useEffect, useState } from 'react';
import type { Tile as TileCode } from '../../engine/tile';
import type { SoloState } from '../../game/solo';
import { useI18n } from '../../i18n/I18nContext';
import { Tile } from '../tile/Tile';

export type DiscardTarget = number | 'drawn';

type Props = {
  state: SoloState;
  canDiscard: (target: DiscardTarget) => boolean;
  /** ヒントで印をつける牌 */
  tipTiles?: TileCode[];
  showTsumo: boolean;
  onDiscard: (target: DiscardTarget) => void;
  onTsumo: () => void;
  /** 立直ボタン（押すと次の打牌が立直宣言牌になる） */
  showRiichi?: boolean;
  riichiPending?: boolean;
  onRiichi?: () => void;
  /** 河で横向きにする牌の位置（立直宣言牌） */
  riichiAt?: number | null;
};

const RIVER_ROW = 6;

/** 一人麻雀の盤面：上に河、下に手牌（ツモ牌は右に離して置く） */
export function SoloBoard({
  state,
  canDiscard,
  tipTiles = [],
  showTsumo,
  onDiscard,
  onTsumo,
  showRiichi,
  riichiPending,
  onRiichi,
  riichiAt = null,
}: Props) {
  const { t } = useI18n();
  const [lifted, setLifted] = useState<DiscardTarget | null>(null);
  useEffect(() => setLifted(null), [state]);

  // 雀魂と同じ：1 回目のタップで浮かせ、同じ牌をもう一度タップで打牌
  const tap = (target: DiscardTarget) => {
    if (lifted === target) onDiscard(target);
    else setLifted(target);
  };

  const rows: TileCode[][] = [];
  for (let i = 0; i < state.river.length; i += RIVER_ROW) rows.push(state.river.slice(i, i + RIVER_ROW));

  const tileProps = (tile: TileCode, target: DiscardTarget) => ({
    tile,
    width: 'var(--hand-tile)',
    selected: lifted === target,
    mark: tipTiles.includes(tile) ? ('tip' as const) : undefined,
    disabled: !canDiscard(target),
    onTap: () => tap(target),
  });

  return (
    <div className="solo-board">
      <div className="solo-info">
        <span>{t('solo.game.draws', { n: state.draws })}</span>
        <span>{t('solo.game.wall', { n: state.wall.length })}</span>
      </div>
      <div className="solo-river">
        {rows.map((row, i) => (
          <div key={i} className="river-row">
            {row.map((tile, j) => (
              <Tile key={j} tile={tile} width="var(--solo-river-tile)" sideways={i * RIVER_ROW + j === riichiAt} />
            ))}
          </div>
        ))}
      </div>
      <div className="action-bar">
        {showRiichi && (
          <button className={`btn action-btn action-riichi ${riichiPending ? 'active' : ''}`} onClick={onRiichi}>
            {t('actions.riichi')}
          </button>
        )}
        {showTsumo && (
          <button className="btn action-btn action-tsumo" onClick={onTsumo}>
            {t('actions.tsumo')}
          </button>
        )}
      </div>
      <div className="solo-hand">
        <span className="solo-hand-main">
          {state.hand.map((tile, i) => (
            <Tile key={`${i}-${tile}`} {...tileProps(tile, i)} />
          ))}
        </span>
        {state.drawn && (
          <span className="solo-drawn">
            <Tile {...tileProps(state.drawn, 'drawn')} />
          </span>
        )}
      </div>
    </div>
  );
}
