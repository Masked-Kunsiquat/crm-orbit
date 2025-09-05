import * as Notifications from 'expo-notifications';

export type ScheduleReminderInput = {
  id: string; // reminderId
  title: string;
  due: Date;
  personId: string | number;
};

// Schedules a local notification for a reminder and returns the notification identifier.
export async function scheduleReminder(input: ScheduleReminderInput): Promise<string> {
  const identifier = await Notifications.scheduleNotificationAsync({
    content: {
      title: input.title,
      body: 'Reminder due',
      data: { reminderId: input.id, personId: String(input.personId) },
      sound: true,
    },
    trigger: { date: input.due, channelId: 'reminders' as any },
  });
  return identifier;
}

// Cancels any scheduled notification(s) associated with a given reminderId
export async function cancelReminderById(reminderId: string): Promise<void> {
  try {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    const targets = scheduled.filter((s) => {
      const data: any = s.content?.data ?? {};
      return String(data.reminderId) === String(reminderId);
    });
    for (const t of targets) {
      // Each scheduled item should have a unique identifier
      if ((t as any).identifier) {
        await Notifications.cancelScheduledNotificationAsync((t as any).identifier as string);
      }
    }
  } catch {
    // Swallow errors; cancellation should be best-effort
  }
}
