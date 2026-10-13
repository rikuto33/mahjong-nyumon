import type { MatchState } from '../../game/match';
import { useI18n } from '../../i18n/I18nContext';
import type { MessageKey } from '../../i18n/translate';

/** 終局：順位と最終点数（ウマ・オカは使わない。SPEC §5.2） */
export function FinalView({ match, onNewGame, onDone }: { match: MatchState; onNewGame: () => void; onDone: () => void }) {
  const { t } = useI18n();
  return (
    <main className="screen">
      <h1>{t('game.final.title')}</h1>
      {match.endReason && <p className="muted">{t(`game.final.reason.${match.endReason}` as MessageKey)}</p>}
      <ol className="final-ranking">
        {match.ranking!.map((seat, i) => (
          <li key={seat} className={seat === 0 ? 'me' : ''}>
            <span className="place">{t('game.final.place', { n: i + 1 })}</span>
            <span className="who">{t(`game.names.${seat}` as MessageKey)}</span>
            <span className="num">{match.scores[seat].toLocaleString('de-DE')}</span>
          </li>
        ))}
      </ol>
      <div className="button-row">
        <button className="btn" onClick={onNewGame}>
          {t('game.final.newGame')}
        </button>
        <button className="btn btn-primary" onClick={onDone}>
          {t('common.done')}
        </button>
      </div>
    </main>
  );
}
