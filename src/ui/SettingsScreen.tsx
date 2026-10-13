import { useI18n } from '../i18n/I18nContext';
import { LANGS } from '../i18n/translate';
import type { Settings } from '../storage';

type Props = {
  settings: Settings;
  storageOk: boolean;
  onChange: (patch: Partial<Settings>) => void;
  onBack: () => void;
};

export function SettingsScreen({ settings, storageOk, onChange, onBack }: Props) {
  const { t } = useI18n();
  return (
    <main className="screen">
      <header className="screen-header">
        <button className="btn btn-small" onClick={onBack}>
          {t('common.back')}
        </button>
        <h1>{t('settings.title')}</h1>
      </header>

      <section className="settings-group">
        <h2>{t('settings.language')}</h2>
        <div className="segmented" role="radiogroup" aria-label={t('settings.language')}>
          {LANGS.map((lang) => (
            <button
              key={lang}
              role="radio"
              aria-checked={settings.lang === lang}
              className={settings.lang === lang ? 'active' : ''}
              onClick={() => onChange({ lang })}
            >
              {t(`language.${lang}`)}
            </button>
          ))}
        </div>
      </section>

      {!storageOk && <p className="notice">{t('settings.storageUnavailable')}</p>}
    </main>
  );
}
