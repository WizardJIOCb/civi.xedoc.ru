import { createHash } from 'node:crypto';
import type { AIDecision, CivilizationStatus, Season, WorldSnapshot } from '@civi/shared';
import { resolveDecision } from './action-resolver.js';
import { instantiateEvent } from './event-catalog.js';
import { SeededRandom } from './random.js';
import { generateWorld } from './world-generator.js';

const seasons: Season[] = ['spring', 'summer', 'autumn', 'winter'];

function checksum(world: WorldSnapshot): string {
  const core = { seed: world.seed, tick: world.tick, civilizations: world.civilizations, relations: world.relations, events: world.events };
  return createHash('sha256').update(JSON.stringify(core)).digest('hex').slice(0, 16);
}

function statusFrom(happiness: number, food: number, population: number): CivilizationStatus {
  if (population <= 0) return 'fallen';
  const health = (happiness + food) / 2;
  return health > 82 ? 'thriving' : health > 56 ? 'stable' : health > 34 ? 'strained' : 'critical';
}

export class SimulationEngine {
  private world: WorldSnapshot;
  private readonly modelRoster: string[];

  constructor(seed: string, initial?: WorldSnapshot, modelRoster: string[] = []) {
    this.world = initial ? structuredClone(initial) : generateWorld(seed);
    this.modelRoster = [...modelRoster];
    this.applyModelRoster();
    this.world.checksum = checksum(this.world);
  }

  snapshot(): WorldSnapshot {
    return structuredClone(this.world);
  }

  setRunning(running: boolean): void { this.world.running = running; }
  setSpeed(speed: number): void { this.world.speed = Math.max(0.25, Math.min(4, speed)); }

  restart(seed = this.world.seed): WorldSnapshot {
    this.world = generateWorld(seed);
    this.applyModelRoster();
    this.world.checksum = checksum(this.world);
    return this.snapshot();
  }

  advance(decisions: AIDecision[] = []): WorldSnapshot {
    this.world.tick += 1;
    const seasonIndex = this.world.tick % seasons.length;
    this.world.season = seasons[seasonIndex] ?? 'spring';
    if (seasonIndex === 0) this.world.year += 1;

    decisions.forEach((decision) => resolveDecision(this.world, decision));
    this.world.decisions = [...decisions, ...this.world.decisions].slice(0, 36);
    this.evolveEconomy();
    if (this.world.tick % 3 === 0) this.createEvent();
    this.world.events = this.world.events.slice(0, 18);
    this.world.chronicle = this.world.chronicle.slice(0, 80);
    this.recalculateStats();
    this.world.checksum = checksum(this.world);
    return this.snapshot();
  }

  private evolveEconomy(): void {
    for (const civilization of this.world.civilizations) {
      const random = new SeededRandom(`${this.world.seed}:economy:${this.world.tick}:${civilization.id}`);
      const seasonalFood = this.world.season === 'autumn' ? 7 : this.world.season === 'winter' ? -6 : 2;
      civilization.metrics.food = Math.max(0, Math.min(120, civilization.metrics.food + seasonalFood + random.integer(-3, 3)));
      const growth = civilization.metrics.food > 42 ? random.integer(80, 280) : -random.integer(120, 420);
      civilization.metrics.population = Math.max(0, civilization.metrics.population + growth);
      civilization.metrics.treasury = Math.max(0, civilization.metrics.treasury + Math.round(civilization.metrics.population / 18_000) + random.integer(-4, 6));
      civilization.metrics.happiness = Math.max(0, Math.min(100, civilization.metrics.happiness + (civilization.metrics.food < 30 ? -4 : random.integer(-1, 2))));
      civilization.status = statusFrom(civilization.metrics.happiness, civilization.metrics.food, civilization.metrics.population);
    }
  }

  private createEvent(): void {
    const random = new SeededRandom(`${this.world.seed}:location:${this.world.tick}`);
    const land = this.world.tiles.filter((tile) => tile.terrain !== 'ocean');
    const tile = random.pick(land);
    const nearby = this.world.civilizations
      .map((civilization) => ({ id: civilization.id, distance: Math.hypot(civilization.capital.x - tile.x, civilization.capital.y - tile.y) }))
      .sort((a, b) => a.distance - b.distance).slice(0, 2).map((entry) => entry.id);
    const event = instantiateEvent(this.world.seed, this.world.tick, this.world.year, { x: tile.x, y: tile.y }, nearby);
    this.world.events.unshift(event);
    this.world.chronicle.unshift({ id: `chronicle-${event.id}`, tick: this.world.tick, year: this.world.year, category: event.tone === 'danger' ? 'disaster' : 'diplomacy', title: event.title, body: event.description, civilizationIds: nearby, importance: event.severity });
  }

  private recalculateStats(): void {
    const living = this.world.civilizations.filter((civilization) => civilization.status !== 'fallen');
    this.world.stats.population = living.reduce((sum, civilization) => sum + civilization.metrics.population, 0);
    this.world.stats.civilizationsAlive = living.length;
    this.world.stats.activeWars = this.world.relations.filter((relation) => relation.state === 'war').length / 2;
    this.world.stats.totalGdp = living.reduce((sum, civilization) => sum + civilization.metrics.treasury * 3 + civilization.metrics.population * 0.014, 0);
    this.world.stats.tokenCostUsd = this.world.decisions.reduce((sum, decision) => sum + decision.costUsd, 0);
  }

  private applyModelRoster(): void {
    if (this.modelRoster.length === 0) return;
    this.world.civilizations.forEach((civilization, index) => {
      civilization.model = this.modelRoster[index % this.modelRoster.length] ?? this.modelRoster[0]!;
    });
  }
}
