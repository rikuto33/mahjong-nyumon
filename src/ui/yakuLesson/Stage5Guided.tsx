import { useState } from 'react';
import { scoreWin } from '../../engine/score';
import { parseTiles } from '../../engine/tile';
import { discard, startSolo, type SoloState } from '../../game/solo';
import { useI18n } from '../../i18n/I18nContext';
import type { MessageKey } from '../../i18n/translate';
import { STAGE5_GUIDED, STAGE5_GUIDED_HAND, STAGE5_ROUND, STAGE5_SEAT } from '../../tutorial/yaku';
import { WinResultView } from '../result/WinResultView';
import { ScreenHeader } from '../ScreenHeader';
import { SoloBoard, type DiscardTarget } from '../solo/SoloBoard';

const WALL = parseTiles(STAGE5_GUIDED_HAND + STAGE5_GUIDED.map((g) => g.draw).join(''));

export function Stage5Guided({ onDone }: { onDone: () => void }) {
  const { t } = useI18n();
  const [state, setState] = useState<SoloState>(() => startSolo(WALL));
  const [step, setStep] = useState(0);
  const [phase, setPhase] = useState<'prompt' | 'after' | 'won'>('prompt');
  const [riichiPending, setRiichiPending] = useState(false);
  const [riichiAt, setRiichiAt] = useState<number | null>(null);
  const current = STAGE5_GUIDED[step];
  const target = current.tile ? parseTiles(current.tile)[0] : null;

  const canDiscard = (d: DiscardTarget) => {
    if (phase !== 'prompt' || !target) return false;
    if (current.action === 'riichi' && !riichiPending) return false;
    const tile = d === 'drawn' ? state.drawn : state.hand[d];
    return tile === target && (d === 'drawn' || state.drawn !== target);
  };

  if (phase === 'won') {
    const result = scoreWin({
      hand: [...state.hand, state.drawn!],
      winTile: state.drawn!,
      tsumo: true,
      riichi: true,
      seatWind: STAGE5_SEAT,
      roundWind: STAGE5_ROUND,
    })!;
    return (
      <main className="screen screen-wide">
        <ScreenHeader title={t('stageMenu.guided')} onBack={onDone} />
        <p className="prompt">{t('yakuLesson.guided.finished')}</p>
        <WinResultView result={result} tsumo hand={state.hand} winTile={state.drawn!} />
        <div className="bottom-actions">
          <button className="btn btn-primary" onClick={onDone}>
            {t('common.done')}
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="screen screen-wide">
      <ScreenHeader title={t('stageMenu.guided')} onBack={onDone} />
      <div className="instruction" aria-live="polite">
        {step === 0 && phase === 'prompt' && <p className="muted">{t('yakuLesson.guided.intro')}</p>}
        <p className="prompt">{t(`yakuLesson.guided.${current.id}.${phase}` as MessageKey)}</p>
      </div>
      <SoloBoard
        state={state}
        canDiscard={canDiscard}
        showTsumo={phase === 'prompt' && current.action === 'tsumo'}
        showRiichi={phase === 'prompt' && current.action === 'riichi'}
        riichiPending={riichiPending}
        onRiichi={() => setRiichiPending(true)}
        riichiAt={riichiAt}
        onDiscard={(d) => {
          if (current.action === 'riichi') setRiichiAt(state.river.length);
          setState(discard(state, d));
          setRiichiPending(false);
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
      </div>
    </main>
  );
}
