import React from 'react';
import { Tabs, router } from 'expo-router';
import { BottomNav, type TabBarProps } from '../../components/ui';
import { color as C } from '../../theme/tokens';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: C.bg },
      }}
      tabBar={(props) => (
        <BottomNav
          {...(props as unknown as TabBarProps)}
          // FAB — таб емес: «жаңа мақсат» экранын ашады
          onFabPress={() => router.push('/goal/new')}
        />
      )}
    >
      <Tabs.Screen name="index" options={{ title: 'Бүгін' }} />
      <Tabs.Screen name="calendar" options={{ title: 'Күнтізбе' }} />
      <Tabs.Screen name="goals" options={{ title: 'Жыл' }} />
      <Tabs.Screen name="profile" options={{ title: 'Профиль' }} />
    </Tabs>
  );
}
