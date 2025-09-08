import { DateTimePickerAndroid } from '@react-native-community/datetimepicker';

/**
 * Opens Android date then time pickers and resolves with the combined Date.
 * Returns null if the user dismisses either dialog.
 */
export async function openAndroidDateTimePicker(initial: Date): Promise<Date | null> {
  return new Promise<Date | null>((resolve) => {
    DateTimePickerAndroid.open({
      value: initial,
      mode: 'date',
      onChange: (event, selectedDate) => {
        if (event.type !== 'set' || !selectedDate) {
          resolve(null);
          return;
        }
        const pickedDate = new Date(selectedDate);
        // After picking date, open time picker on the next tick to
        // ensure the date dialog is fully dismissed on some OEMs.
        setTimeout(() => {
          DateTimePickerAndroid.open({
            value: selectedDate,
            mode: 'time',
            onChange: (event2, selectedTime) => {
              if (event2.type !== 'set' || !selectedTime) {
                resolve(null);
                return;
              }
              const finalDate = new Date(pickedDate);
              finalDate.setHours(selectedTime.getHours(), selectedTime.getMinutes(), 0, 0);
              resolve(finalDate);
            },
          });
        }, 0);
      },
    });
  });
}

