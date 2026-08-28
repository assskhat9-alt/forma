import React from 'react';
import { View } from 'react-native';
import { Tabs, router } from 'expo-router';

import { BottomNav, type TabBarProps } from '../../components/ui';
import { Sidebar } from '../../components/layout/Sidebar';
import { useBreakpoint } from '../../lib/breakpoints';
import { color as C } from '../../theme/tokens';

const MOTTO = '«Мен армандаған адам — бүгін тұрып жасайтын адам.»';

export default function TabsLayout() {
  const bp = useBreakpoint();
  const wide = bp !== 'phone';

  const tabs = (
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

  if (!wide) return tabs;

  return (
    <View style={{ flex: 1, flexDirection: 'row', backgroundColor: C.bg }}>
      <Sidebar width={bp === 'desktop' ? 260 : 232} motto={MOTTO} />
      <View style={{ flex: 1, minWidth: 0 }}>{tabs}</View>
    </View>
  );
}
