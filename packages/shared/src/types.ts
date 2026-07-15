export type Season = 'spring' | 'summer' | 'autumn' | 'winter';
export type Terrain = 'ocean' | 'coast' | 'plains' | 'forest' | 'hills' | 'mountain' | 'desert';
export type Resource = 'grain' | 'timber' | 'stone' | 'iron' | 'gold' | 'knowledge';
export type CivilizationStatus = 'thriving' | 'stable' | 'strained' | 'critical' | 'fallen';
export type EventScope = 'local' | 'regional' | 'global';
export type EventTone = 'opportunity' | 'danger' | 'mystery' | 'political';

export interface Point { x: number; y: number }

export interface WorldTile extends Point {
  id: string;
  terrain: Terrain;
  elevation: number;
  moisture: number;
  resource?: Resource;
  ownerId?: string;
  settlementLevel: 0 | 1 | 2 | 3;
  population: number;
}

export interface Leader {
  name: string;
  title: string;
  portraitSeed: number;
  traits: string[];
}

export interface CivilizationMetrics {
  population: number;
  treasury: number;
  food: number;
  happiness: number;
  science: number;
  military: number;
  influence: number;
}

export interface Civilization {
  id: string;
  name: string;
  demonym: string;
  color: string;
  accent: string;
  emblem: string;
  capital: Point;
  leader: Leader;
  culture: string;
  religion: string;
  ideology: string;
  model: string;
  status: CivilizationStatus;
  metrics: CivilizationMetrics;
  memory: MemoryEntry[];
}

export interface Relation {
  sourceId: string;
  targetId: string;
  score: number;
  state: 'allied' | 'friendly' | 'neutral' | 'hostile' | 'war';
  treaties: string[];
}

export interface MemoryEntry {
  tick: number;
  kind: 'promise' | 'betrayal' | 'war' | 'disaster' | 'discovery' | 'diplomacy';
  summary: string;
  importance: number;
}

export interface EventChoice {
  id: string;
  label: string;
  intent: ActionKind;
  risk: 'low' | 'medium' | 'high';
}

export interface WorldEvent {
  id: string;
  catalogId: string;
  tick: number;
  year: number;
  title: string;
  description: string;
  scope: EventScope;
  tone: EventTone;
  severity: number;
  location: Point;
  civilizationIds: string[];
  choices: EventChoice[];
  resolved: boolean;
}

export type ActionKind =
  | 'build_city' | 'expand' | 'trade' | 'research' | 'attack' | 'defend'
  | 'negotiate' | 'help_neighbor' | 'sabotage' | 'spy' | 'migrate'
  | 'create_law' | 'accept_refugees' | 'spread_faith' | 'sanction' | 'ignore';

export interface CivilizationAction {
  type: ActionKind;
  targetCivilizationId?: string;
  targetTileId?: string;
  eventId?: string;
  investment: number;
  message?: string;
}

export interface AIDecision {
  id: string;
  tick: number;
  civilizationId: string;
  model: string;
  summary: string;
  reasoningSummary: string;
  actions: CivilizationAction[];
  latencyMs: number;
  inputTokens: number;
  outputTokens: number;
  costUsd: number;
  source: 'openrouter' | 'deterministic-fallback' | 'observer';
}

export interface ChronicleEntry {
  id: string;
  tick: number;
  year: number;
  category: 'founding' | 'economy' | 'war' | 'diplomacy' | 'disaster' | 'science' | 'faith';
  title: string;
  body: string;
  civilizationIds: string[];
  importance: number;
}

export interface WorldStats {
  population: number;
  civilizationsAlive: number;
  activeWars: number;
  discoveries: number;
  totalGdp: number;
  tokenCostUsd: number;
}

export interface WorldSnapshot {
  id: string;
  seed: string;
  tick: number;
  year: number;
  season: Season;
  running: boolean;
  speed: number;
  width: number;
  height: number;
  tiles: WorldTile[];
  civilizations: Civilization[];
  relations: Relation[];
  events: WorldEvent[];
  decisions: AIDecision[];
  chronicle: ChronicleEntry[];
  stats: WorldStats;
  checksum: string;
}

export type ServerMessage =
  | { type: 'snapshot'; payload: WorldSnapshot }
  | { type: 'tick'; payload: WorldSnapshot }
  | { type: 'status'; payload: { running: boolean; speed: number } }
  | { type: 'error'; payload: { message: string } };

export type ClientMessage =
  | { type: 'subscribe' }
  | { type: 'control'; payload: { command: 'start' | 'pause' | 'faster' | 'slower' | 'step' | 'restart' } };
