import { CALLS_SLIDES } from './calls';
import { DORA_SLIDES } from './dora';
import { FINALE_SLIDES } from './finale';
import { FLOW_SLIDES } from './flow';
import { RON_SLIDES } from './ron';
import { STRATEGY_SLIDES } from './strategy';
import { SHAPE_SLIDES } from './shape';
import { SOLO_SLIDES } from './solo';
import { TENPAI_SLIDES } from './tenpai';
import { TILES_SLIDES } from './tiles';
import type { ExplainSlide } from './types';
import { YAKU_SLIDES } from './yaku';

/** 段階の並び（SPEC §6）。段階番号は並び順 + 1 */
export const STAGE_ORDER = [
  'intro',
  'tiles',
  'shape',
  'solo',
  'tenpai',
  'yaku',
  'ron',
  'calls',
  'dora',
  'flow',
  'strategy',
  'finale',
] as const;
export type StageId = (typeof STAGE_ORDER)[number];

export type StagePart = 'explain' | 'guided' | 'practice' | 'play' | 'scenarios';

/** 各段階にある部分。flow は説明を読み終えればクリア、intro は 1 局通せばクリア */
export const STAGE_PARTS: Record<StageId, StagePart[]> = {
  intro: ['play'],
  tiles: ['explain', 'guided', 'practice'],
  shape: ['explain', 'guided', 'practice'],
  solo: ['explain', 'guided', 'practice'],
  tenpai: ['explain', 'guided', 'practice'],
  yaku: ['explain', 'guided', 'practice'],
  ron: ['explain', 'guided', 'practice'],
  calls: ['explain', 'guided', 'practice'],
  dora: ['explain', 'guided', 'practice'],
  flow: ['explain', 'guided'],
  strategy: ['explain', 'scenarios'],
  finale: ['explain', 'guided', 'practice'],
};

/** 説明を読み終えた時点でクリアになる段階 */
export const CLEAR_ON_EXPLAIN: StageId[] = ['flow'];

export const STAGE_SLIDES: Record<StageId, ExplainSlide[]> = {
  intro: [],
  tiles: TILES_SLIDES,
  shape: SHAPE_SLIDES,
  solo: SOLO_SLIDES,
  tenpai: TENPAI_SLIDES,
  yaku: YAKU_SLIDES,
  ron: RON_SLIDES,
  calls: CALLS_SLIDES,
  dora: DORA_SLIDES,
  flow: FLOW_SLIDES,
  strategy: STRATEGY_SLIDES,
  finale: FINALE_SLIDES,
};

/** i18n のキーの先頭（役のレッスンは役名の yaku と分けて yakuLesson） */
export const STAGE_I18N: Record<StageId, string> = {
  intro: 'intro',
  tiles: 'tiles',
  shape: 'shape',
  solo: 'solo',
  tenpai: 'tenpai',
  yaku: 'yakuLesson',
  ron: 'ron',
  calls: 'calls',
  dora: 'dora',
  flow: 'flow',
  strategy: 'strategy',
  finale: 'finale',
};

export const stageNumber = (id: StageId) => STAGE_ORDER.indexOf(id) + 1;
export const isStageId = (x: unknown): x is StageId => STAGE_ORDER.includes(x as StageId);

/** 部分を終えたあとに進む先（同じ段階の次の部分、なければ次の段階の最初の部分、最後なら null） */
export function nextPart(stage: StageId, part: StagePart): { stage: StageId; part: StagePart } | null {
  const parts = STAGE_PARTS[stage];
  const i = parts.indexOf(part);
  if (i >= 0 && i + 1 < parts.length) return { stage, part: parts[i + 1] };
  const s = STAGE_ORDER.indexOf(stage);
  if (s + 1 < STAGE_ORDER.length) {
    const next = STAGE_ORDER[s + 1];
    return { stage: next, part: STAGE_PARTS[next][0] };
  }
  return null;
}
