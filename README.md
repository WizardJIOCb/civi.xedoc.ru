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

## Визуальный арт

Фоновая иллюстрация `apps/web/public/assets/world-atmosphere.png` создана встроенным image generation workflow специально для проекта. Интерактивный мир, здания, леса, горы, границы и события отрисовываются кодом PixiJS из актуального snapshot.
