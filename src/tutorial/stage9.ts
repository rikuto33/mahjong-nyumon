import type { HandResult, Seat } from '../game/hand';
import { afterResult, newMatch, type MatchState } from '../game/match';
import type { ExplainSlide } from './types';

export const STAGE9_SLIDES: ExplainSlide[] = [
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

/** 練習：次の局はどうなる？ choices の中にエンジンの答えが必ず 1 つある（テストで確認） */
export type FlowQuizItem = {
  id: string;
  match: Pick<MatchState, 'dealer' | 'roundWind' | 'roundNumber' | 'honba'>;
  event: FlowEvent;
  scores: number[];
  choices: string[]; // 'next:<wind>:<number>:<honba>' または 'end'
};
const q = (
  id: string,
  roundWind: 1 | 2,
  roundNumber: number,
  honba: number,
  event: FlowEvent,
  scores: number[],
  choices: string[],
): FlowQuizItem => ({ id, match: { dealer: ((roundNumber - 1) % 4) as Seat, roundWind, roundNumber, honba }, event, scores, choices });

export const STAGE9_QUIZ: FlowQuizItem[] = [
  q('q1', 1, 1, 0, 'dealerWin', [33000, 22000, 23000, 22000], ['next:1:1:1', 'next:1:2:0', 'next:1:2:1']),
  q('q2', 1, 2, 1, 'childWin', [20000, 24000, 31000, 25000], ['next:1:2:2', 'next:1:3:0', 'next:1:3:2']),
  q('q3', 1, 3, 0, 'drawDealerTenpai', [24000, 24000, 27000, 25000], ['next:1:3:1', 'next:1:4:0', 'next:1:4:1']),
  q('q4', 1, 2, 0, 'drawDealerNoten', [22000, 25000, 26500, 26500], ['next:1:2:1', 'next:1:3:0', 'next:1:3:1']),
  q('q5', 1, 4, 0, 'childWin', [32000, 22000, 24000, 22000], ['end', 'next:2:1:0', 'next:1:4:1']),
  q('q6', 1, 4, 0, 'childWin', [28000, 24000, 25000, 23000], ['end', 'next:2:1:0', 'next:1:4:1']),
  q('q7', 1, 4, 0, 'dealerWin', [24000, 22000, 20000, 34000], ['end', 'next:2:1:0', 'next:1:4:1']),
  q('q8', 2, 1, 0, 'childWin', [21000, 31000, 25000, 23000], ['end', 'next:2:2:0', 'next:2:1:1']),
];
export const QUIZ9_FLOW = 4;

/** 練習：ノーテン罰符（聴牌の人数ごとに、ノーテンの人が 1 人あたり払う点数） */
export const NOTEN_QUIZ = [1, 2, 3];
export const NOTEN_CHOICES = [1000, 1500, 3000];
export const QUIZ9_NOTEN = 2;
export const QUIZ9_PASS = 5;

/** 練習の答え（エンジンで計算） */
export function flowAnswer(item: FlowQuizItem): string {
  const m = { ...newMatch(0), ...item.match };
  const next = afterResult(m, item.scores, eventResult(item.event, m.dealer), 0);
  return next.finished ? 'end' : `next:${next.roundWind}:${next.roundNumber}:${next.honba}`;
}
