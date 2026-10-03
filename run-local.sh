#!/usr/bin/env bash
set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$PROJECT_DIR"

# Kill any process already occupying our ports
for PORT in 5588 5589 5590 5591; do
  PIDS=$(lsof -ti tcp:"$PORT" 2>/dev/null || true)
  if [ -n "$PIDS" ]; then
    echo "Killing existing process(es) on port $PORT..."
    echo "$PIDS" | xargs kill -9 2>/dev/null || true
  fi
done

cleanup() {
  echo ""
  echo "Shutting down..."
  kill ${VITE_PID:-} ${GO_PID:-} ${DOCS_PID:-} ${AGENT_PID:-} 2>/dev/null || true
  wait ${VITE_PID:-} ${GO_PID:-} ${DOCS_PID:-} ${AGENT_PID:-} 2>/dev/null || true
  echo "Done."
}
trap cleanup EXIT INT TERM

if ! command -v node &>/dev/null; then
  echo "Error: Node.js is not installed." >&2
  exit 1
fi

if ! command -v go &>/dev/null; then
  echo "Error: Go is not installed." >&2
  exit 1
fi

if ! command -v python3 &>/dev/null; then
  echo "Error: Python 3 is not installed (needed for the agent runtime)." >&2
  exit 1
fi

# Check PostgreSQL
if command -v pg_isready &>/dev/null; then
  if ! pg_isready -q 2>/dev/null; then
    echo "Warning: PostgreSQL does not appear to be running."
    echo "  Start it with: brew services start postgresql  (macOS)"
    echo "  Or:            sudo systemctl start postgresql (Linux)"
    echo ""
  fi
else
  echo "Note: pg_isready not found — cannot verify PostgreSQL is running."
  echo ""
fi

# Install frontend dependencies
if [ ! -d "node_modules" ]; then
  echo "Installing frontend dependencies..."
  npm install --cache /tmp/npm-cache-pm
fi

# Install docs-viewer dependencies
if [ ! -d "docs-viewer/node_modules" ]; then
  echo "Installing docs-viewer dependencies..."
  cd "$PROJECT_DIR/docs-viewer"
  npm install --cache /tmp/npm-cache-docs
  cd "$PROJECT_DIR"
fi

# Python agent venv
if [ ! -d "agent/.venv" ]; then
  echo "Creating Python agent virtualenv..."
  python3 -m venv "$PROJECT_DIR/agent/.venv"
  "$PROJECT_DIR/agent/.venv/bin/pip" install -r "$PROJECT_DIR/agent/requirements.txt"
fi

# Build Go backend
echo "Building Go backend..."
cd "$PROJECT_DIR/server"
go build -o pm-server ./cmd/main.go
cd "$PROJECT_DIR"

export PYTHON_AGENT_URL="${PYTHON_AGENT_URL:-http://127.0.0.1:5591}"
export LM_STUDIO_BASE_URL="${LM_STUDIO_BASE_URL:-http://127.0.0.1:1234/v1}"

echo ""
echo "  ╔══════════════════════════════════════╗"
echo "  ║         CGen PM Platform             ║"
echo "  ╠══════════════════════════════════════╣"
echo "  ║  Platform:  http://localhost:5588     ║"
echo "  ║  Backend:   http://localhost:5589     ║"
echo "  ║  Docs:      http://localhost:5590     ║"
echo "  ║  Agent:     http://localhost:5591     ║"
echo "  ║  LM Studio: ${LM_STUDIO_BASE_URL}  ║"
echo "  ║  Database:  PostgreSQL (pm_platform)  ║"
echo "  ╚══════════════════════════════════════╝"
echo ""
echo "  Press Ctrl+C to stop all services."
echo ""

# Start Python agent runtime
cd "$PROJECT_DIR/agent"
"$PROJECT_DIR/agent/.venv/bin/uvicorn" main:app --host 127.0.0.1 --port 5591 &
AGENT_PID=$!
cd "$PROJECT_DIR"

# Start Go backend
cd "$PROJECT_DIR/server"
./pm-server &
GO_PID=$!
cd "$PROJECT_DIR"

# Start Vite frontend (port 5588)
npm run dev &
VITE_PID=$!

# Start docs viewer (port 5590)
cd "$PROJECT_DIR/docs-viewer"
npm run dev &
DOCS_PID=$!
cd "$PROJECT_DIR"

wait $VITE_PID $GO_PID $DOCS_PID $AGENT_PID
