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

const db = SQLite.openDatabase('crm-orbit.db');

function executeSql(sql: string, params: unknown[] = []): Promise<SQLite.SQLResultSet> {
  return new Promise((resolve, reject) => {
    db.transaction((tx) => {
      tx.executeSql(
        sql,
        params,
        (_tx, result) => resolve(result),
        (_tx, error) => {
          reject(error);
          return true;
        }
      );
    });
  });
}

export async function initDb(): Promise<void> {
  await executeSql(
    `CREATE TABLE IF NOT EXISTS people (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      nickname TEXT,
      notes TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    )`
  );
  await executeSql(
    `CREATE INDEX IF NOT EXISTS idx_people_last_first ON people(last_name, first_name)`
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
  const res = await executeSql(
    `INSERT INTO people (first_name, last_name, nickname, notes, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [input.firstName, input.lastName, input.nickname ?? null, input.notes ?? null, now, now]
  );
  const id = res.insertId;
  if (typeof id !== 'number') {
    throw new Error('Failed to retrieve insert id');
  }
  return id;
}

export async function getPeople(): Promise<Person[]> {
  const res = await executeSql(
    `SELECT id, first_name, last_name, nickname, notes, created_at, updated_at
     FROM people
     ORDER BY created_at DESC`
  );
  const rows = res.rows as unknown as { length: number; item: (index: number) => PersonRow };
  const out: Person[] = [];
  for (let i = 0; i < rows.length; i += 1) {
    out.push(mapRow(rows.item(i)));
  }
  return out;
}

export async function getPerson(id: number): Promise<Person | null> {
  const res = await executeSql(
    `SELECT id, first_name, last_name, nickname, notes, created_at, updated_at
     FROM people WHERE id = ? LIMIT 1`,
    [id]
  );
  const rows = res.rows as unknown as { length: number; item: (index: number) => PersonRow };
  if (rows.length === 0) return null;
  return mapRow(rows.item(0));
}

