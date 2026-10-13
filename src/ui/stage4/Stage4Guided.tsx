import { useState } from 'react';
import { kindOf, parseTiles, sortTiles } from '../../engine/tile';
import { useI18n } from '../../i18n/I18nContext';
import type { MessageKey } from '../../i18n/translate';
import { STAGE4_GUIDED } from '../../tutorial/stage4';
import { ScreenHeader } from '../ScreenHeader';
import { Tile } from '../tile/Tile';
import { WaitPicker } from './WaitPicker';

export function Stage4Guided({ onDone }: { onDone: () => void }) {
  const { t } = useI18n();
  const [step, setStep] = useState(0);
  const [selected, setSelected] = useState<number[]>([]);
  const finished = step >= STAGE4_GUIDED.length;
  const current = STAGE4_GUIDED[step];
  const answer = current ? parseTiles(current.waits).map(kindOf) : [];
  const done = !finished && answer.every((k) => selected.includes(k));

  return (
    <main className="screen screen-wide">
      <ScreenHeader title={t('stageMenu.guided')} onBack={onDone} />
      <div className="instruction" aria-live="polite">
        {finished ? (
          <p className="prompt">{t('stage4.guided.finished')}</p>
        ) : (
          <>
            {step === 0 && selected.length === 0 && <p className="muted">{t('stage4.guided.intro')}</p>}
            <p className="prompt">{t(`stage4.guided.${current.id}.${done ? 'after' : 'prompt'}` as MessageKey)}</p>
          </>
        )}
      </div>
      {!finished && (
        <>
          <div className="quiz-hand">
            {sortTiles(parseTiles(current.hand)).map((tile, i) => (
              <Tile key={i} tile={tile} width="var(--hand-tile)" />
            ))}
          </div>
          <WaitPicker
            selected={selected}
            canTap={(k) => !done && answer.includes(k) && !selected.includes(k)}
            marks={done ? new Map(answer.map((k) => [k, 'correct'])) : undefined}
            onToggle={(k) => setSelected([...selected, k])}
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
                setSelected([]);
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
