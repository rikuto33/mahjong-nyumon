import { useState } from 'react';
import { ALL_KINDS, RED_FIVES, type Tile as TileCode } from '../../engine/tile';
import { useI18n } from '../../i18n/I18nContext';
import type { MessageKey } from '../../i18n/translate';
import { STAGE1_GUIDED } from '../../tutorial/tiles';
import { ScreenHeader } from '../ScreenHeader';
import { useAnswerSound } from '../useSounds';
import { Tile } from '../tile/Tile';

/** 萬子・筒子・索子（各行の最後に赤五）、字牌の 4 行 */
const GRID_ROWS: TileCode[][] = [
  [...ALL_KINDS.slice(0, 9), RED_FIVES[0]],
  [...ALL_KINDS.slice(9, 18), RED_FIVES[1]],
  [...ALL_KINDS.slice(18, 27), RED_FIVES[2]],
  [...ALL_KINDS.slice(27, 34)],
];

export function Stage1Guided({ onDone }: { onDone: () => void }) {
  const { t } = useI18n();
  const [step, setStep] = useState(0);
  const [answered, setAnswered] = useState(false);
  useAnswerSound(answered ? true : null);
  const finished = step >= STAGE1_GUIDED.length;
  const current = STAGE1_GUIDED[step];
  const key = (part: 'prompt' | 'after') => `tiles.guided.${current.id}.${part}` as MessageKey;

  return (
    <main className="screen screen-wide">
      <ScreenHeader title={t('stageMenu.guided')} onBack={onDone} />
      <div className="instruction" aria-live="polite">
        {finished ? (
          <p>{t('tiles.guided.finished')}</p>
        ) : (
          <>
            {step === 0 && !answered && <p className="muted">{t('tiles.guided.intro')}</p>}
            <p className="prompt">{t(key(answered ? 'after' : 'prompt'))}</p>
          </>
        )}
      </div>

      <div className="tile-grid">
        {GRID_ROWS.map((row, i) => (
          <div key={i} className="tile-grid-row">
            {row.map((tile) => {
              const isTarget = !finished && tile === current.target;
              return (
                <Tile
                  key={tile}
                  tile={tile}
                  width="var(--grid-tile)"
                  mark={isTarget && answered ? 'correct' : undefined}
                  onTap={() => setAnswered(true)}
                  disabled={!isTarget || answered}
                />
              );
            })}
          </div>
        ))}
      </div>

      <div className="bottom-actions">
        {finished ? (
          <button className="btn btn-primary" onClick={onDone}>
            {t('common.done')}
          </button>
        ) : (
          answered && (
            <button
              className="btn btn-primary"
              onClick={() => {
                setStep(step + 1);
                setAnswered(false);
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
