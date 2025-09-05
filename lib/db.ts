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
     CREATE TABLE IF NOT EXISTS people (
       id INTEGER PRIMARY KEY AUTOINCREMENT,
       first_name TEXT NOT NULL,
       last_name TEXT NOT NULL,
       nickname TEXT,
       notes TEXT,
       created_at INTEGER NOT NULL,
       updated_at INTEGER NOT NULL
     );
     CREATE INDEX IF NOT EXISTS idx_people_last_first ON people(last_name, first_name);`
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
