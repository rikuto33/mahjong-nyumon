import { useEffect } from 'react';
import { sortTiles } from '../../engine/tile';
import { play } from '../sound';
import { seatWindOf, type HandState, type Seat } from '../../game/hand';
import { useI18n } from '../../i18n/I18nContext';
import type { MessageKey } from '../../i18n/translate';
import { WinResultView } from '../result/WinResultView';
import { MeldTiles } from '../tile/MeldTiles';
import { Tile } from '../tile/Tile';

/** 局の結果（和了・流局）と点数の増減 */
export function HandResultView({ hand, onNext }: { hand: HandState; onNext: () => void }) {
  const { t } = useI18n();
  const r = hand.result!;
  const name = (s: Seat) => t(`game.names.${s}` as MessageKey);
  const before = hand.scores.map((x, i) => x - r.deltas[i]);
  useEffect(() => {
    if (r.kind === 'draw') play('draw');
  }, [r]);

  return (
    <div className="overlay" role="dialog" aria-modal="true">
      <div className="overlay-card">
        {r.kind === 'win' ? (
          r.wins.map((w, i) => (
            <section key={i} className="result-win">
              <p className="prompt">
                {w.from === null ? t('game.result.winTsumo', { name: name(w.seat) }) : t('game.result.winRon', { name: name(w.seat), from: name(w.from) })}
              </p>
              {w.pao !== null && <p className="muted">{t('game.result.pao', { name: name(w.pao) })}</p>}
              <WinResultView result={w.result} tsumo={w.from === null} hand={sortTiles(w.hand)} winTile={w.winTile} />
              {w.melds.length > 0 && (
                <div className="result-melds">
                  {w.melds.map((m, j) => (
                    <MeldTiles key={j} meld={m.meld} called={m.called ?? undefined} width="var(--group-tile)" />
                  ))}
                </div>
              )}
              {w.uraIndicators.length > 0 && (
                <div className="dora-box dora-inline">
                  <span className="dora-label">{t('game.result.ura')}</span>
                  <span className="dora-tiles">
                    {w.uraIndicators.map((x, j) => (
                      <Tile key={j} tile={x} width="var(--group-tile)" />
                    ))}
                  </span>
                </div>
              )}
            </section>
          ))
        ) : (
          <section>
            <p className="prompt">{t(`game.result.${r.reason}` as MessageKey)}</p>
            {r.nagashi.map((s) => (
              <p key={s}>{t('game.result.nagashi', { name: name(s) })}</p>
            ))}
          </section>
        )}
        <table className="score-table">
          <tbody>
            {([0, 1, 2, 3] as Seat[]).map((s) => (
              <tr key={s}>
                <td>
                  {name(s)} <span className="muted">({t(`table.wind${seatWindOf(hand, s)}` as MessageKey)})</span>
                </td>
                {r.kind === 'draw' && r.reason === 'exhaustive' && (
                  <td className="muted">{r.tenpai[s] ? t('game.result.tenpai') : t('game.result.noten')}</td>
                )}
                <td className="num">{before[s].toLocaleString('de-DE')}</td>
                <td className={`num ${r.deltas[s] > 0 ? 'ok' : r.deltas[s] < 0 ? 'ng' : ''}`}>
                  {r.deltas[s] > 0 ? '+' : ''}
                  {r.deltas[s] !== 0 ? r.deltas[s].toLocaleString('de-DE') : '±0'}
                </td>
                <td className="num strong">{hand.scores[s].toLocaleString('de-DE')}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="bottom-actions">
          <button className="btn btn-primary" onClick={onNext}>
            {t('game.result.next')}
          </button>
        </div>
      </div>
    </div>
  );
}
