/*
 I18nContext — 国际化 Context 别名.
 实际实现在 i18n.tsx, 此处提供 I18nProvider / useI18n 命名导出.
*/

export { LocaleProvider as I18nProvider, useLocale as useI18n } from '../i18n'
export type { Locale } from '../i18n'
