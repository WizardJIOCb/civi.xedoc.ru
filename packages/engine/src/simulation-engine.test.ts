import { describe, expect, it } from 'vitest';
import { EVENT_CATALOG, SimulationEngine, validateAction } from './index.js';

describe('SimulationEngine', () => {
  it('creates the same world and checksum for the same seed', () => {
    const first = new SimulationEngine('repeatable');
    const second = new SimulationEngine('repeatable');
    for (let index = 0; index < 12; index += 1) {
      first.advance();
      second.advance();
    }
    expect(first.snapshot()).toEqual(second.snapshot());
  });

  it('produces a different world for a different seed', () => {
    expect(new SimulationEngine('alpha').snapshot().checksum).not.toBe(new SimulationEngine('beta').snapshot().checksum);
  });

  it('ships at least 500 distinct event scenarios', () => {
    expect(EVENT_CATALOG.length).toBeGreaterThanOrEqual(500);
    expect(new Set(EVENT_CATALOG.map((event) => event.catalogId)).size).toBe(EVENT_CATALOG.length);
  });

  it('rejects actions that try to bypass world constraints', () => {
    const world = new SimulationEngine('rules').snapshot();
    expect(validateAction({ type: 'attack', investment: 101 }, world)).toBe(false);
    expect(validateAction({ type: 'trade', investment: 25, targetCivilizationId: 'missing' }, world)).toBe(false);
  });

  it('creates events and advances the calendar', () => {
    const engine = new SimulationEngine('history');
    for (let index = 0; index < 4; index += 1) engine.advance();
    expect(engine.snapshot().events).toHaveLength(1);
    expect(engine.snapshot().year).toBe(814);
  });

  it('assigns a configurable model roster and preserves it after restart', () => {
    const roster = ['openrouter/free', 'openai/gpt-oss-20b:free'];
    const engine = new SimulationEngine('models', undefined, roster);
    expect(engine.snapshot().civilizations.map((civilization) => civilization.model)).toEqual([
      roster[0], roster[1], roster[0], roster[1], roster[0], roster[1],
    ]);
    engine.restart();
    expect(engine.snapshot().civilizations[1]?.model).toBe(roster[1]);
  });

  it('applies an observer choice and resolves the selected event', () => {
    const engine = new SimulationEngine('observer-choice');
    for (let index = 0; index < 3; index += 1) engine.advance();
    const event = engine.snapshot().events[0];
    const choice = event?.choices[0];
    expect(event).toBeDefined();
    expect(choice).toBeDefined();

    const result = engine.resolveEventChoice(event!.id, choice!.id);
    expect(result?.decision.source).toBe('observer');
    expect(result?.world.events.find((candidate) => candidate.id === event!.id)?.resolved).toBe(true);
    expect(result?.world.chronicle[0]?.title).toContain(choice!.label);
    expect(engine.resolveEventChoice(event!.id, choice!.id)).toBeUndefined();
  });
});
