#!/usr/bin/env bash
set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$PROJECT_DIR"

# Kill any process already occupying our ports
for PORT in 5588 5589 5590; do
  PIDS=$(lsof -ti tcp:"$PORT" 2>/dev/null || true)
  if [ -n "$PIDS" ]; then
    echo "Killing existing process(es) on port $PORT..."
    echo "$PIDS" | xargs kill -9 2>/dev/null || true
  fi
done

cleanup() {
  echo ""
  echo "Shutting down..."
  kill $VITE_PID $GO_PID $DOCS_PID 2>/dev/null || true
  wait $VITE_PID $GO_PID $DOCS_PID 2>/dev/null || true
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

# Build Go backend
echo "Building Go backend..."
cd "$PROJECT_DIR/server"
go build -o pm-server ./cmd/main.go
cd "$PROJECT_DIR"

echo ""
echo "  ╔══════════════════════════════════════╗"
echo "  ║         CGen PM Platform             ║"
echo "  ╠══════════════════════════════════════╣"
echo "  ║  Platform:  http://localhost:5588     ║"
echo "  ║  Backend:   http://localhost:5589     ║"
echo "  ║  Docs:      http://localhost:5590     ║"
echo "  ║  Database:  PostgreSQL (pm_platform)  ║"
echo "  ╚══════════════════════════════════════╝"
echo ""
echo "  Press Ctrl+C to stop all services."
echo ""

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

wait $VITE_PID $GO_PID $DOCS_PID
