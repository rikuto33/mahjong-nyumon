import { QUIZ7_LENGTH, QUIZ7_PASS } from '../../tutorial/calls';
import { CALLS_QUIZ } from '../../tutorial/yakuItems';
import { YesNoYakuQuiz } from '../quiz/YesNoYakuQuiz';

export function Stage7Quiz({ onDone, onNext }: { onDone: () => void; onNext: () => void }) {
  return <YesNoYakuQuiz stage="calls" prefix="calls.quiz" pool={CALLS_QUIZ} length={QUIZ7_LENGTH} pass={QUIZ7_PASS} onDone={onDone} onNext={onNext} />;
}
