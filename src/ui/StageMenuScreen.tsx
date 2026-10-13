import { useI18n } from '../i18n/I18nContext';
import type { MessageKey } from '../i18n/translate';
import { useApp } from './AppContext';
import { IMPLEMENTED_STAGES, type Navigate } from './routes';
import { ScreenHeader } from './ScreenHeader';
import { ComingSoonScreen } from './ComingSoonScreen';

export function StageMenuScreen({ stage, navigate }: { stage: number; navigate: Navigate }) {
  const { t } = useI18n();
  const { progress } = useApp();
  if (!IMPLEMENTED_STAGES.includes(stage)) {
    return <ComingSoonScreen onBack={() => navigate({ name: 'stages' })} />;
  }
  const parts = [
    { route: 'explain', title: t('stageMenu.explain'), desc: t('stageMenu.explainDesc') },
    { route: 'guided', title: t('stageMenu.guided'), desc: t('stageMenu.guidedDesc') },
    { route: 'practice', title: t('stageMenu.practice'), desc: t('stageMenu.practiceDesc') },
  ] as const;
  return (
    <main className="screen">
      <ScreenHeader
        title={`${t('stages.stageN', { n: stage })}: ${t(`stages.s${stage}` as MessageKey)}`}
        onBack={() => navigate({ name: 'stages' })}
      />
      {progress.cleared.includes(stage) && <p className="notice">{t('stageMenu.clearedNote')}</p>}
      <ol className="part-list">
        {parts.map((p, i) => (
          <li key={p.route}>
            <button className="part-card" onClick={() => navigate({ name: p.route, stage })}>
              <span className="part-num">{i + 1}</span>
              <span>
                <span className="part-title">{p.title}</span>
                <span className="part-desc">{p.desc}</span>
              </span>
            </button>
          </li>
        ))}
      </ol>
    </main>
  );
}
