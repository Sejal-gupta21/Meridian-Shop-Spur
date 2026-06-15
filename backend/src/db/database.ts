import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { env } from '../config/env';

let db: Database.Database | null = null;

const SCHEMA = `
CREATE TABLE IF NOT EXISTS conversations (
  id          TEXT PRIMARY KEY,
  created_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
  updated_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
  metadata    TEXT NOT NULL DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS messages (
  id               TEXT PRIMARY KEY,
  conversation_id  TEXT NOT NULL,
  sender           TEXT NOT NULL CHECK(sender IN ('user', 'ai')),
  text             TEXT NOT NULL,
  created_at       TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
  FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at      ON messages(created_at);
`;

export function getDb(): Database.Database {
  if (!db) {
    const dbPath = path.resolve(env.databasePath);
    const dbDir = path.dirname(dbPath);

    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }

    db = new Database(dbPath);
    // WAL mode: better read concurrency and faster writes.
    db.pragma('journal_mode = WAL');
    // Enforce foreign-key constraints.
    db.pragma('foreign_keys = ON');
    db.exec(SCHEMA);
  }

  return db;
}
