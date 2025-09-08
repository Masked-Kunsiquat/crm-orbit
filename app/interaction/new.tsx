import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, Alert, Platform, ToastAndroid } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import ChannelPicker from '../../components/ChannelPicker';
import type { Channel } from '../../lib/db';
import { insertInteraction } from '../../lib/db';
import { openAndroidDateTimePicker } from '../../lib/datetime';

export default function NewInteraction(): React.ReactElement {
  const params = useLocalSearchParams<{ personId: string; channel?: string }>();
  const personId = useMemo(() => String(params.personId), [params.personId]);
  const initialChannel = useMemo<Channel>(() => {
    const c = (params.channel as string | undefined)?.toLowerCase();
    return c === 'call' || c === 'text' || c === 'meet' ? (c as Channel) : 'note';
  }, [params.channel]);
  const [channel, setChannel] = useState<Channel>(initialChannel);
  const [summary, setSummary] = useState<string>('');
  const [when, setWhen] = useState<Date>(new Date());
  const [showPicker, setShowPicker] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const router = useRouter();

  async function handleSave(): Promise<void> {
    const s = summary.trim();
    if (!s) {
      Alert.alert('Validation', 'Summary is required.');
      return;
    }
    setSaving(true);
    try {
      await insertInteraction({ personId, channel, summary: s, happenedAt: when.toISOString() });
      if (Platform.OS === 'android') ToastAndroid.show('Saved', ToastAndroid.SHORT);
      router.replace(`/person/${personId}`);
    } catch (e: unknown) {
      Alert.alert('Error', (e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  function onChangePicker(_: any, date?: Date): void {
    // iOS inline picker only
    setShowPicker(true);
    if (date) setWhen(date);
  }

  async function handleOpenPicker(): Promise<void> {
    if (Platform.OS === 'android') {
      const picked = await openAndroidDateTimePicker(when);
      if (picked) setWhen(picked);
      return;
    }
    setShowPicker(true);
  }

  return (
    <View style={styles.container}>
      <Text accessibilityRole="header" style={styles.header}>New Interaction</Text>
      <Text style={styles.label}>Channel</Text>
      <ChannelPicker value={channel} onChange={setChannel} />
      <Text style={styles.label}>Summary</Text>
      <TextInput
        accessibilityLabel="Summary"
        style={[styles.input, styles.multiline]}
        multiline
        numberOfLines={4}
        textAlignVertical="top"
        value={summary}
        onChangeText={setSummary}
        placeholder={channel === 'note' ? 'Write a quick note…' : 'What happened?'}
      />
      <Text style={styles.label}>When</Text>
      <Pressable accessibilityRole="button" onPress={handleOpenPicker} style={styles.pickerBtn}>
        <Text style={styles.pickerBtnText}>{when.toLocaleString()}</Text>
      </Pressable>
      {Platform.OS === 'ios' && showPicker && (
        <DateTimePicker
          value={when}
          mode="datetime"
          display="inline"
          onChange={onChangePicker}
        />
      )}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Save interaction"
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
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
    gap: 12,
  },
  header: {
    fontSize: 20,
    fontWeight: '600',
  },
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
  multiline: { minHeight: 120 },
  pickerBtn: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
    alignSelf: 'flex-start',
  },
  pickerBtnText: { color: '#111827' },
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

