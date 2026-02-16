import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from '../../locales/en.json';
import lt from '../../locales/lt.json';
import ru from '../../locales/ru.json';

i18n
  .use(initReactI18next)
  .init({
    lng: 'en',
    fallbackLng: 'en',
    resources: {
      en: { translation: en },
      lt: { translation: lt },
      ru: { translation: ru }
    },
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
