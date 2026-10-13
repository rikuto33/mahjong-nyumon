import { useEffect, useState } from 'react';
import { I18nProvider } from '../i18n/I18nContext';
import { translate } from '../i18n/translate';
import { loadSettings, saveSettings, type Settings } from '../storage';
import { TitleScreen } from './TitleScreen';
import { SettingsScreen } from './SettingsScreen';
import { ComingSoonScreen } from './ComingSoonScreen';

export type Screen = 'title' | 'settings' | 'comingSoon';

export function App() {
  const [settings, setSettings] = useState<Settings>(() => loadSettings());
  const [storageOk, setStorageOk] = useState(true);
  const [screen, setScreen] = useState<Screen>('title');

  useEffect(() => {
    document.documentElement.lang = settings.lang;
    document.title = translate(settings.lang, 'app.title');
  }, [settings.lang]);

  const updateSettings = (patch: Partial<Settings>) => {
    const next = { ...settings, ...patch };
    setSettings(next);
    setStorageOk(saveSettings(next));
  };

  return (
    <I18nProvider lang={settings.lang}>
      {screen === 'title' && <TitleScreen onNavigate={setScreen} />}
      {screen === 'settings' && (
        <SettingsScreen
          settings={settings}
          storageOk={storageOk}
          onChange={updateSettings}
          onBack={() => setScreen('title')}
        />
      )}
      {screen === 'comingSoon' && <ComingSoonScreen onBack={() => setScreen('title')} />}
    </I18nProvider>
  );
}
