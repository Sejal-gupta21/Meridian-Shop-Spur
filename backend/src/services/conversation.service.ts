import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../db/database';
import type { Conversation, Message, Sender } from '../types';

// ---------------------------------------------------------------------------
// Conversations
// ---------------------------------------------------------------------------

export function getOrCreateConversation(sessionId?: string): Conversation {
  const db = getDb();

  if (sessionId) {
    const row = db
      .prepare('SELECT * FROM conversations WHERE id = ?')
      .get(sessionId) as Record<string, string> | undefined;

    if (row) {
      return {
        id: row.id,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        metadata: JSON.parse(row.metadata ?? '{}'),
      };
    }
  }

  // Create a new conversation. Use the provided sessionId if supplied so the
  // client keeps the same ID even after a DB reset.
  const id = sessionId ?? uuidv4();
  db.prepare('INSERT INTO conversations (id) VALUES (?)').run(id);

  const created = db
    .prepare('SELECT * FROM conversations WHERE id = ?')
    .get(id) as Record<string, string>;

  return {
    id: created.id,
    createdAt: created.created_at,
    updatedAt: created.updated_at,
    metadata: {},
  };
}

// ---------------------------------------------------------------------------
// Messages
// ---------------------------------------------------------------------------

export function saveMessage(
  conversationId: string,
  sender: Sender,
  text: string,
): Message {
  const db = getDb();
  const id = uuidv4();

  db.prepare(
    'INSERT INTO messages (id, conversation_id, sender, text) VALUES (?, ?, ?, ?)',
  ).run(id, conversationId, sender, text);

  db.prepare(
    "UPDATE conversations SET updated_at = strftime('%Y-%m-%dT%H:%M:%SZ', 'now') WHERE id = ?",
  ).run(conversationId);

  const row = db
    .prepare('SELECT * FROM messages WHERE id = ?')
    .get(id) as Record<string, string>;

  return rowToMessage(row);
}

/** Returns all messages for a conversation, oldest-first (for rendering). */
export function getConversationMessages(
  conversationId: string,
  limit = 100,
): Message[] {
  const rows = getDb()
    .prepare(
      'SELECT * FROM messages WHERE conversation_id = ? ORDER BY created_at ASC LIMIT ?',
    )
    .all(conversationId, limit) as Record<string, string>[];

  return rows.map(rowToMessage);
}

/**
 * Returns the N most-recent messages for a conversation, oldest-first.
 * Used to build the LLM context window.
 */
export function getRecentMessages(
  conversationId: string,
  limit: number,
): Message[] {
  const rows = getDb()
    .prepare(
      `SELECT * FROM (
         SELECT * FROM messages
         WHERE conversation_id = ?
         ORDER BY created_at DESC
         LIMIT ?
       )
       ORDER BY created_at ASC`,
    )
    .all(conversationId, limit) as Record<string, string>[];

  return rows.map(rowToMessage);
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function rowToMessage(row: Record<string, string>): Message {
  return {
    id: row.id,
    conversationId: row.conversation_id,
    sender: row.sender as Sender,
    text: row.text,
    createdAt: row.created_at,
  };
}
