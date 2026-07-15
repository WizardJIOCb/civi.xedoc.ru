import type { Civilization, Relation } from '@civi/shared';
import { BrainCircuit, Coins, Heart, Shield, Users, Wheat, X } from 'lucide-react';
import { compactNumber } from '../lib/format';

export function CivilizationDetail({ civilization, relations, civilizations, onClose }: { civilization: Civilization; relations: Relation[]; civilizations: Civilization[]; onClose: () => void }) {
  const metrics = [
    [Users, 'Население', compactNumber(civilization.metrics.population)], [Coins, 'Казна', civilization.metrics.treasury], [Wheat, 'Запасы', civilization.metrics.food],
    [Heart, 'Счастье', `${civilization.metrics.happiness}%`], [BrainCircuit, 'Наука', civilization.metrics.science], [Shield, 'Армия', civilization.metrics.military],
  ] as const;
  return <aside className="detail-drawer" style={{ '--civ': civilization.color } as React.CSSProperties}>
    <button className="drawer-close" onClick={onClose} aria-label="Закрыть"><X size={17} /></button>
    <div className="drawer-identity"><span className="drawer-emblem">{civilization.emblem}</span><div><small>{civilization.ideology}</small><h2>{civilization.name}</h2><p>{civilization.culture} · {civilization.religion}</p></div></div>
    <div className="leader-card"><div className="leader-avatar">{civilization.leader.name.split(' ').map((part) => part[0]).join('')}</div><div><small>{civilization.leader.title}</small><strong>{civilization.leader.name}</strong><p>{civilization.leader.traits.join(' · ')}</p></div></div>
    <div className="metric-grid">{metrics.map(([Icon, label, value]) => <div key={label}><Icon size={14} /><small>{label}</small><strong>{value}</strong></div>)}</div>
    <h3>Дипломатия</h3>
    <div className="relation-list">{relations.filter((relation) => relation.sourceId === civilization.id).sort((a, b) => b.score - a.score).map((relation) => {
      const target = civilizations.find((candidate) => candidate.id === relation.targetId);
      return <div key={relation.targetId}><span style={{ color: target?.color }}>{target?.emblem}</span><span>{target?.name}</span><i className={relation.score >= 0 ? 'positive' : 'negative'} style={{ width: `${Math.abs(relation.score)}%` }} /><b>{relation.score > 0 ? '+' : ''}{relation.score}</b></div>;
    })}</div>
    <h3>Последняя память</h3>
    <div className="memory-list">{civilization.memory.slice(0, 3).map((entry) => <p key={`${entry.tick}-${entry.summary}`}>{entry.summary}</p>)}{civilization.memory.length === 0 && <p>Летопись этой державы только начинается.</p>}</div>
  </aside>;
}
