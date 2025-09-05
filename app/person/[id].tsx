import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Alert, ScrollView, Pressable, FlatList, Platform, ToastAndroid } from 'react-native';
import { Link, useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { getPerson, type Person, getInteractionsByPerson, type Interaction, deleteInteraction, getUpcomingRemindersByPerson, type Reminder } from '../../lib/db';
import { ChannelChip } from '../../components/ChannelPicker';

function formatRelative(iso: string): string {
  const now = Date.now();
  const t = new Date(iso).getTime();
  const diff = Math.floor((t - now) / 1000); // seconds, can be negative future
  const abs = Math.abs(diff);
  const units: [number, string][] = [
    [60, 's'], [60, 'm'], [24, 'h'], [7, 'd'], [4.345, 'w'], [12, 'mo'], [Number.POSITIVE_INFINITY, 'y']
  ];
  let value = abs;
  let unit = 's';
  for (let i = 0; i < units.length; i++) {
    const [step, label] = units[i];
    if (value < step) { unit = label; break; }
    value = Math.floor(value / step);
    unit = label;
  }
  const when = `${value}${unit}`;
  return diff <= 0 ? `${when} ago` : `in ${when}`;
}

export default function PersonDetail(): React.ReactElement {
  const params = useLocalSearchParams<{ id: string }>();
  const idStr = String(params.id);
  const idNum = useMemo(() => Number(idStr), [idStr]);
  const [person, setPerson] = useState<Person | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [expandedTimeId, setExpandedTimeId] = useState<string | null>(null);
  const router = useRouter();

  const load = useCallback(async (): Promise<void> => {
    try {
      const [p, list, rem] = await Promise.all([
        getPerson(idNum),
        getInteractionsByPerson(idStr),
        getUpcomingRemindersByPerson(idStr, 5),
      ]);
      setPerson(p);
      setInteractions(list);
      setReminders(rem);
    } catch (e: unknown) {
      Alert.alert('Error', (e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [idNum, idStr]);

  useEffect(() => {
    if (!Number.isFinite(idNum)) {
      setLoading(false);
      return;
    }
    load();
  }, [idNum, load]);

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

  async function onDeleteInteraction(it: Interaction): Promise<void> {
    Alert.alert('Delete', 'Delete this interaction?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          try {
            await deleteInteraction(it.id, it.personId);
            if (Platform.OS === 'android') ToastAndroid.show('Deleted', ToastAndroid.SHORT);
            load();
          } catch (e: unknown) {
            Alert.alert('Error', (e as Error).message);
          }
        }
      }
    ]);
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.headerRow}>
        <Text accessibilityRole="header" style={styles.header}>
          {person.firstName} {person.lastName}
        </Text>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Link asChild href={`/reminder/new?personId=${idStr}`}>
            <Pressable accessibilityRole="button" style={styles.addBtn}>
              <Text style={styles.addBtnText}>Set reminder</Text>
            </Pressable>
          </Link>
          <Link asChild href={`/interaction/new?personId=${idStr}&channel=note`}>
            <Pressable accessibilityRole="button" style={styles.addBtn}>
              <Text style={styles.addBtnText}>Add note</Text>
            </Pressable>
          </Link>
        </View>
      </View>
      {person.nickname ? (
        <Text style={styles.sub}>Nickname: {person.nickname}</Text>
      ) : null}
      {person.notes ? (
        <Text style={styles.notes}>{person.notes}</Text>
      ) : null}
      <Text style={styles.meta}>Created: {new Date(person.createdAt).toLocaleString()}</Text>
      <Text style={styles.meta}>Updated: {new Date(person.updatedAt).toLocaleString()}</Text>

      {/* Upcoming Reminders */}
      <Text style={[styles.header, { fontSize: 18, marginTop: 16 }]}>Upcoming reminders</Text>
      {reminders.length === 0 ? (
        <Text style={styles.empty}>No upcoming reminders.</Text>
      ) : (
        <FlatList
          data={reminders}
          keyExtractor={(it) => it.id}
          scrollEnabled={false}
          renderItem={({ item }) => {
            const due = new Date(item.dueAt);
            const overdue = due.getTime() < Date.now();
            return (
              <Link asChild href={`/reminder/edit?id=${item.id}`}>
                <Pressable accessibilityRole="button" style={styles.reminderRow}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Text style={styles.reminderTitle}>{item.title}</Text>
                    {overdue ? <Text style={styles.overdue}>overdue</Text> : null}
                  </View>
                  <Text style={styles.reminderMeta}>{due.toLocaleString()}</Text>
                </Pressable>
              </Link>
            );
          }}
        />
      )}

      {/* Interactions */}
      <Text style={[styles.header, { fontSize: 18, marginTop: 16 }]}>Interactions</Text>
      {interactions.length === 0 ? (
        <Text style={styles.empty}>No interactions yet. Log the first note.</Text>
      ) : (
        <FlatList
          data={interactions}
          keyExtractor={(it) => it.id}
          scrollEnabled={false}
          renderItem={({ item }) => (
            <View style={styles.interactionRow}>
              <View style={styles.interactionTop}>
                <ChannelChip channel={item.channel} />
                <Pressable onPress={() => setExpandedTimeId(expandedTimeId === item.id ? null : item.id)}>
                  <Text style={styles.interactionMeta}>
                    {expandedTimeId === item.id ? new Date(item.happenedAt).toLocaleString() : formatRelative(item.happenedAt)}
                  </Text>
                </Pressable>
              </View>
              <Text numberOfLines={2} style={styles.interactionText}>{item.summary}</Text>
              <View style={styles.actions}>
                <Link asChild href={`/interaction/edit?id=${item.id}`}>
                  <Pressable accessibilityRole="button" style={styles.editBtn}>
                    <Text style={styles.editText}>Edit</Text>
                  </Pressable>
                </Link>
                <Pressable accessibilityRole="button" onPress={() => onDeleteInteraction(item)} style={styles.delBtn}>
                  <Text style={styles.delText}>Delete</Text>
                </Pressable>
              </View>
            </View>
          )}
        />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 8, backgroundColor: '#fff' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  header: { fontSize: 22, fontWeight: '600' },
  sub: { color: '#334155' },
  notes: { marginTop: 8, color: '#1f2937' },
  meta: { marginTop: 8, color: '#6b7280', fontSize: 12 },
  addBtn: { paddingVertical: 8, paddingHorizontal: 12, backgroundColor: '#2563eb', borderRadius: 8 },
  addBtnText: { color: '#fff', fontWeight: '600' },
  empty: { color: '#64748b', marginTop: 8 },
  interactionRow: { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 8, padding: 12, marginTop: 8, gap: 6 },
  interactionTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  interactionMeta: { color: '#6b7280', fontSize: 12, textTransform: 'capitalize' },
  interactionText: { color: '#111827' },
  actions: { flexDirection: 'row', gap: 8, marginTop: 6 },
  editBtn: { paddingVertical: 6, paddingHorizontal: 10, backgroundColor: '#e0e7ff', borderRadius: 6 },
  editText: { color: '#1e3a8a', fontWeight: '600' },
  delBtn: { paddingVertical: 6, paddingHorizontal: 10, backgroundColor: '#fee2e2', borderRadius: 6 },
  delText: { color: '#991b1b', fontWeight: '600' },
  reminderRow: { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 8, padding: 12, marginTop: 8, gap: 4 },
  reminderTitle: { fontWeight: '600', color: '#111827' },
  reminderMeta: { color: '#6b7280', fontSize: 12 },
  overdue: { color: '#b91c1c', fontSize: 12, fontWeight: '700', textTransform: 'uppercase' },
});


