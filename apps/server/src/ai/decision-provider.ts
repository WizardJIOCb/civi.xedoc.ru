import type { AIDecision, Civilization, CivilizationAction, WorldSnapshot } from '@civi/shared';

export interface DecisionProvider {
  decide(civilization: Civilization, world: WorldSnapshot): Promise<AIDecision>;
}

export interface DecisionPayload {
  summary: string;
  reasoningSummary: string;
  actions: CivilizationAction[];
}
