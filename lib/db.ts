import * as SQLite from 'expo-sqlite';

export type Person = {
  id: number;
  firstName: string;
  lastName: string;
  nickname?: string | null;
  notes?: string | null;
  createdAt: number; // epoch ms
  updatedAt: number; // epoch ms
};

type PersonRow = {
  id: number;
  first_name: string;
  last_name: string;
  nickname: string | null;
  notes: string | null;
  created_at: number;
  updated_at: number;
};

const db = SQLite.openDatabaseSync('crm-orbit.db');

export async function initDb(): Promise<void> {
  await db.execAsync(
    `PRAGMA journal_mode = WAL;
     PRAGMA foreign_keys = ON;
     CREATE TABLE IF NOT EXISTS people (
       id INTEGER PRIMARY KEY AUTOINCREMENT,
       first_name TEXT NOT NULL,
       last_name TEXT NOT NULL,
       nickname TEXT,
       notes TEXT,
       created_at INTEGER NOT NULL,
       updated_at INTEGER NOT NULL
     );
     CREATE INDEX IF NOT EXISTS idx_people_last_first ON people(last_name, first_name);
     CREATE TABLE IF NOT EXISTS interactions (
       id INTEGER PRIMARY KEY AUTOINCREMENT,
       person_id INTEGER NOT NULL,
       happened_at INTEGER NOT NULL,
       channel TEXT NOT NULL,
       summary TEXT NOT NULL,
       FOREIGN KEY (person_id) REFERENCES people(id) ON DELETE CASCADE
     );
     CREATE INDEX IF NOT EXISTS idx_interactions_person_time ON interactions(person_id, happened_at DESC);`
  );
}

function mapRow(row: PersonRow): Person {
  return {
    id: row.id,
    firstName: row.first_name,
    lastName: row.last_name,
    nickname: row.nickname,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export type NewPerson = {
  firstName: string;
  lastName: string;
  nickname?: string | null;
  notes?: string | null;
};

export async function insertPerson(input: NewPerson): Promise<number> {
  const now = Date.now();
  const result = await db.runAsync(
    `INSERT INTO people (first_name, last_name, nickname, notes, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)`,
    [input.firstName, input.lastName, input.nickname ?? null, input.notes ?? null, now, now]
  );
  const id = Number((result as unknown as { lastInsertRowId?: number }).lastInsertRowId);
  if (!Number.isFinite(id)) throw new Error('Failed to get insert id');
  return id;
}

export async function getPeople(): Promise<Person[]> {
  const rows = await db.getAllAsync<PersonRow>(
    `SELECT id, first_name, last_name, nickname, notes, created_at, updated_at FROM people ORDER BY created_at DESC`
  );
  return rows.map(mapRow);
}

export async function getPerson(id: number): Promise<Person | null> {
  const row = await db.getFirstAsync<PersonRow>(
    `SELECT id, first_name, last_name, nickname, notes, created_at, updated_at FROM people WHERE id = ? LIMIT 1`,
    [id]
  );
  return row ? mapRow(row) : null;
}

export type Channel = 'note' | 'call' | 'text' | 'meet';

export type Interaction = {
  id: number;
  personId: number;
  happenedAt: number;
  channel: Channel;
  summary: string;
};

export type NewInteraction = {
  personId: number;
  channel: Channel;
  summary: string;
  happenedAt?: number;
};

export async function insertInteraction(input: NewInteraction): Promise<number> {
  const when = input.happenedAt ?? Date.now();
  const now = Date.now();
  await db.execAsync('BEGIN');
  try {
    const result = await db.runAsync(
      `INSERT INTO interactions (person_id, happened_at, channel, summary) VALUES (?, ?, ?, ?)`,
      [input.personId, when, input.channel, input.summary]
    );
    await db.runAsync(`UPDATE people SET updated_at = ? WHERE id = ?`, [now, input.personId]);
    await db.execAsync('COMMIT');
    const id = Number((result as unknown as { lastInsertRowId?: number }).lastInsertRowId);
    if (!Number.isFinite(id)) throw new Error('Failed to get insert id');
    return id;
  } catch (e) {
    await db.execAsync('ROLLBACK');
    throw e;
  }
}

export async function getInteractionsByPerson(personId: number): Promise<Interaction[]> {
  const rows = await db.getAllAsync<{
    id: number;
    person_id: number;
    happened_at: number;
    channel: string;
    summary: string;
  }>(
    `SELECT id, person_id, happened_at, channel, summary FROM interactions WHERE person_id = ? ORDER BY happened_at DESC`,
    [personId]
  );
  return rows.map((r) => ({
    id: r.id,
    personId: r.person_id,
    happenedAt: r.happened_at,
    channel: r.channel as Channel,
    summary: r.summary,
  }));
}
