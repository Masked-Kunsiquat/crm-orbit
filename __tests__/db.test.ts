import { initDb, insertPerson, getPeople, insertInteraction, getPerson } from '../lib/db';

describe('db: people + updated_at smoke', () => {
  beforeEach(async () => {
    await initDb();
  });

  test('insert and read people', async () => {
    const id = await insertPerson({ firstName: 'Ada', lastName: 'Lovelace', nickname: 'AL' });
    expect(typeof id).toBe('number');

    const people = await getPeople();
    expect(people.length).toBe(1);
    expect(people[0]).toMatchObject({
      id,
      firstName: 'Ada',
      lastName: 'Lovelace',
      nickname: 'AL',
    });
    expect(people[0].createdAt).toBeGreaterThan(0);
    expect(people[0].updatedAt).toBe(people[0].createdAt);
  });

  test('updated_at bumps when adding an interaction', async () => {
    // Freeze time for deterministic timestamps
    const start = 1_700_000_000_000; // epoch ms
    jest.spyOn(Date, 'now').mockReturnValue(start);
    const personId = await insertPerson({ firstName: 'Grace', lastName: 'Hopper' });
    const before = await getPerson(personId);
    expect(before).not.toBeNull();
    expect(before!.updatedAt).toBe(start);

    // Advance time and insert an interaction
    const later = start + 5_000;
    ;(Date.now as jest.Mock).mockReturnValue(later);
    await insertInteraction({ personId, channel: 'note', summary: 'Met at conference' });

    const after = await getPerson(personId);
    expect(after).not.toBeNull();
    expect(after!.updatedAt).toBe(later);
    expect(after!.updatedAt).toBeGreaterThan(before!.updatedAt);
  });
});

