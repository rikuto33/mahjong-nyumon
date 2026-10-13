import { useState } from 'react';
import { afterResult, newMatch, type MatchState } from '../../game/match';
import { useI18n } from '../../i18n/I18nContext';
import type { MessageKey } from '../../i18n/translate';
import { eventResult, STAGE9_GUIDED } from '../../tutorial/flow';
import { ScreenHeader } from '../ScreenHeader';
import { MiniBoard } from './MiniBoard';

export function Stage9Guided({ onDone, onNext }: { onDone: () => void; onNext: () => void }) {
  const { t } = useI18n();
  const [step, setStep] = useState(0);
  const [match, setMatch] = useState<MatchState>(() => newMatch(0));
  const finished = step >= STAGE9_GUIDED.length;
  const g = STAGE9_GUIDED[Math.min(step, STAGE9_GUIDED.length - 1)];

  const next = () => {
    const n = step + 1;
    if (n < STAGE9_GUIDED.length) {
      const e = STAGE9_GUIDED[n];
      setMatch(afterResult(match, e.scores, eventResult(e.event!, match.dealer), 0));
    }
    setStep(n);
  };

  return (
    <main className="screen">
      <ScreenHeader title={t('stageMenu.guided')} onBack={onDone} />
      {step === 0 && <p className="muted">{t('flow.guided.intro')}</p>}
      <p className="prompt">{finished ? t('flow.guided.finished') : t(`flow.guided.${g.id}` as MessageKey)}</p>
      <MiniBoard match={match} scores={g.scores} youSeat={0} />
      <div className="bottom-actions">
        <button className="btn btn-primary" onClick={finished ? onNext : next}>
          {t('common.next')}
        </button>
      </div>
    </main>
  );
}
