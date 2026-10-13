import type { StageId, StagePart } from '../tutorial/stages';

export type Route =
  | { name: 'title' }
  | { name: 'settings' }
  | { name: 'stages' }
  | { name: 'stage'; stage: StageId }
  | { name: 'part'; stage: StageId; part: StagePart }
  | { name: 'table' }
  | { name: 'yakuDex'; back: Route };

export type Navigate = (route: Route) => void;
