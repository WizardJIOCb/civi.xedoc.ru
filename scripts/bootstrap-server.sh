#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${APP_DIR:-/var/www/civi.xedoc.ru}"
REPOSITORY="${REPOSITORY:-https://github.com/WizardJIOCb/civi.xedoc.ru.git}"
DOMAIN="${DOMAIN:-civi.xedoc.ru}"
NGINX_SITE="/etc/nginx/sites-available/$DOMAIN"

if [[ "${EUID}" -ne 0 ]]; then
  echo "Run the bootstrap as root" >&2
  exit 1
fi

if [[ ! -d "$APP_DIR/.git" ]]; then
  mkdir -p "$(dirname "$APP_DIR")"
  git clone "$REPOSITORY" "$APP_DIR"
else
  git -C "$APP_DIR" fetch origin main
  git -C "$APP_DIR" checkout main
  git -C "$APP_DIR" pull --ff-only origin main
fi

if [[ ! -f "$APP_DIR/.env" ]]; then
  database_password="$(openssl rand -hex 24)"
  umask 077
  {
    printf 'POSTGRES_PASSWORD=%s\n' "$database_password"
    printf 'OPENROUTER_API_KEY=%s\n' "${OPENROUTER_API_KEY:-}"
    printf 'OPENROUTER_MODELS=%s\n' "${OPENROUTER_MODELS:-openrouter/free}"
    printf 'SIMULATION_SEED=%s\n' "${SIMULATION_SEED:-xeodoc-chronicle-01}"
    printf 'SIMULATION_TICK_MS=%s\n' "${SIMULATION_TICK_MS:-3500}"
  } > "$APP_DIR/.env"
fi

docker compose -f "$APP_DIR/docker-compose.yml" --project-directory "$APP_DIR" up -d --build

mkdir -p /var/www/letsencrypt
cp "$APP_DIR/infra/nginx/civi.xedoc.ru.http.conf" "$NGINX_SITE"

ln -sfn "$NGINX_SITE" "/etc/nginx/sites-enabled/$DOMAIN"
nginx -t
systemctl reload nginx

if [[ ! -d "/etc/letsencrypt/live/$DOMAIN" ]]; then
  certbot certonly --webroot -w /var/www/letsencrypt -d "$DOMAIN" --non-interactive --agree-tos --register-unsafely-without-email
fi

cp "$APP_DIR/infra/nginx/civi.xedoc.ru.conf" "$NGINX_SITE"
nginx -t
systemctl reload nginx

curl --fail --retry 12 --retry-delay 2 http://127.0.0.1:4100/api/health
curl --fail --retry 10 --retry-all-errors --retry-delay 2 --noproxy '*' --resolve "$DOMAIN:443:127.0.0.1" "https://$DOMAIN/api/health"
echo
echo "Chronicle is live at https://$DOMAIN"
