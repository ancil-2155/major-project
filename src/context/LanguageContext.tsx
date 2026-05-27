import React, { createContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LanguageCode, translations } from '../i18n';

const LANGUAGE_KEY = 'acams_language_preference';

interface LanguageContextProps {
  language: LanguageCode;
  setLanguage: (lang: LanguageCode) => Promise<void>;
  t: (key: string) => string;
  isReady: boolean;
}

export const LanguageContext = createContext<LanguageContextProps>({
  language: 'en',
  setLanguage: async () => {},
  t: (key: string) => key,
  isReady: false,
});

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguageState] = useState<LanguageCode>('en');
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const loadLanguage = async () => {
      try {
        const savedLang = await AsyncStorage.getItem(LANGUAGE_KEY);
        if (savedLang && (savedLang === 'en' || savedLang === 'ml' || savedLang === 'hi')) {
          setLanguageState(savedLang as LanguageCode);
        }
      } catch (e) {
        console.error('Failed to load language', e);
      } finally {
        setIsReady(true);
      }
    };
    loadLanguage();
  }, []);

  const setLanguage = async (lang: LanguageCode) => {
    try {
      await AsyncStorage.setItem(LANGUAGE_KEY, lang);
      setLanguageState(lang);
    } catch (e) {
      console.error('Failed to save language', e);
    }
  };

  const t = (keyPath: string): string => {
    const keys = keyPath.split('.');
    let current: any = translations[language];
    let fallback: any = translations['en'];

    for (const key of keys) {
      if (current) current = current[key];
      if (fallback) fallback = fallback[key];
    }

    if (current && typeof current === 'string') return current;
    if (fallback && typeof fallback === 'string') return fallback;
    return keyPath; // fallback to key itself if not found
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, isReady }}>
      {children}
    </LanguageContext.Provider>
  );
};
