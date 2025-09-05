import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, FlatList, ActivityIndicator } from 'react-native';
import { Link, useFocusEffect } from 'expo-router';
import { getPeople, type Person } from '../lib/db';

export default function PeopleListScreen(): React.ReactElement {
  const [people, setPeople] = useState<Person[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const load = useCallback(async (): Promise<void> => {
    setLoading(true);
    try {
      const rows = await getPeople();
      setPeople(rows);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text accessibilityRole="header" style={styles.header}>People</Text>
        <Link asChild href="/people/new">
          <Pressable accessibilityRole="button" style={styles.addButton}>
            <Text style={styles.addButtonText}>Add</Text>
          </Pressable>
        </Link>
      </View>
      {loading ? (
        <ActivityIndicator accessibilityLabel="Loading" />
      ) : people.length === 0 ? (
        <Text style={styles.emptyText}>No people yet.</Text>
      ) : (
        <FlatList
          data={people}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={{ paddingVertical: 8 }}
          renderItem={({ item }) => (
            <Link asChild href={`/people/${item.id}`}>
              <Pressable accessibilityRole="button" style={styles.row}>
                <Text style={styles.rowTitle}>
                  {item.firstName} {item.lastName}
                </Text>
                {item.nickname ? (
                  <Text style={styles.rowSub}>{item.nickname}</Text>
                ) : null}
              </Pressable>
            </Link>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  header: {
    fontSize: 24,
    fontWeight: '600',
  },
  emptyText: {
    color: '#555',
  },
  addButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#2563eb',
    borderRadius: 8,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  row: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    marginBottom: 8,
  },
  rowTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  rowSub: {
    color: '#64748b',
  },
});
