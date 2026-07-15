import type { ChronicleEntry, WorldSnapshot } from '@civi/shared';
import { BookOpen, Landmark, ScrollText, Sparkles } from 'lucide-react';

const categoryNames: Record<ChronicleEntry['category'], string> = {
  founding: 'Основание',
  economy: 'Экономика',
  war: 'Война',
  diplomacy: 'Дипломатия',
  disaster: 'Бедствие',
  science: 'Открытие',
  faith: 'Вера',
};

export function ChronicleView({ world, onSelectCivilization }: { world: WorldSnapshot; onSelectCivilization: (id: string) => void }) {
  return <main className="workspace-view chronicle-view">
    <header className="workspace-heading">
      <div><span className="workspace-kicker"><BookOpen size={17} /> ЖИВАЯ ЛЕТОПИСЬ</span><h1>История Архипелага Астэр</h1><p>Решения моделей превращаются в единую хронологию войн, договоров, открытий и бедствий.</p></div>
      <div className="workspace-summary"><strong>{world.chronicle.length}</strong><span>записей</span><strong>{world.year}</strong><span>текущий год</span></div>
    </header>
    <section className="chronicle-stream">
      {world.chronicle.slice(0, 60).map((entry) => <article className={`chronicle-card category-${entry.category}`} key={entry.id}>
        <div className="chronicle-date"><ScrollText size={18} /><strong>{entry.year}</strong><span>год · ход {entry.tick}</span></div>
        <div className="chronicle-copy"><span className="chronicle-category">{categoryNames[entry.category]}</span><h2>{entry.title}</h2><p>{entry.body}</p>
          <div className="chronicle-civilizations">{entry.civilizationIds.map((id) => {
            const civilization = world.civilizations.find((candidate) => candidate.id === id);
            return civilization && <button key={id} onClick={() => onSelectCivilization(id)} style={{ '--civ': civilization.color } as React.CSSProperties}>{civilization.emblem} {civilization.name}</button>;
          })}</div>
        </div>
        <div className="importance"><Sparkles size={15} /><span>Значимость</span><strong>{entry.importance}/10</strong></div>
      </article>)}
      {world.chronicle.length === 0 && <div className="workspace-empty"><Landmark size={30} /><p>Первая глава ещё пишется.</p></div>}
    </section>
  </main>;
}
