import React, { PropsWithChildren, useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, Platform } from 'react-native';
import { MIN_HIT_SLOP_10 } from '../lib/ui';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';

const BIOMETRIC_ENABLED_KEY = 'biometricEnabled';

export default function AuthGate({ children }: PropsWithChildren): React.ReactElement {
  const [unlocked, setUnlocked] = useState<boolean>(false);
  const [checking, setChecking] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const ensureBiometricPref = useCallback(async (): Promise<boolean> => {
    try {
      const v = await SecureStore.getItemAsync(BIOMETRIC_ENABLED_KEY);
      if (v == null) {
        await SecureStore.setItemAsync(BIOMETRIC_ENABLED_KEY, 'true');
        return true;
      }
      return v === 'true';
    } catch {
      return true;
    }
  }, []);

  const authenticate = useCallback(async (): Promise<void> => {
    setChecking(true);
    setError(null);
    try {
      // Allow web and unsupported devices to pass through for development ergonomics
      const enabled = await ensureBiometricPref();
      if (!enabled) {
        setUnlocked(true);
        setChecking(false);
        return;
      }

      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      if (Platform.OS === 'web' || !hasHardware || !isEnrolled) {
        setUnlocked(true);
        setChecking(false);
        return;
      }

      const res = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Unlock CRM Orbit',
        cancelLabel: 'Cancel',
        disableDeviceFallback: false,
      });
      if (res.success) {
        setUnlocked(true);
      } else {
        setError(res.warning ?? 'Authentication failed');
      }
    } catch (e: unknown) {
      setError((e as Error).message);
    } finally {
      setChecking(false);
    }
  }, [ensureBiometricPref]);

  useEffect(() => {
    authenticate();
  }, [authenticate]);

  if (unlocked) {
    return <>{children}</>;
  }

  return (
    <View style={styles.container}>
      <Text accessibilityRole="header" style={styles.header}>Locked</Text>
      <Text style={styles.text}>Authenticate to continue</Text>
      {error ? <Text accessibilityLiveRegion="polite" style={styles.error}>{error}</Text> : null}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Unlock"
        hitSlop={MIN_HIT_SLOP_10}
        disabled={checking}
        onPress={authenticate}
        style={[styles.button, checking && { opacity: 0.7 }]}
      >
        <Text style={styles.buttonText}>{checking ? 'Checking…' : 'Unlock'}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#fff',
  },
  header: {
    fontSize: 22,
    fontWeight: '600',
    marginBottom: 8,
  },
  text: {
    color: '#444',
  },
  error: {
    color: '#b91c1c',
    marginTop: 8,
  },
  button: {
    marginTop: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#2563eb',
    borderRadius: 8,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
  },
});
