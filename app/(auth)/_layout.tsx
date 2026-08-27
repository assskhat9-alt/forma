import React from 'react';
import { Stack } from 'expo-router';
import { color as C } from '../../theme/tokens';

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: C.bg },
      }}
    />
  );
}
