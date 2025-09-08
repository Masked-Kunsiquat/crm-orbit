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

// Simple id generator (TEXT PK). Avoids extra deps.
function generateId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export async function initDb(): Promise<void> {
  await db.execAsync(`PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;`);

  // People table stays as originally defined
  await db.execAsync(
    `CREATE TABLE IF NOT EXISTS people (
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

  // Ensure interactions table exists with TEXT PK + ISO datetime. Migrate if needed.
  const existing = await db.getFirstAsync<{ name: string; sql: string }>(
    `SELECT name, sql FROM sqlite_master WHERE type='table' AND name='interactions'`
  );

  if (!existing) {
    await db.execAsync(
      `CREATE TABLE IF NOT EXISTS interactions (
        id TEXT PRIMARY KEY,
        person_id TEXT NOT NULL,
        happened_at TEXT NOT NULL,
        channel TEXT NOT NULL,
        summary TEXT NOT NULL,
        FOREIGN KEY (person_id) REFERENCES people(id) ON DELETE CASCADE
      );
      CREATE INDEX IF NOT EXISTS idx_interactions_person_time ON interactions(person_id, happened_at DESC);`
    );
  } else {
    const cols = await db.getAllAsync<{ name: string; type: string }>(
      `PRAGMA table_info('interactions')`
    );
    const colMap = new Map(cols.map((c) => [c.name, c.type.toUpperCase()]));
    const needsMigration = !(
      colMap.get('id')?.includes('TEXT') &&
      colMap.get('person_id')?.includes('TEXT') &&
      colMap.get('happened_at')?.includes('TEXT')
    );
    if (needsMigration) {
      await db.execAsync('BEGIN');
      try {
        await db.execAsync(
          `CREATE TABLE interactions_new (
            id TEXT PRIMARY KEY,
            person_id TEXT NOT NULL,
            happened_at TEXT NOT NULL,
            channel TEXT NOT NULL,
            summary TEXT NOT NULL,
            FOREIGN KEY (person_id) REFERENCES people(id) ON DELETE CASCADE
          );`
        );
        // Copy rows in JS to transform types to TEXT/ISO
        const oldRows = await db.getAllAsync<any>(
          `SELECT id, person_id, happened_at, channel, summary FROM interactions`
        );
        for (const r of oldRows) {
          const newId = String(r.id ?? generateId());
          const newPersonId = String(r.person_id);
          const iso = typeof r.happened_at === 'string'
            ? r.happened_at
            : new Date(Number(r.happened_at ?? Date.now())).toISOString();
          const chan = String(r.channel ?? 'note');
          const sum = String(r.summary ?? '');
          await db.runAsync(
            `INSERT INTO interactions_new (id, person_id, happened_at, channel, summary) VALUES (?, ?, ?, ?, ?)`,
            [newId, newPersonId, iso, chan, sum]
          );
        }
        await db.execAsync(`DROP TABLE interactions;`);
        await db.execAsync(`ALTER TABLE interactions_new RENAME TO interactions;`);
        await db.execAsync(
          `CREATE INDEX IF NOT EXISTS idx_interactions_person_time ON interactions(person_id, happened_at DESC);`
        );
        await db.execAsync('COMMIT');
      } catch (e) {
        await db.execAsync('ROLLBACK');
        throw e;
      }
    } else {
      await db.execAsync(
        `CREATE INDEX IF NOT EXISTS idx_interactions_person_time ON interactions(person_id, happened_at DESC);`
      );
    }
  }

  // Reminders table (Phase 3): TEXT PK, person_id TEXT FK, ISO8601 due_at
  await db.execAsync(
    `CREATE TABLE IF NOT EXISTS reminders (
      id TEXT PRIMARY KEY,
      person_id TEXT NOT NULL,
      due_at TEXT NOT NULL,
      title TEXT NOT NULL,
      notes TEXT,
      done INTEGER NOT NULL DEFAULT 0,
      FOREIGN KEY (person_id) REFERENCES people(id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_reminders_due ON reminders(due_at);
    CREATE INDEX IF NOT EXISTS idx_reminders_person ON reminders(person_id, due_at);`
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
  id: string;
  personId: string;
  happenedAt: string; // ISO 8601
  channel: Channel;
  summary: string;
};

export type NewInteraction = {
  personId: string | number; // store as TEXT
  channel: Channel;
  summary: string;
  happenedAt?: string; // ISO 8601
};

export async function insertInteraction(input: NewInteraction): Promise<string> {
  const id = generateId();
  const when = input.happenedAt ?? new Date().toISOString();
  const now = Date.now();
  await db.execAsync('BEGIN');
  try {
    await db.runAsync(
      `INSERT INTO interactions (id, person_id, happened_at, channel, summary) VALUES (?, ?, ?, ?, ?)`,
      [id, String(input.personId), when, input.channel, input.summary]
    );
    await db.runAsync(`UPDATE people SET updated_at = ? WHERE id = ?`, [now, Number(input.personId)]);
    await db.execAsync('COMMIT');
    return id;
  } catch (e) {
    await db.execAsync('ROLLBACK');
    throw e;
  }
}

export async function updateInteraction(
  id: string,
  changes: { summary: string; channel: Channel; happenedAt: string; personId: string | number }
): Promise<void> {
  const now = Date.now();
  await db.execAsync('BEGIN');
  try {
    await db.runAsync(
      `UPDATE interactions SET summary = ?, channel = ?, happened_at = ?, person_id = ? WHERE id = ?`,
      [changes.summary, changes.channel, changes.happenedAt, String(changes.personId), id]
    );
    await db.runAsync(`UPDATE people SET updated_at = ? WHERE id = ?`, [now, Number(changes.personId)]);
    await db.execAsync('COMMIT');
  } catch (e) {
    await db.execAsync('ROLLBACK');
    throw e;
  }
}

export async function deleteInteraction(id: string, personId: string | number): Promise<void> {
  const now = Date.now();
  await db.execAsync('BEGIN');
  try {
    await db.runAsync(`DELETE FROM interactions WHERE id = ?`, [id]);
    await db.runAsync(`UPDATE people SET updated_at = ? WHERE id = ?`, [now, Number(personId)]);
    await db.execAsync('COMMIT');
  } catch (e) {
    await db.execAsync('ROLLBACK');
    throw e;
  }
}

export async function getInteractionsByPerson(personId: string | number): Promise<Interaction[]> {
  const rows = await db.getAllAsync<{
    id: string;
    person_id: string;
    happened_at: string;
    channel: string;
    summary: string;
  }>(
    `SELECT id, person_id, happened_at, channel, summary FROM interactions WHERE person_id = ? ORDER BY happened_at DESC`,
    [String(personId)]
  );
  return rows.map((r) => ({
    id: r.id,
    personId: String(r.person_id),
    happenedAt: r.happened_at,
    channel: r.channel as Channel,
    summary: r.summary,
  }));
}

export async function getInteractionById(id: string): Promise<Interaction | null> {
  const r = await db.getFirstAsync<{
    id: string;
    person_id: string;
    happened_at: string;
    channel: string;
    summary: string;
  }>(`SELECT id, person_id, happened_at, channel, summary FROM interactions WHERE id = ? LIMIT 1`, [id]);
  if (!r) return null;
  return {
    id: r.id,
    personId: String(r.person_id),
    happenedAt: r.happened_at,
    channel: r.channel as Channel,
    summary: r.summary,
  };
}

// -----------------
// Reminders (Phase 3)
// -----------------

export type Reminder = {
  id: string;
  personId: string; // stored as TEXT
  dueAt: string; // ISO 8601
  title: string;
  notes?: string | null;
  done: boolean;
};

export type NewReminder = {
  personId: string | number;
  title: string;
  dueAt: string; // ISO 8601
  notes?: string | null;
};

function mapReminderRow(r: { id: string; person_id: string; due_at: string; title: string; notes: string | null; done: number }): Reminder {
  return {
    id: r.id,
    personId: String(r.person_id),
    dueAt: r.due_at,
    title: r.title,
    notes: r.notes,
    done: Number(r.done) === 1,
  };
}

export async function insertReminder(input: NewReminder): Promise<string> {
  const id = generateId();
  const now = Date.now();
  await db.execAsync('BEGIN');
  try {
    await db.runAsync(
      `INSERT INTO reminders (id, person_id, due_at, title, notes, done) VALUES (?, ?, ?, ?, ?, 0)`,
      [id, String(input.personId), input.dueAt, input.title, input.notes ?? null]
    );
    await db.runAsync(`UPDATE people SET updated_at = ? WHERE id = ?`, [now, Number(input.personId)]);
    await db.execAsync('COMMIT');
    return id;
  } catch (e) {
    await db.execAsync('ROLLBACK');
    throw e;
  }
}

export async function updateReminder(
  id: string,
  changes: { title: string; dueAt: string; notes?: string | null; done?: boolean; personId: string | number }
): Promise<void> {
  const now = Date.now();
  await db.execAsync('BEGIN');
  try {
    const sets: string[] = ['title = ?', 'due_at = ?', 'notes = ?'];
    const params: any[] = [changes.title, changes.dueAt, changes.notes ?? null];

    // Only include done when explicitly provided by caller
    const hasDone = Object.prototype.hasOwnProperty.call(changes, 'done');
    if (hasDone) {
      sets.push('done = ?');
      params.push(changes.done ? 1 : 0);
    }

    const sql = `UPDATE reminders SET ${sets.join(', ')} WHERE id = ?`;
    params.push(id);

    await db.runAsync(sql, params);
    await db.runAsync(`UPDATE people SET updated_at = ? WHERE id = ?`, [now, Number(changes.personId)]);
    await db.execAsync('COMMIT');
  } catch (e) {
    await db.execAsync('ROLLBACK');
    throw e;
  }
}

export async function markReminderDone(id: string, personId: string | number): Promise<void> {
  const now = Date.now();
  await db.execAsync('BEGIN');
  try {
    await db.runAsync(`UPDATE reminders SET done = 1 WHERE id = ?`, [id]);
    await db.runAsync(`UPDATE people SET updated_at = ? WHERE id = ?`, [now, Number(personId)]);
    await db.execAsync('COMMIT');
  } catch (e) {
    await db.execAsync('ROLLBACK');
    throw e;
  }
}

export async function deleteReminder(id: string, personId: string | number): Promise<void> {
  const now = Date.now();
  await db.execAsync('BEGIN');
  try {
    await db.runAsync(`DELETE FROM reminders WHERE id = ?`, [id]);
    await db.runAsync(`UPDATE people SET updated_at = ? WHERE id = ?`, [now, Number(personId)]);
    await db.execAsync('COMMIT');
  } catch (e) {
    await db.execAsync('ROLLBACK');
    throw e;
  }
}

export async function getReminderById(id: string): Promise<Reminder | null> {
  const r = await db.getFirstAsync<{
    id: string;
    person_id: string;
    due_at: string;
    title: string;
    notes: string | null;
    done: number;
  }>(
    `SELECT id, person_id, due_at, title, notes, done FROM reminders WHERE id = ? LIMIT 1`,
    [id]
  );
  return r ? mapReminderRow(r) : null;
}

export async function getUpcomingRemindersByPerson(
  personId: string | number,
  limit = 5
): Promise<Reminder[]> {
  const rows = await db.getAllAsync<{
    id: string;
    person_id: string;
    due_at: string;
    title: string;
    notes: string | null;
    done: number;
  }>(
    `SELECT id, person_id, due_at, title, notes, done
     FROM reminders
     WHERE person_id = ? AND done = 0
     ORDER BY due_at ASC
     LIMIT ?`,
    [String(personId), Number(limit)]
  );
  return rows.map(mapReminderRow);
}
