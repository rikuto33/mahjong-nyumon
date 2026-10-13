import { describe, expect, it } from 'vitest';
import { ankanOptions, callOptions, forbiddenAfterCall, kakanOptions } from './calls';
import { kindOf, parseTiles, type Tile } from './tile';

const P = parseTiles;
const t1 = (s: string) => P(s)[0] as Tile;
const types = (opts: ReturnType<typeof callOptions>) => opts.map((o) => `${o.type}:${o.fromHand.join('')}`);

describe('callOptions', () => {
  it('ポンは誰からでも、チーは上家からだけ', () => {
    const hand = P('45m77p123s456s789s');
    expect(types(callOptions(hand, t1('7p'), { fromLeft: false }))).toEqual(['pon:7p7p']);
    expect(types(callOptions(hand, t1('3m'), { fromLeft: false }))).toEqual([]);
    expect(types(callOptions(hand, t1('3m'), { fromLeft: true }))).toEqual(['chi:4m5m']);
    expect(types(callOptions(hand, t1('6m'), { fromLeft: true }))).toEqual(['chi:4m5m']);
  });

  it('チーの候補が複数（34 と 46 と 67 で 5 を鳴く）', () => {
    const hand = P('3467m11p123s456s99s');
    expect(types(callOptions(hand, t1('5m'), { fromLeft: true }))).toEqual(['chi:3m4m', 'chi:4m6m', 'chi:6m7m']);
  });

  it('赤五の有無で別の候補になる', () => {
    const hand = P('405m11p123s456s99s');
    expect(types(callOptions(hand, t1('6m'), { fromLeft: true }))).toEqual(['chi:4m0m', 'chi:4m5m']);
    expect(types(callOptions(P('505m123p456s789s1z'), t1('5m'), { fromLeft: false }))).toEqual([
      'pon:5m0m',
      'pon:5m5m',
      'minkan:5m0m5m',
    ]);
  });

  it('大明槓は同じ牌 3 枚', () => {
    expect(types(callOptions(P('111z23m456p789s99s'), t1('1z'), { fromLeft: false }))).toEqual([
      'pon:1z1z',
      'minkan:1z1z1z',
    ]);
    expect(callOptions(P('111z23m456p789s99s'), t1('1z'), { fromLeft: false, kanCount: 4 }).map((o) => o.type)).toEqual(['pon']);
  });

  it('立直中・河底牌は鳴けない', () => {
    expect(callOptions(P('45m77p123s456s789s'), t1('7p'), { fromLeft: true, riichi: true })).toEqual([]);
    expect(callOptions(P('45m77p123s456s789s'), t1('7p'), { fromLeft: true, wallRemaining: 0 })).toEqual([]);
  });

  it('喰い替えで切れる牌がなくなる鳴きはできない', () => {
    // 456m で 3m をチー（45 を使う）と残りは 6m だけ。6m は筋の喰い替えで切れないので不可
    expect(types(callOptions(P('456m'), t1('3m'), { fromLeft: true }))).toEqual([]);
    // 4567m なら 7m を切れるので可
    expect(types(callOptions(P('4567m'), t1('3m'), { fromLeft: true }))).toEqual(['chi:4m5m']);
  });
});

describe('forbiddenAfterCall（喰い替え）', () => {
  it('ポンは同じ牌', () => {
    expect(forbiddenAfterCall('pon', P('77p'), t1('7p'))).toEqual([kindOf('7p')]);
  });
  it('両面チーは現物と反対側の筋', () => {
    expect(forbiddenAfterCall('chi', P('45m'), t1('3m')).sort()).toEqual([kindOf('3m'), kindOf('6m')].sort());
    expect(forbiddenAfterCall('chi', P('45m'), t1('6m')).sort()).toEqual([kindOf('3m'), kindOf('6m')].sort());
  });
  it('辺張形の端（12 で 3）は反対側がない', () => {
    expect(forbiddenAfterCall('chi', P('12s'), t1('3s'))).toEqual([kindOf('3s')]);
    expect(forbiddenAfterCall('chi', P('89s'), t1('7s'))).toEqual([kindOf('7s')]);
  });
  it('嵌張チーは現物だけ', () => {
    expect(forbiddenAfterCall('chi', P('46p'), t1('5p'))).toEqual([kindOf('5p')]);
  });
});

describe('ankanOptions / kakanOptions', () => {
  it('4 枚あれば暗槓できる', () => {
    expect(ankanOptions(P('1111z23m456p789s9s'))).toEqual([kindOf('1z')]);
  });

  it('立直中：ツモ牌で 4 枚、待ちが変わらなければ可', () => {
    // 111z 23m 456p 789s 9s（9s 単騎・1m4m…ではなく 23m は 1m4m 待ち）＋ツモ 1z
    const hand = P('111z23m456p789s99s1z');
    expect(ankanOptions(hand, { riichi: true, drawn: t1('1z') })).toEqual([kindOf('1z')]);
  });

  it('立直中の送り槓は不可（ツモ牌以外で 4 枚）', () => {
    const hand = P('1111z23m456p789s9s5m');
    expect(ankanOptions(hand, { riichi: true, drawn: t1('5m') })).toEqual([]);
  });

  it('立直中、槓すると待ちが変わるなら不可', () => {
    // 3335m：3m4m・5m… 待ち。3m を槓すると 5m 単騎だけになる
    const hand = P('3335m456p789s111z3m');
    expect(ankanOptions(hand, { riichi: true, drawn: t1('3m') })).toEqual([]);
  });

  it('加槓：ポンした牌を持っていれば可', () => {
    expect(kakanOptions(P('7p23m456s789s'), [{ type: 'pon', tiles: P('777p') }])).toEqual([kindOf('7p')]);
    expect(kakanOptions(P('7p23m456s789s'), [{ type: 'pon', tiles: P('777p') }], { riichi: true })).toEqual([]);
  });
});
