import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, Alert, Platform, ToastAndroid } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import DateTimeField from '../../components/DateTimeField';
import { insertReminder } from '../../lib/db';
import { scheduleReminder } from '../../lib/notify';

export default function NewReminder(): React.ReactElement {
  const params = useLocalSearchParams<{ personId: string }>();
  const personId = useMemo(() => String(params.personId), [params.personId]);
  const [title, setTitle] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [when, setWhen] = useState<Date>(new Date(Date.now() + 60 * 60 * 1000)); // +1h
  const [saving, setSaving] = useState<boolean>(false);
  const router = useRouter();

  async function actuallySave(): Promise<void> {
    setSaving(true);
    try {
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
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Save reminder"
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

