import { useState } from 'react';
import { notenPayments } from '../../game/hand';
import { shuffled } from '../../game/solo';
import { useI18n } from '../../i18n/I18nContext';
import type { MessageKey } from '../../i18n/translate';
import {
  flowAnswer,
  NOTEN_CHOICES,
  NOTEN_QUIZ,
  QUIZ9_FLOW,
  QUIZ9_NOTEN,
  QUIZ9_PASS,
  STAGE9_QUIZ,
  type FlowQuizItem,
} from '../../tutorial/stage9';
import { useApp } from '../AppContext';
import { ScreenHeader } from '../ScreenHeader';
import { MiniBoard } from './MiniBoard';

type Q = { kind: 'flow'; item: FlowQuizItem } | { kind: 'noten'; tenpai: number };
const TOTAL = QUIZ9_FLOW + QUIZ9_NOTEN;

function makeQuiz(): Q[] {
  const a = shuffled(STAGE9_QUIZ).slice(0, QUIZ9_FLOW).map<Q>((item) => ({ kind: 'flow', item }));
  const b = shuffled(NOTEN_QUIZ).slice(0, QUIZ9_NOTEN).map<Q>((tenpai) => ({ kind: 'noten', tenpai }));
  return shuffled([...a, ...b]);
}

export function Stage9Quiz({ onDone }: { onDone: () => void }) {
  const { t } = useI18n();
  const { markCleared } = useApp();
  const [phase, setPhase] = useState<'intro' | 'question' | 'result'>('intro');
  const [quiz, setQuiz] = useState<Q[]>([]);
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [score, setScore] = useState(0);

  const start = () => {
    setQuiz(makeQuiz());
    setIndex(0);
    setPicked(null);
    setScore(0);
    setPhase('question');
  };

  if (phase !== 'question') {
    const passed = score >= QUIZ9_PASS;
    return (
      <main className="screen">
        <ScreenHeader title={t('stageMenu.practice')} onBack={onDone} />
        {phase === 'intro' ? (
          <>
            <p className="prompt">{t('stage9.quiz.intro', { total: TOTAL, need: QUIZ9_PASS })}</p>
            <button className="btn btn-primary" onClick={start}>
              {t('stage9.quiz.start')}
            </button>
          </>
        ) : (
          <>
            <p className="result-score">{t('stage9.quiz.score', { score, total: TOTAL })}</p>
            <p className={`notice ${passed ? 'notice-success' : ''}`}>
              {passed ? t('stage9.quiz.passed') : t('stage9.quiz.failed', { need: QUIZ9_PASS })}
            </p>
            <div className="button-row">
              <button className={`btn ${passed ? '' : 'btn-primary'}`} onClick={start}>
                {t('common.retry')}
              </button>
              <button className={`btn ${passed ? 'btn-primary' : ''}`} onClick={onDone}>
                {t('common.done')}
              </button>
            </div>
          </>
        )}
      </main>
    );
  }

  const q = quiz[index];
  const roundLabel = (wind: number, n: number) => t('table.round', { wind: t(`table.wind${wind}` as MessageKey), n });
  const label = (c: string) => {
    if (c === 'end') return t('stage9.quiz.end');
    const [, w, n, h] = c.split(':').map(Number);
    return t('stage9.quiz.next', { round: roundLabel(w, n), honba: h });
  };
  let choices: string[];
  let answer: string;
  if (q.kind === 'flow') {
    choices = q.item.choices;
    answer = flowAnswer(q.item);
  } else {
    choices = NOTEN_CHOICES.map(String);
    const tenpai = [0, 1, 2, 3].map((i) => i < q.tenpai);
    answer = String(-Math.min(...notenPayments(tenpai)));
  }
  const choiceLabel = (c: string) => (q.kind === 'flow' ? label(c) : t('stage9.quiz.points', { n: Number(c).toLocaleString('de-DE') }));
  const correct = picked === answer;

  const pick = (c: string) => {
    if (picked) return;
    setPicked(c);
    if (c === answer) setScore(score + 1);
  };
  const next = () => {
    if (index + 1 < quiz.length) {
      setIndex(index + 1);
      setPicked(null);
      return;
    }
    if (score >= QUIZ9_PASS) markCleared(9);
    setPhase('result');
  };

  return (
    <main className="screen">
      <ScreenHeader title={t('stage9.quiz.question', { n: index + 1, total: quiz.length })} onBack={onDone} />
      {q.kind === 'flow' ? (
        <>
          <p className="prompt">
            {t('stage9.quiz.situation', { round: roundLabel(q.item.match.roundWind, q.item.match.roundNumber), honba: q.item.match.honba })}{' '}
            {t(`stage9.quiz.event.${q.item.event}` as MessageKey)}
          </p>
          <p className="muted">{t('stage9.quiz.scoresAfter')}</p>
          <MiniBoard match={q.item.match} scores={q.item.scores} />
          <p className="prompt">{t('stage9.quiz.flowPrompt')}</p>
        </>
      ) : (
        <p className="prompt">{t('stage9.quiz.notenPrompt', { n: q.tenpai })}</p>
      )}
      <div className="choice-list">
        {choices.map((c) => (
          <button
            key={c}
            className={`btn choice ${picked ? (c === answer ? 'mark-correct' : c === picked ? 'mark-wrong' : '') : ''}`}
            disabled={picked !== null}
            onClick={() => pick(c)}
          >
            {choiceLabel(c)}
          </button>
        ))}
      </div>
      <div className="feedback" aria-live="polite">
        {picked && <p className={correct ? 'ok' : 'ng'}>{correct ? t('stage9.quiz.correct') : t('stage9.quiz.wrong', { answer: choiceLabel(answer) })}</p>}
      </div>
      <div className="bottom-actions">
        {picked && (
          <button className="btn btn-primary" onClick={next}>
            {t('common.next')}
          </button>
        )}
      </div>
    </main>
  );
}
