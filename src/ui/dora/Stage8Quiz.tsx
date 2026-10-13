import { useState } from 'react';
import { countDora, doraFromIndicator } from '../../engine/score';
import { parseTiles, sortTiles, tileOfKind } from '../../engine/tile';
import { shuffled } from '../../game/solo';
import { useI18n } from '../../i18n/I18nContext';
import {
  COUNT_CHOICES,
  QUIZ8_COUNT,
  QUIZ8_PASS,
  QUIZ8_PICK,
  STAGE8_QUIZ_COUNT,
  STAGE8_QUIZ_PICK,
  type DoraCountItem,
} from '../../tutorial/dora';
import { useApp } from '../AppContext';
import { ScreenHeader } from '../ScreenHeader';
import { WaitPicker } from '../tenpai/WaitPicker';
import { MeldTiles } from '../tile/MeldTiles';
import { Tile } from '../tile/Tile';
import { tileName } from '../tile/tileText';

type Q = { kind: 'pick'; indicator: string } | { kind: 'count'; item: DoraCountItem };
const TOTAL = QUIZ8_PICK + QUIZ8_COUNT;

function makeQuiz(): Q[] {
  const a = shuffled(STAGE8_QUIZ_PICK).slice(0, QUIZ8_PICK).map<Q>((indicator) => ({ kind: 'pick', indicator }));
  const b = shuffled(STAGE8_QUIZ_COUNT).slice(0, QUIZ8_COUNT).map<Q>((item) => ({ kind: 'count', item }));
  return shuffled([...a, ...b]);
}

function countOf(item: DoraCountItem) {
  const tiles = [...parseTiles(item.hand), ...(item.melds ?? []).flatMap((m) => parseTiles(m.tiles))];
  const c = countDora(tiles, item.dora.map((x) => parseTiles(x)[0]), (item.ura ?? []).map((x) => parseTiles(x)[0]));
  return { ...c, total: c.dora + c.aka + c.ura };
}

export function Stage8Quiz({ onDone }: { onDone: () => void }) {
  const { t } = useI18n();
  const { markCleared } = useApp();
  const [phase, setPhase] = useState<'intro' | 'question' | 'result'>('intro');
  const [quiz, setQuiz] = useState<Q[]>([]);
  const [index, setIndex] = useState(0);
  const [answer, setAnswer] = useState<number | null>(null);
  const [score, setScore] = useState(0);

  const start = () => {
    setQuiz(makeQuiz());
    setIndex(0);
    setAnswer(null);
    setScore(0);
    setPhase('question');
  };

  if (phase !== 'question') {
    const passed = score >= QUIZ8_PASS;
    return (
      <main className="screen">
        <ScreenHeader title={t('stageMenu.practice')} onBack={onDone} />
        {phase === 'intro' ? (
          <>
            <p className="prompt">{t('dora.quiz.intro', { total: TOTAL, need: QUIZ8_PASS })}</p>
            <button className="btn btn-primary" onClick={start}>
              {t('dora.quiz.start')}
            </button>
          </>
        ) : (
          <>
            <p className="result-score">{t('dora.quiz.score', { score, total: TOTAL })}</p>
            <p className={`notice ${passed ? 'notice-success' : ''}`}>
              {passed ? t('dora.quiz.passed') : t('dora.quiz.failed', { need: QUIZ8_PASS })}
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
  const expected = q.kind === 'pick' ? doraFromIndicator(parseTiles(q.indicator)[0]) : countOf(q.item).total;
  const correct = answer === expected;

  const choose = (n: number) => {
    if (answer !== null) return;
    setAnswer(n);
    if (n === expected) setScore(score + 1);
  };

  const next = () => {
    if (index + 1 < quiz.length) {
      setIndex(index + 1);
      setAnswer(null);
      return;
    }
    if (score >= QUIZ8_PASS) markCleared('dora');
    setPhase('result');
  };

  let answerText = '';
  if (answer !== null) {
    if (q.kind === 'pick') answerText = t('dora.quiz.answerPick', { name: tileName(t, tileOfKind(expected)) });
    else answerText = t('dora.quiz.answerCount', countOf(q.item));
  }

  return (
    <main className="screen screen-wide">
      <ScreenHeader title={t('dora.quiz.question', { n: index + 1, total: quiz.length })} onBack={onDone} />
      <p className="prompt">{q.kind === 'pick' ? t('dora.quiz.pickPrompt') : t('dora.quiz.countPrompt')}</p>
      <div className="dora-row">
        <div className="dora-box dora-inline">
          <span className="dora-label">{t('dora.guided.indicator')}</span>
          <span className="dora-tiles">
            {(q.kind === 'pick' ? [q.indicator] : q.item.dora).map((x, i) => (
              <Tile key={i} tile={parseTiles(x)[0]} width="var(--hand-tile)" />
            ))}
          </span>
        </div>
        {q.kind === 'count' && q.item.ura && (
          <div className="dora-box dora-inline">
            <span className="dora-label">{t('dora.guided.ura')}</span>
            <span className="dora-tiles">
              {q.item.ura.map((x, i) => (
                <Tile key={i} tile={parseTiles(x)[0]} width="var(--hand-tile)" />
              ))}
            </span>
          </div>
        )}
      </div>
      {q.kind === 'pick' ? (
        <WaitPicker
          selected={answer !== null ? [answer] : []}
          marks={
            answer !== null
              ? new Map<number, 'correct' | 'wrong' | 'tip'>([
                  [answer, correct ? 'correct' : 'wrong'],
                  ...(correct ? [] : ([[expected, 'tip']] as const)),
                ])
              : undefined
          }
          canTap={() => answer === null}
          onToggle={choose}
        />
      ) : (
        <>
          {q.item.ura && <p className="muted">{t('dora.quiz.riichi')}</p>}
          <div className="quiz-hand">
            {sortTiles(parseTiles(q.item.hand)).map((x, i) => (
              <Tile key={i} tile={x} width="var(--hand-tile)" />
            ))}
            {(q.item.melds ?? []).map((m, i) => (
              <span key={i} className="win-tile">
                <MeldTiles meld={{ type: m.type, tiles: parseTiles(m.tiles) }} width="var(--hand-tile)" />
              </span>
            ))}
          </div>
          <div className="button-row">
            {COUNT_CHOICES.map((n) => (
              <button
                key={n}
                className={`btn count-btn ${answer === n ? (correct ? 'mark-correct' : 'mark-wrong') : ''} ${answer !== null && !correct && n === expected ? 'mark-missed' : ''}`}
                disabled={answer !== null}
                onClick={() => choose(n)}
              >
                {n}
              </button>
            ))}
          </div>
        </>
      )}
      <div className="feedback" aria-live="polite">
        {answer !== null && (
          <>
            <p className={correct ? 'ok' : 'ng'}>{correct ? t('dora.quiz.correct') : t('dora.quiz.wrong')}</p>
            <p>{answerText}</p>
          </>
        )}
      </div>
      <div className="bottom-actions">
        {answer !== null && (
          <button className="btn btn-primary" onClick={next}>
            {t('common.next')}
          </button>
        )}
      </div>
    </main>
  );
}
