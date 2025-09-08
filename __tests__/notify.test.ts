import * as Notifications from 'expo-notifications';
import { scheduleReminder, cancelReminderById } from '../lib/notify';

describe('notify helpers: schedule + cancel by reminderId', () => {
  test('schedules and cancels associated notifications', async () => {
    const id = 'rem-123';
    const due = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now
    const before = await Notifications.getAllScheduledNotificationsAsync();
    expect(before.length).toBe(0);

    const notifId = await scheduleReminder({ id, title: 'Test', due, personId: '1' });
    expect(typeof notifId).toBe('string');

    const afterSchedule = await Notifications.getAllScheduledNotificationsAsync();
    expect(afterSchedule.length).toBe(1);
    expect(afterSchedule[0].content.data.reminderId).toBe(id);

    await cancelReminderById(id);
    const afterCancel = await Notifications.getAllScheduledNotificationsAsync();
    expect(afterCancel.length).toBe(0);
  });
});
