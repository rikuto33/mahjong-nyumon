import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { hasMessage, translate, type Lang, type MessageKey } from './translate';

type I18n = {
  lang: Lang;
  t: (key: MessageKey, params?: Record<string, string | number>) => string;
  /** 任意のキー（説明の「つまり」など、ない場合がある文字列）があるか */
  has: (key: string) => boolean;
};

const I18nContext = createContext<I18n | null>(null);

export function I18nProvider({ lang, children }: { lang: Lang; children: ReactNode }) {
  const value = useMemo<I18n>(
    () => ({ lang, t: (key, params) => translate(lang, key, params), has: (key) => hasMessage(lang, key) }),
    [lang],
  );
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18n {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used inside I18nProvider');
  return ctx;
}
