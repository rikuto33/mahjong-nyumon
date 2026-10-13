import { useState } from 'react';
import type { Tile as TileCode } from '../../engine/tile';
import { useI18n } from '../../i18n/I18nContext';
import type { MessageKey } from '../../i18n/translate';
import { ScreenHeader } from '../ScreenHeader';
import { Tile } from '../tile/Tile';
import { DEMO_TABLE } from './demoTable';
import type { Discard, Meld, SeatView } from './types';

const RIVER_ROW = 6;

function River({ discards }: { discards: Discard[] }) {
  const rows: Discard[][] = [];
  for (let i = 0; i < discards.length; i += RIVER_ROW) rows.push(discards.slice(i, i + RIVER_ROW));
  return (
    <div className="river">
      {rows.map((row, i) => (
        <div key={i} className="river-row">
          {row.map((d, j) => (
            <Tile key={j} tile={d.tile} sideways={d.riichi} width="var(--river-tile)" />
          ))}
        </div>
      ))}
    </div>
  );
}

function MeldView({ meld, width }: { meld: Meld; width: string }) {
  return (
    <span className="meld">
      {meld.tiles.map((tile, i) => (
        <Tile key={i} tile={tile} sideways={i === meld.sideways} width={width} />
      ))}
    </span>
  );
}

/** 1 人分（河・点数・他家の手牌）。卓の中心を軸に回転させて四方に置く */
function Seat({ seat, position }: { seat: SeatView; position: 0 | 1 | 2 | 3 }) {
  const { t } = useI18n();
  return (
    <div className={`seat seat-${position}`}>
      <div className={`seat-score ${seat.riichi ? 'riichi' : ''}`}>
        <span className={`seat-wind ${seat.wind === 1 ? 'dealer' : ''}`}>{t(`table.wind${seat.wind}` as MessageKey)}</span>
        <span>{seat.score.toLocaleString('de-DE')}</span>
        {seat.riichi && <span className="riichi-stick" aria-label={t('actions.riichi')} />}
      </div>
      <River discards={seat.discards} />
      {position !== 0 && (
        <div className="opponent-hand">
          {Array.from({ length: seat.handCount }, (_, i) => (
            <Tile key={i} tile={null} width="var(--opp-tile)" />
          ))}
          {seat.melds.map((m, i) => (
            <MeldView key={i} meld={m} width="var(--opp-tile)" />
          ))}
        </div>
      )}
    </div>
  );
}

export function TableScreen({ onBack }: { onBack: () => void }) {
  const { t } = useI18n();
  const table = DEMO_TABLE;
  const [hand, setHand] = useState<TileCode[]>(table.myHand);
  const [myDiscards, setMyDiscards] = useState<Discard[]>(table.seats[0].discards);
  const [lifted, setLifted] = useState<number | null>(null);

  // 雀魂と同じ：1 回目のタップで浮かせ、同じ牌をもう一度タップで打牌
  const tap = (i: number) => {
    if (lifted !== i) {
      setLifted(i);
      return;
    }
    setMyDiscards([...myDiscards, { tile: hand[i] }]);
    setHand(hand.filter((_, j) => j !== i));
    setLifted(null);
  };

  const seats = table.seats.map((s, i) => (i === 0 ? { ...s, discards: myDiscards } : s));
  const doraSlots = [...table.doraIndicators, null, null, null, null].slice(0, 5);

  return (
    <main className="table-screen">
      <div className="table-top">
        <ScreenHeader onBack={onBack} />
        <div className="dora-box">
          <span className="dora-label">{t('table.doraIndicator')}</span>
          <span className="dora-tiles">
            {doraSlots.map((tile, i) => (
              <Tile key={i} tile={tile} width="var(--dora-tile)" />
            ))}
          </span>
        </div>
        <p className="table-note">{t('table.previewNote')}</p>
      </div>

      <div className="table-area">
        <div className="board">
          <div className="center-panel">
            <span className="round-name">
              {t('table.round', { wind: t(`table.wind${table.roundWind}` as MessageKey), n: table.roundNumber })}
            </span>
            <span className="round-sub">
              {t('table.honba', { n: table.honba })} · {t('table.riichiSticks', { n: table.riichiSticks })}
            </span>
            <span className="round-sub">{t('table.remaining', { n: table.remaining })}</span>
          </div>
          {seats.map((s, i) => (
            <Seat key={i} seat={s} position={i as 0 | 1 | 2 | 3} />
          ))}
        </div>
      </div>

      <div className="my-area">
        <div className="action-bar">
          {(['chi', 'pon', 'ron', 'skip'] as const).map((a) => (
            <button key={a} className={`btn action-btn action-${a}`}>
              {t(`actions.${a}`)}
            </button>
          ))}
        </div>
        <div className="my-hand-row">
          <div className="my-hand">
            {hand.map((tile, i) => (
              <Tile
                key={`${tile}-${i}`}
                tile={tile}
                width="var(--my-tile)"
                selected={lifted === i}
                onTap={() => tap(i)}
              />
            ))}
          </div>
          <div className="my-melds">
            {seats[0].melds.map((m, i) => (
              <MeldView key={i} meld={m} width="var(--my-meld-tile)" />
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
