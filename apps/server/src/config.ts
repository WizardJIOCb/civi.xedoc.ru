function bool(value: string | undefined, fallback: boolean): boolean {
  if (value === undefined) return fallback;
  return value === 'true' || value === '1';
}

function list(value: string | undefined, fallback: string[]): string[] {
  const items = value?.split(',').map((item) => item.trim()).filter(Boolean);
  return items?.length ? items : fallback;
}

export const config = {
  port: Number(process.env.PORT ?? 4100),
  host: process.env.HOST ?? '0.0.0.0',
  databaseUrl: process.env.DATABASE_URL,
  openRouterApiKey: process.env.OPENROUTER_API_KEY,
  openRouterModels: list(process.env.OPENROUTER_MODELS ?? process.env.OPENROUTER_MODEL, ['openrouter/free']),
  publicOrigin: process.env.PUBLIC_ORIGIN ?? 'http://localhost:5173',
  seed: process.env.SIMULATION_SEED ?? 'xeodoc-chronicle-01',
  autostart: bool(process.env.SIMULATION_AUTOSTART, true),
  tickMs: Math.max(600, Number(process.env.SIMULATION_TICK_MS ?? 3500)),
  nodeEnv: process.env.NODE_ENV ?? 'development',
};
