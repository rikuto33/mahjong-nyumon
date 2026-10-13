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
  { id: 's4', rows: ['22m 66p 44s 99s 77m 2z 3p'] },
  { id: 's5' },
];

const ai = (id?: string): ScriptStep => ({ kind: 'ai', id });
const ais = (n: number, id?: string): ScriptStep[] => Array.from({ length: n }, (_, i) => ai(i === 0 ? id : undefined));

export type ScenarioId = 'tanyao' | 'riichi' | 'toitoi' | 'chiitoitsu';

// 判断が同じくらい良い牌はまとめて正解にする（どれを選んでも台本が続くように作ってある）
const TANYAO_OUT = ['1z', '9m', '9s'];
// 西は 1 枚見えていて対子になりにくい。残りの孤立牌（九萬・一筒・北）はどれも対子にしかならず同等
const TOITOI_REST = ['9m', '1p', '4z'];
const CHIITOI_NUMBERS = ['3p', '8p', '5s'];

export const SCENARIOS: Record<ScenarioId, Script & { analysis: 'regular' | 'pairs' }> = {
  // 断幺九：断幺九に使えない牌（九萬・九索・東）を順に切り、チー（喰いタン）で聴牌
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
      { kind: 'choose', id: 'h1', accept: TANYAO_OUT },
      ...ais(3, 'wait'),
      { kind: 'choose', id: 'h2', accept: TANYAO_OUT },
      ...ais(3),
      { kind: 'choose', id: 'h3', accept: TANYAO_OUT },
      ...ais(3),
      { kind: 'call', id: 'chi', call: 'chi' },
      { kind: 'choose', id: 'afterChi', accept: ['3m', '6m', '3s', '6s'] },
      ai('tenpai'),
      { kind: 'ai', feed: 'win' },
      { kind: 'ron', id: 'ron' },
      { kind: 'info', id: 'end' },
    ],
    expectYaku: ['tanyao'],
  },
  // 立直：断幺九も役牌もない手。客風（西・北）から切り、役がなくなるポンは見送り、門前で聴牌して立直
  riichi: {
    analysis: 'regular',
    setup: {
      dealer: 3,
      hands: ['1236m178p4599s34z', null, null, null],
      draws: '5z9p1s4m6z3s9s2m1z8m2p3p7s1s7m',
      dora: '7z',
    },
    steps: [
      { kind: 'info', id: 'start' },
      ai(),
      { kind: 'choose', id: 'h1', accept: ['3z', '4z'], ok: ['1p'] },
      ...ais(3, 'wait'),
      { kind: 'choose', id: 'h2', accept: ['3z', '4z'], ok: ['1p'] },
      ai(),
      { kind: 'pass', id: 'passPon' },
      ...ais(2),
      { kind: 'riichi', id: 'riichi', accept: ['1p'] },
      ...ais(3, 'afterRiichi'),
      { kind: 'tsumogiri', id: 'tsumogiri' },
      { kind: 'ai', feed: 'win' },
      { kind: 'ron', id: 'ron' },
      { kind: 'info', id: 'end' },
    ],
    expectYaku: ['riichi'],
  },
  // 役牌＋対々和：対子の多い手。見えている牌（西）から切り、白をポンして役を確保し、刻子を集める
  toitoi: {
    analysis: 'regular',
    setup: {
      dealer: 3,
      hands: ['229m177p338s3455z', null, null, null],
      draws: '3z8s5z2s4p1s2m7p6m9m8s',
      dora: '1z',
    },
    steps: [
      { kind: 'info', id: 'start' },
      ai(),
      { kind: 'choose', id: 'h1', accept: ['3z'], ok: TOITOI_REST },
      ai(),
      { kind: 'call', id: 'pon', call: 'pon' },
      { kind: 'choose', id: 'afterPon', accept: TOITOI_REST },
      ...ais(3, 'wait'),
      { kind: 'choose', id: 'h2', accept: TOITOI_REST },
      ai(),
      { kind: 'call', id: 'pon2', call: 'pon' },
      { kind: 'choose', id: 'afterPon2', accept: TOITOI_REST },
      ...ais(2, 'tenpai'),
      { kind: 'ai', feed: 'win' },
      { kind: 'ron', id: 'ron' },
      { kind: 'info', id: 'end' },
    ],
    expectYaku: ['haku', 'toitoi'],
  },
  // 七対子：対子が 5 つになったら七対子。単騎待ちに向く字牌を残して数牌の孤立牌から切る。ポンは見送り、6 つ目の対子で立直
  chiitoitsu: {
    analysis: 'pairs',
    setup: {
      dealer: 3,
      hands: ['227m3668p44599s2z', null, null, null],
      draws: '3z7m9s1p4z2m2s6s7s1s8p',
      dora: '7z',
    },
    steps: [
      { kind: 'info', id: 'start' },
      ai(),
      // どの孤立牌も対子になりやすさは同じ。最後の単騎待ちに向く南（他家には役にならないので切られやすい）を残すのが狙いに基づく判断
      { kind: 'choose', id: 'h1', accept: CHIITOI_NUMBERS, ok: ['2z'], override: true },
      ai(),
      { kind: 'pass', id: 'passPon' },
      ai('wait'),
      { kind: 'ai', feed: 'pairForMe' },
      { kind: 'riichi', id: 'riichi', accept: CHIITOI_NUMBERS, ok: ['2z'], override: true },
      ...ais(3, 'afterRiichi'),
      { kind: 'tsumogiri', id: 'tsumogiri' },
      { kind: 'ai', feed: 'win' },
      { kind: 'ron', id: 'ron' },
      { kind: 'info', id: 'end' },
    ],
    expectYaku: ['chiitoitsu', 'riichi'],
  },
};

export const SCENARIO_ORDER: ScenarioId[] = ['tanyao', 'riichi', 'toitoi', 'chiitoitsu'];
