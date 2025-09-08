import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, Alert, Platform, ToastAndroid, ActivityIndicator, Switch } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import DateTimeField from '../../components/DateTimeField';
import { deleteReminder, getReminderById, markReminderDone, updateReminder, type Reminder } from '../../lib/db';
import { cancelReminderById, scheduleReminder } from '../../lib/notify';
import { MIN_HIT_SLOP_10 } from '../../lib/ui';

export default function EditReminder(): React.ReactElement {
  const params = useLocalSearchParams<{ id: string }>();
  const id = useMemo(() => String(params.id), [params.id]);
  const [reminder, setReminder] = useState<Reminder | null>(null);
  const [title, setTitle] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [when, setWhen] = useState<Date>(new Date());
  const [done, setDone] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const router = useRouter();

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const r = await getReminderById(id);
        if (!r) {
          Alert.alert('Not found', 'Reminder not found.');
          router.back();
          return;
        }
        if (!mounted) return;
        setReminder(r);
        setTitle(r.title);
        setNotes(r.notes ?? '');
        setWhen(new Date(r.dueAt));
        setDone(r.done);
      } catch (e: unknown) {
        Alert.alert('Error', (e as Error).message);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [id, router]);

  async function reschedule(): Promise<void> {
    if (!reminder) return;
    await cancelReminderById(reminder.id);
    if (!done) {
      await scheduleReminder({ id: reminder.id, title: title.trim() || reminder.title, due: when, personId: reminder.personId });
    }
  }

  async function handleSave(): Promise<void> {
    if (!reminder) return;
    const t = title.trim();
    if (!t) {
      Alert.alert('Validation', 'Title is required.');
      return;
    }
    setSaving(true);
    try {
      await updateReminder(reminder.id, { title: t, dueAt: when.toISOString(), notes: notes.trim() || null, done, personId: reminder.personId });
      await reschedule();
      if (Platform.OS === 'android') ToastAndroid.show('Saved', ToastAndroid.SHORT);
      router.replace(`/person/${reminder.personId}`);
    } catch (e: unknown) {
      Alert.alert('Error', (e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(): Promise<void> {
    if (!reminder) return;
    Alert.alert('Delete', 'Delete this reminder?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          try {
            await cancelReminderById(reminder.id);
            await deleteReminder(reminder.id, reminder.personId);
            if (Platform.OS === 'android') ToastAndroid.show('Deleted', ToastAndroid.SHORT);
            router.replace(`/person/${reminder.personId}`);
          } catch (e: unknown) {
            Alert.alert('Error', (e as Error).message);
          }
        }
      }
    ]);
  }

  async function handleMarkDone(): Promise<void> {
    if (!reminder) return;
    try {
      await cancelReminderById(reminder.id);
      await markReminderDone(reminder.id, reminder.personId);
      if (Platform.OS === 'android') ToastAndroid.show('Marked done', ToastAndroid.SHORT);
      router.replace(`/person/${reminder.personId}`);
    } catch (e: unknown) {
      Alert.alert('Error', (e as Error).message);
    }
  }

  async function handleSnooze(ms: number): Promise<void> {
    if (!reminder) return;
    const next = new Date(Math.max(Date.now(), when.getTime()) + ms);
    setWhen(next);
    try {
      await updateReminder(reminder.id, { title: title.trim() || reminder.title, dueAt: next.toISOString(), notes: notes.trim() || null, done: false, personId: reminder.personId });
      await cancelReminderById(reminder.id);
      await scheduleReminder({ id: reminder.id, title: title.trim() || reminder.title, due: next, personId: reminder.personId });
      if (Platform.OS === 'android') ToastAndroid.show('Snoozed', ToastAndroid.SHORT);
    } catch (e: unknown) {
      Alert.alert('Error', (e as Error).message);
    }
  }

  if (loading || !reminder) {
    return (
      <View style={styles.center}>
        <ActivityIndicator accessibilityLabel="Loading" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text accessibilityRole="header" style={styles.header}>Edit Reminder</Text>
      <Text style={styles.label}>Title</Text>
      <TextInput
        accessibilityLabel="Title"
        style={styles.input}
        value={title}
        onChangeText={setTitle}
      />
      <DateTimeField label="Due" value={when} onChange={setWhen} />
      <Text style={styles.label}>Notes (optional)</Text>
      <TextInput
        accessibilityLabel="Notes"
        style={[styles.input, styles.multiline]}
        multiline
        numberOfLines={4}
        textAlignVertical="top"
        value={notes}
        onChangeText={setNotes}
      />

      <View style={styles.row}>
        <Text style={styles.label}>Done</Text>
        <Switch accessibilityLabel="Mark done" value={done} onValueChange={setDone} />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Mark done button"
          hitSlop={MIN_HIT_SLOP_10}
          onPress={handleMarkDone}
          style={styles.doneBtn}
        >
          <Text style={styles.doneText}>Mark done</Text>
        </Pressable>
      </View>

      <View style={styles.snoozeRow}>
        <Text style={styles.label}>Snooze</Text>
        <View style={styles.snoozeBtns}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Snooze +1 hour"
            hitSlop={MIN_HIT_SLOP_10}
            onPress={() => handleSnooze(60 * 60 * 1000)}
            style={styles.snoozeBtn}
          >
            <Text style={styles.snoozeText}>+1h</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Snooze +1 day"
            hitSlop={MIN_HIT_SLOP_10}
            onPress={() => handleSnooze(24 * 60 * 60 * 1000)}
            style={styles.snoozeBtn}
          >
            <Text style={styles.snoozeText}>+1d</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Snooze +1 week"
            hitSlop={MIN_HIT_SLOP_10}
            onPress={() => handleSnooze(7 * 24 * 60 * 60 * 1000)}
            style={styles.snoozeBtn}
          >
            <Text style={styles.snoozeText}>+1w</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.actions}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Save button"
          hitSlop={MIN_HIT_SLOP_10}
          disabled={saving}
          onPress={handleSave}
          style={[styles.saveBtn, saving && { opacity: 0.7 }]}
        >
          <Text style={styles.saveText}>{saving ? 'Saving…' : 'Save'}</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Delete button"
          hitSlop={MIN_HIT_SLOP_10}
          onPress={handleDelete}
          style={styles.deleteBtn}
        >
          <Text style={styles.deleteText}>Delete</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' },
  container: { flex: 1, padding: 16, backgroundColor: '#fff', gap: 12 },
  header: { fontSize: 20, fontWeight: '600' },
  label: { color: '#333' },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  multiline: { minHeight: 100 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  actions: { flexDirection: 'row', gap: 12, marginTop: 8 },
  saveBtn: { paddingVertical: 12, paddingHorizontal: 16, backgroundColor: '#2563eb', borderRadius: 8, alignSelf: 'flex-start' },
  saveText: { color: '#fff', fontWeight: '600' },
  deleteBtn: { paddingVertical: 12, paddingHorizontal: 16, backgroundColor: '#ef4444', borderRadius: 8, alignSelf: 'flex-start' },
  deleteText: { color: '#fff', fontWeight: '600' },
  doneBtn: { paddingVertical: 8, paddingHorizontal: 12, backgroundColor: '#e5e7eb', borderRadius: 6 },
  doneText: { color: '#111827', fontWeight: '600' },
  snoozeRow: { gap: 6 },
  snoozeBtns: { flexDirection: 'row', gap: 8 },
  snoozeBtn: { paddingVertical: 8, paddingHorizontal: 12, backgroundColor: '#f1f5f9', borderRadius: 6 },
  snoozeText: { color: '#111827', fontWeight: '600' },
});

