import type { Civilization, Relation, WorldSnapshot } from '@civi/shared';
import { Handshake, HeartHandshake, ShieldAlert, Swords } from 'lucide-react';

const relationLabel: Record<Relation['state'], string> = {
  allied: 'Союз',
  friendly: 'Дружба',
  neutral: 'Нейтралитет',
  hostile: 'Вражда',
  war: 'Война',
};

function relationsFor(civilization: Civilization, world: WorldSnapshot): Relation[] {
  return world.relations.filter((relation) => relation.sourceId === civilization.id).sort((a, b) => b.score - a.score);
}

export function DiplomacyView({ world, onSelectCivilization }: { world: WorldSnapshot; onSelectCivilization: (id: string) => void }) {
  const wars = world.relations.filter((relation) => relation.state === 'war').length;
  const alliances = world.relations.filter((relation) => relation.state === 'allied').length;
  return <main className="workspace-view diplomacy-view">
    <header className="workspace-heading">
      <div><span className="workspace-kicker"><Handshake size={17} /> ДИПЛОМАТИЧЕСКИЙ ЗАЛ</span><h1>Отношения шести держав</h1><p>Откройте карточку державы, чтобы увидеть её лидера, память и полный список отношений.</p></div>
      <div className="diplomacy-totals"><span><HeartHandshake size={20} /><strong>{alliances}</strong> союзов</span><span className="danger"><Swords size={20} /><strong>{wars}</strong> войн</span></div>
    </header>
    <section className="diplomacy-grid">
      {world.civilizations.map((civilization) => {
        const relations = relationsFor(civilization, world);
        const average = relations.length ? Math.round(relations.reduce((sum, relation) => sum + relation.score, 0) / relations.length) : 0;
        return <article className="diplomacy-card" key={civilization.id} style={{ '--civ': civilization.color } as React.CSSProperties}>
          <button className="diplomacy-identity" onClick={() => onSelectCivilization(civilization.id)}><span>{civilization.emblem}</span><div><h2>{civilization.name}</h2><p>{civilization.leader.title} {civilization.leader.name}</p></div><strong className={average < 0 ? 'negative' : ''}>{average > 0 ? '+' : ''}{average}</strong></button>
          <div className="relation-bars">{relations.slice(0, 5).map((relation) => {
            const target = world.civilizations.find((candidate) => candidate.id === relation.targetId);
            return target && <button key={relation.targetId} onClick={() => onSelectCivilization(target.id)}><span className="relation-name">{target.emblem} {target.name}</span><i><b className={relation.score < 0 ? 'negative' : ''} style={{ width: `${Math.max(6, Math.abs(relation.score))}%` }} /></i><strong>{relationLabel[relation.state]}</strong></button>;
          })}</div>
          <div className="diplomacy-card-footer"><ShieldAlert size={15} /><span>{civilization.status}</span><button onClick={() => onSelectCivilization(civilization.id)}>Подробнее</button></div>
        </article>;
      })}
    </section>
  </main>;
}
