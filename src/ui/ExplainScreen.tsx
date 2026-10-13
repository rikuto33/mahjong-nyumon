import { useState } from 'react';
import { useI18n } from '../i18n/I18nContext';
import type { MessageKey } from '../i18n/translate';
import { STAGE_I18N, STAGE_SLIDES, type StageId } from '../tutorial/stages';
import { useApp } from './AppContext';
import { ScreenHeader } from './ScreenHeader';
import { TileRows } from './tile/TileRows';

export function ExplainScreen({ stage, onDone, clearOnFinish }: { stage: StageId; onDone: () => void; clearOnFinish?: boolean }) {
  const { t, has } = useI18n();
  const { markCleared } = useApp();
  const slides = STAGE_SLIDES[stage];
  const [index, setIndex] = useState(0);
  const slide = slides[index];
  if (!slide) return null;
  const key = (part: string) => `${STAGE_I18N[stage]}.explain.${slide.id}.${part}` as MessageKey;
  const isLast = index === slides.length - 1;
  const summary = has(key('summary')) ? t(key('summary')) : null;
  const finish = () => {
    if (clearOnFinish) markCleared(stage);
    onDone();
  };

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
        {summary && (
          <p className="summary">
            <strong>{t('common.inShort')}</strong> {summary}
          </p>
        )}
      </article>
      <nav className="slide-nav">
        <button className="btn" disabled={index === 0} onClick={() => setIndex(index - 1)}>
          {t('common.prev')}
        </button>
        <span className="page-indicator">{t('common.page', { n: index + 1, total: slides.length })}</span>
        <button className="btn btn-primary" onClick={() => (isLast ? finish() : setIndex(index + 1))}>
          {isLast ? t('common.done') : t('common.next')}
        </button>
      </nav>
    </main>
  );
}
