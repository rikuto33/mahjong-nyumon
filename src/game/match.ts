import type { Wind } from '../engine/score';
import type { Tile } from '../engine/tile';
import { startHand, SEATS, type HandResult, type HandState, type Seat } from './hand';

/*
 * 四人東風戦の進行（雀魂 段位戦ルール、SPEC §5.2）
 * - 25,000 点持ち。一位必要点数 30,000
 * - 親の和了・流局時の親聴牌・途中流局で連荘（本場 +1）。子の和了で親流れ（本場 0）。親ノーテン流局は親流れで本場 +1
 * - 飛び：誰かがマイナスになったら終了（0 点ちょうどは続行）
 * - 東 4 局：連荘しなければ、30,000 点以上の人がいれば終了、いなければ南入
 *   連荘でも、親がトップかつ 30,000 点以上なら自動で和了り止め・聴牌止め
 * - 南場（サドンデス）：誰かが 30,000 点以上になった時点で終了。ただしダブロンで親の連荘がある場合は連荘を優先
 *   南 4 局で終わり（西入なし）
 * - 終局時の供託はトップ取り。同点は起家に近い方が上位
 */

export const START_POINTS = 25000;
export const TARGET_POINTS = 30000;

export type MatchState = {
  /** 起家 */
  startDealer: Seat;
  dealer: Seat;
  roundWind: Wind; // 1 = 東場、2 = 南場
  roundNumber: number; // 1〜4
  honba: number;
  riichiSticks: number;
  scores: number[];
  finished: boolean;
  /** 終局時の順位（席の並び、1 位から） */
  ranking: Seat[] | null;
  endReason: 'tobi' | 'target' | 'agariYame' | 'tenpaiYame' | 'maxRound' | null;
};

export function newMatch(startDealer: Seat): MatchState {
  return {
    startDealer,
    dealer: startDealer,
    roundWind: 1,
    roundNumber: 1,
    honba: 0,
    riichiSticks: 0,
    scores: [START_POINTS, START_POINTS, START_POINTS, START_POINTS],
    finished: false,
    ranking: null,
    endReason: null,
  };
}

export function startMatchHand(m: MatchState, tiles: Tile[]): HandState {
  return startHand({
    roundWind: m.roundWind,
    roundNumber: m.roundNumber,
    dealer: m.dealer,
    honba: m.honba,
    riichiSticks: m.riichiSticks,
    scores: m.scores,
    tiles,
  });
}

/** 点数の順位。同点は起家に近い方が上 */
export function rankingOf(scores: number[], startDealer: Seat): Seat[] {
  const dist = (s: Seat) => (s - startDealer + 4) % 4;
  return [...SEATS].sort((a, b) => scores[b] - scores[a] || dist(a) - dist(b));
}

/** 局の結果から、連荘するか（親が続けるか） */
export function isRenchan(result: HandResult, dealer: Seat): boolean {
  if (result.kind === 'win') return result.dealerWon;
  if (result.reason !== 'exhaustive') return true; // 途中流局はすべて連荘
  return result.tenpai[dealer];
}

/** 局が終わったあとの状態（次局、または終局） */
export function afterHand(m: MatchState, hand: HandState): MatchState {
  if (!hand.result) throw new Error('hand not finished');
  return afterResult(m, hand.scores, hand.result, hand.riichiSticks);
}

/** 局の結果（精算後の点数・結果・場の供託）から次の状態を求める */
export function afterResult(m: MatchState, scores: number[], result: HandResult, riichiSticks: number): MatchState {
  const next: MatchState = { ...m, scores: [...scores], riichiSticks };
  const renchan = isRenchan(result, m.dealer);
  const isOorasu = m.roundWind === 1 && m.roundNumber === 4;
  const isSouth = m.roundWind === 2;
  const anyTarget = next.scores.some((x) => x >= TARGET_POINTS);
  const ranking = rankingOf(next.scores, m.startDealer);

  const finish = (reason: NonNullable<MatchState['endReason']>): MatchState => {
    const scores = [...next.scores];
    // 終了時の供託はトップ取り
    scores[ranking[0]] += next.riichiSticks * 1000;
    return { ...next, scores, riichiSticks: 0, finished: true, ranking: rankingOf(scores, m.startDealer), endReason: reason };
  };

  if (next.scores.some((x) => x < 0)) return finish('tobi');

  if (isSouth) {
    const doubleRonWithDealer = result.kind === 'win' && result.wins.length > 1 && result.dealerWon;
    if (anyTarget && !doubleRonWithDealer) return finish('target');
    if (!renchan && m.roundNumber === 4) return finish('maxRound');
  }

  if (isOorasu) {
    if (renchan) {
      const dealerTop = ranking[0] === m.dealer && next.scores[m.dealer] >= TARGET_POINTS;
      if (dealerTop && result.kind === 'win') return finish('agariYame');
      if (dealerTop && result.kind === 'draw' && result.reason === 'exhaustive') return finish('tenpaiYame');
    } else if (anyTarget) {
      return finish('target');
    }
  }

  if (renchan) return { ...next, honba: m.honba + 1 };

  // 親流れ
  const honba = result.kind === 'draw' ? m.honba + 1 : 0;
  const dealer = ((m.dealer + 1) % 4) as Seat;
  let roundWind = m.roundWind;
  let roundNumber = m.roundNumber + 1;
  if (roundNumber > 4) {
    roundWind = (roundWind + 1) as Wind;
    roundNumber = 1;
  }
  return { ...next, dealer, roundWind, roundNumber, honba };
}
