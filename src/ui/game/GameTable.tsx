import { useEffect, useRef, type ReactNode } from 'react';
import { play } from '../sound';
import { isRed, kindOf, type Tile as TileCode } from '../../engine/tile';
import { doraFromIndicator } from '../../engine/score';
import type { GroupRole } from '../../engine/analyze';
import { doraIndicators, seatWindOf, type HandState, type OpenMeld, type Seat } from '../../game/hand';
import { useI18n } from '../../i18n/I18nContext';
import type { MessageKey } from '../../i18n/translate';
import type { From } from '../../tutorial/calls';
import { MeldTiles } from '../tile/MeldTiles';
import { Tile } from '../tile/Tile';

export type HandTarget = number | 'drawn';

type Props = {
  hand: HandState;
  /** 台本などで右上に出す説明 */
  overlay?: ReactNode;
  /** 自分の手牌（手の内＋ツモ牌の順）の各牌の役割。色の線で示す */
  roles?: GroupRole[];
  lifted: HandTarget | null;
  canTap: (target: HandTarget) => boolean;
  onTap: (target: HandTarget) => void;
  marks?: TileCode[];
  actions: ReactNode;
  hint?: ReactNode;
  topLeft?: ReactNode;
};

const RIVER_ROW = 6;

/** 鳴いた相手が、鳴いた人から見てどこにいるか */
function relative(owner: Seat, from: Seat | null): From {
  if (from === null) return 'left';
  const d = (from - owner + 4) % 4;
  return d === 3 ? 'left' : d === 2 ? 'opposite' : 'right';
}

function Melds({ owner, melds, width, shine }: { owner: Seat; melds: OpenMeld[]; width: string; shine: (t: TileCode) => boolean }) {
  return (
    <>
      {melds.map((m, i) => (
        <MeldTiles key={i} meld={m.meld} from={relative(owner, m.from)} called={m.called ?? undefined} width={width} shine={shine} />
      ))}
    </>
  );
}

function River({ hand, seat, shine }: { hand: HandState; seat: Seat; shine: (t: TileCode) => boolean }) {
  const p = hand.players[seat];
  // 鳴かれた牌は河から消す。立直宣言牌が鳴かれたら、次の牌を横向きにする
  const shown: { tile: TileCode; sideways: boolean; last: boolean }[] = [];
  let pendingSideways = false;
  p.river.forEach((r, i) => {
    if (r.calledAway) {
      if (r.riichi) pendingSideways = true;
      return;
    }
    shown.push({ tile: r.tile, sideways: !!r.riichi || pendingSideways, last: i === p.river.length - 1 });
    pendingSideways = false;
  });
  const isLast = hand.lastDiscard?.from === seat && hand.phase !== 'turn';
  const rows: (typeof shown)[] = [];
  for (let i = 0; i < shown.length; i += RIVER_ROW) rows.push(shown.slice(i, i + RIVER_ROW));
  return (
    <div className="river">
      {rows.map((row, i) => (
        <div key={i} className="river-row">
          {row.map((d, j) => (
            <Tile key={j} tile={d.tile} sideways={d.sideways} width="var(--river-tile)" mark={isLast && d.last ? 'tip' : undefined} shine={shine(d.tile)} />
          ))}
        </div>
      ))}
    </div>
  );
}

/** 打牌・鳴き・立直の音（AI の操作も含めて、状態の変化から鳴らす） */
function useTableSounds(hand: HandState) {
  const prev = useRef<{ river: number; melds: number } | null>(null);
  useEffect(() => {
    const river = hand.players.reduce((n, p) => n + p.river.length, 0);
    const melds = hand.players.reduce((n, p) => n + p.melds.length, 0);
    const before = prev.current;
    prev.current = { river, melds };
    if (!before) return;
    if (melds > before.melds) play('call');
    else if (river > before.river) {
      const last = hand.lastDiscard ? hand.players[hand.lastDiscard.from].river.at(-1) : null;
      play(last?.riichi ? 'riichi' : 'discard');
    }
  }, [hand]);
}

export function GameTable({ hand, lifted, canTap, onTap, marks = [], actions, hint, topLeft, overlay, roles }: Props) {
  const { t } = useI18n();
  const me = hand.players[0];
  useTableSounds(hand);
  const dora = doraIndicators(hand);
  // 雀魂と同じく、ドラと赤ドラを光らせる
  const doraKinds = dora.map(doraFromIndicator);
  const shine = (tile: TileCode) => isRed(tile) || doraKinds.includes(kindOf(tile));
  const doraSlots = [...dora, ...new Array(Math.max(0, 5 - dora.length)).fill(null)];

  const roleOf = (target: HandTarget) => (roles ? roles[target === 'drawn' ? me.hand.length : target] : undefined);
  const handTile = (tile: TileCode, target: HandTarget) => (
    <span key={`${target}-${tile}`} className={roleOf(target) ? `role role-${roleOf(target)}` : undefined}>
    <Tile
      key={`${target}-${tile}`}
      tile={tile}
      width="var(--my-tile)"
      selected={lifted === target}
      disabled={!canTap(target)}
      mark={marks.includes(tile) ? 'tip' : undefined}
      shine={shine(tile)}
      onTap={() => onTap(target)}
    />
    </span>
  );

  return (
    <main className="table-screen game-screen">
      <div className="table-top">
        {topLeft}
        <div className="dora-box">
          <span className="dora-label">{t('table.doraIndicator')}</span>
          <span className="dora-tiles">
            {doraSlots.map((tile, i) => (
              <Tile key={i} tile={tile} width="var(--dora-tile)" />
            ))}
          </span>
        </div>
      </div>

      <div className="table-area">
        <div className="board">
          <div className="center-panel">
            <span className="round-name">
              {t('table.round', { wind: t(`table.wind${hand.roundWind}` as MessageKey), n: hand.roundNumber })}
            </span>
            <span className="round-sub">
              {t('table.honba', { n: hand.honba })} · {t('table.riichiSticks', { n: hand.riichiSticks })}
            </span>
            <span className="round-sub">{t('table.remaining', { n: hand.wall.length })}</span>
          </div>
          {([0, 1, 2, 3] as Seat[]).map((seat) => {
            const p = hand.players[seat];
            const wind = seatWindOf(hand, seat);
            return (
              <div key={seat} className={`seat seat-${seat} ${hand.turn === seat && hand.phase === 'turn' ? 'active' : ''}`}>
                <div className={`seat-score ${p.riichi ? 'riichi' : ''}`}>
                  <span className={`seat-wind ${wind === 1 ? 'dealer' : ''}`}>{t(`table.wind${wind}` as MessageKey)}</span>
                  <span>{hand.scores[seat].toLocaleString('de-DE')}</span>
                  {p.riichi && <span className="riichi-stick" aria-label={t('actions.riichi')} />}
                </div>
                <River hand={hand} seat={seat} shine={shine} />
                {seat !== 0 && (
                  <div className="opponent-hand">
                    {Array.from({ length: p.hand.length + (p.drawn ? 1 : 0) }, (_, i) => (
                      <Tile key={i} tile={null} width="var(--opp-tile)" />
                    ))}
                    <Melds owner={seat} melds={p.melds} width="var(--opp-tile)" shine={shine} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {overlay}
      <div className="my-area">
        <div className="game-hint" aria-live="polite">
          {hint}
        </div>
        <div className="action-bar">{actions}</div>
        <div className="my-hand-row">
          <div className="my-hand">
            {me.hand.map((tile, i) => handTile(tile, i))}
            {me.drawn && <span className="drawn-gap">{handTile(me.drawn, 'drawn')}</span>}
          </div>
          <div className="my-melds">
            <Melds owner={0} melds={me.melds} width="var(--my-meld-tile)" shine={shine} />
          </div>
        </div>
      </div>
    </main>
  );
}
