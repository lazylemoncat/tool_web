'use client';

// 前端 i18n 上下文, 负责保存当前语言, 同步 localStorage 与 html lang,
// 并向页面组件提供类型安全的 t(key) 文案查询函数.
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useSyncExternalStore,
  type ReactNode,
} from 'react';
import {
  defaultLocale,
  isLocale,
  messages,
  type Locale,
  type TranslationKey,
} from '@/i18n/messages';

const LANGUAGE_STORAGE_KEY = 'toolweb-language';
const LANGUAGE_CHANGED_EVENT = 'toolweb-language-change';

interface I18nContextValue {
  language: Locale;
  setLanguage: (language: Locale) => void;
  t: (key: TranslationKey) => string;
}

const I18nContext = createContext<I18nContextValue>({
  language: defaultLocale,
  setLanguage: () => {},
  t: (key) => messages[defaultLocale][key],
});

export const useI18n = () => useContext(I18nContext);

function getLanguageSnapshot(): Locale {
  if (typeof window === 'undefined') return defaultLocale;
  const saved = localStorage.getItem(LANGUAGE_STORAGE_KEY);
  return isLocale(saved) ? saved : defaultLocale;
}

function subscribeLanguage(onStoreChange: () => void) {
  if (typeof window === 'undefined') return () => {};

  window.addEventListener('storage', onStoreChange);
  window.addEventListener(LANGUAGE_CHANGED_EVENT, onStoreChange);
  return () => {
    window.removeEventListener('storage', onStoreChange);
    window.removeEventListener(LANGUAGE_CHANGED_EVENT, onStoreChange);
  };
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const language = useSyncExternalStore(
    subscribeLanguage,
    getLanguageSnapshot,
    () => defaultLocale,
  );

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  const setLanguage = useCallback((nextLanguage: Locale) => {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, nextLanguage);
    window.dispatchEvent(new Event(LANGUAGE_CHANGED_EVENT));
  }, []);

  const t = useCallback(
    (key: TranslationKey) => messages[language][key] ?? messages[defaultLocale][key],
    [language],
  );

  return (
    <I18nContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </I18nContext.Provider>
  );
}
