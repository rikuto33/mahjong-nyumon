import { useState } from 'react';
import { callOptions } from '../../engine/calls';
import { scoreWin } from '../../engine/score';
import { parseTiles, sortTiles, type Tile as TileCode } from '../../engine/tile';
import { shuffled } from '../../game/solo';
import { useI18n } from '../../i18n/I18nContext';
import type { MessageKey } from '../../i18n/translate';
import {
  QUIZ7_CALLS,
  QUIZ7_OPEN,
  QUIZ7_PASS,
  STAGE7_QUIZ_CALLS,
  STAGE7_QUIZ_OPEN,
  type CallScene,
  type OpenWinItem,
} from '../../tutorial/stage7';
import { useApp } from '../AppContext';
import { ScreenHeader } from '../ScreenHeader';
import { MeldTiles } from '../tile/MeldTiles';
import { Tile } from '../tile/Tile';

type Q = { kind: 'calls'; scene: CallScene } | { kind: 'open'; item: OpenWinItem };
type CallChoice = 'pon' | 'chi' | 'kan' | 'none';
const TOTAL = QUIZ7_CALLS + QUIZ7_OPEN;

function makeQuiz(): Q[] {
  const a = shuffled(STAGE7_QUIZ_CALLS).slice(0, QUIZ7_CALLS).map<Q>((scene) => ({ kind: 'calls', scene }));
  const b = shuffled(STAGE7_QUIZ_OPEN).slice(0, QUIZ7_OPEN).map<Q>((item) => ({ kind: 'open', item }));
  return shuffled([...a, ...b]);
}

function callAnswer(scene: CallScene): CallChoice[] {
  const o = callOptions(parseTiles(scene.hand), parseTiles(scene.tile)[0], { fromLeft: scene.from === 'left' });
  const set = new Set<CallChoice>(o.map((x) => (x.type === 'minkan' ? 'kan' : x.type)));
  return set.size ? [...set] : ['none'];
}

function openResult(item: OpenWinItem) {
  const w = parseTiles(item.win)[0] as TileCode;
  return scoreWin({
    hand: [...parseTiles(item.hand), w],
    melds: item.melds.map((m) => ({ type: m.type, tiles: parseTiles(m.tiles) })),
    winTile: w,
    tsumo: false,
    seatWind: 2,
    roundWind: 1,
  });
}

export function Stage7Quiz({ onDone }: { onDone: () => void }) {
  const { t } = useI18n();
  const { markCleared } = useApp();
  const [phase, setPhase] = useState<'intro' | 'question' | 'result'>('intro');
  const [quiz, setQuiz] = useState<Q[]>([]);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<CallChoice[]>([]);
  const [picked, setPicked] = useState<boolean | null>(null);
  const [checked, setChecked] = useState(false);
  const [score, setScore] = useState(0);

  const start = () => {
    setQuiz(makeQuiz());
    setIndex(0);
    setSelected([]);
    setPicked(null);
    setChecked(false);
    setScore(0);
    setPhase('question');
  };

  if (phase !== 'question') {
    const passed = score >= QUIZ7_PASS;
    return (
      <main className="screen">
        <ScreenHeader title={t('stageMenu.practice')} onBack={onDone} />
        {phase === 'intro' ? (
          <>
            <p className="prompt">{t('stage7.quiz.intro', { total: TOTAL, need: QUIZ7_PASS })}</p>
            <button className="btn btn-primary" onClick={start}>
              {t('stage7.quiz.start')}
            </button>
          </>
        ) : (
          <>
            <p className="result-score">{t('stage7.quiz.score', { score, total: TOTAL })}</p>
            <p className={`notice ${passed ? 'notice-success' : ''}`}>
              {passed ? t('stage7.quiz.passed') : t('stage7.quiz.failed', { need: QUIZ7_PASS })}
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
  const callName = (c: CallChoice) => (c === 'none' ? t('stage7.quiz.none') : t(`actions.${c}`));
  let correct = false;
  let answerText = '';
  if (q.kind === 'calls') {
    const ans = callAnswer(q.scene);
    correct = ans.length === selected.length && ans.every((a) => selected.includes(a));
    answerText = t('stage7.quiz.answerCalls', { list: ans.map(callName).join(', ') });
  } else {
    const r = openResult(q.item);
    correct = picked === (r !== null);
    answerText = r
      ? t('stage7.quiz.answerYaku', { list: r.yaku.map((y) => t(`yaku.${y.id}.name` as MessageKey)).join(', ') })
      : t('stage7.quiz.answerNoYaku');
  }

  const finishAnswer = (ok: boolean) => {
    setChecked(true);
    if (ok) setScore(score + 1);
  };

  const next = () => {
    if (index + 1 < quiz.length) {
      setIndex(index + 1);
      setSelected([]);
      setPicked(null);
      setChecked(false);
      return;
    }
    if (score >= QUIZ7_PASS) markCleared(7);
    setPhase('result');
  };

  const toggle = (c: CallChoice) => {
    if (checked) return;
    if (c === 'none') setSelected(selected.includes('none') ? [] : ['none']);
    else setSelected(selected.includes(c) ? selected.filter((x) => x !== c) : [...selected.filter((x) => x !== 'none'), c]);
  };

  return (
    <main className="screen screen-wide">
      <ScreenHeader title={t('stage7.quiz.question', { n: index + 1, total: quiz.length })} onBack={onDone} />
      {q.kind === 'calls' ? (
        <>
          <p className="prompt">{t('stage7.quiz.callPrompt')}</p>
          <div className="ron-discard">
            <span className="muted">{t(`stage7.quiz.from.${q.scene.from}`)}</span>
            <Tile tile={parseTiles(q.scene.tile)[0]} width="var(--choice-tile)" mark="tip" />
          </div>
          <div className="quiz-hand">
            {sortTiles(parseTiles(q.scene.hand)).map((x, i) => (
              <Tile key={i} tile={x} width="var(--hand-tile)" />
            ))}
          </div>
          <div className="choice-grid">
            {(['pon', 'chi', 'kan', 'none'] as const).map((c) => (
              <button key={c} className="btn choice" aria-pressed={selected.includes(c)} onClick={() => toggle(c)}>
                {callName(c)}
              </button>
            ))}
          </div>
        </>
      ) : (
        <>
          <p className="prompt">{t('stage7.quiz.openPrompt')}</p>
          <p className="muted">{t('stage7.quiz.winds')}</p>
          <div className="quiz-hand">
            {sortTiles(parseTiles(q.item.hand)).map((x, i) => (
              <Tile key={i} tile={x} width="var(--hand-tile)" />
            ))}
            <span className="win-tile">
              <Tile tile={parseTiles(q.item.win)[0]} width="var(--hand-tile)" mark="correct" />
            </span>
            {q.item.melds.map((m, i) => (
              <span key={i} className="win-tile">
                <MeldTiles meld={{ type: m.type, tiles: parseTiles(m.tiles) }} from="left" width="var(--hand-tile)" />
              </span>
            ))}
          </div>
        </>
      )}
      <div className="feedback" aria-live="polite">
        {checked && (
          <>
            <p className={correct ? 'ok' : 'ng'}>{correct ? t('stage7.quiz.correct') : t('stage7.quiz.wrong')}</p>
            <p>{answerText}</p>
          </>
        )}
      </div>
      <div className="bottom-actions">
        {checked ? (
          <button className="btn btn-primary" onClick={next}>
            {t('common.next')}
          </button>
        ) : q.kind === 'calls' ? (
          <button
            className="btn btn-primary"
            disabled={selected.length === 0}
            onClick={() => {
              const ans = callAnswer(q.scene);
              finishAnswer(ans.length === selected.length && ans.every((a) => selected.includes(a)));
            }}
          >
            {t('stage7.quiz.check')}
          </button>
        ) : (
          <>
            <button
              className="btn"
              onClick={() => {
                setPicked(false);
                finishAnswer(openResult(q.item) === null);
              }}
            >
              {t('stage7.quiz.no')}
            </button>
            <button
              className="btn btn-primary"
              onClick={() => {
                setPicked(true);
                finishAnswer(openResult(q.item) !== null);
              }}
            >
              {t('stage7.quiz.yes')}
            </button>
          </>
        )}
      </div>
    </main>
  );
}
