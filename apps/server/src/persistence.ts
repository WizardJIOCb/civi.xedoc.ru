import pg from 'pg';
import type { AIDecision, WorldSnapshot } from '@civi/shared';

const { Pool } = pg;

export class Persistence {
  private pool?: pg.Pool;

  async connect(databaseUrl?: string): Promise<boolean> {
    if (!databaseUrl) return false;
    const pool = new Pool({ connectionString: databaseUrl, connectionTimeoutMillis: 2500, max: 4 });
    try {
      await pool.query('SELECT 1');
      this.pool = pool;
      return true;
    } catch {
      await pool.end();
      return false;
    }
  }

  async saveSnapshot(world: WorldSnapshot): Promise<void> {
    if (!this.pool) return;
    await this.pool.query(
      `INSERT INTO world_snapshots (world_id, tick, seed, checksum, snapshot)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (world_id, tick) DO UPDATE SET checksum = EXCLUDED.checksum, snapshot = EXCLUDED.snapshot`,
      [world.id, world.tick, world.seed, world.checksum, world],
    );
  }

  async saveDecisions(decisions: AIDecision[]): Promise<void> {
    if (!this.pool || decisions.length === 0) return;
    await Promise.all(decisions.map((decision) => this.pool?.query(
      `INSERT INTO ai_decisions (id, world_tick, civilization_id, model, source, decision)
       VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT (id) DO NOTHING`,
      [decision.id, decision.tick, decision.civilizationId, decision.model, decision.source, decision],
    )));
  }

  async replay(worldId: string): Promise<Array<{ tick: number; checksum: string; snapshot: WorldSnapshot }>> {
    if (!this.pool) return [];
    const result = await this.pool.query<{ tick: number; checksum: string; snapshot: WorldSnapshot }>(
      'SELECT tick, checksum, snapshot FROM world_snapshots WHERE world_id = $1 ORDER BY tick ASC', [worldId],
    );
    return result.rows;
  }

  async close(): Promise<void> { await this.pool?.end(); }
}
