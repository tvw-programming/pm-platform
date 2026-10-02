# Architecture Overview

## System Architecture

CGen is a **monorepo** with two runnable processes:

```
pm-platform/
├── src/              ← React 19 frontend (Vite)
├── server/           ← Go backend (GoFiber v2)
├── docs/             ← Documentation source
└── docs-viewer/      ← Documentation viewer app (port 5174)
```

## Frontend Stack

| Layer | Technology |
|-------|------------|
| Framework | React 19 + TypeScript 5 |
| Build tool | Vite 6 |
| UI library | MUI (Material UI) v6 |
| Icons | Lucide React |
| Routing | React Router DOM v7 |
| State | React `useReducer` + Context |
| Charts | Recharts |
| HTTP | Native `fetch` |
| WebSocket | Native `WebSocket` |

## Backend Stack

| Layer | Technology |
|-------|------------|
| Framework | GoFiber v2 |
| ORM | GORM |
| Database | PostgreSQL 15+ |
| Real-time | WebSocket (gofiber/contrib/websocket) |
| IDs | UUID (google/uuid) |

## Data Flow

```
Browser                     GoFiber Server              PostgreSQL
  │                               │                          │
  │── GET /api/chat/messages ────→│                          │
  │                               │── SELECT messages ──────→│
  │                               │←── rows ─────────────────│
  │←── JSON response ─────────────│                          │
  │                               │                          │
  │── POST /api/chat/messages ───→│                          │
  │                               │── INSERT message ───────→│
  │                               │── ResolvePlaybook()       │
  │                               │── INSERT tickets ───────→│
  │                               │── WS Broadcast ──→ All   │
  │←── 201 + {message,tickets} ───│    connected clients     │
```

## Request / Response Cycle

1. React page mounts → calls `chatApi.ts` → HTTP fetch to `VITE_API_URL` (default `http://localhost:3001`)
2. GoFiber routes request to handler → handler calls service layer → service uses GORM to query PostgreSQL
3. Handler returns JSON; for mutations it also calls `hub.Broadcast()` to push an event to all WebSocket clients on the same `run_id`
4. Frontend WebSocket listener in `ChatProvider.tsx` receives the event and dispatches to `useReducer`

## Project Conventions

### Path Alias
All frontend imports use `@/` which resolves to `src/`:
```ts
import { useChat } from '@/components/chat/ChatProvider';
```
Configured in `vite.config.ts` and `tsconfig.app.json`.

### Component Memos
All leaf components are wrapped in `memo()` to prevent unnecessary re-renders given the large chat message lists.

### No External State Library
State is managed with React's built-in `useReducer` + `Context`. The workspace state is in `WorkspaceProvider`, chat state is in `ChatProvider`.

### Mock Data
All non-chat data (tasks, sprints, releases, teams) is seeded from `src/mock-data/`. The mock data is deterministic (fixed random seed) so it produces the same fixture set every reload.

## Port Map

| Service | Port | URL |
|---------|------|-----|
| Frontend (Vite) | 5173 | http://localhost:5173 |
| Backend (GoFiber) | 3001 | http://localhost:3001 |
| Docs viewer | 5174 | http://localhost:5174 |
| PostgreSQL | 5432 | localhost:5432 |

## Environment Variables

### Frontend (`.env` or Vite inline)
| Variable | Default | Purpose |
|----------|---------|---------|
| `VITE_API_URL` | `http://localhost:3001` | GoFiber backend base URL |

### Backend (shell environment)
| Variable | Default | Purpose |
|----------|---------|---------|
| `DB_HOST` | `localhost` | PostgreSQL host |
| `DB_PORT` | `5432` | PostgreSQL port |
| `DB_USER` | `postgres` | PostgreSQL user |
| `DB_PASSWORD` | `postgres` | PostgreSQL password |
| `DB_NAME` | `pm_platform` | Database name |
| `SERVER_PORT` | `3001` | GoFiber listen port |
| `CORS_ORIGINS` | `http://localhost:5173` | Allowed CORS origins |
