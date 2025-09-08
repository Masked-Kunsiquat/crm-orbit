// Extend jest-dom / jest-native matchers
import '@testing-library/jest-native/extend-expect';

// Lightweight and deterministic mocks for Expo + Router + SQLite

// 1) Mock expo-router with a minimal Link and useFocusEffect wrapper
jest.mock('expo-router', () => {
  const React = require('react');
  const { useEffect, useRef } = React;
  return {
    // Render-only Link; no navigation in tests
    Link: ({ children }: any) => React.createElement(React.Fragment, null, children),
    // Throttled focus bridge: run on mount and at most once per render burst
    useFocusEffect: (effect: any) => {
      const lastRunRef = useRef(0);
      useEffect(() => {
        const now = Date.now();
        if (now - lastRunRef.current > 5) {
          lastRunRef.current = now;
          return effect();
        }
        return undefined;
      });
    },
  };
});

// 2) Mock expo-secure-store with in-memory Map
jest.mock('expo-secure-store', () => {
  const store = new Map<string, string>();
  return {
    getItemAsync: jest.fn(async (key: string) => (store.has(key) ? store.get(key)! : null)),
    setItemAsync: jest.fn(async (key: string, value: string) => {
      store.set(key, value);
    }),
    deleteItemAsync: jest.fn(async (key: string) => {
      store.delete(key);
    }),
    __reset: () => store.clear(),
  };
});

// 3) Mock expo-local-authentication with tunable results
jest.mock('expo-local-authentication', () => {
  const state = {
    hasHardware: true,
    isEnrolled: true,
    result: { success: true, warning: undefined as string | undefined },
  };
  return {
    hasHardwareAsync: jest.fn(async () => state.hasHardware),
    isEnrolledAsync: jest.fn(async () => state.isEnrolled),
    authenticateAsync: jest.fn(async () => {
      return state.result;
    }),
    __setMock: (overrides: Partial<typeof state>) => Object.assign(state, overrides),
  };
});

// 4) Mock expo-sqlite with a tiny in-memory engine tailored to lib/db.ts usage
jest.mock('expo-sqlite', () => {
  // Plain JS shapes to satisfy Jest's mock factory scoping
  const state = {
    people: [] as any[],
    interactions: [] as any[],
    reminders: [] as any[],
    peopleAutoId: 1,
    inTx: false,
  };

  function reset() {
    state.people = [];
    state.interactions = [];
    state.reminders = [];
    state.peopleAutoId = 1;
    state.inTx = false;
  }

  function openDatabaseSync() {
    return {
      async execAsync(sql: string) {
        // Handle basic transaction and DDL no-ops
        const chunks = sql.split(';').map((s) => s.trim()).filter(Boolean);
        for (const s of chunks) {
          const upper = s.toUpperCase();
          if (upper === 'BEGIN' || upper.startsWith('BEGIN TRANSACTION')) {
            state.inTx = true;
          } else if (upper === 'COMMIT') {
            state.inTx = false;
          } else if (upper === 'ROLLBACK') {
            state.inTx = false;
          } // PRAGMA / CREATE TABLE / CREATE INDEX are ignored as no-ops
        }
      },
      async runAsync(sql: string, params: any[] = []) {
        const s = sql.trim().replace(/\s+/g, ' ').toUpperCase();
        // INSERT person
        if (s.startsWith('INSERT INTO PEOPLE')) {
          const [firstName, lastName, nickname, notes, createdAt, updatedAt] = params;
          const row = {
            id: state.peopleAutoId++,
            first_name: String(firstName),
            last_name: String(lastName),
            nickname: nickname ?? null,
            notes: notes ?? null,
            created_at: Number(createdAt),
            updated_at: Number(updatedAt),
          };
          state.people.push(row);
          return { lastInsertRowId: row.id } as any;
        }
        // UPDATE people.updated_at
        if (s.startsWith('UPDATE PEOPLE SET UPDATED_AT')) {
          const [ts, id] = params;
          const pid = Number(id);
          const p = state.people.find((x) => x.id === pid);
          if (p) p.updated_at = Number(ts);
          return {} as any;
        }
        // INSERT interaction
        if (s.startsWith('INSERT INTO INTERACTIONS')) {
          const [id, personId, happenedAt, channel, summary] = params;
          state.interactions.push({
            id: String(id),
            person_id: String(personId),
            happened_at: String(happenedAt),
            channel: String(channel),
            summary: String(summary),
          });
          return {} as any;
        }
        // UPDATE interaction
        if (s.startsWith('UPDATE INTERACTIONS SET')) {
          const [summary, channel, happenedAt, personId, id] = params;
          const it = state.interactions.find((r) => r.id === String(id));
          if (it) {
            it.summary = String(summary);
            it.channel = String(channel);
            it.happened_at = String(happenedAt);
            it.person_id = String(personId);
          }
          return {} as any;
        }
        // DELETE interaction
        if (s.startsWith('DELETE FROM INTERACTIONS')) {
          const [id] = params;
          const target = String(id);
          state.interactions = state.interactions.filter((r) => r.id !== target);
          return {} as any;
        }
        // INSERT reminder
        if (s.startsWith('INSERT INTO REMINDERS')) {
          const [id, personId, dueAt, title, notes] = params;
          state.reminders.push({
            id: String(id),
            person_id: String(personId),
            due_at: String(dueAt),
            title: String(title),
            notes: notes ?? null,
            done: 0,
          });
          return {} as any;
        }
        // UPDATE reminder done-only variant
        if (s.startsWith('UPDATE REMINDERS SET DONE = 1 WHERE ID =')) {
          const [id] = params;
          const r = state.reminders.find((x) => x.id === String(id));
          if (r) r.done = 1;
          return {} as any;
        }
        // UPDATE reminder (supports variants with or without `done = ?`)
        if (s.startsWith('UPDATE REMINDERS SET')) {
          const hasDone = s.includes(' DONE = ?');
          const title = params[0];
          const dueAt = params[1];
          const notes = params[2];
          const done = hasDone ? params[3] : undefined;
          const id = hasDone ? params[4] : params[3];
          const r = state.reminders.find((x) => x.id === String(id));
          if (r) {
            r.title = String(title);
            r.due_at = String(dueAt);
            r.notes = notes ?? null;
            if (hasDone) {
              r.done = Number(done) ? 1 : 0;
            }
          }
          return {} as any;
        }
        // DELETE reminder
        if (s.startsWith('DELETE FROM REMINDERS')) {
          const [id] = params;
          state.reminders = state.reminders.filter((r) => r.id !== String(id));
          return {} as any;
        }
        // Unhandled runAsync SQL
        return {} as any;
      },
      async getAllAsync(sql: string, params: any[] = []) {
        const S = sql.trim().replace(/\s+/g, ' ').toUpperCase();
        // SELECT people ordered
        if (S.startsWith('SELECT ID, FIRST_NAME, LAST_NAME')) {
          const rows = [...state.people].sort((a, b) => b.created_at - a.created_at);
          return rows as any[];
        }
        // PRAGMA table_info('interactions') GÇö return expected columns
        if (S.startsWith('PRAGMA TABLE_INFO')) {
          return [
            { name: 'id', type: 'TEXT' },
            { name: 'person_id', type: 'TEXT' },
            { name: 'happened_at', type: 'TEXT' },
            { name: 'channel', type: 'TEXT' },
            { name: 'summary', type: 'TEXT' },
          ] as any[];
        }
        // SELECT interactions by person ordered desc by happened_at
        if (S.startsWith('SELECT ID, PERSON_ID, HAPPENED_AT, CHANNEL, SUMMARY FROM INTERACTIONS WHERE PERSON_ID =')) {
          const [personId] = params;
          const rows = state.interactions
            .filter((r) => r.person_id === String(personId))
            .sort((a, b) => (a.happened_at > b.happened_at ? -1 : a.happened_at < b.happened_at ? 1 : 0));
          return rows as any[];
        }
        // SELECT reminders upcoming by person asc by due_at with limit
        if (S.startsWith('SELECT ID, PERSON_ID, DUE_AT, TITLE, NOTES, DONE FROM REMINDERS WHERE PERSON_ID =')) {
          const [personId, limit] = params;
          const max = Number(limit) || 5;
          const rows = state.reminders
            .filter((r) => r.person_id === String(personId) && r.done === 0)
            .sort((a, b) => (a.due_at < b.due_at ? -1 : a.due_at > b.due_at ? 1 : 0))
            .slice(0, max);
          return rows as any[];
        }
        return [] as any[];
      },
      async getFirstAsync(sql: string, params: any[] = []) {
        const S = sql.trim().replace(/\s+/g, ' ').toUpperCase();
        // sqlite_master check for interactions
        if (S.includes("FROM SQLITE_MASTER") && S.includes("NAME='INTERACTIONS'")) {
          // Simulate not existing; initDb will create it
          return undefined as any;
        }
        // SELECT person by id
        if (S.startsWith('SELECT ID, FIRST_NAME, LAST_NAME') && S.includes('FROM PEOPLE WHERE ID =')) {
          const [id] = params;
          const pid = Number(id);
          const row = state.people.find((p) => p.id === pid);
          return (row ?? undefined) as any;
        }
        // SELECT interaction by id
        if (S.startsWith('SELECT ID, PERSON_ID, HAPPENED_AT, CHANNEL, SUMMARY FROM INTERACTIONS WHERE ID =')) {
          const [id] = params;
          const row = state.interactions.find((r) => r.id === String(id));
          return (row ?? undefined) as any;
        }
        // SELECT reminder by id
        if (S.startsWith('SELECT ID, PERSON_ID, DUE_AT, TITLE, NOTES, DONE FROM REMINDERS WHERE ID =')) {
          const [id] = params;
          const row = state.reminders.find((r) => r.id === String(id));
          return (row ?? undefined) as any;
        }
        return undefined as any;
      },
    };
  }

  return {
    openDatabaseSync,
    __resetDb: reset,
  };
});

// 5) Mock expo-notifications with in-memory scheduled notifications
jest.mock('expo-notifications', () => {
  const scheduled = [] as any[];
  let counter = 0;
  return {
    // Provide runtime enum used by code under test
    SchedulableTriggerInputTypes: {
      CALENDAR: 'calendar',
      DAILY: 'daily',
      WEEKLY: 'weekly',
      MONTHLY: 'monthly',
      YEARLY: 'yearly',
      DATE: 'date',
      TIME_INTERVAL: 'timeInterval',
    },
    setNotificationHandler: jest.fn(async () => {}),
    requestPermissionsAsync: jest.fn(async () => ({ status: 'granted' })),
    setNotificationChannelAsync: jest.fn(async () => {}),
    scheduleNotificationAsync: jest.fn(async ({ content, trigger }: any) => {
      const id = `notif-${++counter}`;
      scheduled.push({ identifier: id, content, trigger });
      return id;
    }),
    getAllScheduledNotificationsAsync: jest.fn(async () => scheduled.map((s) => ({ ...s }))),
    cancelScheduledNotificationAsync: jest.fn(async (id: string) => {
      const idx = scheduled.findIndex((s) => s.identifier === id);
      if (idx >= 0) scheduled.splice(idx, 1);
    }),
    __reset: () => {
      scheduled.splice(0, scheduled.length);
      counter = 0;
    },
    resetMock: () => {
      scheduled.splice(0, scheduled.length);
      counter = 0;
    },
  };
});

// Ensure a clean slate between tests
beforeEach(() => {
  // Reset expo-secure-store
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const SecureStore = require('expo-secure-store');
    SecureStore.__reset?.();
  } catch {}
  // Reset in-memory sqlite
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const SQLite = require('expo-sqlite');
    SQLite.__resetDb?.();
  } catch {}
  // Reset expo-notifications scheduled list
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const Notifications = require('expo-notifications');
    Notifications.__reset?.();
  } catch {}
});


