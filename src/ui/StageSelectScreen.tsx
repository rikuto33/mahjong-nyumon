import { useI18n } from '../i18n/I18nContext';
import type { MessageKey } from '../i18n/translate';
import { isStageUnlocked } from '../storage';
import { useApp } from './AppContext';
import { IMPLEMENTED_STAGES, type Navigate } from './routes';
import { ScreenHeader } from './ScreenHeader';

export function StageSelectScreen({ navigate }: { navigate: Navigate }) {
  const { t } = useI18n();
  const { progress } = useApp();
  return (
    <main className="screen screen-wide">
      <ScreenHeader title={t('stages.title')} onBack={() => navigate({ name: 'title' })} />
      <ol className="stage-grid">
        {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => {
          const unlocked = isStageUnlocked(progress, n);
          const cleared = progress.cleared.includes(n);
          const status = cleared
            ? t('stages.cleared')
            : !unlocked
              ? t('stages.locked')
              : IMPLEMENTED_STAGES.includes(n)
                ? t('stages.open')
                : t('stages.inProgress');
          return (
            <li key={n}>
              <button
                className={`stage-card ${cleared ? 'cleared' : ''} ${unlocked ? '' : 'locked'}`}
                disabled={!unlocked}
                onClick={() => navigate({ name: 'stage', stage: n })}
              >
                <span className="stage-num">{t('stages.stageN', { n })}</span>
                <span className="stage-title">{t(`stages.s${n}` as MessageKey)}</span>
                <span className="stage-status">{status}</span>
              </button>
            </li>
          );
        })}
      </ol>
      <p className="locked-hint">{t('stages.lockedHint')}</p>
      <button className="btn btn-small" onClick={() => navigate({ name: 'table' })}>
        {t('stages.tablePreview')}
      </button>
    </main>
  );
}
