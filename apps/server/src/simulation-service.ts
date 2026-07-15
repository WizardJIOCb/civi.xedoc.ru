import { EVENT_CATALOG, SimulationEngine } from '@civi/engine';
import type { AIDecision, ClientMessage, ServerMessage, WorldSnapshot } from '@civi/shared';
import type { WebSocket } from 'ws';
import type { DecisionProvider } from './ai/decision-provider.js';
import { Persistence } from './persistence.js';

export class SimulationService {
  private engine: SimulationEngine;
  private readonly clients = new Set<WebSocket>();
  private timer: NodeJS.Timeout | undefined;
  private busy = false;

  constructor(
    seed: string,
    private readonly provider: DecisionProvider,
    private readonly persistence: Persistence,
    private readonly baseTickMs: number,
  ) { this.engine = new SimulationEngine(seed); }

  snapshot(): WorldSnapshot { return this.engine.snapshot(); }
  catalogMeta(): { total: number; scopes: Record<string, number> } {
    const scopes = EVENT_CATALOG.reduce<Record<string, number>>((counts, event) => {
      counts[event.scope] = (counts[event.scope] ?? 0) + 1;
      return counts;
    }, {});
    return { total: EVENT_CATALOG.length, scopes };
  }

  addClient(socket: WebSocket): void {
    this.clients.add(socket);
    this.send(socket, { type: 'snapshot', payload: this.snapshot() });
    socket.on('close', () => this.clients.delete(socket));
    socket.on('message', (raw) => {
      try { this.control(JSON.parse(raw.toString()) as ClientMessage); }
      catch { this.send(socket, { type: 'error', payload: { message: 'Некорректная команда' } }); }
    });
  }

  start(): void {
    this.engine.setRunning(true);
    this.schedule();
    this.broadcast({ type: 'status', payload: { running: true, speed: this.snapshot().speed } });
  }

  pause(): void {
    this.engine.setRunning(false);
    if (this.timer) clearTimeout(this.timer);
    this.timer = undefined;
    this.broadcast({ type: 'status', payload: { running: false, speed: this.snapshot().speed } });
  }

  async step(): Promise<WorldSnapshot> {
    if (this.busy) return this.snapshot();
    this.busy = true;
    try {
      const before = this.snapshot();
      const civilization = before.civilizations[before.tick % before.civilizations.length];
      const decisions: AIDecision[] = civilization ? [await this.provider.decide(civilization, before)] : [];
      const world = this.engine.advance(decisions);
      this.broadcast({ type: 'tick', payload: world });
      await Promise.all([this.persistence.saveDecisions(decisions), world.tick % 4 === 0 ? this.persistence.saveSnapshot(world) : Promise.resolve()]);
      return world;
    } finally { this.busy = false; }
  }

  control(message: ClientMessage): WorldSnapshot {
    if (message.type !== 'control') return this.snapshot();
    switch (message.payload.command) {
      case 'start': this.start(); break;
      case 'pause': this.pause(); break;
      case 'faster': this.engine.setSpeed(this.snapshot().speed * 2); this.reschedule(); break;
      case 'slower': this.engine.setSpeed(this.snapshot().speed / 2); this.reschedule(); break;
      case 'step': void this.step(); break;
      case 'restart': this.pause(); this.engine.restart(); this.broadcast({ type: 'snapshot', payload: this.snapshot() }); break;
    }
    return this.snapshot();
  }

  private schedule(): void {
    if (!this.snapshot().running) return;
    this.timer = setTimeout(async () => { await this.step(); this.schedule(); }, this.baseTickMs / this.snapshot().speed);
  }
  private reschedule(): void { if (this.snapshot().running) { if (this.timer) clearTimeout(this.timer); this.schedule(); } }
  private send(socket: WebSocket, message: ServerMessage): void { if (socket.readyState === socket.OPEN) socket.send(JSON.stringify(message)); }
  private broadcast(message: ServerMessage): void { this.clients.forEach((client) => this.send(client, message)); }
}
