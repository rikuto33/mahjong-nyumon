import { describe, expect, it } from 'vitest';
import {
  DEFAULT_SETTINGS,
  isStageUnlocked,
  loadProgress,
  loadSettings,
  saveProgress,
  saveSettings,
} from './storage';

function memoryStore() {
  const m = new Map<string, string>();
  return {
    getItem: (k: string) => m.get(k) ?? null,
    setItem: (k: string, v: string) => void m.set(k, v),
  };
}

const throwingStore = {
  getItem: () => {
    throw new Error('denied');
  },
  setItem: () => {
    throw new Error('denied');
  },
};

describe('settings storage', () => {
  it('初期値は ドイツ語・補助表示オン', () => {
    expect(loadSettings(memoryStore())).toEqual(DEFAULT_SETTINGS);
    expect(DEFAULT_SETTINGS.lang).toBe('de');
    expect(DEFAULT_SETTINGS.tileHints).toBe(true);
  });

  it('保存して読み戻せる', () => {
    const store = memoryStore();
    const s = { ...DEFAULT_SETTINGS, lang: 'ja' as const, tileHints: false };
    expect(saveSettings(s, store)).toBe(true);
    expect(loadSettings(store)).toEqual(s);
  });

  it('ストレージが例外を投げても初期値で動く', () => {
    expect(loadSettings(throwingStore)).toEqual(DEFAULT_SETTINGS);
    expect(saveSettings(DEFAULT_SETTINGS, throwingStore)).toBe(false);
    expect(loadSettings(null)).toEqual(DEFAULT_SETTINGS);
    expect(saveSettings(DEFAULT_SETTINGS, null)).toBe(false);
  });

  it('壊れたデータや不正な値は初期値に戻す', () => {
    const store = memoryStore();
    store.setItem('mahjong-nyumon:settings:v1', '{not json');
    expect(loadSettings(store)).toEqual(DEFAULT_SETTINGS);
    store.setItem('mahjong-nyumon:settings:v1', JSON.stringify({ lang: 'fr', tileHints: 'yes' }));
    expect(loadSettings(store)).toEqual(DEFAULT_SETTINGS);
  });
});

describe('progress storage', () => {
  it('初期状態は何もクリアしていない', () => {
    expect(loadProgress(memoryStore())).toEqual({ cleared: [] });
    expect(loadProgress(throwingStore)).toEqual({ cleared: [] });
  });

  it('保存して読み戻せる・不正な値は捨てる・段階順に並ぶ', () => {
    const store = memoryStore();
    expect(saveProgress({ cleared: ['tiles', 'intro'] }, store)).toBe(true);
    expect(loadProgress(store)).toEqual({ cleared: ['intro', 'tiles'] });
    store.setItem('mahjong-nyumon:progress:v2', JSON.stringify({ cleared: ['intro', 'intro', 'x', 3, 'shape'] }));
    expect(loadProgress(store)).toEqual({ cleared: ['intro', 'shape'] });
    expect(saveProgress({ cleared: ['intro'] }, throwingStore)).toBe(false);
  });

  it('段階のロック', () => {
    expect(isStageUnlocked({ cleared: [] }, 'intro')).toBe(true);
    expect(isStageUnlocked({ cleared: [] }, 'tiles')).toBe(false);
    expect(isStageUnlocked({ cleared: ['intro'] }, 'tiles')).toBe(true);
    expect(isStageUnlocked({ cleared: ['intro'] }, 'shape')).toBe(false);
    // 日本語モード（確認用）は全段階が開いている
    expect(isStageUnlocked({ cleared: [] }, 'finale', true)).toBe(true);
  });
});
