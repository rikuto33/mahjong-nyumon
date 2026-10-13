import { useEffect, useRef } from 'react';
import { play } from './sound';

/** 正解・不正解が決まった瞬間に音を鳴らす（null → true/false になったとき） */
export function useAnswerSound(correct: boolean | null) {
  const prev = useRef<boolean | null>(null);
  useEffect(() => {
    if (correct !== null && prev.current === null) play(correct ? 'correct' : 'wrong');
    prev.current = correct;
  }, [correct]);
}
