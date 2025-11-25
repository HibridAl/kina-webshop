#!/usr/bin/env bash
set -euo pipefail

PORT=9222
PROFILE_DIR=/tmp/chrome-debug-headful
CHROME_LOG=/tmp/chrome-launch.log
MCP_LOG=/tmp/cdt-mcp.log

# 1) Ha már fut Chrome a porton, ne indíts újat
if curl -s "http://127.0.0.1:${PORT}/json/version" >/dev/null 2>&1; then
  echo "[start] Chrome already running on port ${PORT}"
else
  echo "[start] Launching headful Chrome on port ${PORT}..."
  nohup google-chrome \
    --remote-debugging-port="${PORT}" \
    --user-data-dir="${PROFILE_DIR}" \
    --no-first-run \
    --disable-gpu \
    about:blank \
    >"${CHROME_LOG}" 2>&1 &
  sleep 1
fi

# 2) Indítsd az MCP attach szervert
echo "[start] Starting chrome-devtools-mcp attach..."
exec npx -y chrome-devtools-mcp@latest \
  --browserUrl "http://127.0.0.1:${PORT}" \
  --logFile "${MCP_LOG}"
