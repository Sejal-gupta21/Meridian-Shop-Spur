# Spur AI Live Chat Agent

A mini AI-powered customer support chat widget — Spur Founding Full-Stack Engineer take-home assignment.

**Live demo:** _(add your deployed URL here)_

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│  Browser (SvelteKit SPA)                                │
│  ┌──────────────┐  fetch /chat/message                  │
│  │  ChatWidget  │ ────────────────────────────────────► │
│  │  MessageBubble│ ◄─────────────────────────────────── │
│  │  TypingIndicator│   { reply, sessionId }             │
│  └──────────────┘                                       │
│  lib/api.ts  (typed fetch wrapper + timeout + errors)   │
└─────────────────────────────────────────────────────────┘
                          │ HTTP
┌─────────────────────────▼───────────────────────────────┐
│  Express + TypeScript (backend/)                        │
│                                                         │
│  src/                                                   │
│  ├── routes/chat.routes.ts   (POST /message, GET /history)│
│  ├── services/               (clear separation)        │
│  │   ├── llm.service.ts      (OpenAI call, prompting)  │
│  │   └── conversation.service.ts (DB CRUD)             │
│  ├── middleware/validate.ts  (Zod input validation)     │
│  ├── config/                                            │
│  │   ├── env.ts              (typed env, fails fast)    │
│  │   └── knowledge.ts        (FAQ / store knowledge)   │
│  ├── db/database.ts          (SQLite + schema migration)│
│  └── types/index.ts          (shared interfaces)       │
└─────────────────────────────────────────────────────────┘
                          │
                  ┌───────▼────────┐
                  │  SQLite (WAL)  │
                  │  conversations │
                  │  messages      │
                  └────────────────┘
```

### Key design decisions

| Decision | Rationale |
|---|---|
| SQLite + better-sqlite3 | Zero-ops, synchronous API fits Express's request/response model; WAL mode is safe for concurrent reads |
| Zod validation at the boundary | Single source of truth for request shape; trims whitespace, enforces length limits before any DB/LLM call |
| knowledge.ts separate from prompt logic | Easy to swap for a DB-driven or retrieval-augmented approach |
| Optimistic UI in the frontend | Instant feedback without waiting for the round-trip |
| sessionId in localStorage | Simple stateless approach; no auth required; survives page reloads |
| gpt-4o-mini | ~10× cheaper than gpt-4o; more than capable for structured support Q&A |

---

## Running Locally

### Prerequisites

- **Node.js 18+** (LTS recommended)
- **npm 9+**
- An **OpenAI API key** — [get one here](https://platform.openai.com/api-keys)

> **Windows note:** `better-sqlite3` ships pre-built binaries for Windows x64 so no C++ build tools are required. If you see a compilation error, run `npm install --global windows-build-tools` and retry.

---

### 1 — Clone & enter the repo

```bash
git clone <your-repo-url>
cd spur-chat
```

### 2 — Backend

```bash
cd backend

# Install dependencies
npm install

# Create .env from the example
cp .env.example .env

# Open .env and set your key:
# OPENAI_API_KEY=sk-...
```

Start the dev server (hot-reloads on file changes):

```bash
npm run dev
# → Server running at http://localhost:3001
```

The SQLite database and schema are **created automatically** on first start at `backend/data/chat.db`. No separate migration step is needed.

### 3 — Frontend

Open a second terminal:

```bash
cd frontend

# Install dependencies
npm install

# Create .env from the example
cp .env.example .env
# VITE_API_URL=http://localhost:3001  (default — leave as-is for local dev)
```

Start the dev server:

```bash
npm run dev
# → http://localhost:5173
```

Open **http://localhost:5173** in your browser and start chatting.

---

## Environment Variables

### Backend (`backend/.env`)

| Variable | Default | Description |
|---|---|---|
| `PORT` | `3001` | Express server port |
| `NODE_ENV` | `development` | `development` \| `production` |
| `OPENAI_API_KEY` | _(required)_ | OpenAI API key |
| `DATABASE_PATH` | `./data/chat.db` | Path to the SQLite file |
| `CORS_ORIGIN` | `http://localhost:5173` | Allowed frontend origin |
| `MAX_MESSAGE_LENGTH` | `5000` | Hard cap on incoming message length (characters) |
| `MAX_HISTORY_MESSAGES` | `20` | Max messages sent to the LLM as context (≈ 10 turns) |

### Frontend (`frontend/.env`)

| Variable | Default | Description |
|---|---|---|
| `VITE_API_URL` | `http://localhost:3001` | Backend base URL |

---

## API Reference

### `POST /chat/message`

**Request body:**
```json
{
  "message": "What is your return policy?",
  "sessionId": "uuid-v4-optional"
}
```

**Success response `200`:**
```json
{
  "reply": "We offer a 30-day return window...",
  "sessionId": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Validation error `400`:**
```json
{
  "error": "Validation error",
  "details": [{ "field": "message", "message": "Message cannot be empty" }]
}
```

### `GET /chat/history/:sessionId`

Returns all messages for an existing conversation. Returns `{ sessionId, messages: [] }` if the session doesn't exist (graceful).

### `GET /health`

Returns `{ "status": "ok", "timestamp": "…" }`.

---

## Database Schema

```sql
conversations
  id          TEXT  PRIMARY KEY          -- UUID v4
  created_at  TEXT  NOT NULL             -- ISO 8601 UTC
  updated_at  TEXT  NOT NULL
  metadata    TEXT  NOT NULL DEFAULT '{}' -- JSON, extensible

messages
  id               TEXT  PRIMARY KEY
  conversation_id  TEXT  NOT NULL REFERENCES conversations(id)
  sender           TEXT  NOT NULL  -- 'user' | 'ai'
  text             TEXT  NOT NULL
  created_at       TEXT  NOT NULL
```

---

## LLM Notes

- **Provider:** OpenAI
- **Model:** `gpt-4o-mini` — fast, cheap (~$0.15 / 1M input tokens), very capable for structured support Q&A
- **System prompt:** `STORE_KNOWLEDGE` in `backend/src/config/knowledge.ts` — a single, well-structured prompt that contains the full FAQ for the fictional *Meridian Shop*. Keeping it in one file makes it trivial to swap for a DB-driven or RAG approach later.
- **Context window:** The last `MAX_HISTORY_MESSAGES` (default 20) messages are sent so replies stay contextual across multi-turn conversations.
- **`max_tokens: 500`** — enough for a detailed support answer (~375 words); prevents runaway costs.
- **Temperature: 0.7** — balanced between deterministic and natural-sounding.
- **Error handling:** `RateLimitError`, `AuthenticationError`, `APIConnectionError`, and `APITimeoutError` from the OpenAI SDK are each caught and surfaced as a user-friendly message in the UI. A 30-second request timeout is set on the client.

---

## Trade-offs & "If I Had More Time…"

| What I kept simple | What I'd do with more time |
|---|---|
| SQLite file-based DB | Migrate to PostgreSQL for multi-instance deployments |
| In-memory OpenAI client (singleton) | Add proper dependency injection or a service container |
| No auth | Add session tokens so users can't read each other's history |
| FAQ hardcoded in `knowledge.ts` | Build an admin UI to edit FAQs; store in DB; add embeddings for RAG retrieval |
| `adapter-auto` for frontend | Use `adapter-node` or `adapter-static` explicitly depending on deploy target |
| No tests | Add Vitest unit tests for services and Playwright e2e for the chat flow |
| Single CORS origin | Make CORS configurable per environment via env list |
| No rate limiting on the backend | Add `express-rate-limit` to protect the `/chat/message` endpoint from abuse |
| Redis cache | Cache recent conversation history reads to reduce DB hits under load |

---

## Deploying

### Backend → [Render](https://render.com) (free tier)

1. Push your repo to GitHub.
2. New Web Service → connect repo → **Root directory:** `backend`.
3. Build command: `npm install && npm run build`
4. Start command: `node dist/index.js`
5. Add environment variables (especially `OPENAI_API_KEY`, `CORS_ORIGIN`).

### Frontend → [Vercel](https://vercel.com) (free tier)

1. Import the repo on Vercel → **Root directory:** `frontend`.
2. Framework preset: **SvelteKit**.
3. Add `VITE_API_URL` pointing to your Render backend URL.

---

## Project Structure

```
spur-chat/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   ├── env.ts                  # Typed env with fail-fast validation
│   │   │   └── knowledge.ts            # Store FAQ injected into every prompt
│   │   ├── db/
│   │   │   └── database.ts             # SQLite connection + auto-migration
│   │   ├── middleware/
│   │   │   └── validate.ts             # Zod body-validation factory
│   │   ├── routes/
│   │   │   └── chat.routes.ts          # POST /message  GET /history/:id
│   │   ├── services/
│   │   │   ├── conversation.service.ts # DB CRUD
│   │   │   └── llm.service.ts          # OpenAI wrapper
│   │   ├── types/
│   │   │   └── index.ts                # Shared TypeScript interfaces
│   │   └── index.ts                    # Express app + bootstrap
│   ├── .env.example
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/
│   ├── src/
│   │   ├── lib/
│   │   │   ├── api.ts                  # Typed fetch wrapper (timeout, errors)
│   │   │   └── components/
│   │   │       ├── ChatWidget.svelte   # Main chat logic + layout
│   │   │       ├── MessageBubble.svelte
│   │   │       └── TypingIndicator.svelte
│   │   ├── routes/
│   │   │   ├── +layout.svelte
│   │   │   └── +page.svelte
│   │   ├── app.css
│   │   └── app.html
│   ├── .env.example
│   ├── package.json
│   ├── svelte.config.js
│   ├── tsconfig.json
│   └── vite.config.ts
│
└── README.md
```
