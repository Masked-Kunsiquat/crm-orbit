import {
  initDb,
  insertPerson,
  getPerson,
  insertInteraction,
  updateInteraction,
  deleteInteraction,
  getInteractionsByPerson,
} from '../lib/db';

describe('interactions: create/edit/delete + sort', () => {
  beforeEach(async () => {
    await initDb();
  });

  test('CRUD with sorting by happened_at desc and updated_at bump', async () => {
    // Create a person
    jest.spyOn(Date, 'now').mockReturnValue(1_700_000_000_000);
    const personId = await insertPerson({ firstName: 'Linus', lastName: 'Torvalds' });
    const p0 = await getPerson(personId);
    expect(p0).not.toBeNull();
    const createdAt = p0!.updatedAt;

    // Create three interactions with specific times
    const t1 = '2024-01-01T10:00:00.000Z';
    const t2 = '2024-02-01T10:00:00.000Z';
    const t3 = '2024-03-01T10:00:00.000Z';

    // Advance time to observe updated_at changes
    ;(Date.now as jest.Mock).mockReturnValue(1_700_000_005_000);
    const id1 = await insertInteraction({ personId, channel: 'note', summary: 'Initial note', happenedAt: t1 });
    const p1 = await getPerson(personId);
    expect(p1!.updatedAt).toBeGreaterThan(createdAt);

    ;(Date.now as jest.Mock).mockReturnValue(1_700_000_010_000);
    const id2 = await insertInteraction({ personId, channel: 'call', summary: 'Kickoff call', happenedAt: t2 });
    const p2 = await getPerson(personId);
    expect(p2!.updatedAt).toBeGreaterThan(p1!.updatedAt);

    ;(Date.now as jest.Mock).mockReturnValue(1_700_000_015_000);
    const id3 = await insertInteraction({ personId, channel: 'meet', summary: 'Coffee chat', happenedAt: t3 });
    const p3 = await getPerson(personId);
    expect(p3!.updatedAt).toBeGreaterThan(p2!.updatedAt);

    // Verify sorting by happened_at desc
    const list1 = await getInteractionsByPerson(personId);
    expect(list1.map((i) => i.id)).toEqual([id3, id2, id1]);

    // Update: move second item to the latest by changing happened_at to newer
    const newer = '2024-04-01T10:00:00.000Z';
    ;(Date.now as jest.Mock).mockReturnValue(1_700_000_020_000);
    await updateInteraction(id2, {
      summary: 'Kickoff call - updated',
      channel: 'call',
      happenedAt: newer,
      personId,
    });
    const p4 = await getPerson(personId);
    expect(p4!.updatedAt).toBeGreaterThan(p3!.updatedAt);

    const list2 = await getInteractionsByPerson(personId);
    expect(list2.map((i) => i.id)).toEqual([id2, id3, id1]);

    // Delete oldest item
    ;(Date.now as jest.Mock).mockReturnValue(1_700_000_025_000);
    await deleteInteraction(id1, personId);
    const p5 = await getPerson(personId);
    expect(p5!.updatedAt).toBeGreaterThan(p4!.updatedAt);

    const list3 = await getInteractionsByPerson(personId);
    expect(list3.map((i) => i.id)).toEqual([id2, id3]);
  });
});

