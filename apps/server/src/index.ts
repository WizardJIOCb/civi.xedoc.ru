import cors from '@fastify/cors';
import fastifyStatic from '@fastify/static';
import websocket from '@fastify/websocket';
import Fastify from 'fastify';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { FallbackDecisionProvider } from './ai/fallback-provider.js';
import { OpenRouterDecisionProvider } from './ai/openrouter-provider.js';
import { config } from './config.js';
import { Persistence } from './persistence.js';
import { SimulationService } from './simulation-service.js';

const app = Fastify({ logger: { level: config.nodeEnv === 'production' ? 'info' : 'debug' } });
await app.register(cors, { origin: config.nodeEnv === 'production' ? config.publicOrigin : true });
await app.register(websocket);

const persistence = new Persistence();
const databaseConnected = await persistence.connect(config.databaseUrl);
const fallback = new FallbackDecisionProvider();
const provider = config.openRouterApiKey ? new OpenRouterDecisionProvider(config.openRouterApiKey, fallback) : fallback;
const simulation = new SimulationService(config.seed, config.openRouterModels, provider, persistence, config.tickMs);

app.get('/api/health', async () => ({ status: 'ok', database: databaseConnected ? 'connected' : 'memory', ai: config.openRouterApiKey ? 'openrouter' : 'deterministic-fallback', models: config.openRouterModels, tick: simulation.snapshot().tick }));
app.get('/api/world', async () => simulation.snapshot());
app.get('/api/events/catalog-meta', async () => simulation.catalogMeta());
app.get('/api/replays/:worldId', async (request) => persistence.replay((request.params as { worldId: string }).worldId));
app.post('/api/simulation/control', async (request) => simulation.control(request.body as Parameters<typeof simulation.control>[0]));
app.get('/ws', { websocket: true }, (socket) => simulation.addClient(socket));

const webRoot = join(dirname(fileURLToPath(import.meta.url)), '../../web/dist');
if (existsSync(webRoot)) {
  await app.register(fastifyStatic, { root: webRoot, wildcard: false });
  app.get('/*', async (_request, reply) => reply.sendFile('index.html'));
}

app.addHook('onClose', async () => { simulation.pause(); await persistence.close(); });
await app.listen({ port: config.port, host: config.host });
if (config.autostart) simulation.start();
