import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import en from './locales/en.json';
import lt from './locales/lt.json';
import ru from './locales/ru.json';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: { en: { translation: en }, lt: { translation: lt }, ru: { translation: ru } },
    fallbackLng: 'lt',
    supportedLngs: ['lt', 'en', 'ru'],
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: 'pixelforge_lang',
    },
    interpolation: { escapeValue: false },
  });

export default i18n;
