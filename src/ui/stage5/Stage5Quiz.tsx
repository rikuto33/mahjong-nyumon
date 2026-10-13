import { useState } from 'react';
import { scoreWin } from '../../engine/score';
import { parseTiles, sortTiles, type Tile as TileCode } from '../../engine/tile';
import type { YakuId } from '../../engine/yaku';
import { shuffled } from '../../game/solo';
import { useI18n } from '../../i18n/I18nContext';
import type { MessageKey } from '../../i18n/translate';
import { QUIZ5_LENGTH, QUIZ5_PASS, STAGE5_QUIZ, type YakuQuizItem } from '../../tutorial/stage5';
import { LESSON_YAKU } from '../../tutorial/yakuDex';
import { useApp } from '../AppContext';
import { ScreenHeader } from '../ScreenHeader';
import { Tile } from '../tile/Tile';

type Choice = YakuId | 'none';

function answerOf(item: YakuQuizItem): Choice[] {
  const win = parseTiles(item.win)[0] as TileCode;
  const r = scoreWin({
    hand: [...parseTiles(item.hand), win],
    winTile: win,
    tsumo: item.tsumo,
    riichi: item.riichi,
    seatWind: item.seatWind,
    roundWind: item.roundWind,
  });
  return r ? [...new Set(r.yaku.map((y) => y.id))] : ['none'];
}

export function Stage5Quiz({ onDone }: { onDone: () => void }) {
  const { t } = useI18n();
  const { markCleared } = useApp();
  const [phase, setPhase] = useState<'intro' | 'question' | 'result'>('intro');
  const [quiz, setQuiz] = useState<YakuQuizItem[]>([]);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<Choice[]>([]);
  const [checked, setChecked] = useState(false);
  const [score, setScore] = useState(0);

  const start = () => {
    setQuiz(shuffled(STAGE5_QUIZ).slice(0, QUIZ5_LENGTH));
    setIndex(0);
    setSelected([]);
    setChecked(false);
    setScore(0);
    setPhase('question');
  };

  const name = (c: Choice) => (c === 'none' ? t('stage5.quiz.noYaku') : t(`yaku.${c}.name` as MessageKey));

  if (phase === 'intro') {
    return (
      <main className="screen">
        <ScreenHeader title={t('stageMenu.practice')} onBack={onDone} />
        <p className="prompt">{t('stage5.quiz.intro', { total: QUIZ5_LENGTH, need: QUIZ5_PASS })}</p>
        <button className="btn btn-primary" onClick={start}>
          {t('stage5.quiz.start')}
        </button>
      </main>
    );
  }

  if (phase === 'result') {
    const passed = score >= QUIZ5_PASS;
    return (
      <main className="screen">
        <ScreenHeader title={t('stageMenu.practice')} onBack={onDone} />
        <p className="result-score">{t('stage5.quiz.score', { score, total: QUIZ5_LENGTH })}</p>
        <p className={`notice ${passed ? 'notice-success' : ''}`}>
          {passed ? t('stage5.quiz.passed') : t('stage5.quiz.failed', { need: QUIZ5_PASS })}
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

  const item = quiz[index];
  const answer = answerOf(item);
  const correct = checked && answer.length === selected.length && answer.every((a) => selected.includes(a));
  const choices: Choice[] = [...LESSON_YAKU, 'none'];

  const toggle = (c: Choice) => {
    if (checked) return;
    if (c === 'none') setSelected(selected.includes('none') ? [] : ['none']);
    else setSelected(selected.includes(c) ? selected.filter((x) => x !== c) : [...selected.filter((x) => x !== 'none'), c]);
  };

  const check = () => {
    setChecked(true);
    if (answer.length === selected.length && answer.every((a) => selected.includes(a))) setScore(score + 1);
  };

  const next = () => {
    if (index + 1 < quiz.length) {
      setIndex(index + 1);
      setSelected([]);
      setChecked(false);
      return;
    }
    if (score >= QUIZ5_PASS) markCleared(5);
    setPhase('result');
  };

  const markOf = (c: Choice) => {
    if (!checked) return selected.includes(c) ? 'selected' : '';
    if (answer.includes(c)) return selected.includes(c) ? 'mark-correct' : 'mark-missed';
    return selected.includes(c) ? 'mark-wrong' : '';
  };

  return (
    <main className="screen screen-wide">
      <ScreenHeader title={t('stage5.quiz.question', { n: index + 1, total: quiz.length })} onBack={onDone} />
      <p className="prompt">{t('stage5.quiz.prompt')}</p>
      <div className="quiz-hand">
        {sortTiles(parseTiles(item.hand)).map((tile, i) => (
          <Tile key={i} tile={tile} width="var(--hand-tile)" />
        ))}
        <span className="win-tile">
          <Tile tile={parseTiles(item.win)[0]} width="var(--hand-tile)" mark="correct" />
        </span>
      </div>
      <ul className="situation">
        <li>{item.tsumo ? t('stage5.quiz.tsumo') : t('stage5.quiz.ron')}</li>
        {item.riichi && <li>{t('stage5.quiz.riichi')}</li>}
        <li>
          {t('stage5.quiz.winds', {
            seat: t(`table.wind${item.seatWind}` as MessageKey),
            round: t(`table.wind${item.roundWind}` as MessageKey),
          })}
        </li>
      </ul>
      <div className="choice-grid">
        {choices.map((c) => (
          <button key={c} className={`btn choice ${markOf(c)}`} aria-pressed={selected.includes(c)} onClick={() => toggle(c)}>
            {name(c)}
          </button>
        ))}
      </div>
      <div className="feedback" aria-live="polite">
        {checked && (
          <p className={correct ? 'ok' : 'ng'}>
            {correct ? t('stage5.quiz.correct') : t('stage5.quiz.wrong', { list: answer.map(name).join(', ') })}
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
            {t('stage5.quiz.check')}
          </button>
        )}
      </div>
    </main>
  );
}
