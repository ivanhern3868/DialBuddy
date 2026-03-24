/**
 * Internationalization (i18n) Configuration for DialBuddy
 *
 * Business Purpose:
 * Enables app to work in any language/country. Critical for global reach
 * and ensures emergency numbers/dispatcher greetings are localized correctly.
 *
 * Languages Supported (Phase 1):
 * - English (en) - US, Canada, UK, Australia, etc.
 * - Spanish (es) - Mexico, Central/South America, Spain
 * - Portuguese (pt-BR) - Brazil
 *
 * How It Works:
 * 1. Device locale detected via expo-localization
 * 2. Matching translation file loaded (en.json, es.json, pt-BR.json)
 * 3. All UI strings rendered in correct language
 * 4. TTS (text-to-speech) uses correct language code
 *
 * Why i18next:
 * Industry standard for React/React Native. Supports interpolation,
 * pluralization, and nested translation keys.
 */

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { getLocales } from 'expo-localization';

// Import translation files
import en from './locales/en.json';
import es from './locales/es.json';
import ptBR from './locales/pt-BR.json';

// Detect device language
const deviceLocale = getLocales()[0];
const deviceLanguageCode = deviceLocale?.languageCode || 'en';

// Map device language to our supported languages
// Business Rule: Default to English if language not supported
const getInitialLanguage = () => {
  if (deviceLanguageCode === 'es') return 'es';
  if (deviceLanguageCode === 'pt') return 'pt-BR';
  return 'en'; // Default
};

i18n
  .use(initReactI18next)
  .init({
    compatibilityJSON: 'v4', // React Native compatibility
    resources: {
      en: { translation: en },
      es: { translation: es },
      'pt-BR': { translation: ptBR },
    },
    lng: getInitialLanguage(),
    fallbackLng: 'en', // If translation missing, use English
    interpolation: {
      escapeValue: false, // React already escapes
    },
  });

export default i18n;
