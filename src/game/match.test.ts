import { describe, expect, it } from 'vitest';
import { fullTileSet, shuffled } from './solo';
import { decideResponse, decideTurn, type AiLevel } from './ai';
import { apply, SEATS, type HandResult, type HandState, type Seat } from './hand';
import { afterHand, newMatch, rankingOf, startMatchHand, type MatchState } from './match';
import { seeded } from './arrange';

/** 局の結果だけを持つ HandState（afterHand の判定に必要な項目のみ） */
function ended(scores: number[], result: HandResult, riichiSticks = 0): HandState {
  return { scores, result, riichiSticks } as unknown as HandState;
}
const win = (seats: Seat[], dealerWon: boolean): HandResult => ({
  kind: 'win',
  wins: seats.map((seat) => ({ seat }) as never),
  deltas: [0, 0, 0, 0],
  dealerWon,
});
const draw = (tenpai: boolean[]): HandResult => ({ kind: 'draw', reason: 'exhaustive', tenpai, nagashi: [], deltas: [0, 0, 0, 0] });

describe('東風戦の進行', () => {
  const m0 = newMatch(0);

  it('親の和了は連荘（本場 +1）', () => {
    const m = afterHand(m0, ended([37000, 21000, 21000, 21000], win([0], true)));
    expect(m).toMatchObject({ dealer: 0, roundWind: 1, roundNumber: 1, honba: 1, finished: false });
  });

  it('子の和了は親流れ（本場 0）', () => {
    const m = afterHand({ ...m0, honba: 2 }, ended([20000, 30000, 25000, 25000], win([1], false)));
    expect(m).toMatchObject({ dealer: 1, roundNumber: 2, honba: 0 });
  });

  it('流局：親聴牌は連荘、親ノーテンは親流れ。どちらも本場 +1', () => {
    expect(afterHand(m0, ended([26000, 26000, 26000, 22000], draw([true, true, true, false])))).toMatchObject({ dealer: 0, honba: 1 });
    expect(afterHand(m0, ended([24000, 26000, 25000, 25000], draw([false, true, false, false])))).toMatchObject({ dealer: 1, roundNumber: 2, honba: 1 });
  });

  it('途中流局は連荘', () => {
    const r: HandResult = { kind: 'draw', reason: 'kyuushu', tenpai: [false, false, false, false], nagashi: [], deltas: [0, 0, 0, 0] };
    expect(afterHand(m0, ended([25000, 25000, 25000, 25000], r))).toMatchObject({ dealer: 0, honba: 1 });
  });

  it('飛び：マイナスで終了、0 点ちょうどは続行', () => {
    expect(afterHand(m0, ended([-100, 40100, 30000, 30000], win([1], false))).endReason).toBe('tobi');
    expect(afterHand(m0, ended([0, 40000, 30000, 30000], win([1], false))).finished).toBe(false);
  });

  const east4: MatchState = { ...m0, dealer: 3, roundNumber: 4 };

  it('東 4 局：子の和了で 30,000 点以上がいれば終了', () => {
    const m = afterHand(east4, ended([31000, 25000, 24000, 20000], win([0], false)));
    expect(m).toMatchObject({ finished: true, endReason: 'target' });
  });

  it('東 4 局：30,000 点以上がいなければ南入', () => {
    const m = afterHand(east4, ended([29000, 25000, 24000, 22000], win([0], false)));
    expect(m).toMatchObject({ finished: false, roundWind: 2, roundNumber: 1, dealer: 0 });
  });

  it('東 4 局：親がトップで 30,000 点以上なら和了り止め・聴牌止め', () => {
    expect(afterHand(east4, ended([25000, 20000, 20000, 35000], win([3], true))).endReason).toBe('agariYame');
    expect(afterHand(east4, ended([25000, 20000, 20000, 35000], draw([false, false, false, true]))).endReason).toBe('tenpaiYame');
    // 親が連荘してもトップでなければ続行
    expect(afterHand(east4, ended([36000, 15000, 15000, 34000], win([3], true)))).toMatchObject({ finished: false, honba: 1, dealer: 3 });
  });

  const south: MatchState = { ...m0, roundWind: 2, roundNumber: 1, dealer: 0 };

  it('南場はサドンデス：30,000 点以上で終了', () => {
    expect(afterHand(south, ended([22000, 31000, 24000, 23000], win([1], false))).endReason).toBe('target');
    expect(afterHand(south, ended([22000, 29000, 25000, 24000], win([1], false)))).toMatchObject({ finished: false, roundNumber: 2 });
  });

  it('南場：ダブロンで親の連荘があれば連荘を優先', () => {
    const m = afterHand(south, ended([31000, 17000, 30000, 22000], win([0, 2], true)));
    expect(m).toMatchObject({ finished: false, dealer: 0, honba: 1 });
  });

  it('南 4 局で終了（西入なし）', () => {
    const m = afterHand({ ...south, roundNumber: 4, dealer: 3 }, ended([26000, 25000, 25000, 24000], win([0], false)));
    expect(m.endReason).toBe('maxRound');
  });

  it('終局時の供託はトップ取り、同点は起家に近い方が上', () => {
    const m = afterHand(east4, ended([30000, 30000, 19000, 19000], win([1], false), 2));
    expect(m.ranking).toEqual([0, 1, 2, 3]);
    expect(m.scores).toEqual([32000, 30000, 19000, 19000]);
    expect(rankingOf([25000, 25000, 25000, 25000], 2)).toEqual([2, 3, 0, 1]);
  });
});

describe('AI 同士で東風戦を最後まで打つ', () => {
  function playMatch(seed: number, levels: AiLevel[]) {
    const rng = seeded(seed);
    let m = newMatch((seed % 4) as Seat);
    let hands = 0;
    while (!m.finished && hands < 40) {
      let h = startMatchHand(m, shuffled(fullTileSet(), rng));
      let steps = 0;
      while (h.phase !== 'ended') {
        if (++steps > 600) throw new Error('hand did not end');
        if (h.phase === 'turn') h = apply(h, decideTurn(h, levels[h.turn], rng));
        else {
          const from = h.phase === 'chankan' ? h.chankanTile!.from : h.lastDiscard!.from;
          const responses = SEATS.filter((x) => x !== from).map((x) => decideResponse(h, x, levels[x], rng));
          h = apply(h, { type: 'respond', responses });
        }
      }
      // 点数の合計は常に 100,000（場の供託を含む）
      expect(h.scores.reduce((a, b) => a + b, 0) + h.riichiSticks * 1000).toBe(100000);
      m = afterHand(m, h);
      hands++;
    }
    return { m, hands };
  }

  it('ふつう × 4、やさしい × 4、混合：すべて終局し、点数の合計が 100,000', () => {
    const results: string[] = [];
    for (let seed = 1; seed <= 24; seed++) {
      const levels: AiLevel[] = seed % 3 === 0 ? ['easy', 'easy', 'easy', 'easy'] : seed % 3 === 1 ? ['normal', 'normal', 'normal', 'normal'] : ['easy', 'normal', 'easy', 'normal'];
      const { m, hands } = playMatch(seed, levels);
      expect(m.finished).toBe(true);
      expect(m.scores.reduce((a, b) => a + b, 0)).toBe(100000);
      results.push(`${m.endReason}:${hands}`);
    }
    expect(results.length).toBe(24);
  }, 120000);
});
