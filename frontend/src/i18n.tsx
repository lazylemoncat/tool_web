/*
 国际化系统: 基于 JSON 文件的懒加载 i18n。
 添加新语言: 复制 en.json 为 <lang>.json 并翻译值即可。
*/

import React, { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { registerI18n } from './runtime/themeBridge'

export type Locale = 'zh' | 'en'

type Translations = Record<string, string>

interface LocaleContextType {
  locale: Locale
  setLocale: (l: Locale) => void
  t: (key: string, vars?: Record<string, string | number>) => string
}

const LocaleContext = createContext<LocaleContextType>({
  locale: 'zh',
  setLocale: () => {},
  t: (key) => key,
})

const cache: Record<string, Translations> = {}

function flatten(obj: Record<string, unknown>, prefix = ''): Translations {
  const result: Translations = {}
  for (const [k, v] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${k}` : k
    if (typeof v === 'object' && v !== null && !Array.isArray(v)) {
      Object.assign(result, flatten(v as Record<string, unknown>, fullKey))
    } else {
      result[fullKey] = String(v)
    }
  }
  return result
}

async function loadLocale(locale: Locale): Promise<Translations> {
  if (cache[locale]) return cache[locale]
  const mod = await import(`./locales/${locale}.json`)
  cache[locale] = flatten(mod.default)
  return cache[locale]
}

function interpolate(template: string, vars?: Record<string, string | number>): string {
  if (!vars) return template
  return template.replace(/\{(\w+)\}/g, (_, key) => String(vars[key] ?? `{${key}}`))
}

export function LocaleProvider({ children, initial }: { children: ReactNode; initial: Locale }) {
  const [locale, setLocale] = useState<Locale>(initial)
  const [messages, setMessages] = useState<Translations>({})

  useEffect(() => {
    loadLocale(locale).then(setMessages)
    document.documentElement.lang = locale === 'zh' ? 'zh-CN' : 'en'
  }, [locale])

  const t = (key: string, vars?: Record<string, string | number>) => {
    const template = messages[key]
    if (template === undefined) {
      // Fallback: if key is in old `t('zh', 'en')` format, return first arg as key
      return key
    }
    return interpolate(template, vars)
  }

  useEffect(() => {
    registerI18n({ locale, t })
  }, [locale, messages])

  return (
    <LocaleContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </LocaleContext.Provider>
  )
}

export function useLocale() {
  return useContext(LocaleContext)
}
