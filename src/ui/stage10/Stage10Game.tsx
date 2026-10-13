import { useState } from 'react';
import type { AiLevel } from '../../game/ai';
import { useI18n } from '../../i18n/I18nContext';
import { useApp } from '../AppContext';
import { GameScreen } from '../game/GameScreen';
import { ScreenHeader } from '../ScreenHeader';

/** 段階 10 の練習：AI との東風戦。終局まで打つとクリア */
export function Stage10Game({ onDone }: { onDone: () => void }) {
  const { t } = useI18n();
  const { settings, updateSettings, markCleared } = useApp();
  const [playing, setPlaying] = useState(false);
  const [cleared, setCleared] = useState(false);

  if (playing) {
    return (
      <GameScreen
        level={settings.aiLevel}
        onFinished={() => {
          markCleared(10);
          setCleared(true);
        }}
        onExit={() => setPlaying(false)}
      />
    );
  }

  return (
    <main className="screen">
      <ScreenHeader title={t('stageMenu.practice')} onBack={onDone} />
      {cleared && <p className="notice notice-success">{t('stage10.passed')}</p>}
      <p className="prompt">{t('stage10.chooseLevel')}</p>
      <div className="segmented" role="radiogroup" aria-label={t('settings.aiLevel')}>
        {(['easy', 'normal'] as AiLevel[]).map((lv) => (
          <button
            key={lv}
            role="radio"
            aria-checked={settings.aiLevel === lv}
            className={settings.aiLevel === lv ? 'active' : ''}
            onClick={() => updateSettings({ aiLevel: lv })}
          >
            {t(`settings.${lv}`)}
          </button>
        ))}
      </div>
      <div className="bottom-actions start-row">
        <button className="btn btn-primary" onClick={() => setPlaying(true)}>
          {t('stage10.start')}
        </button>
      </div>
    </main>
  );
}
