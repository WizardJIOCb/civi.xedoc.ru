# Развёртывание civi.xedoc.ru

## Требования

- DNS `A`: `civi.xedoc.ru` → `82.146.42.213`.
- Ubuntu/Debian, Node.js 22, PostgreSQL 16+, Nginx, PM2 и Certbot; либо Docker Compose.
- Рабочая директория: `/var/www/civi.xedoc.ru`. В исходной постановке указано `/var/www/civi.xeodc.ru`; это выглядит как опечатка, поэтому конфигурация использует написание домена.

## Первый запуск с PM2

```bash
sudo mkdir -p /var/www/civi.xedoc.ru
sudo chown "$USER":"$USER" /var/www/civi.xedoc.ru
git clone https://github.com/WizardJIOCb/civi.xedoc.ru.git /var/www/civi.xedoc.ru
cd /var/www/civi.xedoc.ru
cp .env.example .env
npm ci
npm run build && npm test
pm2 start ecosystem.config.cjs
pm2 save
```

Для полностью автоматического первого запуска под `root` можно выполнить `bash scripts/bootstrap-server.sh`. Скрипт не печатает созданный пароль PostgreSQL и сохраняет `.env` с правами владельца.

Секреты задаются в `.env` на сервере, файл не попадает в Git. Для реальных AI-решений нужен `OPENROUTER_API_KEY`; без него приложение честно показывает `deterministic-fallback` в `/api/health`.

Для бесплатного роутера добавьте `OPENROUTER_MODELS=openrouter/free`. Можно перечислить несколько `:free` model ID через запятую: сервер назначит их державам по кругу и сохранит фактическое имя использованной модели в каждом решении.

## Nginx и TLS

```bash
sudo cp infra/nginx/civi.xedoc.ru.conf /etc/nginx/sites-available/civi.xedoc.ru
sudo ln -s /etc/nginx/sites-available/civi.xedoc.ru /etc/nginx/sites-enabled/civi.xedoc.ru
sudo certbot certonly --webroot -w /var/www/letsencrypt -d civi.xedoc.ru
sudo nginx -t && sudo systemctl reload nginx
```

## Docker Compose

```bash
cp .env.example .env
# обязательно сменить POSTGRES_PASSWORD и при необходимости добавить OPENROUTER_API_KEY
docker compose up -d --build
docker compose ps
curl http://127.0.0.1:4100/api/health
```

## Обновление

`APP_DIR=/var/www/civi.xedoc.ru bash scripts/deploy.sh`. Скрипт допускает только fast-forward, выполняет тесты до перезапуска и проверяет health endpoint после него.
