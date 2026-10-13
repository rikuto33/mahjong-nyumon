import { describe, expect, it } from 'vitest';
import { allKeys, translate } from './translate';

describe('i18n', () => {
  it('de と ja のキーが一致する', () => {
    expect(allKeys('ja')).toEqual(allKeys('de'));
  });

  it('空の文字列がない', () => {
    for (const lang of ['de', 'ja'] as const) {
      for (const key of allKeys(lang)) {
        expect(translate(lang, key as never).trim(), `${lang}:${key}`).not.toBe('');
      }
    }
  });

  it('言語ごとに訳を返す', () => {
    expect(translate('de', 'title.settings')).toBe('Einstellungen');
    expect(translate('ja', 'title.settings')).toBe('設定');
  });

  it('存在しないキーはキー自体を返す', () => {
    expect(translate('ja', 'no.such.key' as never)).toBe('no.such.key');
  });
});
