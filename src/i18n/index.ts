import { en } from './en';
import { ml } from './ml';
import { hi } from './hi';

export const translations = {
  en,
  ml,
  hi,
};

export type LanguageCode = keyof typeof translations;
export type TranslationKey = keyof typeof en;
