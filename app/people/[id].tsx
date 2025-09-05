import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { getPerson, type Person } from '../../lib/db';

export default function PersonDetailScreen(): JSX.Element {
  const params = useLocalSearchParams<{ id: string }>();
  const id = Number(params.id);
  const [person, setPerson] = useState<Person | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let mounted = true;
    async function load(): Promise<void> {
      try {
        const p = await getPerson(id);
        if (mounted) setPerson(p);
      } catch (e: unknown) {
        Alert.alert('Error', (e as Error).message);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    if (!Number.isFinite(id)) {
      setLoading(false);
      return;
    }
    load();
    return () => {
      mounted = false;
    };
  }, [id]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator accessibilityLabel="Loading" />
      </View>
    );
  }

  if (!person) {
    return (
      <View style={styles.center}>
        <Text>Person not found.</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text accessibilityRole="header" style={styles.header}>
        {person.firstName} {person.lastName}
      </Text>
      {person.nickname ? (
        <Text style={styles.sub}>Nickname: {person.nickname}</Text>
      ) : null}
      {person.notes ? (
        <Text style={styles.notes}>{person.notes}</Text>
      ) : null}
      <Text style={styles.meta}>Created: {new Date(person.createdAt).toLocaleString()}</Text>
      <Text style={styles.meta}>Updated: {new Date(person.updatedAt).toLocaleString()}</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 8,
    backgroundColor: '#fff',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  header: {
    fontSize: 22,
    fontWeight: '600',
  },
  sub: {
    color: '#334155',
  },
  notes: {
    marginTop: 8,
    color: '#1f2937',
  },
  meta: {
    marginTop: 8,
    color: '#6b7280',
    fontSize: 12,
  },
});

