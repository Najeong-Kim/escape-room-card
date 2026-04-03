import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import en from './locales/en'
import ko from './locales/ko'

const saved = localStorage.getItem('escape-room-lang')
const browser = navigator.language.startsWith('ko') ? 'ko' : 'en'

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    ko: { translation: ko },
  },
  lng: saved ?? browser,
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
})

export default i18n
