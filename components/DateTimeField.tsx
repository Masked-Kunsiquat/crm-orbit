import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';

type Props = {
  label?: string;
  value: Date;
  onChange: (next: Date) => void;
  display?: 'default' | 'spinner' | 'calendar' | 'clock' | 'inline';
};

/**
 * DateTimeField: cross-platform date+time picker field.
 * - iOS: uses single DateTimePicker with mode="datetime" (inline by default).
 * - Android: two-step flow (date, then time), merging into one Date.
 */
export default function DateTimeField({ label = 'Date & time', value, onChange, display }: Props): React.ReactElement {
  // iOS picker visibility
  const [showIOS, setShowIOS] = useState<boolean>(false);

  // Android two-step flow visibility and temp state
  const [showAndroidDate, setShowAndroidDate] = useState<boolean>(false);
  const [showAndroidTime, setShowAndroidTime] = useState<boolean>(false);
  const [tempAndroidDate, setTempAndroidDate] = useState<Date | null>(null);

  const iosDisplay = display ?? 'inline';
  // Prevent unsupported Android display='inline'
  const androidDisplay = display && display !== 'inline' ? display : 'default';

  // iOS: single datetime picker
  function onChangePickerIOS(_: any, date?: Date): void {
    // Keep the inline picker open on iOS; Android flow handled separately
    setShowIOS(true);
    if (date) onChange(date);
  }

  // Android: step 1 — date, then step 2 — time
  function onChangeAndroidDate(event: any, selectedDate?: Date): void {
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
  }

  function onChangeAndroidTime(event: any, selectedTime?: Date): void {
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
  }

  const onPressOpen = (): void => {
    if (Platform.OS === 'ios') {
      setShowIOS(true);
    } else {
      setShowAndroidDate(true);
    }
  };

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <Pressable accessibilityRole="button" onPress={onPressOpen} style={styles.button}>
        <Text style={styles.buttonText}>{value.toLocaleString()}</Text>
      </Pressable>

      {Platform.OS === 'ios' && showIOS && (
        <DateTimePicker value={value} mode="datetime" display={iosDisplay} onChange={onChangePickerIOS} />
      )}

      {Platform.OS !== 'ios' && showAndroidDate && (
        <DateTimePicker value={value} mode="date" display={androidDisplay} onChange={onChangeAndroidDate} />
      )}

      {Platform.OS !== 'ios' && showAndroidTime && (
        <DateTimePicker value={tempAndroidDate ?? value} mode="time" display={androidDisplay} onChange={onChangeAndroidTime} />
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

