import { useI18n } from '../i18n/I18nContext';
import type { Screen } from './App';

export function TitleScreen({ onNavigate }: { onNavigate: (s: Screen) => void }) {
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
        <button className="btn btn-primary" onClick={() => onNavigate('comingSoon')}>
          {t('title.start')}
        </button>
        <button className="btn" onClick={() => onNavigate('comingSoon')}>
          {t('title.continue')}
        </button>
        <button className="btn" onClick={() => onNavigate('settings')}>
          {t('title.settings')}
        </button>
      </nav>
    </main>
  );
}
