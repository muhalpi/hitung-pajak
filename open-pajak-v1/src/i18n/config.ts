import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

import en from './locales/en/common.json'
import id from './locales/id/common.json'
import ja from './locales/ja/common.json'
import ko from './locales/ko/common.json'
import nl from './locales/nl/common.json'
import zhTW from './locales/zh-TW/common.json'
import zh from './locales/zh/common.json'

const resources = {
  en: { translation: en },
  id: { translation: id },
  ja: { translation: ja },
  ko: { translation: ko },
  nl: { translation: nl },
  zh: { translation: zh },
  'zh-TW': { translation: zhTW },
} as const

export type LocaleCode = keyof typeof resources

export const availableLocales: Array<{
  code: LocaleCode
  label: string
  emoji: string
}> = [
  { code: 'id', label: 'Indonesia', emoji: '🇮🇩' },
  { code: 'en', label: 'English', emoji: '🇺🇸' },
  { code: 'ja', label: '日本語', emoji: '🇯🇵' },
  { code: 'ko', label: '한국어', emoji: '🇰🇷' },
  { code: 'nl', label: 'Nederlands', emoji: '🇳🇱' },
  { code: 'zh', label: '简体中文', emoji: '🇨🇳' },
  { code: 'zh-TW', label: '繁體中文', emoji: '🇹🇼' },
]

const fallbackLng: LocaleCode = 'id'

const hasLocale = (locale: string): locale is LocaleCode => locale in resources

const detectLocale = (): LocaleCode => {
  const stored =
    typeof window !== 'undefined' ? window.localStorage.getItem('locale') : null
  if (stored && hasLocale(stored)) {
    return stored
  }

  if (typeof window === 'undefined') {
    return fallbackLng
  }

  const navigatorLocale = window.navigator.language
  if (hasLocale(navigatorLocale)) {
    return navigatorLocale
  }

  const languageOnly = navigatorLocale.split('-')[0]
  return hasLocale(languageOnly) ? languageOnly : fallbackLng
}

i18n.use(initReactI18next).init({
  resources,
  lng: detectLocale(),
  fallbackLng,
  interpolation: {
    escapeValue: false,
  },
  react: {
    useSuspense: false,
  },
})

export function changeLocale(locale: string) {
  if (!hasLocale(locale)) {
    return
  }

  i18n.changeLanguage(locale)
  if (typeof window !== 'undefined') {
    window.localStorage.setItem('locale', locale)
  }
}

export default i18n
