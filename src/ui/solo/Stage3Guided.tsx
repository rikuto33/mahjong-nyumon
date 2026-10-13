import { useState } from 'react';
import { parseTiles } from '../../engine/tile';
import { discard, startSolo, type SoloState } from '../../game/solo';
import { useI18n } from '../../i18n/I18nContext';
import type { MessageKey } from '../../i18n/translate';
import { STAGE3_GUIDED, STAGE3_GUIDED_HAND } from '../../tutorial/solo';
import { ScreenHeader } from '../ScreenHeader';
import { SoloBoard, type DiscardTarget } from './SoloBoard';

const WALL = parseTiles(STAGE3_GUIDED_HAND + STAGE3_GUIDED.map((g) => g.draw).join(''));

export function Stage3Guided({ onDone }: { onDone: () => void }) {
  const { t } = useI18n();
  const [state, setState] = useState<SoloState>(() => startSolo(WALL));
  const [step, setStep] = useState(0);
  const [phase, setPhase] = useState<'prompt' | 'after' | 'won'>('prompt');
  const current = STAGE3_GUIDED[step];
  const target = current.discard ? parseTiles(current.discard)[0] : null;

  const canDiscard = (d: DiscardTarget) => {
    if (phase !== 'prompt' || !target) return false;
    const tile = d === 'drawn' ? state.drawn : state.hand[d];
    if (tile !== target) return false;
    // 同じ牌が手牌とツモ牌の両方にあるときはツモ切りを指示する
    return d === 'drawn' || state.drawn !== target;
  };

  const text =
    phase === 'won'
      ? t('solo.guided.finished')
      : t(`solo.guided.${current.id}.${phase}` as MessageKey);

  return (
    <main className="screen screen-wide">
      <ScreenHeader title={t('stageMenu.guided')} onBack={onDone} />
      <div className="instruction" aria-live="polite">
        {step === 0 && phase === 'prompt' && <p className="muted">{t('solo.guided.intro')}</p>}
        <p className="prompt">{text}</p>
      </div>
      <SoloBoard
        state={state}
        canDiscard={canDiscard}
        showTsumo={phase === 'prompt' && current.discard === null}
        onDiscard={(d) => {
          setState(discard(state, d));
          setPhase('after');
        }}
        onTsumo={() => setPhase('won')}
      />
      <div className="bottom-actions">
        {phase === 'after' && (
          <button
            className="btn btn-primary"
            onClick={() => {
              setStep(step + 1);
              setPhase('prompt');
            }}
          >
            {t('common.next')}
          </button>
        )}
        {phase === 'won' && (
          <button className="btn btn-primary" onClick={onDone}>
            {t('common.done')}
          </button>
        )}
      </div>
    </main>
  );
}
