import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import * as Font from 'expo-font';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'react-native';
import Navigation from './src/navigation';
import { useAppStore } from './src/store/useAppStore';
import { colors } from './src/constants/colors';
import * as QuickActions from 'expo-quick-actions';

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

QuickActions.setItems([
  {
    id: 'everyone',
    title: 'Everyone',
    subtitle: 'Visible to all',
    icon: 'symbol:globe',
  },
  {
    id: 'contacts',
    title: 'Contacts Only',
    subtitle: 'Contacts only',
    icon: 'symbol:person.2',
  },
  {
    id: 'invisible',
    title: 'Invisible',
    subtitle: 'Send only',
    icon: 'symbol:eye.slash',
  },
]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
          <StatusBar barStyle="light-content" backgroundColor={colors.bgPrimary} />
        <Navigation />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}