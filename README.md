# Chronicle — AI Civilizations Arena

Живая детерминированная песочница, где LLM управляют державами, а simulation engine единолично применяет правила мира. Observer UI показывает изометрический мир, решения моделей, события, дипломатию и воспроизводимую летопись.

## Что уже работает

- детерминированная генерация мира из seed: 324 тайла, 6 держав, ресурсы и отношения;
- модульная экономика, календарь, память, дипломатия и валидатор AI-действий;
- 512 уникальных событий: локальные, региональные и глобальные;
- OpenRouter JSON-schema gateway с логируемым безопасным fallback;
- Fastify REST API и live WebSocket;
- PostgreSQL snapshots/решения и checksum для replay;
- React + PixiJS observer UI с анимированной изометрической картой;
- Docker, PM2, Nginx, CI и unit-тесты ядра.

## Локальный запуск

```bash
cp .env.example .env
npm install
npm run dev
```

Откройте `http://localhost:5173`. API работает на `http://localhost:4100`. PostgreSQL необязателен для разработки: при его отсутствии сервер использует память и сообщает об этом в health endpoint.

## Проверка

```bash
npm run typecheck
npm test
npm run build
```

Основные документы: [архитектура](docs/ARCHITECTURE.md), [развёртывание](docs/DEPLOYMENT.md), исходная спецификация [PROJECT.md](PROJECT.md).

## Переменные окружения

См. `.env.example`. Никогда не коммитьте OpenRouter API key или пароль PostgreSQL.

### Бесплатные модели OpenRouter

Создайте API key в [OpenRouter Keys](https://openrouter.ai/settings/keys) и добавьте его только в серверный `.env`:

```dotenv
OPENROUTER_API_KEY=sk-or-v1-...
OPENROUTER_MODELS=openrouter/free
```

`openrouter/free` автоматически выбирает доступную бесплатную модель с поддержкой нужного формата ответа. Для фиксированных противников перечислите модели через запятую — они распределятся по державам по кругу:

```dotenv
OPENROUTER_MODELS=tencent/hy3:free,google/gemma-4-26b-a4b-it:free,nvidia/nemotron-3-super-120b-a12b:free,qwen/qwen3-next-80b-a3b-instruct:free,nvidia/nemotron-nano-9b-v2:free,openai/gpt-oss-20b:free
```

После изменения выполните `docker compose up -d --force-recreate app`. Текущий режим виден в `/api/health` и в карточке стоимости интерфейса. Бесплатные модели и лимиты OpenRouter меняются, поэтому `openrouter/free` — рекомендуемая конфигурация.

## Визуальный арт

Фоновая иллюстрация `apps/web/public/assets/world-atmosphere.png` создана встроенным image generation workflow специально для проекта. Интерактивный мир, здания, леса, горы, границы и события отрисовываются кодом PixiJS из актуального snapshot.
