import { QUIZ6_LENGTH, QUIZ6_PASS } from '../../tutorial/ron';
import { RON_QUIZ } from '../../tutorial/yakuItems';
import { YesNoYakuQuiz } from '../quiz/YesNoYakuQuiz';

export function Stage6Quiz({ onDone, onNext }: { onDone: () => void; onNext: () => void }) {
  return <YesNoYakuQuiz stage="ron" prefix="ron.quiz" pool={RON_QUIZ} length={QUIZ6_LENGTH} pass={QUIZ6_PASS} onDone={onDone} onNext={onNext} />;
}
