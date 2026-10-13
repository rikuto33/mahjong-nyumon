import { useI18n } from '../i18n/I18nContext';
import type { MessageKey } from '../i18n/translate';
import { STAGE_PARTS, stageNumber, type StageId } from '../tutorial/stages';
import { useApp } from './AppContext';
import type { Navigate } from './routes';
import { ScreenHeader } from './ScreenHeader';

export function StageMenuScreen({ stage, navigate }: { stage: StageId; navigate: Navigate }) {
  const { t } = useI18n();
  const { progress } = useApp();
  const parts = STAGE_PARTS[stage];
  return (
    <main className="screen">
      <ScreenHeader
        title={`${t('stages.stageN', { n: stageNumber(stage) })}: ${t(`stages.${stage}` as MessageKey)}`}
        onBack={() => navigate({ name: 'stages' })}
      />
      {progress.cleared.includes(stage) && <p className="notice">{t('stageMenu.clearedNote')}</p>}
      <ol className="part-list">
        {parts.map((part, i) => (
          <li key={part}>
            <button className="part-card" onClick={() => navigate({ name: 'part', stage, part })}>
              <span className="part-num">{i + 1}</span>
              <span>
                <span className="part-title">{t(`stageMenu.${part}` as MessageKey)}</span>
                <span className="part-desc">{t(`stageMenu.${part}Desc` as MessageKey)}</span>
              </span>
            </button>
          </li>
        ))}
      </ol>
    </main>
  );
}
