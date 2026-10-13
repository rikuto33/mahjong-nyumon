import { useI18n } from '../i18n/I18nContext';

export function ScreenHeader({ title, onBack }: { title?: string; onBack: () => void }) {
  const { t } = useI18n();
  return (
    <header className="screen-header">
      <button className="btn btn-small" onClick={onBack}>
        {t('common.back')}
      </button>
      {title && <h1>{title}</h1>}
    </header>
  );
}
