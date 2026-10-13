import { useI18n } from '../i18n/I18nContext';

export function ComingSoonScreen({ onBack }: { onBack: () => void }) {
  const { t } = useI18n();
  return (
    <main className="screen">
      <header className="screen-header">
        <button className="btn btn-small" onClick={onBack}>
          {t('common.back')}
        </button>
      </header>
      <p className="notice">{t('common.comingSoon')}</p>
    </main>
  );
}
