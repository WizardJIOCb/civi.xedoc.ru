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
});
