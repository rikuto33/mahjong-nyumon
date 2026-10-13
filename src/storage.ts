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
