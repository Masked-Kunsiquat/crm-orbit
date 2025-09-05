import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import type { Channel, NewInteraction } from '../../../../lib/db';
import { insertInteraction } from '../../../../lib/db';

const CHANNELS: Channel[] = ['note', 'call', 'text', 'meet'];

export default function LogInteractionScreen(): React.ReactElement {
  const params = useLocalSearchParams<{ id: string; channel?: string }>();
  const personId = Number(params.id);
  const initialChannel = useMemo<Channel>(() => {
    const p = (params.channel as string | undefined)?.toLowerCase();
    return (CHANNELS.includes(p as Channel) ? (p as Channel) : 'note');
  }, [params.channel]);
  const [channel, setChannel] = useState<Channel>(initialChannel);
  const [summary, setSummary] = useState<string>('');
  const [saving, setSaving] = useState<boolean>(false);
  const router = useRouter();

  async function handleSave(): Promise<void> {
    if (!summary.trim() || !Number.isFinite(personId)) return;
    setSaving(true);
    const input: NewInteraction = {
      personId,
      channel,
      summary: summary.trim(),
    };
    try {
      await insertInteraction(input);
      router.replace(`/people/${personId}`);
    } catch (e: unknown) {
      Alert.alert('Error', (e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text accessibilityRole="header" style={styles.header}>Log Interaction</Text>
      <View style={styles.channelRow}>
        {CHANNELS.map((c) => (
          <Pressable
            key={c}
            accessibilityRole="button"
            accessibilityLabel={`Channel ${c}`}
            onPress={() => setChannel(c)}
            style={[styles.pill, channel === c && styles.pillActive]}
          >
            <Text style={[styles.pillText, channel === c && styles.pillTextActive]}>{c}</Text>
          </Pressable>
        ))}
      </View>
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
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Save interaction"
        disabled={!summary.trim() || saving}
        onPress={handleSave}
        style={[styles.button, (!summary.trim() || saving) && { opacity: 0.6 }]}
      >
        <Text style={styles.buttonText}>{saving ? 'Saving…' : 'Save'}</Text>
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
  channelRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  pill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: '#fff',
  },
  pillActive: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  pillText: {
    color: '#111827',
    textTransform: 'capitalize',
  },
  pillTextActive: {
    color: '#fff',
  },
  label: {
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  multiline: {
    minHeight: 120,
  },
  button: {
    marginTop: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#16a34a',
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
  },
});

