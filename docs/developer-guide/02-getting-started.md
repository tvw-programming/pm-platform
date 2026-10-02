# Getting Started (Developer)

## Prerequisites

| Tool | Minimum version | Check |
|------|----------------|-------|
| Node.js | 20 LTS | `node --version` |
| npm | 9 | `npm --version` |
| Go | 1.21 | `go version` |
| PostgreSQL | 15 | `psql --version` |
| Git | 2.x | `git --version` |

### macOS Quick Install

```bash
brew install node go postgresql@15
brew services start postgresql@15
```

### Linux (Ubuntu/Debian)

```bash
# Node.js 20 via NodeSource
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Go
wget https://go.dev/dl/go1.21.0.linux-amd64.tar.gz
sudo tar -C /usr/local -xzf go1.21.0.linux-amd64.tar.gz
export PATH=$PATH:/usr/local/go/bin

# PostgreSQL
sudo apt-get install -y postgresql postgresql-contrib
sudo systemctl start postgresql
```

---

## First-Time Setup

### 1. Clone the repo

```bash
git clone <repo-url>
cd pm-platform
```

### 2. Create the database

```bash
createdb pm_platform
# or using psql:
psql -U postgres -c "CREATE DATABASE pm_platform;"
```

### 3. Start everything

```bash
chmod +x run-local.sh
./run-local.sh
```

`run-local.sh` does:
1. Checks Node.js and Go are installed
2. Checks PostgreSQL connectivity (`pg_isready`)
3. Installs npm dependencies if `node_modules` is missing
4. Builds the Go backend binary (`server/pm-server`)
5. Starts the Go server in the background on port 3001
6. Starts the Vite dev server in the background on port 5173
7. Starts the docs viewer on port 5174
8. On exit (`Ctrl+C`), kills all three processes cleanly

### 4. Open the app

- **Platform:** http://localhost:5173
- **API health:** http://localhost:3001/api/health
- **Docs:** http://localhost:5174

---

## Running Services Individually

### Frontend only (no backend needed for mock data)

```bash
npm install
npm run dev
```

### Backend only

```bash
cd server
go run ./cmd/main.go
# or build first:
go build -o pm-server ./cmd/main.go && ./pm-server
```

### Run all tests

```bash
# Frontend type check
npx tsc --noEmit

# Frontend build check
npx vite build

# Go build check
cd server && go build ./...

# Go tests (when added)
cd server && go test ./...
```

---

## Environment Configuration

Copy `.env.example` to `.env` (if present) or set env vars before running:

```bash
# Frontend: create src/.env (Vite picks it up)
VITE_API_URL=http://localhost:3001

# Backend: export before ./pm-server
export DB_HOST=localhost
export DB_PORT=5432
export DB_USER=postgres
export DB_PASSWORD=postgres
export DB_NAME=pm_platform
export SERVER_PORT=3001
```

---

## Database Setup (GORM Auto-Migration)

The backend automatically runs `AutoMigrate` on startup for all 5 models:

```
messages           → Message
tickets            → Ticket
playbook_instances → PlaybookInstance
roster_entries     → RosterEntry
project_role_configs → ProjectRoleConfig
```

No manual migration files are needed during development. For production, use GORM Migrator or generate SQL from the schemas.

---

## IDE Setup

### VS Code (recommended)

Extensions (from `.vscode/extensions.json`):
- `dbaeumer.vscode-eslint`
- `esbenp.prettier-vscode`
- `bradlc.vscode-tailwindcss` (if added)
- `golang.go`

Settings are in `.vscode/settings.json`.

### JetBrains / GoLand

Open the project root as the workspace. The Go module is in `server/`. Mark `src/` as a source root.
