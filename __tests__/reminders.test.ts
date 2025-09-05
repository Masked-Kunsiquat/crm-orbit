import {
  initDb,
  insertPerson,
  insertReminder,
  getUpcomingRemindersByPerson,
  markReminderDone,
} from '../lib/db';

describe('reminders: insert + list upcoming + done hides', () => {
  beforeEach(async () => {
    await initDb();
  });

  test('sorted ASC by due_at; done not listed', async () => {
    jest.spyOn(Date, 'now').mockReturnValue(1_700_000_000_000);
    const personId = await insertPerson({ firstName: 'Ada', lastName: 'Lovelace' });

    const r1 = await insertReminder({ personId, title: 'First', dueAt: '2024-01-01T10:00:00.000Z' });
    const r2 = await insertReminder({ personId, title: 'Second', dueAt: '2024-01-02T10:00:00.000Z' });
    const r3 = await insertReminder({ personId, title: 'Third', dueAt: '2024-01-03T10:00:00.000Z' });

    const list1 = await getUpcomingRemindersByPerson(personId, 5);
    expect(list1.map((r) => r.title)).toEqual(['First', 'Second', 'Third']);

    // Mark middle one done; should be hidden
    await markReminderDone(r2, personId);

    const list2 = await getUpcomingRemindersByPerson(personId, 5);
    expect(list2.map((r) => r.title)).toEqual(['First', 'Third']);
  });
});

