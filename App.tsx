import React, { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider, useTheme, ThemeMode } from './src/theme';
import { AppProvider, useApp } from './src/state';
import { RootNavigator } from './src/navigation';

function ThemeSynchronizer({ preference }: { preference: ThemeMode }) {
  const { setMode } = useTheme();
  useEffect(() => {
    if (preference) {
      setMode(preference);
    }
  }, [preference, setMode]);
  return null;
}

function ThemedApp(): React.JSX.Element {
  const { state } = useApp();
  return (
    <ThemeProvider initialMode={state.themePreference} userDob={state.userProfile?.date_of_birth}>
      <ThemeSynchronizer preference={state.themePreference} />
      <RootNavigator />
    </ThemeProvider>
  );
}

export function App(): React.JSX.Element {
  return (
    <SafeAreaProvider>
      <AppProvider>
        <ThemedApp />
      </AppProvider>
    </SafeAreaProvider>
  );
}

export default App;
