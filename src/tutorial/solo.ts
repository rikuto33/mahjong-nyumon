import type { ExplainSlide } from './types';

export const SOLO_SLIDES: ExplainSlide[] = [
  { id: 's1' },
  { id: 's2' },
  { id: 's3', rows: ['45p 77s', '1z 9m'] },
  { id: 's4' },
];

/** 台本：配牌 13 枚とツモ順。各手で切る牌を指示する */
export const STAGE3_GUIDED_HAND = '234m67p345s77z9m1z5z';
export const STAGE3_GUIDED: { id: string; draw: string; discard: string | null }[] = [
  { id: 'g1', draw: '8p', discard: '1z' },
  { id: 'g2', draw: '8m', discard: '5z' },
  { id: 'g3', draw: '2p', discard: '2p' },
  { id: 'g4', draw: '7m', discard: null }, // ツモ和了
];
