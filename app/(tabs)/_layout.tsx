import React from 'react';
import { Tabs, router } from 'expo-router';

import { BottomNav, type TabBarProps } from '../../components/ui';
import { useBreakpoint } from '../../lib/breakpoints';
import { color as C } from '../../theme/tokens';

export default function TabsLayout() {
  // ⚠ Панель мұнда емес, түбірлік layout-та: ол бүкіл қосымшада тұрады
  const wide = useBreakpoint() !== 'phone';

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: C.bg },
      }}
      // Кең экранда төменгі жолақ жоқ — оның рөлін Sidebar атқарады
      tabBar={
        wide
          ? () => null
          : (props) => (
              <BottomNav
                {...(props as unknown as TabBarProps)}
                onFabPress={() => router.push('/goal/new')}
              />
            )
      }
    >
      <Tabs.Screen name="index" options={{ title: 'Басты бет' }} />
      <Tabs.Screen name="calendar" options={{ title: 'Күнтізбе' }} />
      <Tabs.Screen name="goals" options={{ title: 'Жыл' }} />
      <Tabs.Screen name="profile" options={{ title: 'Профиль' }} />
    </Tabs>
  );
}
