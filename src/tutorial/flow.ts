import type { HandResult, Seat } from '../game/hand';
import type { ExplainSlide } from './types';

export const FLOW_SLIDES: ExplainSlide[] = [
  { id: 's0' },
  { id: 's1', rows: ['1z 2z 3z 4z'] },
  { id: 's2' },
  { id: 's3' },
  { id: 's4' },
  { id: 's5' },
  { id: 's6' },
  { id: 's7' },
  { id: 's8' },
  { id: 's9' },
  { id: 's10' },
];

export type FlowEvent = 'dealerWin' | 'childWin' | 'drawDealerTenpai' | 'drawDealerNoten';

/** 局の結果を作る（afterResult に渡すだけの簡易なもの） */
export function eventResult(event: FlowEvent, dealer: Seat): HandResult {
  const child = ((dealer + 1) % 4) as Seat;
  switch (event) {
    case 'dealerWin':
      return { kind: 'win', wins: [{ seat: dealer } as never], deltas: [0, 0, 0, 0], dealerWon: true };
    case 'childWin':
      return { kind: 'win', wins: [{ seat: child } as never], deltas: [0, 0, 0, 0], dealerWon: false };
    case 'drawDealerTenpai':
    case 'drawDealerNoten': {
      const tenpai = [false, false, false, false];
      tenpai[dealer] = event === 'drawDealerTenpai';
      tenpai[child] = true;
      return { kind: 'draw', reason: 'exhaustive', tenpai, nagashi: [], deltas: [0, 0, 0, 0] };
    }
  }
}

/** 台本：局の流れを順に見る。scores は各局のあとの点数（自分は席 0、起家） */
export const STAGE9_GUIDED: { id: string; event: FlowEvent | null; scores: number[] }[] = [
  { id: 'g1', event: null, scores: [25000, 25000, 25000, 25000] },
  { id: 'g2', event: 'dealerWin', scores: [30800, 23000, 23100, 23100] },
  { id: 'g3', event: 'childWin', scores: [27800, 26000, 23100, 23100] },
  { id: 'g4', event: 'drawDealerTenpai', scores: [26300, 27500, 23100, 23100] },
  { id: 'g5', event: 'drawDealerNoten', scores: [24800, 26000, 24600, 24600] },
];
