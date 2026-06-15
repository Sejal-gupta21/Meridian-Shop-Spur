# 🚀Meridian Shop — AI-Powered Live Chat Agent

> A modern, full-stack customer support chat widget powered by AI. Built with **SvelteKit** (frontend) and **Express + TypeScript** (backend), featuring real-time conversations, session persistence, and seamless deployment to Vercel & Render.

**✨ Features**
- 💬 Real-time AI responses via OpenAI GPT-4o-mini
- 🗣️ Multi-turn conversation memory with SQLite persistence
- 📱 Responsive, accessible chat UI (Svelte)
- ⚡ Type-safe TypeScript across the stack
- 🔒 CORS-protected API
- 📊 Session tracking with localStorage fallback
- 🚀 Production-ready deployments (Vercel + Render)

**Live Demo:** (https://meridian-shop-spur-psi.vercel.app) 

---

## 📋 Quick Start

### Prerequisites

- **Node.js 20.x** (required for backend; frontend works with 18+)
- **npm 9+**
- **OpenAI API Key** — Get one free at [platform.openai.com](https://platform.openai.com/api-keys)

> **On Windows?** No build tools needed — `better-sqlite3` has prebuilt binaries. If you see errors, install [windows-build-tools](https://www.npmjs.com/package/windows-build-tools).

### 1️⃣ Clone & Setup

```bash
git clone https://github.com/Sejal-gupta21/Meridian-Shop-Spur.git
cd Meridian-Shop-Spur
```

### 2️⃣ Backend Setup (Terminal 1)

```bash
cd backend

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env

# ⚠️ REQUIRED: Edit .env and add your OpenAI API key
# GEMINI_API_KEY=sk-... (or your actual Gemini/OpenAI key)

# Start development server
npm run dev
# ✅ Server running at http://localhost:3001
```

The database (`backend/data/chat.db`) is **created automatically** on first start.

### 3️⃣ Frontend Setup (Terminal 2)

```bash
cd frontend

# Install dependencies
npm install

# Set up environment (optional for local dev)
cp .env.example .env

# Start development server
npm run dev
# ✅ Open http://localhost:5173 in your browser
```

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  Frontend (SvelteKit + Svelte)                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  ChatWidget.svelte (UI + state)                     │   │
│  │  ├── MessageBubble.svelte (display)                 │   │
│  │  ├── TypingIndicator.svelte (feedback)              │   │
│  │  └── lib/api.ts (typed HTTP client)                 │   │
│  └─────────────────────────────────────────────────────┘   │
└──────────────────────┬──────────────────────────────────────┘
                       │ HTTPS
┌──────────────────────▼──────────────────────────────────────┐
│  Backend (Express + TypeScript)                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Routes                                             │   │
│  │  ├── POST /chat/message (send + get reply)          │   │
│  │  ├── GET  /chat/history/:sessionId (get history)    │   │
│  │  └── GET  /health (status check)                    │   │
│  ├─────────────────────────────────────────────────────┤   │
│  │  Services                                           │   │
│  │  ├── llm.service.ts (OpenAI integration)            │   │
│  │  ├── conversation.service.ts (DB CRUD)              │   │
│  │  └── validate.ts (Zod input validation)             │   │
│  ├─────────────────────────────────────────────────────┤   │
│  │  Data Layer                                         │   │
│  │  └── database.ts (SQLite + auto-migration)          │   │
│  └─────────────────────────────────────────────────────┘   │
└──────────────────────┬──────────────────────────────────────┘
                       │
              ┌────────▼─────────┐
              │  SQLite DB       │
              │  conversations   │
              │  messages        │
              └──────────────────┘
```

### 🎯 Key Design Principles

| Aspect | Decision | Why |
|--------|----------|-----|
| **Database** | SQLite + better-sqlite3 | Zero ops, sync API, WAL mode safe for reads |
| **Validation** | Zod schemas at boundary | Type-safe, composable, fail-fast |
| **State** | sessionId in localStorage | Stateless backend, survives reloads |
| **LLM** | gpt-4o-mini | 10× cheaper, very capable for structured Q&A |
| **API Style** | REST + JSON | Simple, cacheable, widely supported |
| **Error Handling** | Typed errors in UI | Users see friendly messages, not stack traces |

---

## 🔧 Environment Variables

### Backend (`backend/.env`)

```dotenv
# Server
PORT=3001
NODE_ENV=production

# Database
DATABASE_PATH=/data/chat.db          # Use /data on Render for persistence

# LLM (REQUIRED)
GEMINI_API_KEY=sk-your-openai-key...

# Frontend URL (CORS)
CORS_ORIGIN=https://your-frontend.vercel.app

# Limits
MAX_MESSAGE_LENGTH=5000
MAX_HISTORY_MESSAGES=20
```

> ⚠️ **Important:** `CORS_ORIGIN` must NOT have a trailing slash. ✅ `https://example.com` ❌ `https://example.com/`

### Frontend (`frontend/.env`)

```dotenv
# Backend API URL
VITE_API_URL=https://your-backend.onrender.com
```

---

## 📡 API Reference

### Send a Message

```bash
POST /chat/message
Content-Type: application/json

{
  "message": "What is your return policy?",
  "sessionId": "optional-uuid-v4"  # If omitted, new session created
}
```

**✅ Response (200)**
```json
{
  "reply": "We offer a 30-day return window on all merchandise...",
  "sessionId": "550e8400-e29b-41d4-a716-446655440000"
}
```

**❌ Validation Error (400)**
```json
{
  "error": "Validation failed",
  "details": [
    { "field": "message", "message": "Message is required" }
  ]
}
```

### Get Conversation History

```bash
GET /chat/history/{sessionId}
```

**Response**
```json
{
  "sessionId": "550e8400-e29b-41d4-a716-446655440000",
  "messages": [
    { "id": "...", "sender": "user", "text": "Hi", "created_at": "2026-06-15T13:00:00Z" },
    { "id": "...", "sender": "ai", "text": "Hello! How can I help?", "created_at": "2026-06-15T13:00:02Z" }
  ]
}
```

### Health Check

```bash
GET /health
```

**Response**
```json
{ "status": "ok", "timestamp": "2026-06-15T13:00:00Z" }
```

---

## 📁 Project Structure

```
Meridian-Shop-Spur/
│
├── 📦 backend/
│   ├── src/
│   │   ├── index.ts                    # Express app bootstrap
│   │   ├── config/
│   │   │   ├── env.ts                  # Typed env validation (Zod)
│   │   │   └── knowledge.ts            # Store FAQ/knowledge base
│   │   ├── db/
│   │   │   └── database.ts             # SQLite connection & migrations
│   │   ├── middleware/
│   │   │   └── validate.ts             # Request validation (Zod)
│   │   ├── routes/
│   │   │   └── chat.routes.ts          # Chat endpoints
│   │   ├── services/
│   │   │   ├── llm.service.ts          # OpenAI wrapper
│   │   │   └── conversation.service.ts # DB operations
│   │   └── types/
│   │       └── index.ts                # Shared TypeScript types
│   ├── package.json                    # Node 20.x required
│   ├── tsconfig.json
│   └── .env.example
│
├── 📦 frontend/
│   ├── src/
│   │   ├── routes/
│   │   │   ├── +page.svelte            # Main chat page
│   │   │   └── +layout.svelte          # App layout
│   │   ├── lib/
│   │   │   ├── api.ts                  # Fetch wrapper (errors, timeout)
│   │   │   └── components/
│   │   │       ├── ChatWidget.svelte   # Main chat component
│   │   │       ├── MessageBubble.svelte # Message display
│   │   │       └── TypingIndicator.svelte # Loading state
│   │   ├── app.css                     # Styles
│   │   └── app.html                    # HTML template
│   ├── package.json
│   ├── svelte.config.js
│   ├── vite.config.ts
│   ├── tsconfig.json
│   └── .env.example
│
└── README.md (this file)
```

---

## 🗄️ Database Schema

```sql
CREATE TABLE conversations (
  id TEXT PRIMARY KEY,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  metadata TEXT NOT NULL DEFAULT '{}'
);

CREATE TABLE messages (
  id TEXT PRIMARY KEY,
  conversation_id TEXT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender TEXT NOT NULL CHECK(sender IN ('user', 'ai')),
  text TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
```

---

## 🚀 Deployment

### Deploy Frontend to Vercel

1. **Connect repo** to [Vercel](https://vercel.com) (GitHub auth)
2. **Settings:**
   - Framework: **SvelteKit**
   - Root Directory: **`frontend`**
   - Node Version: **20.x**
3. **Environment Variables:**
   - `VITE_API_URL` = your Render backend URL (e.g., `https://your-backend.onrender.com`)
4. **Deploy** → Auto-deploys on push to `main`

### Deploy Backend to Render

1. **Create Web Service** on [Render](https://render.com)
2. **Settings:**
   - Repository: Connect GitHub repo
   - Root Directory: **`backend`**
   - Build Command: `npm install && npm run build`
   - Start Command: `npm run start`
   - Node Version: **20.x** (auto-detected from `package.json`)
3. **Environment Variables:**
   ```
   NODE_ENV=production
   GEMINI_API_KEY=sk-...
   CORS_ORIGIN=https://your-frontend.vercel.app
   DATABASE_PATH=/data/chat.db
   MAX_MESSAGE_LENGTH=5000
   MAX_HISTORY_MESSAGES=20
   ```
4. **Persistent Disk:**
   - Add a Render Disk
   - Mount Path: `/data`
   - Size: **1 GB** (enough for millions of messages)
5. **Deploy** → Auto-deploys on push to `main`

---

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| **"Cannot find module 'zod'"** | Run `npm install` in backend/; check `node_modules` exists |
| **CORS error in browser console** | Check `CORS_ORIGIN` in backend `.env` matches frontend URL (no trailing `/`) |
| **Cannot connect to backend** | Verify backend is running (`http://localhost:3001/health`); check network tab for 404/500 |
| **Database file not created** | Ensure `DATABASE_PATH` directory exists; backend auto-migrates on first start |
| **"Better-sqlite3 compile error"** | You may have Node 24+ (incompatible); add `"engines": { "node": "20.x" }` to `package.json` |
| **Frontend won't build on Vercel** | Ensure `svelte.config.js` has `adapter: vercel({ runtime: 'nodejs20.x' })` |
| **Gemini API 429 errors** | Upgrade your OpenAI plan or add rate limiting middleware |

---

## 🧪 Development Tips

**Run TypeScript checks:**
```bash
# Backend
cd backend && npm run build

# Frontend  
cd frontend && npm run check
```

**View SQLite database:**
```bash
# Install sqlite3 CLI, then:
sqlite3 backend/data/chat.db
sqlite> SELECT * FROM messages;
```

**Test backend locally:**
```bash
curl -X POST http://localhost:3001/chat/message \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello!"}'
```

---

## 📝 License

This project is part of the Spur take-home assignment. All rights reserved.

---

## 🤝 Support

For questions or issues:
1. Check the **Troubleshooting** section above
2. Review backend/frontend `.env.example` files
3. Check deployment service logs (Vercel, Render dashboards)
4. Verify `Node.js 20.x` is being used
