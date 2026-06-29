import { create } from 'zustand';

export type Language = 'vi' | 'en';

interface LanguageState {
  language: Language;
  setLanguage: (lang: Language) => void;
}

export const useLanguageStore = create<LanguageState>((set) => {
  // Get default language from localStorage or browser preferences
  const getInitialLanguage = (): Language => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('idle_rpg_lang') as Language;
      if (saved === 'vi' || saved === 'en') return saved;
      
      const locale = navigator.language.toLowerCase();
      if (locale.startsWith('vi')) return 'vi';
    }
    return 'vi'; // default to vi as primary
  };

  return {
    language: getInitialLanguage(),
    setLanguage: (lang) => {
      if (typeof window !== 'undefined') {
        localStorage.setItem('idle_rpg_lang', lang);
      }
      set({ language: lang });
    }
  };
});
