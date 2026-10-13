import { useState } from 'react';
import { useI18n } from '../i18n/I18nContext';
import type { MessageKey } from '../i18n/translate';
import { STAGE1_SLIDES } from '../tutorial/stage1';
import { STAGE2_SLIDES } from '../tutorial/stage2';
import { STAGE3_SLIDES } from '../tutorial/stage3';
import { STAGE4_SLIDES } from '../tutorial/stage4';
import { STAGE5_SLIDES } from '../tutorial/stage5';
import { STAGE6_SLIDES } from '../tutorial/stage6';
import { STAGE7_SLIDES } from '../tutorial/stage7';
import { STAGE8_SLIDES } from '../tutorial/stage8';
import { STAGE9_SLIDES } from '../tutorial/stage9';
import { STAGE10_SLIDES } from '../tutorial/stage10';
import type { ExplainSlide } from '../tutorial/types';
import { ScreenHeader } from './ScreenHeader';
import { TileRows } from './tile/TileRows';

const SLIDES: Record<number, ExplainSlide[]> = {
  1: STAGE1_SLIDES,
  2: STAGE2_SLIDES,
  3: STAGE3_SLIDES,
  4: STAGE4_SLIDES,
  5: STAGE5_SLIDES,
  6: STAGE6_SLIDES,
  7: STAGE7_SLIDES,
  8: STAGE8_SLIDES,
  9: STAGE9_SLIDES,
  10: STAGE10_SLIDES,
};

export function ExplainScreen({ stage, onDone }: { stage: number; onDone: () => void }) {
  const { t } = useI18n();
  const slides = SLIDES[stage] ?? [];
  const [index, setIndex] = useState(0);
  const slide = slides[index];
  if (!slide) return null;
  const key = (part: 'title' | 'body') => `stage${stage}.explain.${slide.id}.${part}` as MessageKey;
  const isLast = index === slides.length - 1;

  return (
    <main className="screen">
      <ScreenHeader title={t('stageMenu.explain')} onBack={onDone} />
      <article className="slide">
        <h2>{t(key('title'))}</h2>
        {t(key('body'))
          .split('\n')
          .map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        {slide.rows && <TileRows rows={slide.rows} width="var(--diagram-tile)" />}
      </article>
      <nav className="slide-nav">
        <button className="btn" disabled={index === 0} onClick={() => setIndex(index - 1)}>
          {t('common.prev')}
        </button>
        <span className="page-indicator">{t('common.page', { n: index + 1, total: slides.length })}</span>
        <button className="btn btn-primary" onClick={() => (isLast ? onDone() : setIndex(index + 1))}>
          {isLast ? t('common.done') : t('common.next')}
        </button>
      </nav>
    </main>
  );
}
