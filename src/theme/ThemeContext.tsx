import React, { createContext, useContext, useState, useMemo, useCallback, useEffect } from 'react';
import { useColorScheme, AppState } from 'react-native';
import { AppTheme, lightTheme, darkTheme, goldenTheme, ThemeMode } from './theme';
import { DateService } from '../services/dateService';

export interface ThemeContextValue {
  theme: AppTheme;
  mode: ThemeMode;
  isDark: boolean;
  isGolden: boolean;
  setMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;
  devForceGolden: boolean;
  setDevForceGolden: (force: boolean) => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export interface ThemeProviderProps {
  children: React.ReactNode;
  initialMode?: ThemeMode;
  userDob?: string | null;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({
  children,
  initialMode = 'system',
  userDob = null,
}) => {
  const systemColorScheme = useColorScheme();
  const [mode, setMode] = useState<ThemeMode>(initialMode);
  const [devForceGolden, setDevForceGolden] = useState(false);
  const [midnightTick, setMidnightTick] = useState(0);

  // Scheduled transition at midnight boundary without continuous polling
  useEffect(() => {
    const calculateMsUntilMidnight = (): number => {
      const now = new Date();
      const nextMidnight = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() + 1,
        0,
        0,
        1
      );
      return Math.max(1000, nextMidnight.getTime() - now.getTime());
    };

    const timer = setTimeout(() => {
      setMidnightTick((t) => t + 1);
    }, calculateMsUntilMidnight());

    // Listen to AppState to immediately sync date when app comes from background/sleep
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        setMidnightTick((t) => t + 1);
      }
    });

    return () => {
      clearTimeout(timer);
      sub.remove();
    };
  }, [midnightTick]);

  // Determine if today is the main user's birthday
  const isGolden = useMemo(() => {
    if (midnightTick < 0) return false;
    if (devForceGolden) return true;
    if (!userDob) return false;
    return DateService.isDobToday(userDob);
  }, [devForceGolden, userDob, midnightTick]);

  const isDark = useMemo(() => {
    if (isGolden) return true;
    if (mode === 'system') {
      return systemColorScheme === 'dark';
    }
    return mode === 'dark';
  }, [isGolden, mode, systemColorScheme]);

  // Resolve theme: Golden Birthday Theme takes temporary precedence on the user's birthday
  const theme = useMemo(() => {
    if (isGolden) {
      return goldenTheme;
    }
    return isDark ? darkTheme : lightTheme;
  }, [isGolden, isDark]);

  const toggleTheme = useCallback(() => {
    setMode((current) => {
      if (current === 'system') {
        return systemColorScheme === 'dark' ? 'light' : 'dark';
      }
      return current === 'dark' ? 'light' : 'dark';
    });
  }, [systemColorScheme]);

  const value = useMemo(
    () => ({
      theme,
      mode,
      isDark,
      isGolden,
      setMode,
      toggleTheme,
      devForceGolden,
      setDevForceGolden,
    }),
    [theme, mode, isDark, isGolden, toggleTheme, devForceGolden]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = (): ThemeContextValue => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
