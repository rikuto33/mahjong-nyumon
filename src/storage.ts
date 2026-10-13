import { DEFAULT_LANG, LANGS, type Lang } from './i18n/translate';

export type AiLevel = 'easy' | 'normal';

export type Settings = {
  lang: Lang;
  tileHints: boolean;
  aiLevel: AiLevel;
  gameHints: boolean;
};

export const DEFAULT_SETTINGS: Settings = {
  lang: DEFAULT_LANG,
  tileHints: true,
  aiLevel: 'easy',
  gameHints: true,
};

const SETTINGS_KEY = 'mahjong-nyumon:settings:v1';
const PROGRESS_KEY = 'mahjong-nyumon:progress:v1';

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
  /** クリアした段階の番号（1–10） */
  cleared: number[];
};

export const EMPTY_PROGRESS: Progress = { cleared: [] };

export function loadProgress(store: KV | null = defaultStore()): Progress {
  try {
    const text = store?.getItem(PROGRESS_KEY);
    if (!text) return { cleared: [] };
    const raw = JSON.parse(text) as { cleared?: unknown };
    const cleared = Array.isArray(raw.cleared)
      ? raw.cleared.filter((n): n is number => Number.isInteger(n) && n >= 1 && n <= 10)
      : [];
    return { cleared: [...new Set(cleared)].sort((a, b) => a - b) };
  } catch {
    return { cleared: [] };
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

/** 段階 1 は常に開いている。それ以降は前の段階をクリアすると開く */
export function isStageUnlocked(progress: Progress, stage: number): boolean {
  return stage === 1 || progress.cleared.includes(stage - 1);
}
