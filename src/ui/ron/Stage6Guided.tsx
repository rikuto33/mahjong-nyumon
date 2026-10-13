import { useState } from 'react';
import { parseTiles, sortTiles } from '../../engine/tile';
import { useI18n } from '../../i18n/I18nContext';
import type { MessageKey } from '../../i18n/translate';
import { STAGE6_GUIDED } from '../../tutorial/ron';
import { WinResultView } from '../result/WinResultView';
import { ScreenHeader } from '../ScreenHeader';
import { RonSceneView } from './RonSceneView';
import { ronOf } from './ronOf';

export function Stage6Guided({ onDone }: { onDone: () => void }) {
  const { t } = useI18n();
  const [step, setStep] = useState(0);
  const [answered, setAnswered] = useState(false);
  const finished = step >= STAGE6_GUIDED.length;
  const current = STAGE6_GUIDED[step];
  const check = current ? ronOf(current.scene) : null;

  return (
    <main className="screen screen-wide">
      <ScreenHeader title={t('stageMenu.guided')} onBack={onDone} />
      <div className="instruction" aria-live="polite">
        {finished ? (
          <p className="prompt">{t('ron.guided.finished')}</p>
        ) : (
          <>
            {step === 0 && !answered && <p className="muted">{t('ron.guided.intro')}</p>}
            <p className="prompt">{t(`ron.guided.${current.id}.${answered ? 'after' : 'prompt'}` as MessageKey)}</p>
          </>
        )}
      </div>
      {!finished &&
        (answered && check?.ok ? (
          <WinResultView
            result={check.result}
            tsumo={false}
            hand={sortTiles(parseTiles(current.scene.hand))}
            winTile={parseTiles(current.scene.tile)[0]}
          />
        ) : (
          <RonSceneView scene={current.scene} />
        ))}
      <div className="bottom-actions">
        {finished ? (
          <button className="btn btn-primary" onClick={onDone}>
            {t('common.done')}
          </button>
        ) : answered ? (
          <button
            className="btn btn-primary"
            onClick={() => {
              setStep(step + 1);
              setAnswered(false);
            }}
          >
            {t('common.next')}
          </button>
        ) : check?.ok ? (
          <button className="btn action-btn action-ron" onClick={() => setAnswered(true)}>
            {t('actions.ron')}
          </button>
        ) : (
          <button className="btn" onClick={() => setAnswered(true)}>
            {t('actions.skip')}
          </button>
        )}
      </div>
    </main>
  );
}
