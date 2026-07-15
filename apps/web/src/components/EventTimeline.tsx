import type { ChronicleEntry, WorldEvent } from '@civi/shared';
import { AlertTriangle, Compass, Landmark, Sparkles } from 'lucide-react';
import { relativeTick } from '../lib/format';

const icons = { danger: AlertTriangle, opportunity: Compass, mystery: Sparkles, political: Landmark };

export function EventTimeline({ events, chronicle, tick }: { events: WorldEvent[]; chronicle: ChronicleEntry[]; tick: number }) {
  const activeIds = new Set(events.map((event) => event.id));
  const items = events.slice(0, 4).map((event) => ({ ...event, active: !event.resolved }));
  return <section className="timeline-panel">
    <div className="timeline-rule" />
    {items.map((event) => {
      const Icon = icons[event.tone];
      return <article className={`timeline-event tone-${event.tone}`} key={event.id}>
        <div className="timeline-pin"><Icon size={14} /></div>
        <time>{relativeTick(event.tick, tick)}</time>
        <strong>{event.title}</strong>
        <p>{event.description}</p>
      </article>;
    })}
    {items.length === 0 && chronicle.filter((entry) => !activeIds.has(entry.id)).slice(0, 2).map((entry) => <article className="timeline-event" key={entry.id}><div className="timeline-pin"><Landmark size={14} /></div><time>813 год</time><strong>{entry.title}</strong><p>{entry.body}</p></article>)}
  </section>;
}
