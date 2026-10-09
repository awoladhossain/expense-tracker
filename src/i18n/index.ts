/**
 * Expense Tracker — i18n index
 */

import en from './en';
import bn from './bn';

export type Language = 'en' | 'bn';

const translations = { en, bn } as const;

export function getTranslations(lang: Language) {
  return translations[lang] ?? translations.en;
}

export { en, bn };
export default translations;
