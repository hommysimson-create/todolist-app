import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import en from './locales/en.json'
import ko from './locales/ko.json'

const savedLang = localStorage.getItem('lang')

const initLang = savedLang || 'ko'

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    ko: { translation: ko },
  },
  lng: initLang,
  fallbackLng: 'ko',
  interpolation: {
    escapeValue: false,
  },
})

document.documentElement.lang = initLang

i18n.on('languageChanged', (lng) => {
  localStorage.setItem('lang', lng)
  document.documentElement.lang = lng
})

export default i18n
