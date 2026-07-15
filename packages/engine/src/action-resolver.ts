import type { AIDecision, Civilization, CivilizationAction, ChronicleEntry, Relation, WorldSnapshot } from '@civi/shared';

const allowedActions = new Set([
  'build_city', 'expand', 'trade', 'research', 'attack', 'defend', 'negotiate', 'help_neighbor',
  'sabotage', 'spy', 'migrate', 'create_law', 'accept_refugees', 'spread_faith', 'sanction', 'ignore',
]);

export function validateAction(action: CivilizationAction, world: WorldSnapshot): boolean {
  if (!allowedActions.has(action.type) || !Number.isFinite(action.investment) || action.investment < 0 || action.investment > 100) return false;
  if (action.targetCivilizationId && !world.civilizations.some((civ) => civ.id === action.targetCivilizationId)) return false;
  if (action.targetTileId && !world.tiles.some((tile) => tile.id === action.targetTileId)) return false;
  if (action.eventId && !world.events.some((event) => event.id === action.eventId)) return false;
  return true;
}

function relationBetween(world: WorldSnapshot, sourceId: string, targetId: string): Relation | undefined {
  return world.relations.find((relation) => relation.sourceId === sourceId && relation.targetId === targetId);
}

function updateRelation(relation: Relation, delta: number): void {
  relation.score = Math.max(-100, Math.min(100, relation.score + delta));
  relation.state = relation.score > 65 ? 'allied' : relation.score > 25 ? 'friendly' : relation.score < -65 ? 'war' : relation.score < -25 ? 'hostile' : 'neutral';
}

function chronicleFor(world: WorldSnapshot, civilization: Civilization, action: CivilizationAction): ChronicleEntry {
  const target = world.civilizations.find((candidate) => candidate.id === action.targetCivilizationId);
  const subjects = target ? [civilization.id, target.id] : [civilization.id];
  const names: Record<string, string> = {
    attack: `${civilization.name} начинает военную операцию${target ? ` против ${target.name}` : ''}`,
    trade: `${civilization.name} открывает новый торговый путь${target ? ` с ${target.name}` : ''}`,
    help_neighbor: `${civilization.name} отправляет помощь${target ? ` народу ${target.name}` : ''}`,
    research: `${civilization.name} учреждает великую исследовательскую программу`,
    negotiate: `${civilization.name} созывает дипломатический совет`,
    build_city: `${civilization.name} закладывает новое поселение`,
    create_law: `${civilization.name} принимает новый государственный закон`,
    spread_faith: `${civilization.name} отправляет проповедников за границы`,
  };
  return {
    id: `chronicle-${world.tick}-${civilization.id}-${action.type}`, tick: world.tick, year: world.year,
    category: action.type === 'attack' ? 'war' : action.type === 'research' ? 'science' : action.type === 'spread_faith' ? 'faith' : action.type === 'trade' ? 'economy' : 'diplomacy',
    title: names[action.type] ?? `${civilization.name}: ${action.type}`,
    body: action.message ?? 'Совет правителя утвердил решение, последствия которого проявятся со временем.', civilizationIds: subjects,
    importance: action.type === 'attack' ? 9 : Math.max(3, Math.round(action.investment / 12)),
  };
}

export function resolveDecision(world: WorldSnapshot, decision: AIDecision): void {
  const civilization = world.civilizations.find((candidate) => candidate.id === decision.civilizationId);
  if (!civilization) return;

  for (const action of decision.actions.filter((candidate) => validateAction(candidate, world))) {
    const investment = Math.round(action.investment);
    civilization.metrics.treasury = Math.max(0, civilization.metrics.treasury - Math.ceil(investment * 0.35));
    const relation = action.targetCivilizationId ? relationBetween(world, civilization.id, action.targetCivilizationId) : undefined;
    switch (action.type) {
      case 'research': civilization.metrics.science += Math.ceil(investment * 0.18); world.stats.discoveries += investment > 65 ? 1 : 0; break;
      case 'trade': civilization.metrics.treasury += Math.ceil(investment * 0.62); civilization.metrics.influence += 2; if (relation) updateRelation(relation, 8); break;
      case 'help_neighbor': civilization.metrics.happiness += 2; civilization.metrics.influence += 4; if (relation) updateRelation(relation, 16); break;
      case 'negotiate': civilization.metrics.influence += 3; if (relation) updateRelation(relation, 12); break;
      case 'attack': civilization.metrics.military = Math.max(0, civilization.metrics.military - Math.ceil(investment * 0.08)); if (relation) updateRelation(relation, -28); break;
      case 'defend': civilization.metrics.military += Math.ceil(investment * 0.12); break;
      case 'create_law': civilization.metrics.happiness = Math.min(100, civilization.metrics.happiness + 4); break;
      case 'accept_refugees': civilization.metrics.population += investment * 22; civilization.metrics.food = Math.max(0, civilization.metrics.food - 5); break;
      case 'spread_faith': civilization.metrics.influence += Math.ceil(investment * 0.08); if (relation) updateRelation(relation, -4); break;
      case 'sanction': if (relation) updateRelation(relation, -15); break;
      case 'sabotage': case 'spy': if (relation) updateRelation(relation, -10); break;
      case 'migrate': civilization.metrics.population = Math.max(0, civilization.metrics.population - investment * 10); break;
      case 'build_city': case 'expand': civilization.metrics.population += investment * 8; break;
      case 'ignore': break;
    }
    if (action.eventId) {
      const event = world.events.find((candidate) => candidate.id === action.eventId);
      if (event) event.resolved = true;
    }
    if (action.type !== 'ignore' && action.investment >= 35) world.chronicle.unshift(chronicleFor(world, civilization, action));
  }
  civilization.memory.unshift({ tick: world.tick, kind: decision.actions.some((action) => action.type === 'attack') ? 'war' : 'diplomacy', summary: decision.summary, importance: Math.max(3, ...decision.actions.map((action) => Math.round(action.investment / 10))) });
  civilization.memory = civilization.memory.slice(0, 12);
}
