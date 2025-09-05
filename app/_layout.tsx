import React from 'react';
import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AuthGate from '../components/AuthGate';

export default function RootLayout(): JSX.Element {
  return (
    <SafeAreaProvider>
      <AuthGate>
        <Stack>
          <Stack.Screen name="index" options={{ title: 'People' }} />
          <Stack.Screen name="people/new" options={{ title: 'Add Person', presentation: 'card' }} />
          <Stack.Screen name="people/[id]" options={{ title: 'Person' }} />
        </Stack>
      </AuthGate>
    </SafeAreaProvider>
  );
}

