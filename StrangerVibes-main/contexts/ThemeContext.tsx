// Powered by OnSpace.AI
import React, { createContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PersonalityType, PersonalityTheme, PERSONALITY_THEMES } from '@/constants/theme';

interface ThemeContextType {
  currentTheme: PersonalityTheme;
  currentPersonality: PersonalityType;
  setTheme: (type: PersonalityType) => void;
}

export const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const DEFAULT_THEME = PERSONALITY_THEMES['joyful'];

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [currentPersonality, setCurrentPersonality] = useState<PersonalityType>('joyful');
  const [currentTheme, setCurrentTheme] = useState<PersonalityTheme>(DEFAULT_THEME);

  useEffect(() => {
    AsyncStorage.getItem('sv_personality').then((stored) => {
      if (stored && PERSONALITY_THEMES[stored as PersonalityType]) {
        const type = stored as PersonalityType;
        setCurrentPersonality(type);
        setCurrentTheme(PERSONALITY_THEMES[type]);
      }
    });
  }, []);

  const setTheme = (type: PersonalityType) => {
    setCurrentPersonality(type);
    setCurrentTheme(PERSONALITY_THEMES[type]);
    AsyncStorage.setItem('sv_personality', type);
  };

  return (
    <ThemeContext.Provider value={{ currentTheme, currentPersonality, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
