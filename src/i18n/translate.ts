import de from './de.json';
import ja from './ja.json';

export type Lang = 'de' | 'ja';
export const LANGS: readonly Lang[] = ['de', 'ja'];
export const DEFAULT_LANG: Lang = 'de';

type Dict = { [key: string]: string | Dict };

// "a.b.c" 形式のキーを de.json の構造から導出する（ドイツ語が基準）
type Paths<T> = {
  [K in keyof T & string]: T[K] extends string ? K : `${K}.${Paths<T[K]>}`;
}[keyof T & string];

export type MessageKey = Paths<typeof de>;

const dicts: Record<Lang, Dict> = { de, ja };

function lookup(dict: Dict, key: string): string | undefined {
  let node: string | Dict | undefined = dict;
  for (const part of key.split('.')) {
    if (typeof node !== 'object') return undefined;
    node = node[part];
  }
  return typeof node === 'string' ? node : undefined;
}

/** 指定言語にキーがなければドイツ語、それもなければキー自体を返す。{name} を params で置換する。 */
export function translate(
  lang: Lang,
  key: MessageKey,
  params?: Record<string, string | number>,
): string {
  const text = lookup(dicts[lang], key) ?? lookup(dicts[DEFAULT_LANG], key) ?? key;
  if (!params) return text;
  return text.replace(/\{(\w+)\}/g, (m, name: string) =>
    name in params ? String(params[name]) : m,
  );
}

/** その言語（またはドイツ語）にキーがあるか */
export function hasMessage(lang: Lang, key: string): boolean {
  return lookup(dicts[lang], key) !== undefined || lookup(dicts[DEFAULT_LANG], key) !== undefined;
}

/** テスト用：辞書の全キーを列挙する */
export function allKeys(lang: Lang): string[] {
  const out: string[] = [];
  const walk = (node: Dict, prefix: string) => {
    for (const [k, v] of Object.entries(node)) {
      const path = prefix ? `${prefix}.${k}` : k;
      if (typeof v === 'string') out.push(path);
      else walk(v, path);
    }
  };
  walk(dicts[lang], '');
  return out.sort();
}
