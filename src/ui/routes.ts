export type Route =
  | { name: 'title' }
  | { name: 'settings' }
  | { name: 'stages' }
  | { name: 'stage'; stage: number }
  | { name: 'explain'; stage: number }
  | { name: 'guided'; stage: number }
  | { name: 'practice'; stage: number }
  | { name: 'table' };

export type Navigate = (route: Route) => void;

/** 実装済みの段階 */
export const IMPLEMENTED_STAGES = [1, 2, 3, 4];
