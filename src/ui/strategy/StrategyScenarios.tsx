import { useState } from 'react';
import { useI18n } from '../../i18n/I18nContext';
import type { MessageKey } from '../../i18n/translate';
import { SCENARIO_ORDER, SCENARIOS, type ScenarioId } from '../../tutorial/strategy';
import { useApp } from '../AppContext';
import { ScenarioPlay } from '../scenario/ScenarioPlay';
import { ScreenHeader } from '../ScreenHeader';

/** 「考えながら打つ」のシナリオ一覧。終えたら次のシナリオへ自動で進み、全部終えたら段階クリア */
export function StrategyScenarios({ onDone, onNext }: { onDone: () => void; onNext: () => void }) {
  const { t } = useI18n();
  const { progress, markScenario, markCleared } = useApp();
  const done = progress.scenarios ?? [];
  const [playing, setPlaying] = useState<ScenarioId | null>(null);

  if (playing) {
    const sc = SCENARIOS[playing];
    return (
      <ScenarioPlay
        key={playing}
        script={sc}
        prefix={`strategy.${playing}`}
        analysis={sc.analysis}
        onBack={() => setPlaying(null)}
        onFinish={() => {
          markScenario(playing);
          const finished = new Set([...done, playing]);
          if (SCENARIO_ORDER.every((id) => finished.has(id))) {
            markCleared('strategy');
            onNext();
            return;
          }
          const nextId = SCENARIO_ORDER.find((id) => !finished.has(id) && SCENARIO_ORDER.indexOf(id) > SCENARIO_ORDER.indexOf(playing));
          setPlaying(nextId ?? SCENARIO_ORDER.find((id) => !finished.has(id)) ?? null);
        }}
      />
    );
  }

  const firstOpen = SCENARIO_ORDER.find((id) => !done.includes(id)) ?? SCENARIO_ORDER[0];
  return (
    <main className="screen">
      <ScreenHeader title={t('stageMenu.scenarios')} onBack={onDone} />
      <p className="muted">{t('strategy.hub.intro')}</p>
      <ol className="part-list">
        {SCENARIO_ORDER.map((id, i) => (
          <li key={id}>
            <button className="part-card" onClick={() => setPlaying(id)}>
              <span className="part-num">{done.includes(id) ? '✓' : i + 1}</span>
              <span>
                <span className="part-title">{t(`strategy.hub.${id}` as MessageKey)}</span>
                <span className="part-desc">{t(`strategy.hub.${id}Desc` as MessageKey)}</span>
              </span>
            </button>
          </li>
        ))}
      </ol>
      <div className="bottom-actions">
        <button className="btn btn-primary" onClick={() => setPlaying(firstOpen)}>
          {t('strategy.hub.start')}
        </button>
      </div>
    </main>
  );
}
