import { CALLS_SLIDES } from './calls';
import { DORA_SLIDES } from './dora';
import { FINALE_SLIDES } from './finale';
import { FLOW_SLIDES } from './flow';
import { RON_SLIDES } from './ron';
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
  'finale',
] as const;
export type StageId = (typeof STAGE_ORDER)[number];

export type StagePart = 'explain' | 'guided' | 'practice' | 'play';

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
  finale: 'finale',
};

export const stageNumber = (id: StageId) => STAGE_ORDER.indexOf(id) + 1;
export const isStageId = (x: unknown): x is StageId => STAGE_ORDER.includes(x as StageId);
