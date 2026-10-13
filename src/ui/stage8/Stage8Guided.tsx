import { useState } from 'react';
import { doraFromIndicator } from '../../engine/score';
import { parseTiles } from '../../engine/tile';
import { useI18n } from '../../i18n/I18nContext';
import type { MessageKey } from '../../i18n/translate';
import { STAGE8_GUIDED } from '../../tutorial/stage8';
import { ScreenHeader } from '../ScreenHeader';
import { WaitPicker } from '../stage4/WaitPicker';
import { Tile } from '../tile/Tile';

export function Stage8Guided({ onDone }: { onDone: () => void }) {
  const { t } = useI18n();
  const [step, setStep] = useState(0);
  const [done, setDone] = useState(false);
  const finished = step >= STAGE8_GUIDED.length;
  const g = STAGE8_GUIDED[step];
  const target = g ? doraFromIndicator(parseTiles(g.indicator)[0]) : -1;

  return (
    <main className="screen screen-wide">
      <ScreenHeader title={t('stageMenu.guided')} onBack={onDone} />
      <div className="instruction" aria-live="polite">
        {finished ? (
          <p className="prompt">{t('stage8.guided.finished')}</p>
        ) : (
          <>
            {step === 0 && !done && <p className="muted">{t('stage8.guided.intro')}</p>}
            <p className="prompt">{t(`stage8.guided.${g.id}.${done ? 'after' : 'prompt'}` as MessageKey)}</p>
          </>
        )}
      </div>
      {!finished && (
        <>
          <div className="dora-box dora-inline">
            <span className="dora-label">{t('stage8.guided.indicator')}</span>
            <Tile tile={parseTiles(g.indicator)[0]} width="var(--choice-tile)" />
          </div>
          <WaitPicker
            selected={done ? [target] : []}
            marks={done ? new Map([[target, 'correct']]) : undefined}
            canTap={(k) => !done && k === target}
            onToggle={() => setDone(true)}
          />
        </>
      )}
      <div className="bottom-actions">
        {finished ? (
          <button className="btn btn-primary" onClick={onDone}>
            {t('common.done')}
          </button>
        ) : (
          done && (
            <button
              className="btn btn-primary"
              onClick={() => {
                setStep(step + 1);
                setDone(false);
              }}
            >
              {t('common.next')}
            </button>
          )
        )}
      </div>
    </main>
  );
}
