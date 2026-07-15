import type { Civilization, Relation, Resource, Terrain, WorldSnapshot, WorldTile } from '@civi/shared';
import { hashString, SeededRandom } from './random.js';

const WIDTH = 18;
const HEIGHT = 18;

const civilizationBlueprints = [
  ['aurelian', 'Аурелийский Конкордат', 'аурелийцы', '#e7b85b', '#fff0bd', '☀', 'Лисандра Вейл', 'Первая хранительница', ['honorable', 'scientist'], 'Гелиософия', 'Культ Рассвета', 'Просвещённый конкордат', 'qwen/qwen3-30b-a3b'],
  ['verdant', 'Вердантская Лига', 'верданты', '#45b982', '#b7f5cf', '❧', 'Орен Мосс', 'Голос рощ', ['peaceful', 'trader'], 'Речные кланы', 'Живой круг', 'Союз вольных коммун', 'google/gemma-3-27b-it'],
  ['obsidian', 'Обсидиановый Трон', 'обсидианцы', '#dc6b55', '#ffc0a5', '◆', 'Кайр Драхт', 'Владыка пепла', ['aggressive', 'expansionist'], 'Кузнечные дома', 'Пламя предков', 'Военная автократия', 'deepseek/deepseek-chat-v3.1'],
  ['tideborn', 'Талассийские Вольные Порты', 'талассийцы', '#4faed1', '#bcecff', '≈', 'Мира Сейл', 'Первый навигатор', ['curious', 'trader'], 'Морские республики', 'Песнь глубин', 'Торговая федерация', 'mistralai/mistral-small-3.2-24b-instruct'],
  ['astral', 'Астральная Директория', 'астралы', '#9b7bd4', '#dfd0ff', '✦', 'Севериан Нокс', 'Архивариус', ['isolationist', 'scientist'], 'Небесные коллегии', 'Безмолвные сферы', 'Технократическая директория', 'qwen/qwen3-32b'],
  ['khanate', 'Золотая Степь', 'степняки', '#d79545', '#ffe0a3', '▲', 'Аша Тархан', 'Хранительница ветра', ['expansionist', 'honorable'], 'Кочевые роды', 'Вечное небо', 'Выборный каганат', 'google/gemma-3-12b-it'],
] as const;

const capitals = [
  { x: 5, y: 5 }, { x: 11, y: 4 }, { x: 13, y: 10 },
  { x: 4, y: 12 }, { x: 9, y: 13 }, { x: 8, y: 8 },
];

function terrainAt(x: number, y: number, seed: string): { terrain: Terrain; elevation: number; moisture: number } {
  const dx = (x - WIDTH / 2) / (WIDTH / 2);
  const dy = (y - HEIGHT / 2) / (HEIGHT / 2);
  const radial = 1 - Math.sqrt(dx * dx + dy * dy);
  const wave = Math.sin(x * 0.83 + hashString(seed) * 0.00001) * 0.14 + Math.cos(y * 0.67) * 0.12;
  const detail = new SeededRandom(`${seed}:tile:${x}:${y}`).next() * 0.22 - 0.11;
  const elevation = Math.max(0, Math.min(1, radial + wave + detail + 0.28));
  const moisture = Math.max(0, Math.min(1, 0.55 + Math.sin((x + y) * 0.55) * 0.25 + detail));
  let terrain: Terrain;
  if (elevation < 0.24) terrain = 'ocean';
  else if (elevation < 0.31) terrain = 'coast';
  else if (elevation > 0.83) terrain = 'mountain';
  else if (elevation > 0.7) terrain = 'hills';
  else if (moisture < 0.3) terrain = 'desert';
  else if (moisture > 0.66) terrain = 'forest';
  else terrain = 'plains';
  return { terrain, elevation: Number(elevation.toFixed(3)), moisture: Number(moisture.toFixed(3)) };
}

function nearestCapital(x: number, y: number): { index: number; distance: number } {
  let result = { index: 0, distance: Number.POSITIVE_INFINITY };
  capitals.forEach((capital, index) => {
    const distance = Math.hypot(x - capital.x, y - capital.y);
    if (distance < result.distance) result = { index, distance };
  });
  return result;
}

function createCivilizations(seed: string): Civilization[] {
  return civilizationBlueprints.map((blueprint, index) => {
    const random = new SeededRandom(`${seed}:civilization:${index}`);
    const capital = capitals[index] ?? { x: 8, y: 8 };
    return {
      id: blueprint[0], name: blueprint[1], demonym: blueprint[2], color: blueprint[3], accent: blueprint[4], emblem: blueprint[5],
      capital, leader: { name: blueprint[6], title: blueprint[7], portraitSeed: random.integer(1, 9999), traits: [...blueprint[8]] },
      culture: blueprint[9], religion: blueprint[10], ideology: blueprint[11], model: blueprint[12], status: 'stable',
      metrics: {
        population: random.integer(41_000, 78_000), treasury: random.integer(380, 720), food: random.integer(62, 94),
        happiness: random.integer(58, 82), science: random.integer(15, 38), military: random.integer(22, 48), influence: random.integer(20, 45),
      },
      memory: [],
    };
  });
}

function createTiles(seed: string): WorldTile[] {
  const resourceList: Resource[] = ['grain', 'timber', 'stone', 'iron', 'gold', 'knowledge'];
  const tiles: WorldTile[] = [];
  for (let y = 0; y < HEIGHT; y += 1) {
    for (let x = 0; x < WIDTH; x += 1) {
      const generated = terrainAt(x, y, seed);
      const nearest = nearestCapital(x, y);
      const random = new SeededRandom(`${seed}:resource:${x}:${y}`);
      const isLand = generated.terrain !== 'ocean';
      const isCapital = capitals.some((capital) => capital.x === x && capital.y === y);
      tiles.push({
        id: `${x}:${y}`, x, y, ...generated,
        ...(isLand && random.next() > 0.73 ? { resource: random.pick(resourceList) } : {}),
        ...(isLand && nearest.distance < 4.4 ? { ownerId: civilizationBlueprints[nearest.index]![0] } : {}),
        settlementLevel: isCapital ? 3 : isLand && nearest.distance < 2.2 && random.next() > 0.7 ? 1 : 0,
        population: isCapital ? random.integer(12_000, 21_000) : isLand && nearest.distance < 3 ? random.integer(300, 2800) : 0,
      });
    }
  }
  return tiles;
}

function createRelations(civilizations: Civilization[], seed: string): Relation[] {
  const relations: Relation[] = [];
  for (const source of civilizations) {
    for (const target of civilizations) {
      if (source.id === target.id) continue;
      const random = new SeededRandom(`${seed}:relation:${source.id}:${target.id}`);
      const score = random.integer(-24, 54);
      relations.push({ sourceId: source.id, targetId: target.id, score, state: score > 35 ? 'friendly' : score < -15 ? 'hostile' : 'neutral', treaties: [] });
    }
  }
  return relations;
}

export function generateWorld(seed: string): WorldSnapshot {
  const civilizations = createCivilizations(seed);
  const population = civilizations.reduce((sum, civ) => sum + civ.metrics.population, 0);
  const snapshot: WorldSnapshot = {
    id: `world-${hashString(seed).toString(16)}`, seed, tick: 0, year: 813, season: 'spring', running: false, speed: 1,
    width: WIDTH, height: HEIGHT, tiles: createTiles(seed), civilizations, relations: createRelations(civilizations, seed), events: [], decisions: [],
    chronicle: [{ id: 'founding-0', tick: 0, year: 813, category: 'founding', title: 'Начало Эпохи Наблюдения', body: 'Шесть держав вступают в эпоху, историю которой ещё никто не написал.', civilizationIds: civilizations.map((civilization) => civilization.id), importance: 10 }],
    stats: { population, civilizationsAlive: civilizations.length, activeWars: 0, discoveries: 0, totalGdp: Math.round(population * 0.018), tokenCostUsd: 0 }, checksum: '',
  };
  return snapshot;
}
