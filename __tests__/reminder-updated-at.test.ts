import { initDb, insertPerson, getPerson, insertReminder, updateReminder, deleteReminder, markReminderDone } from '../lib/db';

describe('person.updated_at bumps on reminder create/edit/delete/done', () => {
  beforeEach(async () => {
    await initDb();
  });

  afterEach(() => {
    // Restore Date.now spy so it doesn't leak across tests
    jest.restoreAllMocks();
  });

  test('updated_at changes across reminder lifecycle', async () => {
    jest.spyOn(Date, 'now').mockReturnValue(1_700_000_000_000);
    const personId = await insertPerson({ firstName: 'Grace', lastName: 'Hopper' });
    const p0 = await getPerson(personId);
    expect(p0).not.toBeNull();
    const t0 = p0!.updatedAt;

    // Create
    ;(Date.now as jest.Mock).mockReturnValue(1_700_000_005_000);
    const rid = await insertReminder({ personId, title: 'Ping', dueAt: '2024-01-01T10:00:00.000Z' });
    const p1 = await getPerson(personId);
    expect(p1!.updatedAt).toBeGreaterThan(t0);

    // Edit
    ;(Date.now as jest.Mock).mockReturnValue(1_700_000_010_000);
    await updateReminder(rid, { title: 'Ping updated', dueAt: '2024-01-02T10:00:00.000Z', personId, notes: null, done: false });
    const p2 = await getPerson(personId);
    expect(p2!.updatedAt).toBeGreaterThan(p1!.updatedAt);

    // Mark done
    ;(Date.now as jest.Mock).mockReturnValue(1_700_000_015_000);
    await markReminderDone(rid, personId);
    const p3 = await getPerson(personId);
    expect(p3!.updatedAt).toBeGreaterThan(p2!.updatedAt);

    // Delete
    ;(Date.now as jest.Mock).mockReturnValue(1_700_000_020_000);
    await deleteReminder(rid, personId);
    const p4 = await getPerson(personId);
    expect(p4!.updatedAt).toBeGreaterThan(p3!.updatedAt);
  });
});
