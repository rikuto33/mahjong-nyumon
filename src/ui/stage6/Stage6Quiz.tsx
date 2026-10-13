import { useState } from 'react';
import { shuffled } from '../../game/solo';
import { useI18n } from '../../i18n/I18nContext';
import type { MessageKey } from '../../i18n/translate';
import { QUIZ6_LENGTH, QUIZ6_PASS, STAGE6_QUIZ, type RonScene } from '../../tutorial/stage6';
import { useApp } from '../AppContext';
import { ScreenHeader } from '../ScreenHeader';
import { RonSceneView } from './RonSceneView';
import { ronOf } from './ronOf';

export function Stage6Quiz({ onDone }: { onDone: () => void }) {
  const { t } = useI18n();
  const { markCleared } = useApp();
  const [phase, setPhase] = useState<'intro' | 'question' | 'result'>('intro');
  const [quiz, setQuiz] = useState<RonScene[]>([]);
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<boolean | null>(null);
  const [score, setScore] = useState(0);

  const start = () => {
    setQuiz(shuffled(STAGE6_QUIZ).slice(0, QUIZ6_LENGTH));
    setIndex(0);
    setPicked(null);
    setScore(0);
    setPhase('question');
  };

  if (phase === 'intro') {
    return (
      <main className="screen">
        <ScreenHeader title={t('stageMenu.practice')} onBack={onDone} />
        <p className="prompt">{t('stage6.quiz.intro', { total: QUIZ6_LENGTH, need: QUIZ6_PASS })}</p>
        <button className="btn btn-primary" onClick={start}>
          {t('stage6.quiz.start')}
        </button>
      </main>
    );
  }

  if (phase === 'result') {
    const passed = score >= QUIZ6_PASS;
    return (
      <main className="screen">
        <ScreenHeader title={t('stageMenu.practice')} onBack={onDone} />
        <p className="result-score">{t('stage6.quiz.score', { score, total: QUIZ6_LENGTH })}</p>
        <p className={`notice ${passed ? 'notice-success' : ''}`}>
          {passed ? t('stage6.quiz.passed') : t('stage6.quiz.failed', { need: QUIZ6_PASS })}
        </p>
        <div className="button-row">
          <button className={`btn ${passed ? '' : 'btn-primary'}`} onClick={start}>
            {t('common.retry')}
          </button>
          <button className={`btn ${passed ? 'btn-primary' : ''}`} onClick={onDone}>
            {t('common.done')}
          </button>
        </div>
      </main>
    );
  }

  const scene = quiz[index];
  const check = ronOf(scene);
  const correct = picked !== null && picked === check.ok;
  const reason = check.ok ? 'ok' : check.reason;

  const pick = (yes: boolean) => {
    if (picked !== null) return;
    setPicked(yes);
    if (yes === check.ok) setScore(score + 1);
  };

  const next = () => {
    if (index + 1 < quiz.length) {
      setIndex(index + 1);
      setPicked(null);
      return;
    }
    if (score >= QUIZ6_PASS) markCleared(6);
    setPhase('result');
  };

  return (
    <main className="screen screen-wide">
      <ScreenHeader title={t('stage6.quiz.question', { n: index + 1, total: quiz.length })} onBack={onDone} />
      <p className="prompt">{t('stage6.quiz.prompt')}</p>
      <RonSceneView scene={scene} />
      <div className="feedback" aria-live="polite">
        {picked !== null && (
          <>
            <p className={correct ? 'ok' : 'ng'}>{correct ? t('stage6.quiz.correct') : t('stage6.quiz.wrong')}</p>
            <p>{t(`stage6.quiz.reason.${reason}` as MessageKey)}</p>
          </>
        )}
      </div>
      <div className="bottom-actions">
        {picked === null ? (
          <>
            <button className="btn" onClick={() => pick(false)}>
              {t('stage6.quiz.no')}
            </button>
            <button className="btn action-btn action-ron" onClick={() => pick(true)}>
              {t('stage6.quiz.yes')}
            </button>
          </>
        ) : (
          <button className="btn btn-primary" onClick={next}>
            {t('common.next')}
          </button>
        )}
      </div>
    </main>
  );
}
