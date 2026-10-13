import type { Seat } from '../../game/hand';
import type { MatchState } from '../../game/match';
import { useI18n } from '../../i18n/I18nContext';
import type { MessageKey } from '../../i18n/translate';

/** 段階 9：局・本場・親と点数だけの小さな表示 */
export function MiniBoard({ match, scores, youSeat }: { match: Pick<MatchState, 'roundWind' | 'roundNumber' | 'honba' | 'dealer'>; scores: number[]; youSeat?: Seat }) {
  const { t } = useI18n();
  // 親から順に（東・南・西・北）
  const order = [0, 1, 2, 3].map((i) => ((match.dealer + i) % 4) as Seat);
  return (
    <div className="mini-board">
      <div className="mini-round">
        {t('table.round', { wind: t(`table.wind${match.roundWind}` as MessageKey), n: match.roundNumber })} ·{' '}
        {t('table.honba', { n: match.honba })}
      </div>
      <ul>
        {order.map((seat, i) => (
          <li key={seat} className={i === 0 ? 'dealer' : ''}>
            <span>
              {t(`table.wind${i + 1}` as MessageKey)}
              {i === 0 && ` (${t('flow.guided.dealer')})`}
              {youSeat === seat && ` · ${t('flow.guided.you')}`}
            </span>
            <span className="num">{scores[seat].toLocaleString('de-DE')}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
