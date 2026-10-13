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
import type { Route } from './routes';
import { TitleScreen } from './TitleScreen';
import { SettingsScreen } from './SettingsScreen';
import { StageSelectScreen } from './StageSelectScreen';
import { StageMenuScreen } from './StageMenuScreen';
import { ExplainScreen } from './ExplainScreen';
import { ComingSoonScreen } from './ComingSoonScreen';
import { Stage1Guided } from './stage1/Stage1Guided';
import { Stage1Quiz } from './stage1/Stage1Quiz';
import { Stage2Guided } from './stage2/Stage2Guided';
import { Stage2Practice } from './stage2/Stage2Practice';
import { Stage3Guided } from './stage3/Stage3Guided';
import { Stage3Game } from './stage3/Stage3Game';
import { Stage4Guided } from './stage4/Stage4Guided';
import { Stage4Quiz } from './stage4/Stage4Quiz';
import { Stage5Guided } from './stage5/Stage5Guided';
import { Stage5Quiz } from './stage5/Stage5Quiz';
import { Stage6Guided } from './stage6/Stage6Guided';
import { Stage6Quiz } from './stage6/Stage6Quiz';
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
        const next = { cleared: [...progress.cleared, stage].sort((a, b) => a - b) };
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
  const toStage = (stage: number) => () => navigate({ name: 'stage', stage });
  switch (route.name) {
    case 'title':
      return <TitleScreen navigate={navigate} />;
    case 'settings':
      return <SettingsScreen onBack={() => navigate({ name: 'title' })} />;
    case 'stages':
      return <StageSelectScreen navigate={navigate} />;
    case 'stage':
      return <StageMenuScreen stage={route.stage} navigate={navigate} />;
    case 'explain':
      return <ExplainScreen stage={route.stage} onDone={toStage(route.stage)} />;
    case 'guided':
      if (route.stage === 1) return <Stage1Guided onDone={toStage(1)} />;
      if (route.stage === 2) return <Stage2Guided onDone={toStage(2)} />;
      if (route.stage === 3) return <Stage3Guided onDone={toStage(3)} />;
      if (route.stage === 4) return <Stage4Guided onDone={toStage(4)} />;
      if (route.stage === 5) return <Stage5Guided onDone={toStage(5)} />;
      if (route.stage === 6) return <Stage6Guided onDone={toStage(6)} />;
      return <ComingSoonScreen onBack={toStage(route.stage)} />;
    case 'practice':
      if (route.stage === 1) return <Stage1Quiz onDone={toStage(1)} />;
      if (route.stage === 2) return <Stage2Practice onDone={toStage(2)} />;
      if (route.stage === 3) return <Stage3Game onDone={toStage(3)} />;
      if (route.stage === 4) return <Stage4Quiz onDone={toStage(4)} />;
      if (route.stage === 5) return <Stage5Quiz onDone={toStage(5)} />;
      if (route.stage === 6) return <Stage6Quiz onDone={toStage(6)} />;
      return <ComingSoonScreen onBack={toStage(route.stage)} />;
    case 'table':
      return <TableScreen onBack={() => navigate({ name: 'stages' })} />;
    case 'yakuDex':
      return <YakuDexScreen onBack={() => navigate(route.back)} />;
  }
}
