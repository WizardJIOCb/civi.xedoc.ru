import type { EventChoice, EventScope, EventTone, Point, WorldEvent } from '@civi/shared';
import { SeededRandom } from './random.js';

interface EventArchetype {
  slug: string;
  title: string;
  description: string;
  scope: EventScope;
  tone: EventTone;
  severity: [number, number];
  choiceSet: keyof typeof choiceSets;
}

const choiceSets = {
  relief: [
    ['aid', 'Направить помощь', 'help_neighbor', 'medium'],
    ['shelter', 'Принять беженцев', 'accept_refugees', 'medium'],
    ['exploit', 'Воспользоваться хаосом', 'attack', 'high'],
    ['observe', 'Не вмешиваться', 'ignore', 'low'],
  ],
  discovery: [
    ['study', 'Начать исследование', 'research', 'medium'],
    ['guard', 'Засекретить находку', 'defend', 'low'],
    ['share', 'Поделиться открытием', 'negotiate', 'medium'],
    ['sell', 'Продать доступ', 'trade', 'high'],
  ],
  unrest: [
    ['reform', 'Провести реформы', 'create_law', 'medium'],
    ['mediate', 'Начать переговоры', 'negotiate', 'medium'],
    ['fortify', 'Усилить охрану', 'defend', 'low'],
    ['infiltrate', 'Найти зачинщиков', 'spy', 'high'],
  ],
  diplomacy: [
    ['alliance', 'Предложить союз', 'negotiate', 'medium'],
    ['trade', 'Открыть рынки', 'trade', 'low'],
    ['pressure', 'Ввести санкции', 'sanction', 'high'],
    ['espionage', 'Послать агентов', 'spy', 'high'],
  ],
  threat: [
    ['defend', 'Подготовить оборону', 'defend', 'medium'],
    ['evacuate', 'Эвакуировать жителей', 'migrate', 'medium'],
    ['strike', 'Ударить первыми', 'attack', 'high'],
    ['appease', 'Попытаться договориться', 'negotiate', 'high'],
  ],
  faith: [
    ['welcome', 'Признать новое учение', 'spread_faith', 'medium'],
    ['debate', 'Созвать совет мудрецов', 'research', 'low'],
    ['protect', 'Защитить свободу веры', 'create_law', 'medium'],
    ['suppress', 'Запретить культ', 'defend', 'high'],
  ],
} as const;

const archetypes: EventArchetype[] = [
  { slug: 'tsunami', title: 'Великая волна', description: 'Море поглотило гавани и оставило тысячи людей без дома.', scope: 'regional', tone: 'danger', severity: [7, 10], choiceSet: 'relief' },
  { slug: 'royal-heir', title: 'Рождение наследника', description: 'Во дворце родился наследник, способный изменить порядок престолонаследия.', scope: 'local', tone: 'political', severity: [2, 5], choiceSet: 'diplomacy' },
  { slug: 'assassination', title: 'Убийство правителя', description: 'Неизвестный заговорщик нанёс удар в самом сердце власти.', scope: 'regional', tone: 'political', severity: [7, 10], choiceSet: 'unrest' },
  { slug: 'new-faith', title: 'Новое откровение', description: 'Странствующий пророк собирает вокруг себя тысячи последователей.', scope: 'regional', tone: 'mystery', severity: [4, 8], choiceSet: 'faith' },
  { slug: 'gunpowder', title: 'Грохочущий порошок', description: 'Алхимики нашли смесь, меняющую представление об осадах и власти.', scope: 'regional', tone: 'opportunity', severity: [5, 8], choiceSet: 'discovery' },
  { slug: 'plague', title: 'Тихая лихорадка', description: 'Неизвестная болезнь распространяется вдоль дорог и рынков.', scope: 'regional', tone: 'danger', severity: [6, 10], choiceSet: 'relief' },
  { slug: 'foreign-technology', title: 'Машина чужеземцев', description: 'Купцы привезли устройство, принцип работы которого никто не понимает.', scope: 'local', tone: 'opportunity', severity: [3, 7], choiceSet: 'discovery' },
  { slug: 'rare-meteor', title: 'Звёздный металл', description: 'С неба упал камень с редким металлом и странным магнитным полем.', scope: 'regional', tone: 'mystery', severity: [4, 9], choiceSet: 'discovery' },
  { slug: 'slave-uprising', title: 'Разбитые цепи', description: 'Подневольные рабочие подняли восстание и захватили склады оружия.', scope: 'regional', tone: 'political', severity: [6, 9], choiceSet: 'unrest' },
  { slug: 'dragon', title: 'Зверь над шахтами', description: 'Огромное крылатое существо разрушило рудники и перекрыло перевал.', scope: 'regional', tone: 'danger', severity: [7, 10], choiceSet: 'threat' },
  { slug: 'asylum', title: 'Просьба об убежище', description: 'Соседний правитель прибыл тайно и просит защиты от мятежников.', scope: 'local', tone: 'political', severity: [4, 8], choiceSet: 'diplomacy' },
  { slug: 'ancient-ai', title: 'Оракул из руин', description: 'Археологи пробудили древний механизм, отвечающий на невозможные вопросы.', scope: 'global', tone: 'mystery', severity: [6, 10], choiceSet: 'discovery' },
  { slug: 'unknown-fleet', title: 'Паруса без гербов', description: 'К берегам пристал флот народа, которого нет ни на одной карте.', scope: 'global', tone: 'mystery', severity: [5, 9], choiceSet: 'diplomacy' },
  { slug: 'market-crash', title: 'Обвал долговых домов', description: 'Крупнейшие ростовщики прекратили выплаты, замораживая торговлю.', scope: 'regional', tone: 'danger', severity: [5, 9], choiceSet: 'unrest' },
  { slug: 'great-drought', title: 'Небо без дождя', description: 'Колодцы мелеют, урожай гибнет, а цена зерна растёт каждый день.', scope: 'regional', tone: 'danger', severity: [6, 10], choiceSet: 'relief' },
  { slug: 'migration', title: 'Дороги изгнанников', description: 'Десятки тысяч людей покидают восток и ищут новый дом.', scope: 'regional', tone: 'political', severity: [4, 8], choiceSet: 'relief' },
  { slug: 'vanished-city', title: 'Город, которого нет', description: 'Разведчики нашли пустое место там, где вчера стоял многолюдный город.', scope: 'global', tone: 'mystery', severity: [7, 10], choiceSet: 'discovery' },
  { slug: 'royal-wedding', title: 'Свадьба двух корон', description: 'Династический союз способен соединить давних соперников.', scope: 'regional', tone: 'political', severity: [3, 7], choiceSet: 'diplomacy' },
  { slug: 'civil-war', title: 'Два знамени', description: 'Армия раскололась, и обе стороны объявили себя законной властью.', scope: 'regional', tone: 'danger', severity: [8, 10], choiceSet: 'unrest' },
  { slug: 'coup', title: 'Ночь закрытых ворот', description: 'Гвардия заняла столицу и требует передачи власти совету военных.', scope: 'local', tone: 'political', severity: [7, 10], choiceSet: 'unrest' },
  { slug: 'schism', title: 'Раскол державы', description: 'Богатые провинции отказались платить налоги и подняли свои знамёна.', scope: 'regional', tone: 'political', severity: [7, 10], choiceSet: 'diplomacy' },
  { slug: 'cult', title: 'Лица под масками', description: 'Тайное братство проникло в гильдии, храмы и городской совет.', scope: 'local', tone: 'mystery', severity: [4, 8], choiceSet: 'faith' },
  { slug: 'bankruptcy', title: 'Пустая казна', description: 'Государственные расписки обесценились, солдаты и чиновники не получают жалованья.', scope: 'regional', tone: 'danger', severity: [5, 9], choiceSet: 'unrest' },
  { slug: 'new-continent', title: 'Земля за туманом', description: 'Экспедиция вернулась с картами неизвестного материка.', scope: 'global', tone: 'opportunity', severity: [4, 8], choiceSet: 'discovery' },
  { slug: 'volcano', title: 'Пепельная гора', description: 'Вулкан проснулся, закрывая небо и погребая дороги под пеплом.', scope: 'regional', tone: 'danger', severity: [7, 10], choiceSet: 'relief' },
  { slug: 'famine', title: 'Голодный сезон', description: 'Амбары пусты, и всё больше семей меняют имущество на хлеб.', scope: 'local', tone: 'danger', severity: [5, 9], choiceSet: 'relief' },
  { slug: 'miracle', title: 'Свет над источником', description: 'Свидетели говорят о чуде, после которого исцелились умирающие.', scope: 'regional', tone: 'mystery', severity: [3, 7], choiceSet: 'faith' },
  { slug: 'pirates', title: 'Чёрные паруса', description: 'Пираты перекрыли торговый путь и требуют дань с каждого корабля.', scope: 'regional', tone: 'danger', severity: [5, 8], choiceSet: 'threat' },
  { slug: 'prophecy', title: 'Пророчество машины', description: 'Оракул назвал дату падения великой державы, не назвав её имени.', scope: 'global', tone: 'mystery', severity: [6, 10], choiceSet: 'discovery' },
  { slug: 'magical-storm', title: 'Сияющая буря', description: 'Гроза меняет направление рек и оставляет за собой кристаллы.', scope: 'global', tone: 'mystery', severity: [7, 10], choiceSet: 'threat' },
  { slug: 'trade-boom', title: 'Сезон изобилия', description: 'Новые маршруты наполнили рынки товарами и золотом.', scope: 'regional', tone: 'opportunity', severity: [2, 5], choiceSet: 'diplomacy' },
  { slug: 'ruins', title: 'Подземный архив', description: 'Шахтёры открыли зал с картами звёзд и забытыми формулами.', scope: 'local', tone: 'opportunity', severity: [3, 7], choiceSet: 'discovery' },
];

const contexts = [
  'у Янтарного побережья', 'в Северных марках', 'в долине Эхо', 'на островах Тумана',
  'у Красного перевала', 'в дельте Семи рек', 'на равнине Великанов', 'в Старом лесу',
  'у Сапфирового моря', 'на Серебряном тракте', 'в землях Пепла', 'у озера Звёзд',
  'в Зеленокамье', 'на Стеклянных холмах', 'у Врат Рассвета', 'в Безмолвной бухте',
] as const;

function makeChoices(setName: keyof typeof choiceSets): EventChoice[] {
  return choiceSets[setName].map(([id, label, intent, risk]) => ({ id, label, intent, risk }));
}

export type CatalogEntry = Omit<WorldEvent, 'id' | 'tick' | 'year' | 'location' | 'civilizationIds' | 'resolved'>;

export function buildEventCatalog(): CatalogEntry[] {
  return archetypes.flatMap((event) => contexts.map((context, contextIndex) => ({
    catalogId: `${event.slug}-${String(contextIndex + 1).padStart(2, '0')}`,
    title: `${event.title} ${context}`,
    description: `${event.description} Слухи сходятся на том, что всё началось ${context}.`,
    scope: event.scope,
    tone: event.tone,
    severity: Math.min(10, event.severity[0] + (contextIndex % (event.severity[1] - event.severity[0] + 1))),
    choices: makeChoices(event.choiceSet),
  })));
}

export const EVENT_CATALOG = buildEventCatalog();

export function instantiateEvent(
  seed: string,
  tick: number,
  year: number,
  location: Point,
  civilizationIds: string[],
): WorldEvent {
  const random = new SeededRandom(`${seed}:event:${tick}`);
  const template = random.pick(EVENT_CATALOG);
  return {
    ...template,
    id: `event-${tick}-${template.catalogId}`,
    tick,
    year,
    location,
    civilizationIds,
    resolved: false,
  };
}
