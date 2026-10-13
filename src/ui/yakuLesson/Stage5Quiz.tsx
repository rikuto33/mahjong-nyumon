import { useState } from 'react';
import { shuffled } from '../../game/solo';
import { useI18n } from '../../i18n/I18nContext';
import type { MessageKey } from '../../i18n/translate';
import { QUIZ5_LENGTH, QUIZ5_PASS } from '../../tutorial/yaku';
import { BASIC_YAKU, basicYakuOf, YAKU_QUIZ, type BasicYaku, type YakuItem } from '../../tutorial/yakuItems';
import { useApp } from '../AppContext';
import { YakuItemView } from '../quiz/YakuItemView';
import { ScreenHeader } from '../ScreenHeader';
import { play } from '../sound';

type Choice = BasicYaku | 'none';

export function Stage5Quiz({ onDone }: { onDone: () => void }) {
  const { t } = useI18n();
  const { markCleared } = useApp();
  const [phase, setPhase] = useState<'intro' | 'question' | 'result'>('intro');
  const [quiz, setQuiz] = useState<YakuItem[]>([]);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<Choice[]>([]);
  const [checked, setChecked] = useState(false);
  const [score, setScore] = useState(0);

  const start = () => {
    setQuiz(shuffled(YAKU_QUIZ).slice(0, QUIZ5_LENGTH));
    setIndex(0);
    setSelected([]);
    setChecked(false);
    setScore(0);
    setPhase('question');
  };
  const name = (c: Choice) => t(`yakuLesson.choice.${c}` as MessageKey);

  if (phase !== 'question') {
    const passed = score >= QUIZ5_PASS;
    return (
      <main className="screen">
        <ScreenHeader title={t('stageMenu.practice')} onBack={onDone} />
        {phase === 'intro' ? (
          <>
            <p className="prompt">{t('yakuLesson.quiz.intro', { total: QUIZ5_LENGTH, need: QUIZ5_PASS })}</p>
            <button className="btn btn-primary" onClick={start}>
              {t('common.startPractice')}
            </button>
          </>
        ) : (
          <>
            <p className="result-score">{t('common.score', { score, total: QUIZ5_LENGTH })}</p>
            <p className={`notice ${passed ? 'notice-success' : ''}`}>
              {passed ? t('yakuLesson.quiz.passed') : t('common.failed', { need: QUIZ5_PASS })}
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

  const item = quiz[index];
  const yaku = basicYakuOf(item);
  const answer: Choice[] = yaku.length ? yaku : ['none'];
  const isCorrect = (sel: Choice[]) => answer.length === sel.length && answer.every((a) => sel.includes(a));
  const correct = checked && isCorrect(selected);
  const choices: Choice[] = [...BASIC_YAKU, 'none'];

  const toggle = (c: Choice) => {
    if (checked) return;
    if (c === 'none') setSelected(selected.includes('none') ? [] : ['none']);
    else setSelected(selected.includes(c) ? selected.filter((x) => x !== c) : [...selected.filter((x) => x !== 'none'), c]);
  };
  const check = () => {
    setChecked(true);
    play(isCorrect(selected) ? 'correct' : 'wrong');
    if (isCorrect(selected)) setScore(score + 1);
  };
  const next = () => {
    if (index + 1 < quiz.length) {
      setIndex(index + 1);
      setSelected([]);
      setChecked(false);
      return;
    }
    if (score >= QUIZ5_PASS) markCleared('yaku');
    setPhase('result');
  };
  const markOf = (c: Choice) => {
    if (!checked) return '';
    if (answer.includes(c)) return selected.includes(c) ? 'mark-correct' : 'mark-missed';
    return selected.includes(c) ? 'mark-wrong' : '';
  };

  return (
    <main className="screen screen-wide">
      <ScreenHeader title={t('common.question', { n: index + 1, total: quiz.length })} onBack={onDone} />
      <p className="prompt">{t('yakuLesson.quiz.prompt')}</p>
      <YakuItemView item={item} />
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
            {correct ? t('common.correct') : t('yakuLesson.quiz.wrong', { list: answer.map(name).join(', ') })}
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
            {t('yakuLesson.quiz.check')}
          </button>
        )}
      </div>
    </main>
  );
}
