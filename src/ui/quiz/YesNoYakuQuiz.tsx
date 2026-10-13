import { useState } from 'react';
import { shuffled } from '../../game/solo';
import { useI18n } from '../../i18n/I18nContext';
import type { MessageKey } from '../../i18n/translate';
import type { StageId } from '../../tutorial/stages';
import { scoreItem, type YakuItem } from '../../tutorial/yakuItems';
import { useApp } from '../AppContext';
import { ScreenHeader } from '../ScreenHeader';
import { YakuItemView } from './YakuItemView';

type Props = {
  stage: StageId;
  /** i18n の接頭辞（intro / start / question / prompt / score / passed / failed を持つ） */
  prefix: string;
  pool: YakuItem[];
  length: number;
  pass: number;
  onDone: () => void;
};

/** 「ロンしたら、この手に役はある？」をはい／いいえで答えるクイズ */
export function YesNoYakuQuiz({ stage, prefix, pool, length, pass, onDone }: Props) {
  const { t } = useI18n();
  const { markCleared } = useApp();
  const k = (s: string) => `${prefix}.${s}` as MessageKey;
  const [phase, setPhase] = useState<'intro' | 'question' | 'result'>('intro');
  const [quiz, setQuiz] = useState<YakuItem[]>([]);
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<boolean | null>(null);
  const [score, setScore] = useState(0);

  const start = () => {
    setQuiz(shuffled(pool).slice(0, length));
    setIndex(0);
    setPicked(null);
    setScore(0);
    setPhase('question');
  };

  if (phase !== 'question') {
    const passed = score >= pass;
    return (
      <main className="screen">
        <ScreenHeader title={t('stageMenu.practice')} onBack={onDone} />
        {phase === 'intro' ? (
          <>
            <p className="prompt">{t(k('intro'), { total: length, need: pass })}</p>
            <button className="btn btn-primary" onClick={start}>
              {t('common.startPractice')}
            </button>
          </>
        ) : (
          <>
            <p className="result-score">{t('common.score', { score, total: length })}</p>
            <p className={`notice ${passed ? 'notice-success' : ''}`}>{passed ? t(k('passed')) : t('common.failed', { need: pass })}</p>
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
  const r = scoreItem(item);
  const answer = r !== null;
  const correct = picked === answer;
  const pick = (yes: boolean) => {
    if (picked !== null) return;
    setPicked(yes);
    if (yes === answer) setScore(score + 1);
  };
  const next = () => {
    if (index + 1 < quiz.length) {
      setIndex(index + 1);
      setPicked(null);
      return;
    }
    if (score >= pass) markCleared(stage);
    setPhase('result');
  };

  return (
    <main className="screen screen-wide">
      <ScreenHeader title={t('common.question', { n: index + 1, total: quiz.length })} onBack={onDone} />
      <p className="prompt">{t(k('prompt'))}</p>
      <YakuItemView item={item} />
      <div className="feedback" aria-live="polite">
        {picked !== null && (
          <>
            <p className={correct ? 'ok' : 'ng'}>{correct ? t('common.correct') : t('common.wrong')}</p>
            <p>
              {r
                ? t('quizHelp.answerYaku', { list: r.yaku.map((y) => t(`yaku.${y.id}.name` as MessageKey)).join(', ') })
                : t('quizHelp.answerNoYaku')}
            </p>
          </>
        )}
      </div>
      <div className="bottom-actions">
        {picked === null ? (
          <>
            <button className="btn" onClick={() => pick(false)}>
              {t('quizHelp.noYaku')}
            </button>
            <button className="btn btn-primary" onClick={() => pick(true)}>
              {t('quizHelp.hasYaku')}
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
