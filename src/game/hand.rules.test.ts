import { describe, expect, it } from 'vitest';
import { parseTiles, type Tile } from '../engine/tile';
import { apply, responseOptions, startHand, type HandState, type Response, type Seat } from './hand';
import { makeTiles } from './arrange';

const t1 = (s: string) => parseTiles(s)[0] as Tile;
const others = (s: HandState) =>
  ([0, 1, 2, 3] as Seat[]).filter((x) => x !== s.lastDiscard?.from && x !== s.chankanTile?.from);
const passAll = (s: HandState): Response[] => others(s).map((seat) => ({ seat, action: 'pass' as const }));
function start(hands: (string | null)[], draws: string, dealer: Seat = 0, dora = '1s') {
  return startHand({
    roundWind: 1,
    roundNumber: 1,
    dealer,
    honba: 0,
    riichiSticks: 0,
    scores: [25000, 25000, 25000, 25000],
    tiles: makeTiles({ dealer, hands, draws, dora }),
  });
}
function discardAndPass(s: HandState, tile: Tile, riichi = false): HandState {
  s = apply(s, { type: 'discard', tile, riichi });
  return s.phase === 'respond' ? apply(s, { type: 'respond', responses: passAll(s) }) : s;
}
function pon(s: HandState, seat: Seat): HandState {
  const option = responseOptions(s, seat).calls.find((c) => c.type === 'pon')!;
  return apply(s, {
    type: 'respond',
    responses: others(s).map((x) => (x === seat ? { seat, action: 'call' as const, option } : { seat: x, action: 'pass' as const })),
  });
}

describe('責任払い（パオ）', () => {
  it('大三元の 3 種目をポンさせた人がツモの全額を払う', () => {
    let s = start(['567z', '556677z234m99s1p2p', null, null], '1z2z3z4z1z2z3z4z2z3z9s');
    s = apply(s, { type: 'discard', tile: t1('5z') });
    s = pon(s, 1);
    s = discardAndPass(s, t1('1p'));
    s = discardAndPass(s, s.players[2].drawn!);
    s = discardAndPass(s, s.players[3].drawn!);
    s = apply(s, { type: 'discard', tile: t1('6z') });
    s = pon(s, 1);
    s = discardAndPass(s, t1('2p'));
    s = discardAndPass(s, s.players[2].drawn!);
    s = discardAndPass(s, s.players[3].drawn!);
    s = apply(s, { type: 'discard', tile: t1('7z') });
    s = pon(s, 1);
    expect(s.pao[1]).toEqual({ yaku: 'daisangen', liable: 0 });
    s = discardAndPass(s, t1('9s'));
    s = discardAndPass(s, s.players[2].drawn!);
    s = discardAndPass(s, s.players[3].drawn!);
    s = discardAndPass(s, s.players[0].drawn!);
    expect(s.players[1].drawn).toBe('9s');
    s = apply(s, { type: 'tsumo' });
    expect(s.result?.kind).toBe('win');
    if (s.result?.kind === 'win') {
      expect(s.result.wins[0].result.yaku.map((y) => y.id)).toEqual(['daisangen']);
      expect(s.result.wins[0].pao).toBe(0);
    }
    expect(s.result?.deltas).toEqual([-32000, 32000, 0, 0]);
  });
});

describe('流し満貫', () => {
  it('捨て牌がすべて么九牌で鳴かれていなければ、流局時に満貫（子：親 4,000・子 2,000）', () => {
    // 席 2 のツモだけ么九牌、ほかの席は中張牌。全員ツモ切り
    const yaochu = parseTiles('19m19p19s1234567z19m19p19s1234567z');
    const simples = parseTiles('2345678m2345678p2345678s2345678m2345678p2345678s2345678m2345678p');
    let draws = '';
    let yi = 0;
    let si = 0;
    for (let i = 0; i < 69; i++) draws += i % 4 === 2 ? yaochu[yi++] : simples[si++];
    let s = start([null, null, null, null], draws);
    let guard = 0;
    while (s.phase !== 'ended' && guard++ < 200) s = discardAndPass(s, s.players[s.turn].drawn!);
    expect(s.result).toMatchObject({ kind: 'draw', reason: 'exhaustive', nagashi: [2] });
    expect(s.result?.deltas).toEqual([-4000, -2000, 8000, -2000]);
  });
});

describe('四家立直', () => {
  it('4 人目の立直が通ったら途中流局（供託は場に残る）', () => {
    const hands = ['123m456m789m11z23p', '123p456p789p22z34s', '123s456s789s33z45m', '111m999m111s999s4z'];
    let s = start(hands, '5z6z7z5z', 0, '6p');
    for (let i = 0; i < 4; i++) s = discardAndPass(s, s.players[s.turn].drawn!, true);
    expect(s.result).toMatchObject({ kind: 'draw', reason: 'suucha' });
    expect(s.riichiSticks).toBe(4);
    expect(s.scores).toEqual([24000, 24000, 24000, 24000]);
  });
});
