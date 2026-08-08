import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, lightColors } from '../constants/colors';

type ThemeMode = 'dark' | 'light' | 'system';

interface ThemeStore {
  mode: ThemeMode;
  colors: typeof colors;
  isDark: boolean;
  setMode: (mode: ThemeMode) => void;
  loadTheme: () => Promise<void>;
}

export const useThemeStore = create<ThemeStore>((set, get) => ({
  mode: 'dark',
  colors: colors,
  isDark: true,

  setMode: async (mode: ThemeMode) => {
    const isDark = mode === 'dark' || mode === 'system';
    set({
      mode,
      isDark,
      colors: isDark ? colors : lightColors,
    });
    await AsyncStorage.setItem('themeMode', mode);
  },

  loadTheme: async () => {
    try {
      const saved = await AsyncStorage.getItem('themeMode');
      if (saved) {
        const mode = saved as ThemeMode;
        const isDark = mode === 'dark' || mode === 'system';
        set({
          mode,
          isDark,
          colors: isDark ? colors : lightColors,
        });
      }
    } catch (e) {
      console.log('Load theme error:', e);
    }
  },
}));