import type { Script, ScriptStep } from './script';
import type { ExplainSlide } from './types';

/*
 * 段階「考えながら打つ」。4 つのシナリオで、手牌の見方と狙う役の決め方を体験する。
 * どれも自分は席 0（南家）、親は左の席 3。ツモ順は 席3 → 席0 → 席1 → 席2（鳴いたあとは席 1 から）。
 */

export const STRATEGY_SLIDES: ExplainSlide[] = [
  { id: 's1' },
  { id: 's2', rows: ['345m 2467p 3567s 9m 1z'] },
  { id: 's3', rows: ['22m 77p 33s 55z 8s 1m 4z'] },
  { id: 's4', rows: ['22m 66p 44s 99s 77m 1z 3p'] },
  { id: 's5' },
];

const ai = (id?: string): ScriptStep => ({ kind: 'ai', id });
const ais = (n: number, id?: string): ScriptStep[] => Array.from({ length: n }, (_, i) => ai(i === 0 ? id : undefined));

export type ScenarioId = 'tanyao' | 'riichi' | 'toitoi' | 'chiitoitsu';

export const SCENARIOS: Record<ScenarioId, Script & { analysis: 'regular' | 'pairs' }> = {
  // 断幺九：1・9・字牌から切り、チー（喰いタン）で聴牌
  tanyao: {
    analysis: 'regular',
    setup: {
      dealer: 3,
      hands: ['346m2467p356s9m9s1z', null, null, null],
      draws: '2z8p1s7z4z5m1p9p3z4s1m6z3p2z6s',
      dora: '7z',
    },
    steps: [
      { kind: 'info', id: 'start' },
      ai(),
      { kind: 'choose', id: 'h1', tile: '1z', alsoOk: ['9m', '9s'] },
      ...ais(3, 'wait'),
      { kind: 'choose', id: 'h2', tile: '9m', alsoOk: ['9s'] },
      ...ais(3),
      { kind: 'choose', id: 'h3', tile: '9s' },
      ...ais(3),
      { kind: 'call', id: 'chi', call: 'chi' },
      { kind: 'choose', id: 'afterChi', tile: '3m', alsoOk: ['6m', '3s', '6s'] },
      ...ais(2, 'tenpai'),
      { kind: 'ron', id: 'ron' },
      { kind: 'info', id: 'end' },
    ],
    expectYaku: ['tanyao'],
  },
  // 立直：役のない手はポンを見送り、門前で聴牌して立直
  riichi: {
    analysis: 'regular',
    setup: {
      dealer: 3,
      hands: ['1236m178p4599s26z', null, null, null],
      draws: '3z9p1s4m5z3s9s2m1z8m2p3p7s1s7m',
      dora: '7z',
    },
    steps: [
      { kind: 'info', id: 'start' },
      ai(),
      { kind: 'choose', id: 'h1', tile: '6z', alsoOk: ['2z'] },
      ...ais(3, 'wait'),
      { kind: 'choose', id: 'h2', tile: '2z' },
      ai(),
      { kind: 'pass', id: 'passPon' },
      ...ais(2),
      { kind: 'riichi', id: 'riichi', tile: '1p' },
      ...ais(3, 'afterRiichi'),
      { kind: 'discard', id: 'tsumogiri', tile: '1s' },
      ai(),
      { kind: 'ron', id: 'ron' },
      { kind: 'info', id: 'end' },
    ],
    expectYaku: ['riichi'],
  },
  // 役牌＋対々和：対子の多い手。白をポンして役を確保し、刻子を集める
  toitoi: {
    analysis: 'regular',
    setup: {
      dealer: 3,
      hands: ['122m6779p338s55z4z', null, null, null],
      draws: '3z8s5z2s4p1s2m7p6m9m8s',
      dora: '1z',
    },
    steps: [
      { kind: 'info', id: 'start' },
      ai(),
      { kind: 'choose', id: 'h1', tile: '4z', alsoOk: ['1m', '9p', '6p'] },
      ai(),
      { kind: 'call', id: 'pon', call: 'pon' },
      { kind: 'choose', id: 'afterPon', tile: '1m', alsoOk: ['9p', '6p'] },
      ...ais(3, 'wait'),
      { kind: 'choose', id: 'h2', tile: '9p', alsoOk: ['6p'] },
      ai(),
      { kind: 'call', id: 'pon2', call: 'pon' },
      { kind: 'discard', id: 'afterPon2', tile: '6p' },
      ...ais(2, 'tenpai'),
      ai(),
      { kind: 'ron', id: 'ron' },
      { kind: 'info', id: 'end' },
    ],
    expectYaku: ['haku', 'toitoi'],
  },
  // 七対子：対子が 5 つ以上なら七対子。鳴かずに対子を集め、立直して単騎待ち
  chiitoitsu: {
    analysis: 'pairs',
    setup: {
      dealer: 3,
      hands: ['227m3668p44599s1z', null, null, null],
      draws: '3z7m9s1p4z3p2s6s7s1s8p',
      dora: '7z',
    },
    steps: [
      { kind: 'info', id: 'start' },
      ai(),
      { kind: 'choose', id: 'h1', tile: '1z', alsoOk: ['3p', '5s', '8p'] },
      ai(),
      { kind: 'pass', id: 'passPon' },
      ...ais(2, 'wait'),
      { kind: 'riichi', id: 'riichi', tile: '5s' },
      ...ais(3, 'afterRiichi'),
      { kind: 'discard', id: 'tsumogiri', tile: '1s' },
      ai(),
      { kind: 'ron', id: 'ron' },
      { kind: 'info', id: 'end' },
    ],
    expectYaku: ['chiitoitsu', 'riichi'],
  },
};

export const SCENARIO_ORDER: ScenarioId[] = ['tanyao', 'riichi', 'toitoi', 'chiitoitsu'];
