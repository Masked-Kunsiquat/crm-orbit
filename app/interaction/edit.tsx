import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, Alert, Platform, ToastAndroid, ActivityIndicator } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import ChannelPicker from '../../components/ChannelPicker';
import type { Channel, Interaction } from '../../lib/db';
import { deleteInteraction, getInteractionById, updateInteraction } from '../../lib/db';
import { openAndroidDateTimePicker } from '../../lib/datetime';

export default function EditInteraction(): React.ReactElement {
  const params = useLocalSearchParams<{ id: string }>();
  const id = String(params.id);
  const [interaction, setInteraction] = useState<Interaction | null>(null);
  const [summary, setSummary] = useState<string>('');
  const [channel, setChannel] = useState<Channel>('note');
  const [when, setWhen] = useState<Date>(new Date());
  const [saving, setSaving] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [showPicker, setShowPicker] = useState<boolean>(false);
  const router = useRouter();

  useEffect(() => {
    let mounted = true;
    async function load(): Promise<void> {
      try {
        const i = await getInteractionById(id);
        if (!i) {
          Alert.alert('Not found', 'Interaction not found.');
          router.back();
          return;
        }
        if (!mounted) return;
        setInteraction(i);
        setSummary(i.summary);
        setChannel(i.channel);
        setWhen(new Date(i.happenedAt));
      } catch (e: unknown) {
        Alert.alert('Error', (e as Error).message);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, [id, router]);

  async function handleSave(): Promise<void> {
    if (!interaction) return;
    const s = summary.trim();
    if (!s) {
      Alert.alert('Validation', 'Summary is required.');
      return;
    }
    setSaving(true);
    try {
      await updateInteraction(interaction.id, {
        summary: s,
        channel,
        happenedAt: when.toISOString(),
        personId: interaction.personId,
      });
      if (Platform.OS === 'android') ToastAndroid.show('Saved', ToastAndroid.SHORT);
      router.replace(`/person/${interaction.personId}`);
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

  async function handleDelete(): Promise<void> {
    if (!interaction) return;
    Alert.alert('Delete', 'Delete this interaction?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          try {
            await deleteInteraction(interaction.id, interaction.personId);
            if (Platform.OS === 'android') ToastAndroid.show('Deleted', ToastAndroid.SHORT);
            router.replace(`/person/${interaction.personId}`);
          } catch (e: unknown) {
            Alert.alert('Error', (e as Error).message);
          }
        }
      }
    ]);
  }

  if (loading || !interaction) {
    return (
      <View style={styles.center}>
        <ActivityIndicator accessibilityLabel="Loading" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text accessibilityRole="header" style={styles.header}>Edit Interaction</Text>
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
      />
      <Text style={styles.label}>When</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="When button"
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        onPress={handleOpenPicker}
        style={styles.pickerBtn}
      >
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
      <View style={styles.row}>
        <Pressable accessibilityRole="button" disabled={saving} onPress={handleSave} style={[styles.saveBtn, saving && { opacity: 0.7 }]}>
          <Text style={styles.saveText}>{saving ? 'Saving…' : 'Save'}</Text>
        </Pressable>
        <Pressable accessibilityRole="button" onPress={handleDelete} style={styles.deleteBtn}>
          <Text style={styles.deleteText}>Delete</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' },
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
    gap: 12,
  },
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
  row: { flexDirection: 'row', gap: 12 },
  saveBtn: {
    marginTop: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#2563eb',
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  saveText: { color: '#fff', fontWeight: '600' },
  deleteBtn: {
    marginTop: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#ef4444',
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  deleteText: { color: '#fff', fontWeight: '600' },
});

