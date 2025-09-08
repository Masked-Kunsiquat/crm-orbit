import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, Platform } from 'react-native';
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { openAndroidDateTimePicker } from '../lib/datetime';

type Props = {
  label?: string;
  value: Date;
  onChange: (next: Date) => void;
  display?: 'default' | 'spinner' | 'calendar' | 'clock' | 'inline';
};

export default function DateTimeField({ label = 'Date & time', value, onChange, display }: Props): React.ReactElement {
  const [show, setShow] = useState<boolean>(false);
  const [picking, setPicking] = useState<boolean>(false);
  const disp = display ?? (Platform.OS === 'ios' ? 'inline' : 'default');

  function onChangePicker(event: DateTimePickerEvent, date?: Date): void {
    // iOS inline picker only
    if (event.type === 'set' && date) onChange(date);
  }

  /**
   * Open the date/time picker.
   * On Android, guard against double-taps using `picking`.
   */
  async function handleOpen(): Promise<void> {
    if (Platform.OS === 'android') {
      if (picking) return;
      setPicking(true);
      try {
        const picked = await openAndroidDateTimePicker(value);
        if (picked) onChange(picked);
      } catch (e) {
        // no-op; ensure picking resets
      } finally {
        setPicking(false);
      }
      return;
    }
    setShow(true);
  }

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${label} button`}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        onPress={handleOpen}
        style={styles.button}
      >
        <Text style={styles.buttonText}>{value.toLocaleString()}</Text>
      </Pressable>
      {Platform.OS === 'ios' && show && (
        <DateTimePicker value={value} mode="datetime" display={disp} onChange={onChangePicker} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 6 },
  label: { color: '#333' },
  button: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
    alignSelf: 'flex-start',
  },
  buttonText: { color: '#111827' },
});
