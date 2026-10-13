import { useEffect, useMemo, useState } from 'react';
import { I18nProvider } from '../i18n/I18nContext';
import { translate } from '../i18n/translate';
import {
  EMPTY_PROGRESS,
  loadProgress,
  loadSettings,
  saveProgress,
  saveSettings,
  type Progress,
  type Settings,
} from '../storage';
import { AppContext, type AppState } from './AppContext';
import { setSoundEnabled } from './sound';
import type { Route } from './routes';
import { TitleScreen } from './TitleScreen';
import { SettingsScreen } from './SettingsScreen';
import { StageSelectScreen } from './StageSelectScreen';
import { StageMenuScreen } from './StageMenuScreen';
import { ExplainScreen } from './ExplainScreen';
import { ComingSoonScreen } from './ComingSoonScreen';
import { CLEAR_ON_EXPLAIN, STAGE_ORDER } from '../tutorial/stages';
import { STAGE_SCREENS } from './stageScreens';
import { YakuDexScreen } from './yaku/YakuDexScreen';
import { TableScreen } from './table/TableScreen';

export function App() {
  const [settings, setSettings] = useState<Settings>(() => loadSettings());
  const [progress, setProgress] = useState<Progress>(() => loadProgress());
  const [storageOk, setStorageOk] = useState(true);
  const [route, setRoute] = useState<Route>({ name: 'title' });

  useEffect(() => {
    document.documentElement.lang = settings.lang;
    document.title = translate(settings.lang, 'app.title');
  }, [settings.lang]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [route]);

  useEffect(() => setSoundEnabled(settings.sound), [settings.sound]);

  const app = useMemo<AppState>(
    () => ({
      settings,
      progress,
      storageOk,
      updateSettings: (patch) => {
        const next = { ...settings, ...patch };
        setSettings(next);
        setStorageOk(saveSettings(next));
      },
      markCleared: (stage) => {
        if (progress.cleared.includes(stage)) return;
        const next = { cleared: STAGE_ORDER.filter((id) => id === stage || progress.cleared.includes(id)) };
        setProgress(next);
        setStorageOk(saveProgress(next));
      },
      resetProgress: () => {
        setProgress(EMPTY_PROGRESS);
        setStorageOk(saveProgress(EMPTY_PROGRESS));
      },
    }),
    [settings, progress, storageOk],
  );

  return (
    <AppContext.Provider value={app}>
      <I18nProvider lang={settings.lang}>
        <RouteView route={route} navigate={setRoute} />
      </I18nProvider>
    </AppContext.Provider>
  );
}

function RouteView({ route, navigate }: { route: Route; navigate: (r: Route) => void }) {
  switch (route.name) {
    case 'title':
      return <TitleScreen navigate={navigate} />;
    case 'settings':
      return <SettingsScreen onBack={() => navigate({ name: 'title' })} />;
    case 'stages':
      return <StageSelectScreen navigate={navigate} />;
    case 'stage':
      return <StageMenuScreen stage={route.stage} navigate={navigate} />;
    case 'part': {
      const back = () => navigate({ name: 'stage', stage: route.stage });
      if (route.part === 'explain') {
        return <ExplainScreen stage={route.stage} onDone={back} clearOnFinish={CLEAR_ON_EXPLAIN.includes(route.stage)} />;
      }
      const Screen = STAGE_SCREENS[route.stage][route.part];
      return Screen ? <Screen onDone={back} /> : <ComingSoonScreen onBack={back} />;
    }
    case 'table':
      return <TableScreen onBack={() => navigate({ name: 'stages' })} />;
    case 'yakuDex':
      return <YakuDexScreen onBack={() => navigate(route.back)} />;
  }
}
