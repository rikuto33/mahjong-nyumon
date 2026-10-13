import { useI18n } from '../i18n/I18nContext';
import { ScreenHeader } from './ScreenHeader';

export function ComingSoonScreen({ onBack }: { onBack: () => void }) {
  const { t } = useI18n();
  return (
    <main className="screen">
      <ScreenHeader onBack={onBack} />
      <p className="notice">{t('common.comingSoon')}</p>
    </main>
  );
}
