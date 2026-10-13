import { useState } from 'react';
import { parseTiles, sortTiles, tileOfKind } from '../../engine/tile';
import { waits } from '../../engine/waits';
import { shuffled } from '../../game/solo';
import { useI18n } from '../../i18n/I18nContext';
import {
  QUIZ4_EASY_COUNT,
  QUIZ4_HARD_COUNT,
  QUIZ4_PASS,
  STAGE4_QUIZ_EASY,
  STAGE4_QUIZ_HARD,
} from '../../tutorial/tenpai';
import { useApp } from '../AppContext';
import { ScreenHeader } from '../ScreenHeader';
import { play } from '../sound';
import { Tile } from '../tile/Tile';
import { tileName } from '../tile/tileText';
import { WaitPicker } from './WaitPicker';

const TOTAL = QUIZ4_EASY_COUNT + QUIZ4_HARD_COUNT;

function makeQuiz(): string[] {
  return [...shuffled(STAGE4_QUIZ_EASY).slice(0, QUIZ4_EASY_COUNT), ...shuffled(STAGE4_QUIZ_HARD).slice(0, QUIZ4_HARD_COUNT)];
}

export function Stage4Quiz({ onDone }: { onDone: () => void }) {
  const { t } = useI18n();
  const { markCleared } = useApp();
  const [phase, setPhase] = useState<'intro' | 'question' | 'result'>('intro');
  const [quiz, setQuiz] = useState<string[]>([]);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<number[]>([]);
  const [checked, setChecked] = useState(false);
  const [score, setScore] = useState(0);

  const start = () => {
    setQuiz(makeQuiz());
    setIndex(0);
    setSelected([]);
    setChecked(false);
    setScore(0);
    setPhase('question');
  };

  if (phase === 'intro') {
    return (
      <main className="screen">
        <ScreenHeader title={t('stageMenu.practice')} onBack={onDone} />
        <p className="prompt">{t('tenpai.quiz.intro', { total: TOTAL, need: QUIZ4_PASS })}</p>
        <button className="btn btn-primary" onClick={start}>
          {t('tenpai.quiz.start')}
        </button>
      </main>
    );
  }

  if (phase === 'result') {
    const passed = score >= QUIZ4_PASS;
    return (
      <main className="screen">
        <ScreenHeader title={t('stageMenu.practice')} onBack={onDone} />
        <p className="result-score">{t('tenpai.quiz.score', { score, total: TOTAL })}</p>
        <p className={`notice ${passed ? 'notice-success' : ''}`}>
          {passed ? t('tenpai.quiz.passed') : t('tenpai.quiz.failed', { need: QUIZ4_PASS })}
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

  const hand = sortTiles(parseTiles(quiz[index]));
  const answer = waits(hand);
  const correct = checked && answer.length === selected.length && answer.every((k) => selected.includes(k));
  const marks = checked
    ? new Map<number, 'correct' | 'wrong' | 'tip'>([
        ...selected.map((k) => [k, answer.includes(k) ? 'correct' : 'wrong'] as const),
        ...answer.filter((k) => !selected.includes(k)).map((k) => [k, 'tip'] as const),
      ])
    : undefined;

  const check = () => {
    setChecked(true);
    const ok = answer.length === selected.length && answer.every((k) => selected.includes(k));
    play(ok ? 'correct' : 'wrong');
    if (ok) setScore(score + 1);
  };

  const next = () => {
    if (index + 1 < quiz.length) {
      setIndex(index + 1);
      setSelected([]);
      setChecked(false);
      return;
    }
    if (score >= QUIZ4_PASS) markCleared('tenpai');
    setPhase('result');
  };

  return (
    <main className="screen screen-wide">
      <ScreenHeader title={t('tenpai.quiz.question', { n: index + 1, total: TOTAL })} onBack={onDone} />
      <p className="prompt">{t('tenpai.quiz.prompt')}</p>
      <div className="quiz-hand">
        {hand.map((tile, i) => (
          <Tile key={i} tile={tile} width="var(--hand-tile)" />
        ))}
      </div>
      <WaitPicker
        selected={selected}
        marks={marks}
        canTap={() => !checked}
        onToggle={(k) => setSelected(selected.includes(k) ? selected.filter((x) => x !== k) : [...selected, k])}
      />
      <div className="feedback" aria-live="polite">
        {checked && (
          <p className={correct ? 'ok' : 'ng'}>
            {correct
              ? t('tenpai.quiz.correct')
              : t('tenpai.quiz.wrong', { tiles: answer.map((k) => tileName(t, tileOfKind(k))).join(', ') })}
          </p>
        )}
      </div>
      <div className="bottom-actions">
        {checked ? (
          <button className="btn btn-primary" onClick={next}>
            {t('common.next')}
          </button>
        ) : (
          <button className="btn btn-primary" disabled={selected.length === 0} onClick={check}>
            {t('tenpai.quiz.check')}
          </button>
        )}
      </div>
    </main>
  );
}
