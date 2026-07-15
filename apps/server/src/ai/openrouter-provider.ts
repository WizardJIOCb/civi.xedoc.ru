import type { AIDecision, Civilization, WorldSnapshot } from '@civi/shared';
import { z } from 'zod';
import type { DecisionPayload, DecisionProvider } from './decision-provider.js';

const actionKinds = ['build_city', 'expand', 'trade', 'research', 'attack', 'defend', 'negotiate', 'help_neighbor', 'sabotage', 'spy', 'migrate', 'create_law', 'accept_refugees', 'spread_faith', 'sanction', 'ignore'] as const;
const decisionSchema = z.object({
  summary: z.string().min(1).max(280),
  reasoningSummary: z.string().min(1).max(500),
  actions: z.array(z.object({
    type: z.enum(actionKinds), targetCivilizationId: z.string().optional(), targetTileId: z.string().optional(),
    eventId: z.string().optional(), investment: z.number().min(0).max(100), message: z.string().max(280).optional(),
  })).min(1).max(3),
});

function compactContext(civilization: Civilization, world: WorldSnapshot): object {
  return {
    tick: world.tick, year: world.year, season: world.season,
    civilization: { ...civilization, memory: civilization.memory.slice(0, 8) },
    neighbors: world.civilizations.filter((candidate) => candidate.id !== civilization.id).map((candidate) => ({ id: candidate.id, name: candidate.name, status: candidate.status, metrics: candidate.metrics })),
    relations: world.relations.filter((relation) => relation.sourceId === civilization.id),
    activeEvents: world.events.filter((event) => !event.resolved && event.civilizationIds.includes(civilization.id)).slice(0, 5),
    validActionTypes: actionKinds,
  };
}

export class OpenRouterDecisionProvider implements DecisionProvider {
  constructor(private readonly apiKey: string, private readonly fallback: DecisionProvider) {}

  async decide(civilization: Civilization, world: WorldSnapshot): Promise<AIDecision> {
    const started = performance.now();
    try {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: { Authorization: `Bearer ${this.apiKey}`, 'Content-Type': 'application/json', 'HTTP-Referer': 'https://civi.xedoc.ru', 'X-Title': 'AI Civilizations Arena' },
        body: JSON.stringify({
          model: civilization.model,
          temperature: 0.72,
          messages: [
            { role: 'system', content: 'You are the sovereign council of a simulated civilization. You decide strategy but never modify state. Return JSON only. Be consistent with leader traits and memory. Actions must use only IDs from context.' },
            { role: 'user', content: JSON.stringify(compactContext(civilization, world)) },
          ],
          response_format: { type: 'json_schema', json_schema: { name: 'civilization_decision', strict: true, schema: z.toJSONSchema(decisionSchema) } },
        }),
        signal: AbortSignal.timeout(25_000),
      });
      if (!response.ok) throw new Error(`OpenRouter returned ${response.status}`);
      const body = await response.json() as { choices?: Array<{ message?: { content?: string } }>; usage?: { prompt_tokens?: number; completion_tokens?: number; cost?: number } };
      const content = body.choices?.[0]?.message?.content;
      if (!content) throw new Error('OpenRouter returned no decision');
      const parsed = decisionSchema.parse(JSON.parse(content));
      const payload: DecisionPayload = {
        summary: parsed.summary,
        reasoningSummary: parsed.reasoningSummary,
        actions: parsed.actions.map((action) => ({
          type: action.type,
          investment: action.investment,
          ...(action.targetCivilizationId ? { targetCivilizationId: action.targetCivilizationId } : {}),
          ...(action.targetTileId ? { targetTileId: action.targetTileId } : {}),
          ...(action.eventId ? { eventId: action.eventId } : {}),
          ...(action.message ? { message: action.message } : {}),
        })),
      };
      return {
        id: `decision-${world.tick}-${civilization.id}`, tick: world.tick, civilizationId: civilization.id, model: civilization.model,
        ...payload, latencyMs: Math.round(performance.now() - started), inputTokens: body.usage?.prompt_tokens ?? 0,
        outputTokens: body.usage?.completion_tokens ?? 0, costUsd: body.usage?.cost ?? 0, source: 'openrouter',
      };
    } catch (error) {
      const decision = await this.fallback.decide(civilization, world);
      decision.reasoningSummary = `${decision.reasoningSummary} OpenRouter fallback: ${error instanceof Error ? error.message : 'unknown error'}`;
      return decision;
    }
  }
}
