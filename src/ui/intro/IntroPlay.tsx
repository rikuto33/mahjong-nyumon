import { INTRO_SCRIPT } from '../../tutorial/intro';
import { useApp } from '../AppContext';
import { ScenarioPlay } from '../scenario/ScenarioPlay';

/** 段階 1：本物の卓で 1 局を台本どおりに体験する */
export function IntroPlay({ onDone, onNext }: { onDone: () => void; onNext: () => void }) {
  const { markCleared } = useApp();
  return (
    <ScenarioPlay
      script={INTRO_SCRIPT}
      prefix="intro"
      onBack={onDone}
      onFinish={() => {
        markCleared('intro');
        onNext();
      }}
    />
  );
}
