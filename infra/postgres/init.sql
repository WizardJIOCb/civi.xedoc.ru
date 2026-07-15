CREATE TABLE IF NOT EXISTS world_snapshots (
  world_id TEXT NOT NULL,
  tick INTEGER NOT NULL,
  seed TEXT NOT NULL,
  checksum TEXT NOT NULL,
  snapshot JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (world_id, tick)
);

CREATE TABLE IF NOT EXISTS ai_decisions (
  id TEXT PRIMARY KEY,
  world_tick INTEGER NOT NULL,
  civilization_id TEXT NOT NULL,
  model TEXT NOT NULL,
  source TEXT NOT NULL,
  decision JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_world_snapshots_created_at ON world_snapshots(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_decisions_civilization ON ai_decisions(civilization_id, world_tick DESC);
