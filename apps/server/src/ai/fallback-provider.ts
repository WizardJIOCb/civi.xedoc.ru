import { SeededRandom } from '@civi/engine';
import type { ActionKind, AIDecision, Civilization, CivilizationAction, WorldSnapshot } from '@civi/shared';
import type { DecisionProvider } from './decision-provider.js';

const traitActions: Record<string, ActionKind[]> = {
  aggressive: ['attack', 'defend', 'spy'], peaceful: ['negotiate', 'help_neighbor', 'trade'], greedy: ['trade', 'expand', 'sabotage'],
  honorable: ['defend', 'help_neighbor', 'negotiate'], curious: ['research', 'spy', 'expand'], isolationist: ['defend', 'research', 'ignore'],
  expansionist: ['expand', 'build_city', 'attack'], trader: ['trade', 'negotiate', 'expand'], scientist: ['research', 'trade', 'spy'], fanatic: ['spread_faith', 'attack', 'create_law'],
};

export class FallbackDecisionProvider implements DecisionProvider {
  async decide(civilization: Civilization, world: WorldSnapshot): Promise<AIDecision> {
    const started = performance.now();
    const random = new SeededRandom(`${world.seed}:decision:${world.tick}:${civilization.id}`);
    const event = world.events.find((candidate) => !candidate.resolved && candidate.civilizationIds.includes(civilization.id));
    const candidates: ActionKind[] = civilization.leader.traits.flatMap((trait) => traitActions[trait] ?? ['negotiate' as ActionKind]);
    const target = random.pick(world.civilizations.filter((candidate) => candidate.id !== civilization.id));
    const eventIntent = event ? random.pick(event.choices).intent as ActionKind : undefined;
    const type = eventIntent ?? random.pick(candidates);
    const action: CivilizationAction = {
      type,
      investment: random.integer(28, 78),
      ...(['trade', 'attack', 'negotiate', 'help_neighbor', 'spy', 'sabotage', 'sanction', 'spread_faith'].includes(type) ? { targetCivilizationId: target.id } : {}),
      ...(event ? { eventId: event.id } : {}),
      message: event ? `${civilization.leader.name} отвечает на событие «${event.title}».` : `${civilization.leader.name} действует в интересах державы.`,
    };
    const summary = event
      ? `${civilization.name} выбирает «${event.choices.find((choice) => choice.intent === type)?.label ?? type}» в ответ на кризис.`
      : `${civilization.name} направляет ресурсы на стратегию «${type}».`;
    return {
      id: `decision-${world.tick}-${civilization.id}`, tick: world.tick, civilizationId: civilization.id, model: civilization.model,
      summary, reasoningSummary: `Решение согласовано с чертами лидера: ${civilization.leader.traits.join(', ')}.`, actions: [action],
      latencyMs: Math.max(1, Math.round(performance.now() - started)), inputTokens: 0, outputTokens: 0, costUsd: 0, source: 'deterministic-fallback',
    };
  }
}
