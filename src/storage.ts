import { DEFAULT_LANG, LANGS, type Lang } from './i18n/translate';
import { isStageId, STAGE_ORDER, type StageId } from './tutorial/stages';

export type AiLevel = 'easy' | 'normal';

export type Settings = {
  lang: Lang;
  tileHints: boolean;
  aiLevel: AiLevel;
  gameHints: boolean;
  sound: boolean;
};

export const DEFAULT_SETTINGS: Settings = {
  lang: DEFAULT_LANG,
  tileHints: true,
  aiLevel: 'easy',
  gameHints: true,
  sound: true,
};

const SETTINGS_KEY = 'mahjong-nyumon:settings:v1';
// v2：段階を ID で保存（段階の構成を変えたので v1 は使わない）
const PROGRESS_KEY = 'mahjong-nyumon:progress:v2';

type KV = Pick<Storage, 'getItem' | 'setItem'>;

// Safari のプライベートモード等では localStorage へのアクセス自体が例外を投げる
function defaultStore(): KV | null {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
}

function sanitize(raw: unknown): Settings {
  const s = { ...DEFAULT_SETTINGS };
  if (typeof raw !== 'object' || raw === null) return s;
  const r = raw as Record<string, unknown>;
  if (LANGS.includes(r.lang as Lang)) s.lang = r.lang as Lang;
  if (typeof r.tileHints === 'boolean') s.tileHints = r.tileHints;
  if (r.aiLevel === 'easy' || r.aiLevel === 'normal') s.aiLevel = r.aiLevel;
  if (typeof r.gameHints === 'boolean') s.gameHints = r.gameHints;
  if (typeof r.sound === 'boolean') s.sound = r.sound;
  return s;
}

export function loadSettings(store: KV | null = defaultStore()): Settings {
  try {
    const text = store?.getItem(SETTINGS_KEY);
    return text ? sanitize(JSON.parse(text)) : { ...DEFAULT_SETTINGS };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

/** 保存できたら true */
export function saveSettings(settings: Settings, store: KV | null = defaultStore()): boolean {
  try {
    if (!store) return false;
    store.setItem(SETTINGS_KEY, JSON.stringify(settings));
    return true;
  } catch {
    return false;
  }
}

export type Progress = {
  /** クリアした段階 */
  cleared: StageId[];
  /** 「考えながら打つ」で終えたシナリオ */
  scenarios?: string[];
};

export const EMPTY_PROGRESS: Progress = { cleared: [], scenarios: [] };

export function loadProgress(store: KV | null = defaultStore()): Progress {
  try {
    const text = store?.getItem(PROGRESS_KEY);
    if (!text) return { cleared: [], scenarios: [] };
    const raw = JSON.parse(text) as { cleared?: unknown; scenarios?: unknown };
    const cleared = Array.isArray(raw.cleared) ? raw.cleared.filter(isStageId) : [];
    const scenarios = Array.isArray(raw.scenarios) ? raw.scenarios.filter((x): x is string => typeof x === 'string') : [];
    return { cleared: STAGE_ORDER.filter((id) => cleared.includes(id)), scenarios: [...new Set(scenarios)] };
  } catch {
    return { cleared: [], scenarios: [] };
  }
}

export function saveProgress(progress: Progress, store: KV | null = defaultStore()): boolean {
  try {
    if (!store) return false;
    store.setItem(PROGRESS_KEY, JSON.stringify(progress));
    return true;
  } catch {
    return false;
  }
}

/**
 * 最初の段階は常に開いている。それ以降は前の段階をクリアすると開く。
 * 日本語モードは Rikuto の確認用なので、全段階を最初から開く（allUnlocked）。
 */
export function isStageUnlocked(progress: Progress, stage: StageId, allUnlocked = false): boolean {
  if (allUnlocked) return true;
  const i = STAGE_ORDER.indexOf(stage);
  return i === 0 || progress.cleared.includes(STAGE_ORDER[i - 1]);
}
