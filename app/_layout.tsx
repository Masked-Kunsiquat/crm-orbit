import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AuthGate from '../components/AuthGate';
import { initDb } from '../lib/db';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

export default function RootLayout(): React.ReactElement {
  useEffect(() => {
    initDb().catch((e) => console.warn('DB init failed', e));
  }, []);

  useEffect(() => {
    // Notifications setup: permissions + Android channel + handler
    (async () => {
      try {
        await Notifications.setNotificationHandler({
          handleNotification: async () => ({ shouldShowAlert: true, shouldPlaySound: true, shouldSetBadge: false }),
        });

        const { status } = await Notifications.requestPermissionsAsync();
        if (status !== 'granted') {
          // no-op; user can enable later in settings
        }
        if (Platform.OS === 'android') {
          await Notifications.setNotificationChannelAsync('reminders', {
            name: 'Reminders',
            importance: Notifications.AndroidImportance.HIGH,
            lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
            bypassDnd: true,
            sound: 'default',
            vibrationPattern: [250, 250, 500],
            lightColor: '#2563eb',
          });
        }
      } catch (e) {
        console.warn('Notifications init failed', e);
      }
    })();
  }, []);
  return (
    <SafeAreaProvider>
      <AuthGate>
        <Stack>
          <Stack.Screen name="index" options={{ title: 'People' }} />
          <Stack.Screen name="people/new" options={{ title: 'Add Person', presentation: 'card' }} />
          <Stack.Screen name="people/[id]" options={{ title: 'Person' }} />
          <Stack.Screen name="people/[id]/interactions/new" options={{ title: 'Log Interaction' }} />
          <Stack.Screen name="person/[id]" options={{ title: 'Person' }} />
          <Stack.Screen name="interaction/new" options={{ title: 'New Interaction' }} />
          <Stack.Screen name="interaction/edit" options={{ title: 'Edit Interaction' }} />
          <Stack.Screen name="reminder/new" options={{ title: 'New Reminder' }} />
          <Stack.Screen name="reminder/edit" options={{ title: 'Edit Reminder' }} />
        </Stack>
      </AuthGate>
    </SafeAreaProvider>
  );
}
