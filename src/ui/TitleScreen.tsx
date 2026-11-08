import { useI18n } from '../i18n/I18nContext';
import type { Navigate } from './routes';

export function TitleScreen({ navigate }: { navigate: Navigate }) {
  const { t } = useI18n();
  return (
    <main className="screen title-screen">
      <h1 className="app-title">{t('app.title')}</h1>
      <p className="app-subtitle">{t('app.subtitle')}</p>

      <nav className="menu">
        <button className="btn btn-primary" onClick={() => navigate({ name: 'stage', stage: 'intro' })}>
          {t('title.start')}
        </button>
        <button className="btn" onClick={() => navigate({ name: 'stages' })}>
          {t('title.continue')}
        </button>
        <button className="btn" onClick={() => navigate({ name: 'yakuDex', back: { name: 'title' } })}>
          {t('title.yakuDex')}
        </button>
        <button className="btn" onClick={() => navigate({ name: 'settings' })}>
          {t('title.settings')}
        </button>
      </nav>
    </main>
  );
}
