import type { AIDecision, Civilization } from '@civi/shared';
import { Bot, Sparkles } from 'lucide-react';
import { relativeTick } from '../lib/format';

export function DecisionFeed({ decisions, civilizations, tick }: { decisions: AIDecision[]; civilizations: Civilization[]; tick: number }) {
  return <section className="panel decision-panel">
    <div className="panel-heading"><span>Совет моделей</span><span className="live-label"><i /> LIVE</span></div>
    <div className="decision-list">
      {decisions.slice(0, 5).map((decision, index) => {
        const civilization = civilizations.find((candidate) => candidate.id === decision.civilizationId);
        return <article className="decision-card" key={decision.id} style={{ '--delay': `${index * 60}ms` } as React.CSSProperties}>
          <div className="decision-meta"><span className="decision-model"><Bot size={12} /> {decision.model.split('/').at(-1)}</span><time>{relativeTick(decision.tick, tick)}</time></div>
          <div className="decision-title"><span style={{ color: civilization?.color }}>{civilization?.emblem}</span><strong>{civilization?.name}</strong></div>
          <p>{decision.summary}</p>
          <div className="decision-intent"><Sparkles size={11} /> {decision.actions.map((action) => action.type).join(' · ')}</div>
        </article>;
      })}
      {decisions.length === 0 && <div className="panel-empty"><Bot size={22} /><span>Модели созывают первый совет…</span></div>}
    </div>
  </section>;
}
