import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, Platform } from 'react-native';
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { openAndroidDateTimePicker } from '../lib/datetime';
import { MIN_HIT_SLOP_10 } from '../lib/ui';

type Props = {
  label?: string;
  value: Date;
  onChange: (next: Date) => void;
  display?: 'default' | 'spinner' | 'compact' | 'inline';
};

/**
 * DateTimeField: cross-platform date+time picker field.
 * - iOS: uses single DateTimePicker with mode="datetime" (inline by default).
 * - Android: two-step flow (date, then time), merging into one Date.
 */
export default function DateTimeField({ label = 'Date & time', value, onChange, display }: Props): React.ReactElement {
  const [show, setShow] = useState<boolean>(false);
  const [picking, setPicking] = useState<boolean>(false);
  const disp: 'default' | 'compact' | 'inline' | 'spinner' =
    display ?? (Platform.OS === 'ios' ? 'inline' : 'default');

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

  // Android: step 1 — date, then step 2 — time
  /* function onChangeAndroidDate(event: any, selectedDate?: Date): void {
    // Close date picker regardless of outcome
    setShowAndroidDate(false);

    if (event?.type === 'dismissed') {
      // User canceled at date stage; reset temp state
      setTempAndroidDate(null);
      return;
    }

    if (selectedDate) {
      // Store picked calendar date, then show time picker
      setTempAndroidDate(selectedDate);
      // Ensure next picker shows after current closes
      setTimeout(() => setShowAndroidTime(true), 0);
    }
  } */

  /* function onChangeAndroidTime(event: any, selectedTime?: Date): void {
    // Close time picker regardless of outcome
    setShowAndroidTime(false);

    if (event?.type === 'dismissed') {
      // User canceled time picking; do not commit changes
      setTempAndroidDate(null);
      return;
    }

    if (selectedTime && tempAndroidDate) {
      // Merge picked date with picked time (preserves local timezone)
      const merged = new Date(tempAndroidDate);
      merged.setHours(selectedTime.getHours(), selectedTime.getMinutes(), 0, 0);
      setTempAndroidDate(null);
      onChange(merged);
    } else {
      setTempAndroidDate(null);
    }
  } */

  /* const onPressOpen = (): void => {
    if (Platform.OS === 'ios') {
      setShowIOS(true);
    } else {
      setShowAndroidDate(true);
    }
  }; */

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Open date and time picker"
        hitSlop={MIN_HIT_SLOP_10}
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
