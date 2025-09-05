import React from 'react';
import { View, Pressable, Text, StyleSheet } from 'react-native';
import type { Channel } from '../lib/db';

type Props = {
  value: Channel;
  onChange: (value: Channel) => void;
  options?: Channel[];
};

const DEFAULTS: Channel[] = ['note', 'call', 'text', 'meet'];

export default function ChannelPicker({ value, onChange, options = DEFAULTS }: Props): React.ReactElement {
  return (
    <View style={styles.row}>
      {options.map((opt) => {
        const selected = opt === value;
        return (
          <Pressable
            key={opt}
            accessibilityRole="button"
            accessibilityLabel={`Select ${opt}`}
            onPress={() => onChange(opt)}
            style={[styles.pill, selected && styles.pillActive]}
          >
            <Text style={[styles.pillText, selected && styles.pillTextActive]}>{opt}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function ChannelChip({ channel }: { channel: Channel }): React.ReactElement {
  return (
    <View style={[styles.chip, styles[`chip_${channel}` as const]]}>
      <Text style={styles.chipText}>{channel}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
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
  chip: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: '#e5e7eb',
  },
  chip_note: { backgroundColor: '#dbeafe' },
  chip_call: { backgroundColor: '#dcfce7' },
  chip_text: { backgroundColor: '#fae8ff' },
  chip_meet: { backgroundColor: '#fee2e2' },
  chipText: {
    color: '#111827',
    textTransform: 'capitalize',
    fontSize: 12,
    fontWeight: '600',
  },
});

