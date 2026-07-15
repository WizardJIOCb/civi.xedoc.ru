import { Activity, BookOpen, ChevronDown, CircleDollarSign, Clock3, Globe2, Landmark, Pause, Play, RotateCcw, ShieldAlert, Sparkles, Users, Zap } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { CivilizationDetail } from './components/CivilizationDetail';
import { CivilizationList } from './components/CivilizationList';
import { DecisionFeed } from './components/DecisionFeed';
import { EventTimeline } from './components/EventTimeline';
import { WorldMap } from './components/WorldMap';
import { useSimulation } from './hooks/use-simulation';
import { compactNumber, money, seasonName } from './lib/format';

export function App() {
  const { world, health, connection, control } = useSimulation();
  const [selectedId, setSelectedId] = useState<string>();
  const [intro, setIntro] = useState(true);
  useEffect(() => { const timeout = setTimeout(() => setIntro(false), 1450); return () => clearTimeout(timeout); }, []);
  const selectCivilization = useCallback((id: string) => setSelectedId(id), []);

  if (!world) return <div className="loading-screen"><div className="loading-sigil"><Globe2 /></div><span>CHRONICLE</span><p>{connection === 'offline' ? 'Сервер летописей недоступен' : 'Пробуждаем мир…'}</p></div>;
  const selected = world.civilizations.find((civilization) => civilization.id === selectedId);
  const latestEvent = world.events.find((event) => !event.resolved);

  return <div className={`app-shell ${intro ? 'is-entering' : ''}`}>
    <header className="topbar">
      <a className="brand" href="#"><span className="brand-mark"><Globe2 size={19} /></span><span><strong>CHRONICLE</strong><small>AI CIVILIZATIONS ARENA</small></span></a>
      <nav className="primary-nav"><button className="active"><Globe2 size={15} /> Мир</button><button><BookOpen size={15} /> Летопись</button><button><Landmark size={15} /> Дипломатия</button></nav>
      <div className="era-selector"><span>Эпоха наблюдения</span><ChevronDown size={14} /></div>
      <div className={`connection ${connection}`}><i />{connection === 'live' ? 'Мир онлайн' : connection}</div>
    </header>

    <section className="world-status">
      <div className="date-block"><small>Год</small><strong>{world.year}</strong><span>{seasonName[world.season]}</span></div>
      <div className="status-metrics">
        <div><Users size={15} /><span><small>Население мира</small><strong>{compactNumber(world.stats.population)}</strong></span></div>
        <div><Landmark size={15} /><span><small>Живые державы</small><strong>{world.stats.civilizationsAlive}</strong></span></div>
        <div><ShieldAlert size={15} /><span><small>Активные войны</small><strong>{world.stats.activeWars}</strong></span></div>
        <div><Sparkles size={15} /><span><small>Открытия</small><strong>{world.stats.discoveries}</strong></span></div>
        <div><CircleDollarSign size={15} /><span><small>Мировой выпуск</small><strong>{money(world.stats.totalGdp)}</strong></span></div>
      </div>
      <div className="simulation-controls">
        <button onClick={() => control(world.running ? 'pause' : 'start')} className="play-button" aria-label={world.running ? 'Пауза' : 'Продолжить'}>{world.running ? <Pause size={16} /> : <Play size={16} />}</button>
        <button onClick={() => control('slower')}>−</button><span>{world.speed}×</span><button onClick={() => control('faster')}>+</button>
        <button onClick={() => control('restart')} aria-label="Начать заново"><RotateCcw size={14} /></button>
      </div>
    </section>

    <main className="observer-grid">
      <div className="left-rail"><CivilizationList civilizations={world.civilizations} selectedId={selectedId} onSelect={selectCivilization} /><div className="cost-card" title={health?.models.join(', ')}><Zap size={15} /><span><small>{health?.ai === 'openrouter' ? 'OpenRouter · AI активен' : 'Fallback · добавьте API key'}</small><strong>${world.stats.tokenCostUsd.toFixed(4)}</strong></span><Activity size={16} /></div></div>
      <section className="map-stage">
        <WorldMap world={world} selectedId={selectedId} onSelectCivilization={selectCivilization} />
        <div className="map-vignette" />
        <div className="map-caption"><span>Архипелаг Астэр</span><small>seed / {world.seed}</small></div>
        <div className="turn-indicator"><Clock3 size={13} /><span>ХОД {world.tick.toString().padStart(3, '0')}</span><i>{world.checksum}</i></div>
        <div className="map-legend"><span><i className="terrain forest" />Леса</span><span><i className="terrain plains" />Равнины</span><span><i className="terrain mountain" />Высоты</span><span><i className="event-pulse" />Событие</span></div>
        {latestEvent && <div className={`event-toast tone-${latestEvent.tone}`}><span className="event-kicker">МИРОВОЕ СОБЫТИЕ · УРОВЕНЬ {latestEvent.severity}</span><strong>{latestEvent.title}</strong><p>{latestEvent.description}</p><div>{latestEvent.choices.slice(0, 3).map((choice) => <span key={choice.id}>{choice.label}</span>)}</div></div>}
      </section>
      <div className="right-rail"><DecisionFeed decisions={world.decisions} civilizations={world.civilizations} tick={world.tick} /></div>
    </main>

    <EventTimeline events={world.events} chronicle={world.chronicle} tick={world.tick} />
    <footer><span>Детерминированный мир · LLM только принимают решения</span><span>REPLAY <b>{world.checksum}</b></span></footer>
    {selected && <CivilizationDetail civilization={selected} relations={world.relations} civilizations={world.civilizations} onClose={() => setSelectedId(undefined)} />}
  </div>;
}
