import { useState } from 'react';
import type { Tile as TileCode } from '../../engine/tile';
import { useI18n } from '../../i18n/I18nContext';
import { makeQuiz, QUIZ_LENGTH, QUIZ_PASS, type QuizQuestion } from '../../tutorial/stage1';
import { useApp } from '../AppContext';
import { ScreenHeader } from '../ScreenHeader';
import { Tile } from '../tile/Tile';
import { tileName } from '../tile/tileText';

type Phase = 'intro' | 'question' | 'result';

export function Stage1Quiz({ onDone }: { onDone: () => void }) {
  const { t } = useI18n();
  const { markCleared } = useApp();
  const [phase, setPhase] = useState<Phase>('intro');
  const [quiz, setQuiz] = useState<QuizQuestion[]>([]);
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<TileCode | null>(null);
  const [score, setScore] = useState(0);

  const start = () => {
    setQuiz(makeQuiz());
    setIndex(0);
    setPicked(null);
    setScore(0);
    setPhase('question');
  };

  const pick = (tile: TileCode) => {
    if (picked) return;
    setPicked(tile);
    if (tile === quiz[index].answer) setScore(score + 1);
  };

  const next = () => {
    if (index + 1 < quiz.length) {
      setIndex(index + 1);
      setPicked(null);
      return;
    }
    if (score >= QUIZ_PASS) markCleared(1);
    setPhase('result');
  };

  if (phase === 'intro') {
    return (
      <main className="screen">
        <ScreenHeader title={t('stageMenu.practice')} onBack={onDone} />
        <p className="prompt">{t('stage1.quiz.intro', { total: QUIZ_LENGTH, need: QUIZ_PASS })}</p>
        <button className="btn btn-primary" onClick={start}>
          {t('stage1.quiz.start')}
        </button>
      </main>
    );
  }

  if (phase === 'result') {
    const passed = score >= QUIZ_PASS;
    return (
      <main className="screen">
        <ScreenHeader title={t('stageMenu.practice')} onBack={onDone} />
        <p className="result-score">{t('stage1.quiz.score', { score, total: QUIZ_LENGTH })}</p>
        <p className={`notice ${passed ? 'notice-success' : ''}`}>
          {passed ? t('stage1.quiz.passed') : t('stage1.quiz.failed', { need: QUIZ_PASS })}
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

  const q = quiz[index];
  const correct = picked === q.answer;
  const markOf = (tile: TileCode) =>
    !picked ? undefined : tile === q.answer ? 'correct' : tile === picked ? 'wrong' : undefined;

  return (
    <main className="screen">
      <ScreenHeader title={t('stage1.quiz.question', { n: index + 1, total: quiz.length })} onBack={onDone} />
      {q.type === 'find' ? (
        <>
          <p className="prompt">{t('stage1.quiz.findTile', { name: tileName(t, q.answer) })}</p>
          <div className="choice-tiles">
            {q.choices.map((tile) => (
              <Tile
                key={tile}
                tile={tile}
                width="var(--choice-tile)"
                mark={markOf(tile)}
                disabled={picked !== null}
                onTap={() => pick(tile)}
              />
            ))}
          </div>
        </>
      ) : (
        <>
          <p className="prompt">{t('stage1.quiz.nameTile')}</p>
          <div className="quiz-tile">
            <Tile tile={q.answer} width="var(--big-tile)" />
          </div>
          <div className="choice-names">
            {q.choices.map((tile) => (
              <button
                key={tile}
                className={`btn choice ${markOf(tile) ? `mark-${markOf(tile)}` : ''}`}
                disabled={picked !== null}
                onClick={() => pick(tile)}
              >
                {tileName(t, tile)}
              </button>
            ))}
          </div>
        </>
      )}
      <div className="feedback" aria-live="polite">
        {picked && (
          <>
            <p className={correct ? 'ok' : 'ng'}>
              {correct ? t('stage1.quiz.correct') : t('stage1.quiz.wrong', { name: tileName(t, q.answer) })}
            </p>
            <button className="btn btn-primary" onClick={next}>
              {t('common.next')}
            </button>
          </>
        )}
      </div>
    </main>
  );
}
