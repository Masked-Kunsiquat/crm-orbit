import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, Alert, Platform, ToastAndroid } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import DateTimeField from '../../components/DateTimeField';
import { insertReminder } from '../../lib/db';
import { scheduleReminder } from '../../lib/notify';
import { MIN_HIT_SLOP_10 } from '../../lib/ui';

export default function NewReminder(): React.ReactElement {
  const router = useRouter();
  const params = useLocalSearchParams<{ personId?: string }>();
  const personId = useMemo(() => (typeof params.personId === 'string' ? params.personId.trim() : ''), [params.personId]);
  const hasValidPerson = personId.length > 0 && !/^undefined|null$/i.test(personId);
  const [title, setTitle] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [when, setWhen] = useState<Date>(new Date(Date.now() + 60 * 60 * 1000)); // +1h
  const [saving, setSaving] = useState<boolean>(false);

  // Early guard: if no personId, redirect to home and show feedback
  useEffect(() => {
    if (!hasValidPerson) {
      if (Platform.OS === 'android') ToastAndroid.show('Missing person context', ToastAndroid.SHORT);
      router.replace('/');
    }
  }, [hasValidPerson, router]);

  async function actuallySave(): Promise<void> {
    setSaving(true);
    try {
      if (!hasValidPerson) return;
      const id = await insertReminder({ personId, title: title.trim(), dueAt: when.toISOString(), notes: notes.trim() || undefined });
      await scheduleReminder({ id, title: title.trim(), due: when, personId });
      if (Platform.OS === 'android') ToastAndroid.show('Reminder set', ToastAndroid.SHORT);
      router.replace(`/person/${personId}`);
    } catch (e: unknown) {
      Alert.alert('Error', (e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function handleSave(): Promise<void> {
    const t = title.trim();
    if (!t) {
      Alert.alert('Validation', 'Title is required.');
      return;
    }
    const now = Date.now();
    if (when.getTime() <= now) {
      Alert.alert('Past time', 'The selected time is in the past. Schedule anyway?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Schedule', style: 'default', onPress: actuallySave },
      ]);
      return;
    }
    if (!hasValidPerson) {
      Alert.alert('Missing person', 'Cannot save a reminder without a person.');
      return;
    }
    await actuallySave();
  }

  return (
    <View style={styles.container}>
      <Text accessibilityRole="header" style={styles.header}>New Reminder</Text>
      <Text style={styles.label}>Title</Text>
      <TextInput
        accessibilityLabel="Title"
        style={styles.input}
        value={title}
        onChangeText={setTitle}
        placeholder="Follow up"
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
        placeholder="Any details to remember"
      />
      {!hasValidPerson ? (
        <Text style={{ color: '#b91c1c' }}>Missing person context. Returning to home…</Text>
      ) : null}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Save reminder"
        hitSlop={MIN_HIT_SLOP_10}
        disabled={saving}
        onPress={handleSave}
        style={[styles.saveBtn, saving && { opacity: 0.7 }]}
      >
        <Text style={styles.saveText}>{saving ? 'Saving…' : 'Save'}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
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
  saveBtn: {
    marginTop: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#16a34a',
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  saveText: { color: '#fff', fontWeight: '600' },
});
