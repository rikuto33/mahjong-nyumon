import { useState } from 'react';
import { useI18n } from '../../i18n/I18nContext';
import type { MessageKey } from '../../i18n/translate';
import { STAGE10_TOUR } from '../../tutorial/stage10';
import { TableScreen } from '../table/TableScreen';

/** 段階 10 の台本：卓の見方を順に案内する（静的な卓の上で該当箇所を強調） */
export function Stage10Tour({ onDone }: { onDone: () => void }) {
  const { t } = useI18n();
  const [step, setStep] = useState(0);
  const finished = step >= STAGE10_TOUR.length;
  const cur = STAGE10_TOUR[Math.min(step, STAGE10_TOUR.length - 1)];
  return (
    <div className={finished ? '' : `tour tour-${cur.target}`}>
      <TableScreen onBack={onDone} />
      <div className="tour-box" aria-live="polite">
        {step === 0 && <p className="muted">{t('stage10.tour.intro')}</p>}
        <p>{finished ? t('stage10.tour.finished') : t(`stage10.tour.${cur.id}` as MessageKey)}</p>
        <div className="button-row">
          {finished ? (
            <button className="btn btn-primary" onClick={onDone}>
              {t('common.done')}
            </button>
          ) : (
            <button className="btn btn-primary" onClick={() => setStep(step + 1)}>
              {t('common.next')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
