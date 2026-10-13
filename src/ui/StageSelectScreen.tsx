import { useI18n } from '../i18n/I18nContext';
import type { MessageKey } from '../i18n/translate';
import { isStageUnlocked } from '../storage';
import { STAGE_ORDER, stageNumber } from '../tutorial/stages';
import { useApp } from './AppContext';
import type { Navigate } from './routes';
import { ScreenHeader } from './ScreenHeader';

export function StageSelectScreen({ navigate }: { navigate: Navigate }) {
  const { t } = useI18n();
  const { progress } = useApp();
  return (
    <main className="screen screen-wide">
      <ScreenHeader title={t('stages.title')} onBack={() => navigate({ name: 'title' })} />
      <ol className="stage-grid">
        {STAGE_ORDER.map((id) => {
          const unlocked = isStageUnlocked(progress, id);
          const cleared = progress.cleared.includes(id);
          const status = cleared ? t('stages.cleared') : unlocked ? t('stages.open') : t('stages.locked');
          return (
            <li key={id}>
              <button
                className={`stage-card ${cleared ? 'cleared' : ''} ${unlocked ? '' : 'locked'}`}
                disabled={!unlocked}
                onClick={() => navigate({ name: 'stage', stage: id })}
              >
                <span className="stage-num">{t('stages.stageN', { n: stageNumber(id) })}</span>
                <span className="stage-title">{t(`stages.${id}` as MessageKey)}</span>
                <span className="stage-status">{status}</span>
              </button>
            </li>
          );
        })}
      </ol>
      <p className="locked-hint">{t('stages.lockedHint')}</p>
      <div className="button-row">
        <button className="btn" onClick={() => navigate({ name: 'yakuDex', back: { name: 'stages' } })}>
          {t('stages.yakuDex')}
        </button>
      </div>
    </main>
  );
}
