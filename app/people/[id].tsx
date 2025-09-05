import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Alert, ScrollView, Pressable, FlatList } from 'react-native';
import { Link, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { getPerson, getInteractionsByPerson, type Person, type Interaction } from '../../lib/db';

export default function PersonDetailScreen(): React.ReactElement {
  const params = useLocalSearchParams<{ id: string }>();
  const id = Number(params.id);
  const [person, setPerson] = useState<Person | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [interactions, setInteractions] = useState<Interaction[]>([]);

  const load = useCallback(async (): Promise<void> => {
    try {
      const [p, list] = await Promise.all([
        getPerson(id),
        getInteractionsByPerson(id),
      ]);
      setPerson(p);
      setInteractions(list);
    } catch (e: unknown) {
      Alert.alert('Error', (e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (!Number.isFinite(id)) {
      setLoading(false);
      return;
    }
    load();
  }, [id, load]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

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
      <View style={styles.headerRow}>
        <Text accessibilityRole="header" style={styles.header}>
          {person.firstName} {person.lastName}
        </Text>
        <Link asChild href={`/people/${id}/interactions/new?channel=note`}>
          <Pressable accessibilityRole="button" style={styles.addBtn}>
            <Text style={styles.addBtnText}>Add Note</Text>
          </Pressable>
        </Link>
      </View>
      {person.nickname ? (
        <Text style={styles.sub}>Nickname: {person.nickname}</Text>
      ) : null}
      {person.notes ? (
        <Text style={styles.notes}>{person.notes}</Text>
      ) : null}
      <Text style={styles.meta}>Created: {new Date(person.createdAt).toLocaleString()}</Text>
      <Text style={styles.meta}>Updated: {new Date(person.updatedAt).toLocaleString()}</Text>

      <Text style={[styles.header, { fontSize: 18, marginTop: 16 }]}>Interactions</Text>
      {interactions.length === 0 ? (
        <Text style={styles.empty}>No interactions yet.</Text>
      ) : (
        <FlatList
          data={interactions}
          keyExtractor={(it) => String(it.id)}
          scrollEnabled={false}
          renderItem={({ item }) => (
            <View style={styles.interactionRow}>
              <Text style={styles.interactionMeta}>
                {new Date(item.happenedAt).toLocaleString()} • {item.channel}
              </Text>
              <Text style={styles.interactionText}>{item.summary}</Text>
            </View>
          )}
        />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 8,
    backgroundColor: '#fff',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  addBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#2563eb',
    borderRadius: 8,
  },
  addBtnText: {
    color: '#fff',
    fontWeight: '600',
  },
  empty: {
    color: '#64748b',
    marginTop: 8,
  },
  interactionRow: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
  },
  interactionMeta: {
    color: '#6b7280',
    fontSize: 12,
    marginBottom: 4,
    textTransform: 'capitalize',
  },
  interactionText: {
    color: '#111827',
  },
});
