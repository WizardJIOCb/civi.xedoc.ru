import type { Civilization } from '@civi/shared';
import { ChevronRight } from 'lucide-react';
import { compactNumber } from '../lib/format';

interface Props { civilizations: Civilization[]; selectedId: string | undefined; onSelect: (id: string) => void }

export function CivilizationList({ civilizations, selectedId, onSelect }: Props) {
  return <section className="panel civilization-panel">
    <div className="panel-heading"><span>Державы</span><span className="count">{civilizations.length}</span></div>
    <div className="civilization-list">
      {civilizations.map((civilization, index) => <button className={`civilization-row ${selectedId === civilization.id ? 'selected' : ''}`} key={civilization.id} onClick={() => onSelect(civilization.id)} style={{ '--civ': civilization.color, '--delay': `${index * 45}ms` } as React.CSSProperties}>
        <span className="emblem">{civilization.emblem}</span>
        <span className="civilization-copy"><strong>{civilization.name}</strong><small>{civilization.leader.name} · {compactNumber(civilization.metrics.population)}</small></span>
        <span className={`status-dot ${civilization.status}`} />
        <ChevronRight size={14} />
      </button>)}
    </div>
  </section>;
}
