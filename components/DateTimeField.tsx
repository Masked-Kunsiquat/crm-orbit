import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';

type Props = {
  label?: string;
  value: Date;
  onChange: (next: Date) => void;
  display?: 'default' | 'spinner' | 'calendar' | 'clock' | 'inline';
};

export default function DateTimeField({ label = 'Date & time', value, onChange, display }: Props): React.ReactElement {
  const [show, setShow] = useState<boolean>(false);
  const disp = display ?? (Platform.OS === 'ios' ? 'inline' : 'default');

  function onChangePicker(_: any, date?: Date): void {
    setShow(Platform.OS === 'ios');
    if (date) onChange(date);
  }

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <Pressable accessibilityRole="button" onPress={() => setShow(true)} style={styles.button}>
        <Text style={styles.buttonText}>{value.toLocaleString()}</Text>
      </Pressable>
      {show && (
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

