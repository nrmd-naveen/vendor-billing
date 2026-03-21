#!/bin/bash

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$DIR"

PORT=3000
URL="http://localhost:$PORT"
REQUIRED_NODE=20

# ── Install nvm if missing ────────────────────────────────────────────────────
export NVM_DIR="$HOME/.nvm"
if [ ! -s "$NVM_DIR/nvm.sh" ]; then
  echo "Installing nvm..."
  curl -fsSL https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.2/install.sh | bash
  [ -s "$NVM_DIR/nvm.sh" ] && source "$NVM_DIR/nvm.sh"
fi

[ -s "$NVM_DIR/nvm.sh" ] && source "$NVM_DIR/nvm.sh"

# ── Install / switch to Node 20 ───────────────────────────────────────────────
if command -v nvm &>/dev/null; then
  if ! nvm ls "$REQUIRED_NODE" &>/dev/null | grep -q "v$REQUIRED_NODE"; then
    echo "Installing Node.js $REQUIRED_NODE..."
    nvm install "$REQUIRED_NODE"
  fi
  nvm use "$REQUIRED_NODE" --silent
else
  # Fallback: check system node version
  if command -v node &>/dev/null; then
    NODE_VER=$(node -e "process.stdout.write(process.version.split('.')[0].replace('v',''))")
    if [ "$NODE_VER" -lt "$REQUIRED_NODE" ]; then
      echo "ERROR: Node.js v$REQUIRED_NODE+ required, found v$NODE_VER."
      echo "Install nvm: https://github.com/nvm-sh/nvm"
      exit 1
    fi
  else
    echo "ERROR: Node.js is not installed."
    echo "Install nvm: https://github.com/nvm-sh/nvm"
    exit 1
  fi
fi

echo "Node $(node -v) / npm $(npm -v)"

# ── Install dependencies if missing ──────────────────────────────────────────
if [ ! -d "$DIR/node_modules" ]; then
  echo "Installing dependencies..."
  npm install
fi

# ── Rebuild native modules (better-sqlite3) ───────────────────────────────────
if [ ! -f "$DIR/node_modules/better-sqlite3/build/Release/better_sqlite3.node" ]; then
  echo "Building native modules..."
  npm rebuild better-sqlite3
fi

# ── Build Next.js if needed ───────────────────────────────────────────────────
if [ ! -d "$DIR/.next" ]; then
  echo "Building app for the first time..."
  npm run build
fi

# ── Kill any existing process on port ────────────────────────────────────────
EXISTING_PID=$(lsof -ti:$PORT 2>/dev/null || true)
if [ -n "$EXISTING_PID" ]; then
  echo "Stopping previous instance on port $PORT..."
  kill "$EXISTING_PID" 2>/dev/null || true
  sleep 1
fi

# ── Start server ──────────────────────────────────────────────────────────────
echo "Starting Database..."
nohup npm start -- -p $PORT > "$DIR/database.log" 2>&1 &
SERVER_PID=$!

# ── Wait for ready ────────────────────────────────────────────────────────────
echo -n "Waiting for server"
for i in $(seq 1 30); do
  if curl -sf "$URL" > /dev/null 2>&1; then
    echo " ready."
    break
  fi
  echo -n "."
  sleep 0.5
done

# ── Open browser ──────────────────────────────────────────────────────────────
if command -v xdg-open &>/dev/null; then
  xdg-open "$URL"
elif command -v open &>/dev/null; then
  open "$URL"
else
  echo "Open your browser at $URL"
fi

echo "Database is running at $URL (PID: $SERVER_PID)"
echo "Logs: $DIR/database.log"
