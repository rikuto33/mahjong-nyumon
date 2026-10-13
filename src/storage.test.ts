import { describe, expect, it } from 'vitest';
import { DEFAULT_SETTINGS, loadSettings, saveSettings } from './storage';

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
