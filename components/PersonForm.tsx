import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, Pressable } from 'react-native';
import { MIN_HIT_SLOP_10 } from '../lib/ui';
import type { NewPerson } from '../lib/db';

type Props = {
  onSubmit: (input: NewPerson) => void | Promise<void>;
};

export default function PersonForm({ onSubmit }: Props): React.ReactElement {
  const [firstName, setFirstName] = useState<string>('');
  const [lastName, setLastName] = useState<string>('');
  const [nickname, setNickname] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);

  const canSubmit = firstName.trim().length > 0 && lastName.trim().length > 0 && !submitting;

  async function handleSubmit(): Promise<void> {
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      await onSubmit({ firstName: firstName.trim(), lastName: lastName.trim(), nickname: nickname.trim() || undefined, notes: notes.trim() || undefined });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text accessibilityRole="header" style={styles.header}>New Person</Text>
      <View style={styles.field}>
        <Text style={styles.label}>First name</Text>
        <TextInput
          accessibilityLabel="First name"
          style={styles.input}
          value={firstName}
          onChangeText={setFirstName}
          autoCapitalize="words"
          autoCorrect={false}
        />
      </View>
      <View style={styles.field}>
        <Text style={styles.label}>Last name</Text>
        <TextInput
          accessibilityLabel="Last name"
          style={styles.input}
          value={lastName}
          onChangeText={setLastName}
          autoCapitalize="words"
          autoCorrect={false}
        />
      </View>
      <View style={styles.field}>
        <Text style={styles.label}>Nickname (optional)</Text>
        <TextInput
          accessibilityLabel="Nickname"
          style={styles.input}
          value={nickname}
          onChangeText={setNickname}
          autoCapitalize="words"
          autoCorrect={false}
        />
      </View>
      <View style={styles.field}>
        <Text style={styles.label}>Notes (optional)</Text>
        <TextInput
          accessibilityLabel="Notes"
          style={[styles.input, styles.notes]}
          value={notes}
          onChangeText={setNotes}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Save person"
        hitSlop={MIN_HIT_SLOP_10}
        disabled={!canSubmit}
        onPress={handleSubmit}
        style={[styles.button, !canSubmit && { opacity: 0.6 }]}
      >
        <Text style={styles.buttonText}>{submitting ? 'Saving…' : 'Save'}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  header: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 4,
  },
  field: {
    gap: 4,
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
  notes: {
    minHeight: 100,
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
