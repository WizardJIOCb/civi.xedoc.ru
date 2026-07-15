import type { ClientMessage, ServerMessage, WorldSnapshot } from '@civi/shared';
import { useCallback, useEffect, useRef, useState } from 'react';

type Connection = 'connecting' | 'live' | 'offline';

export function useSimulation() {
  const [world, setWorld] = useState<WorldSnapshot>();
  const [connection, setConnection] = useState<Connection>('connecting');
  const socketRef = useRef<WebSocket | undefined>(undefined);

  useEffect(() => {
    let disposed = false;
    let reconnect: ReturnType<typeof setTimeout> | undefined;
    const load = async () => {
      try {
        const response = await fetch('/api/world');
        if (!response.ok) throw new Error('world unavailable');
        if (!disposed) setWorld(await response.json() as WorldSnapshot);
      } catch { if (!disposed) setConnection('offline'); }
    };
    const connect = () => {
      if (disposed) return;
      const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
      const socket = new WebSocket(`${protocol}//${location.host}/ws`);
      socketRef.current = socket;
      socket.onopen = () => setConnection('live');
      socket.onmessage = (message) => {
        const data = JSON.parse(message.data as string) as ServerMessage;
        if (data.type === 'snapshot' || data.type === 'tick') setWorld(data.payload);
        if (data.type === 'status') setWorld((current) => current ? { ...current, ...data.payload } : current);
      };
      socket.onerror = () => setConnection('offline');
      socket.onclose = () => {
        if (!disposed) { setConnection('offline'); reconnect = setTimeout(connect, 2500); }
      };
    };
    void load();
    connect();
    return () => { disposed = true; if (reconnect) clearTimeout(reconnect); socketRef.current?.close(); };
  }, []);

  const control = useCallback((command: Extract<ClientMessage, { type: 'control' }>['payload']['command']) => {
    const message: ClientMessage = { type: 'control', payload: { command } };
    if (socketRef.current?.readyState === WebSocket.OPEN) socketRef.current.send(JSON.stringify(message));
    else void fetch('/api/simulation/control', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(message) });
  }, []);

  return { world, connection, control };
}
