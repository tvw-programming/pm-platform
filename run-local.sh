#!/usr/bin/env bash
set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$PROJECT_DIR"

cleanup() {
  echo ""
  echo "Shutting down..."
  kill $VITE_PID $GO_PID 2>/dev/null || true
  wait $VITE_PID $GO_PID 2>/dev/null || true
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

if [ ! -d "node_modules" ]; then
  echo "Installing frontend dependencies..."
  npm install
fi

echo "Building Go backend..."
cd "$PROJECT_DIR/server"
go build -o pm-server ./cmd/main.go
cd "$PROJECT_DIR"

echo ""
echo "  CGen Platform"
echo "  ─────────────────────────────"
echo "  Frontend:  http://localhost:5173"
echo "  Backend:   http://localhost:3001"
echo "  Database:  PostgreSQL (pm_platform)"
echo ""

# Start Go backend
cd "$PROJECT_DIR/server"
./pm-server &
GO_PID=$!
cd "$PROJECT_DIR"

# Start Vite frontend
npm run dev &
VITE_PID=$!

wait $VITE_PID $GO_PID
