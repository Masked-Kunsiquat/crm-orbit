import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AuthGate from '../components/AuthGate';
import { initDb } from '../lib/db';

export default function RootLayout(): React.ReactElement {
  useEffect(() => {
    initDb().catch((e) => console.warn('DB init failed', e));
  }, []);
  return (
    <SafeAreaProvider>
      <AuthGate>
        <Stack>
          <Stack.Screen name="index" options={{ title: 'People' }} />
          <Stack.Screen name="people/new" options={{ title: 'Add Person', presentation: 'card' }} />
          <Stack.Screen name="people/[id]" options={{ title: 'Person' }} />
          <Stack.Screen name="people/[id]/interactions/new" options={{ title: 'Log Interaction' }} />
        </Stack>
      </AuthGate>
    </SafeAreaProvider>
  );
}
