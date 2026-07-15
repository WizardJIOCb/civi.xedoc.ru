#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${APP_DIR:-/var/www/civi.xedoc.ru}"
BRANCH="${BRANCH:-main}"

cd "$APP_DIR"
git fetch origin "$BRANCH"
git checkout "$BRANCH"
git pull --ff-only origin "$BRANCH"
npm ci
npm run build
npm test
pm2 startOrReload ecosystem.config.cjs --update-env
pm2 save
curl --fail --retry 8 --retry-delay 2 http://127.0.0.1:4100/api/health
