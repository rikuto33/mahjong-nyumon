import { describe, expect, it } from 'vitest';
import { translate } from '../../i18n/translate';
import { tileHint, tileName } from './tileText';

const de = (k: Parameters<typeof translate>[1], p?: Record<string, string | number>) => translate('de', k, p);
const ja = (k: Parameters<typeof translate>[1], p?: Record<string, string | number>) => translate('ja', k, p);

describe('tileHint', () => {
  it('萬子は数字、筒子・索子は表示しない', () => {
    expect(tileHint(de, '3m')).toBe('3');
    expect(tileHint(de, '0m')).toBe('5');
    expect(tileHint(de, '3p')).toBeUndefined();
    expect(tileHint(de, '0s')).toBeUndefined();
  });

  it('字牌は言語ごと', () => {
    expect(['1z', '2z', '3z', '4z'].map((t) => tileHint(de, t as '1z'))).toEqual(['O', 'S', 'W', 'N']);
    expect(['1z', '2z', '3z', '4z'].map((t) => tileHint(ja, t as '1z'))).toEqual(['E', 'S', 'W', 'N']);
    expect(['5z', '6z', '7z'].map((t) => tileHint(de, t as '5z'))).toEqual(['weiß', 'grün', 'rot']);
  });
});

describe('tileName', () => {
  it('名前', () => {
    expect(tileName(de, '7p')).toBe('7 Pinzu');
    expect(tileName(de, '0s')).toBe('Rote 5 Souzu');
    expect(tileName(ja, '7p')).toBe('7筒');
    expect(tileName(ja, '1z')).toBe('東');
  });
});
