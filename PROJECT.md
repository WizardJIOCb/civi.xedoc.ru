# PROJECT.md

# Civilizations.xedoc.ru
## AI Civilizations Arena
### Product Vision + PRD + SDD (Codex Implementation Specification)

> Version: 0.1
> Status: Foundation Specification
> Target: Codex GPT-5.6 Sol

---

# Vision

Civilizations.xedoc.ru is an autonomous civilization simulator where every nation is controlled by an LLM through OpenRouter.

The simulation engine owns the world rules.
LLMs only make strategic decisions.

The goal is not to "win" but to observe emergent behavior:
- diplomacy
- wars
- alliances
- betrayal
- economics
- religion
- science
- disasters
- migration
- history

Every simulation should produce a unique story.

---

# Core Principles

1. World simulation is deterministic.
2. AI only decides.
3. Every decision is logged.
4. Every civilization has memory.
5. Everything is replayable.
6. UI is observer-first.
7. Modular architecture.
8. OpenRouter-first model abstraction.

---

# Technology Stack

Frontend:
- React
- TypeScript
- PixiJS
- TailwindCSS

Backend:
- Node.js
- Fastify
- WebSocket

Database:
- PostgreSQL

Infrastructure:
- Docker
- OpenRouter API
- PM2
- Nginx

---

# Architecture

Simulation Engine
├── World
├── Economy
├── Military
├── Diplomacy
├── Religion
├── Science
├── Events
├── History
├── Memory
├── AI Gateway
└── Replay

AI Gateway
└── OpenRouter
    ├── Qwen
    ├── Gemma
    ├── DeepSeek
    ├── Mistral
    └── Any future model

---

# AI Contract

LLMs never modify the world directly.

They receive:
- civilization state
- neighboring states
- economy summary
- military summary
- memory summary
- active events

They return structured JSON only.

Example actions:
- build_city
- expand
- trade
- research
- attack
- defend
- negotiate
- help_neighbor
- sabotage
- spy
- migrate
- create_law

---

# Civilizations

Every civilization has:

- leader personality
- culture
- religion
- economy
- diplomacy
- military
- technology
- memory
- ideology

Leader traits:

- aggressive
- peaceful
- greedy
- honorable
- curious
- isolationist
- expansionist
- trader
- scientist
- fanatic

---

# Random Events

## Local
- famine
- plague
- fire
- mine collapse
- assassination
- corruption
- rebellion
- monster attack
- crop failure
- miracle

## Regional
- tsunami
- volcano
- drought
- migration wave
- refugee crisis
- pirate attacks
- trade collapse
- civil war

## Global
- ice age
- meteor
- magical storm
- AI prophecy
- new continent discovered
- world religion appears
- ancient ruins revealed
- global pandemic

---

# Expected AI Reactions

Examples:

Flood destroys neighboring kingdom.

Possible responses:
- send aid
- ignore
- invade
- offer alliance
- request tribute
- steal resources
- spread propaganda
- evacuate civilians

No response is hardcoded.

---

# Memory

Each civilization stores:
- friends
- enemies
- promises
- betrayals
- wars
- disasters
- discoveries

Memory is summarized to minimize token usage.

---

# UI

Observer mode.

Panels:
- World Map
- Timeline
- Live Decisions
- Diplomacy
- Economy
- Wars
- Events
- History
- AI Thoughts (summarized only)

---

# Metrics

Track:
- survival
- GDP
- happiness
- technology
- military power
- diplomacy score
- wars started
- wars won
- disasters survived
- OpenRouter token cost
- latency

---

# Roadmap

Phase 1
- World engine
- Map
- Resources
- Economy

Phase 2
- AI Gateway
- OpenRouter integration
- JSON actions

Phase 3
- Diplomacy
- Memory
- History

Phase 4
- UI

Phase 5
- Replay
- Metrics
- Tournament mode

---

# Stretch Goals

- Hundreds of civilizations
- Different models competing
- Personality presets
- Civilization editor
- Steam release
- Twitch integration
- Live spectator mode
- Time acceleration
- Sandbox editor
- Mod support

---

# Definition of Done

- deterministic simulation
- replay support
- modular code
- tests for core engine
- documentation updated
- no giant files (>500 LOC preferred)
- clear APIs
- incremental commits
- production-ready quality

---

# Instructions for Codex

1. Read this document completely.
2. Produce an implementation plan before coding.
3. Work phase by phase.
4. Keep architecture clean.
5. Never hardcode AI behavior.
6. AI decisions must always pass through the simulation engine.
7. Prefer small reusable modules.
8. Continuously update documentation.
9. Optimize for long autonomous implementation sessions.
10. Build this as an extensible research platform rather than only a game.


Важно сделать клёвые красивые анимации, интерфейс весь красивый, и 2d графику для людей\поселений\домов\дорог\окружения\деревьев\персонажей, в изометрии!


И самое интересное — добавить 500–1000 различных событий, чтобы действительно наблюдать, как разные модели принимают решения.

Например:

соседний город уничтожило цунами;
у короля родился наследник;
убили правителя;
появилась новая религия;
открыли порох;
эпидемия только в одном регионе;
торговцы привезли неизвестную технологию;
метеорит с редким металлом;
восстание рабов;
дракон уничтожил шахты;
сосед попросил убежища;
найден древний ИИ-артефакт;
на континент приплыли неизвестные люди;
экономический кризис;
сильнейшая засуха;
массовая миграция;
исчезновение целого города;
дипломатическая свадьба;
гражданская война;
переворот;
раскол государства;
появление секты;
банкротство;
открытие нового материка.

Для каждого события модели смогут выбирать совершенно разные действия:

помочь;
проигнорировать;
воспользоваться ситуацией;
объявить войну;
заключить союз;
ввести санкции;
отправить гуманитарную помощь;
организовать шпионаж;
начать пропаганду;
принять беженцев;
отказаться помогать;
попытаться аннексировать территорию.

Именно из таких решений будут рождаться настоящие истории, которые никто заранее не написал.

Мне кажется, из этого может получиться один из самых интересных AI-проектов для стримов и исследований поведения моделей.