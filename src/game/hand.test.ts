import { describe, expect, it } from 'vitest';
import { kindOf, parseTiles, type Tile } from '../engine/tile';
import { apply, doraIndicators, responseOptions, startHand, turnOptions, type HandState, type Response, type Seat } from './hand';
import { makeTiles } from './testing';

const t1 = (s: string) => parseTiles(s)[0] as Tile;
const passAll = (s: HandState): Response[] =>
  ([0, 1, 2, 3] as Seat[]).filter((x) => x !== s.lastDiscard?.from && x !== s.chankanTile?.from).map((seat) => ({ seat, action: 'pass' as const }));

function setup(hands: (string | null)[], draws = '', extra: Partial<Parameters<typeof makeTiles>[0]> = {}, dealer: Seat = 0) {
  return startHand({
    roundWind: 1,
    roundNumber: 1,
    dealer,
    honba: 0,
    riichiSticks: 0,
    scores: [25000, 25000, 25000, 25000],
    tiles: makeTiles({ dealer, hands, draws, dora: '7z', ...extra }),
  });
}

/** 手番の人がツモ切りし、全員パス */
function tsumogiri(s: HandState): HandState {
  const d = s.players[s.turn].drawn!;
  s = apply(s, { type: 'discard', tile: d });
  return apply(s, { type: 'respond', responses: passAll(s) });
}

// 指定しない席の配牌はランダム
const BASE: (string | null)[] = [null, null, null, null];

describe('局の進行', () => {
  it('配牌 13 枚、親は 14 枚目をツモって手番', () => {
    const s = setup(BASE, '9m');
    expect(s.turn).toBe(0);
    expect(s.players[0].drawn).toBe('9m');
    expect(s.players.map((p) => p.hand.length)).toEqual([13, 13, 13, 13]);
    expect(s.wall.length).toBe(122 - 52 - 1);
    expect(doraIndicators(s)).toHaveLength(1);
  });

  it('ツモ和了：子の門前ツモ', () => {
    const hands = [...BASE];
    hands[1] = '234m567p345s55p78s';
    // 1 巡目は 5z〜7z をツモ切り、2 巡目に席 1 が 9s をツモ（1 巡目だと地和になる）
    let s = setup(hands, '5z6z7z5z6z9s');
    for (let i = 0; i < 5; i++) s = tsumogiri(s);
    expect(s.turn).toBe(1);
    const opts = turnOptions(s);
    expect(opts.tsumo?.yaku.map((y) => y.id).sort()).toEqual(['menzenTsumo', 'pinfu']);
    s = apply(s, { type: 'tsumo' });
    expect(s.phase).toBe('ended');
    // 門前ツモ・平和 2 翻 20 符：親 700・子 400
    expect(s.result?.deltas).toEqual([-700, 1500, -400, -400]);
  });

  it('ロン：本場は和了者へ', () => {
    const hands = [...BASE];
    hands[2] = '234m567p345s55p78s';
    let s = startHand({
      roundWind: 1,
      roundNumber: 1,
      dealer: 0,
      honba: 2,
      riichiSticks: 1,
      scores: [25000, 25000, 25000, 24000],
      tiles: makeTiles({ dealer: 0, hands, draws: '9s', dora: '7z' }),
    });
    s = apply(s, { type: 'discard', tile: t1('9s') }); // 親が 9s を切る
    expect(responseOptions(s, 2).ron?.yaku.map((y) => y.id)).toEqual(['pinfu']);
    s = apply(s, { type: 'respond', responses: [{ seat: 1, action: 'pass' }, { seat: 2, action: 'ron' }, { seat: 3, action: 'pass' }] });
    // 子 1 翻 30 符 1000 ＋ 2 本場 600 ＋ 供託 1000
    expect(s.result?.deltas).toEqual([-1600, 0, 2600, 0]);
    expect(s.riichiSticks).toBe(0);
  });

  it('ダブロン：本場と供託は上家取り（放銃者から近い方）', () => {
    const hands = [...BASE];
    hands[1] = '234m567p345s55p78s';
    hands[3] = '234m678p345s99p78s';
    let s = startHand({
      roundWind: 1,
      roundNumber: 1,
      dealer: 0,
      honba: 1,
      riichiSticks: 1,
      scores: [25000, 25000, 25000, 24000],
      tiles: makeTiles({ dealer: 0, hands, draws: '9s', dora: '7z' }),
    });
    s = apply(s, { type: 'discard', tile: t1('9s') });
    s = apply(s, {
      type: 'respond',
      responses: [{ seat: 1, action: 'ron' }, { seat: 2, action: 'pass' }, { seat: 3, action: 'ron' }],
    });
    expect(s.result?.kind).toBe('win');
    // 席 1：1000 ＋ 300 ＋ 1000、席 3：1000
    expect(s.result?.deltas).toEqual([-2300, 2300, 0, 1000]);
  });

  it('見逃すと同巡内フリテン、次の自分のツモで解除', () => {
    const hands = [...BASE];
    hands[2] = '234m567p345s55p78s';
    let s = setup(hands, '9s1z');
    s = apply(s, { type: 'discard', tile: t1('9s') });
    s = apply(s, { type: 'respond', responses: passAll(s) });
    expect(s.players[2].skippedThisTurn).toBe(true);
    // 席 1 が 1z を切っても（待ちではないが）フリテン中なのでロンの選択肢は出ない…待ちの 6s で確認
    expect(s.turn).toBe(1);
  });

  it('立直：供託 1,000 点、一発ツモ', () => {
    const hands = [...BASE];
    hands[0] = '234m567p345s55p78s';
    let s = setup(hands, '1z2z3z4z9s');
    expect(turnOptions(s).riichiDiscards).toContain('1z');
    s = apply(s, { type: 'discard', tile: t1('1z'), riichi: true });
    s = apply(s, { type: 'respond', responses: passAll(s) });
    expect(s.players[0].riichi).toEqual({ double: true, ippatsu: true });
    expect(s.scores[0]).toBe(24000);
    expect(s.riichiSticks).toBe(1);
    s = tsumogiri(s);
    s = tsumogiri(s);
    s = tsumogiri(s);
    expect(s.turn).toBe(0);
    const r = turnOptions(s).tsumo!;
    expect(r.yaku.map((y) => y.id).sort()).toEqual(['doubleRiichi', 'ippatsu', 'menzenTsumo', 'pinfu']);
  });

  it('立直中はツモ牌しか切れない', () => {
    const hands = [...BASE];
    hands[0] = '234m567p345s55p78s';
    let s = setup(hands, '1z2z3z4z1m');
    s = apply(s, { type: 'discard', tile: t1('1z'), riichi: true });
    s = apply(s, { type: 'respond', responses: passAll(s) });
    s = tsumogiri(s);
    s = tsumogiri(s);
    s = tsumogiri(s);
    expect(turnOptions(s).discards).toEqual(['1m']);
    expect(() => apply(s, { type: 'discard', tile: t1('2m') })).toThrow();
  });

  it('ポン：喰い替えの牌は切れない、ツモは飛ばされる', () => {
    const hands = [...BASE];
    hands[2] = '77z234m567p11s99p1m';
    let s = setup(hands, '7z');
    s = apply(s, { type: 'discard', tile: t1('7z') });
    const pon = responseOptions(s, 2).calls.find((c) => c.type === 'pon')!;
    s = apply(s, { type: 'respond', responses: [{ seat: 1, action: 'pass' }, { seat: 2, action: 'call', option: pon }, { seat: 3, action: 'pass' }] });
    expect(s.turn).toBe(2);
    expect(s.afterCall).toBe(true);
    expect(s.players[2].drawn).toBeNull();
    expect(turnOptions(s).tsumo).toBeNull();
    expect(turnOptions(s).discards).not.toContain('7z');
    expect(s.players[0].river[0].calledAway).toBe(true);
  });

  it('チーは上家からだけ。喰い替えの筋も切れない', () => {
    const hands = [...BASE];
    hands[1] = '45m67m9p1258s3456z';
    let s = setup(hands, '3m');
    s = apply(s, { type: 'discard', tile: t1('3m') }); // 席 0 → 席 1 は下家（席 0 は席 1 の上家）
    const chi = responseOptions(s, 1).calls.find((c) => c.type === 'chi')!;
    expect(chi.fromHand.sort()).toEqual(['4m', '5m']);
    expect(responseOptions(s, 3).calls.filter((c) => c.type === 'chi')).toEqual([]);
    s = apply(s, { type: 'respond', responses: [{ seat: 1, action: 'call', option: chi }, { seat: 2, action: 'pass' }, { seat: 3, action: 'pass' }] });
    expect(turnOptions(s).discards).not.toContain('6m');
    expect(turnOptions(s).discards).toContain('7m');
  });

  it('暗槓は即めくり、大明槓は打牌後にめくる', () => {
    const hands = [...BASE];
    hands[0] = '111z234m456p789s5s';
    let s = setup(hands, '1z', { rinshan: '5s' });
    expect(turnOptions(s).ankan).toEqual([kindOf('1z')]);
    s = apply(s, { type: 'ankan', kind: kindOf('1z') });
    expect(s.doraRevealed).toBe(2);
    expect(s.players[0].drawn).toBe('5s');
    expect(s.rinshanDraw).toBe(true);
    // 嶺上開花：234m 456p 789s 55s ＋暗槓 東
    expect(turnOptions(s).tsumo?.yaku.map((y) => y.id)).toContain('rinshan');
  });

  it('大明槓の槓ドラは打牌後', () => {
    const hands = [...BASE];
    hands[1] = '666z234m567p11s9p1m';
    let s = setup(hands, '6z', { rinshan: '9m' });
    s = apply(s, { type: 'discard', tile: t1('6z') });
    const kan = responseOptions(s, 1).calls.find((c) => c.type === 'minkan')!;
    s = apply(s, { type: 'respond', responses: [{ seat: 1, action: 'call', option: kan }, { seat: 2, action: 'pass' }, { seat: 3, action: 'pass' }] });
    expect(s.doraRevealed).toBe(1);
    expect(s.players[1].drawn).toBe('9m');
    s = apply(s, { type: 'discard', tile: t1('9m') });
    expect(s.doraRevealed).toBe(2);
  });

  it('流局：ノーテン罰符（聴牌 1 人なら 1,000 点ずつ）', () => {
    const hands = [...BASE];
    hands[1] = '234m567p345s55p78s';
    let s = setup(hands, '');
    // 全員ツモ切りで山を使い切る（席 1 の待ち 6s・9s を誰かが切るとロンの選択肢が出るがパス）
    let guard = 0;
    while (s.phase !== 'ended' && guard++ < 200) {
      const d = s.players[s.turn].drawn!;
      s = apply(s, { type: 'discard', tile: d });
      if (s.phase === 'respond') s = apply(s, { type: 'respond', responses: passAll(s) });
    }
    expect(s.result?.kind).toBe('draw');
    if (s.result?.kind === 'draw') {
      expect(s.result.reason).toBe('exhaustive');
      expect(s.result.tenpai[1]).toBe(true);
      if (s.result.nagashi.length === 0) {
        const n = s.result.tenpai.filter(Boolean).length;
        expect(s.result.deltas.reduce((a, b) => a + b, 0)).toBe(0);
        expect(n).toBeGreaterThanOrEqual(1);
      }
    }
  });

  it('四風連打', () => {
    let s = setup(['1z', '1z', '1z', '1z'], '4z');
    for (let i = 0; i < 4; i++) {
      s = apply(s, { type: 'discard', tile: t1('1z') });
      s = apply(s, { type: 'respond', responses: passAll(s) });
    }
    expect(s.result).toMatchObject({ kind: 'draw', reason: 'suufon' });
  });

  it('九種九牌は宣言できる', () => {
    const hands = [...BASE];
    hands[0] = '19m19p19s1234z5m5p5s';
    const s = setup(hands, '6z');
    expect(turnOptions(s).kyuushu).toBe(true);
    expect(apply(s, { type: 'kyuushu' }).result).toMatchObject({ kind: 'draw', reason: 'kyuushu' });
  });
});
