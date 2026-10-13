import type { ExplainSlide } from './types';

export const FINALE_SLIDES: ExplainSlide[] = [{ id: 's1' }, { id: 's2' }, { id: 's3' }, { id: 's4' }];

/** 卓の見方の案内（静的な卓の上で、示す場所の CSS クラス） */
export const STAGE10_TOUR: { id: string; target: string }[] = [
  { id: 't1', target: 'center-panel' },
  { id: 't2', target: 'seat-score' },
  { id: 't3', target: 'dora-box' },
  { id: 't4', target: 'river' },
  { id: 't5', target: 'opponent-hand' },
  { id: 't6', target: 'my-hand' },
  { id: 't7', target: 'my-melds' },
  { id: 't8', target: 'action-bar' },
];
