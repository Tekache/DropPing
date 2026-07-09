import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import * as Font from 'expo-font';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import Navigation from './src/navigation';
import { useAppStore } from './src/store/useAppStore';
import { colors } from './src/constants/colors';

export default function App() {
  const [fontsLoaded, setFontsLoaded] = useState(false);
  const loadSettings = useAppStore((state) => state.loadSettings);

  useEffect(() => {
    async function prepare() {
      await Font.loadAsync({
        'Poppins-Regular': require('./assets/fonts/Poppins-Regular.ttf'),
        'Poppins-SemiBold': require('./assets/fonts/Poppins-SemiBold.ttf'),
        'Poppins-Bold': require('./assets/fonts/Poppins-Bold.ttf'),
        'Poppins-ExtraBold': require('./assets/fonts/Poppins-ExtraBold.ttf'),
      });
      await loadSettings();
      setFontsLoaded(true);
    }
    prepare();
  }, []);

  if (!fontsLoaded) {
    return <View style={{ flex: 1, backgroundColor: colors.bgPrimary }} />;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="light" backgroundColor={colors.bgPrimary} />
        <Navigation />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}