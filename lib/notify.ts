import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

export type ScheduleReminderInput = {
  id: string; // reminderId
  title: string;
  // Accept Date or epoch ms for convenience
  due: Date | number;
  personId: string | number;
};

// Schedules a local notification for a reminder and returns the notification identifier.
export async function scheduleReminder(input: ScheduleReminderInput): Promise<string> {
  const dueMs = input.due instanceof Date ? input.due.getTime() : Number(input.due);
  if (!Number.isFinite(dueMs)) {
    throw new Error('Invalid due date');
  }
  if (dueMs <= Date.now()) {
    throw new Error('Cannot schedule a reminder in the past');
  }

  const trigger: Notifications.SchedulableNotificationTriggerInput = {
    type: Notifications.SchedulableTriggerInputTypes.DATE,
    date: dueMs,
    ...(Platform.OS === 'android' ? { channelId: 'reminders' } : {}),
  };

  const identifier = await Notifications.scheduleNotificationAsync({
    content: {
      title: input.title,
      body: 'Reminder due',
      data: { reminderId: input.id, personId: String(input.personId) },
      sound: true,
    },
    trigger,
  });
  return identifier;
}

// Cancels any scheduled notification(s) associated with a given reminderId
export async function cancelReminderById(reminderId: string): Promise<void> {
  try {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    const targets = scheduled.filter((s) => {
      const data = (s.content?.data ?? {}) as Record<string, unknown>;
      return String((data as any).reminderId) === String(reminderId);
    });
    for (const t of targets) {
      await Notifications.cancelScheduledNotificationAsync(t.identifier);
    }
  } catch {
    // Swallow errors; cancellation should be best-effort
  }
}
