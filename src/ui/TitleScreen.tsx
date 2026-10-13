import { useI18n } from '../i18n/I18nContext';
import type { Navigate } from './routes';

export function TitleScreen({ navigate }: { navigate: Navigate }) {
  const { t } = useI18n();
  return (
    <main className="screen title-screen">
      <h1 className="app-title">{t('app.title')}</h1>
      <p className="app-subtitle">{t('app.subtitle')}</p>

      <section className="message-card" aria-label={t('title.messageHeading')}>
        <h2>{t('title.messageHeading')}</h2>
        {/* Rikuto の一言。文面は未定（SPEC §10） */}
        <p className="message-placeholder">{t('title.messagePlaceholder')}</p>
      </section>

      <nav className="menu">
        <button className="btn btn-primary" onClick={() => navigate({ name: 'stage', stage: 1 })}>
          {t('title.start')}
        </button>
        <button className="btn" onClick={() => navigate({ name: 'stages' })}>
          {t('title.continue')}
        </button>
        <button className="btn" onClick={() => navigate({ name: 'settings' })}>
          {t('title.settings')}
        </button>
      </nav>
    </main>
  );
}
