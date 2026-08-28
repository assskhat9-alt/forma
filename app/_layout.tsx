/**
 * Түбірлік layout — шрифт, кэш, сессия, қауіпсіз аймақ.
 */
import React, { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { QueryClientProvider } from '@tanstack/react-query';

import {
  GolosText_400Regular,
  GolosText_500Medium,
  GolosText_600SemiBold,
  GolosText_700Bold,
  GolosText_800ExtraBold,
  GolosText_900Black,
} from '@expo-google-fonts/golos-text';
import { Caveat_600SemiBold, Caveat_700Bold } from '@expo-google-fonts/caveat';

import { queryClient } from '../lib/query';
import { SessionProvider, useSession, useProtectedRoute } from '../lib/auth';
import { color as C } from '../theme/tokens';

SplashScreen.preventAutoHideAsync().catch(() => {
  /* splash әлдеқашан жабылған болуы мүмкін — елемейміз */
});

export default function RootLayout() {
  const [loaded, error] = useFonts({
    GolosText_400Regular,
    GolosText_500Medium,
    GolosText_600SemiBold,
    GolosText_700Bold,
    GolosText_800ExtraBold,
    GolosText_900Black,
    Caveat_600SemiBold,
    Caveat_700Bold,
  });

  useEffect(() => {
    // Шрифт жүктелмей қалса да қосымшаны бөгеп қоймаймыз —
    // жүйелік шрифтпен көрсеткен қараңғы экраннан жақсы.
    if (loaded || error) SplashScreen.hideAsync().catch(() => {});
  }, [loaded, error]);

  if (!loaded && !error) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: C.bg }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <SessionProvider>
            <StatusBar style="dark" />
            <RootNavigator />
          </SessionProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

function RootNavigator() {
  const { ready } = useSession();

  // Кірмеген адамды /sign-in-ке, кіргенді қосымшаға жібереді
  useProtectedRoute();

  if (!ready) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: C.bg }}>
        <ActivityIndicator color={C.accent} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: C.bg } }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        {/*
          Рефлексия — мөлдір модаль: артында тұрған экран көрініп тұрады
          (Refleksiya.dc.html-де солай, көмескіленген фон).
        */}
        <Stack.Screen
          name="reflection"
          options={{ presentation: 'transparentModal', animation: 'fade' }}
        />
      </Stack>
    </View>
  );
}
