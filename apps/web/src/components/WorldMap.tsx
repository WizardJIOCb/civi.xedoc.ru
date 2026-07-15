import type { Civilization, Terrain, WorldSnapshot, WorldTile } from '@civi/shared';
import { Application, Container, Graphics, Text } from 'pixi.js';
import { useEffect, useRef } from 'react';

const terrainColors: Record<Terrain, number> = {
  ocean: 0x0a3140, coast: 0x19606a, plains: 0x476c45, forest: 0x244c3e, hills: 0x6a6b4b, mountain: 0x66716d, desert: 0x9b7747,
};
const TILE_W = 62;
const TILE_H = 31;

interface Props { world: WorldSnapshot; selectedId: string | undefined; onSelectCivilization: (id: string) => void }

function iso(tile: WorldTile, centerX: number, top: number): { x: number; y: number } {
  return { x: centerX + (tile.x - tile.y) * TILE_W / 2, y: top + (tile.x + tile.y) * TILE_H / 2 - tile.elevation * 19 };
}

function drawTree(parent: Container, x: number, y: number, scale: number): void {
  const tree = new Graphics().poly([x, y - 11 * scale, x + 7 * scale, y + 3 * scale, x, y, x - 7 * scale, y + 3 * scale]).fill({ color: 0x163c31 });
  tree.rect(x - scale, y, 2 * scale, 5 * scale).fill({ color: 0x6d4b32 });
  parent.addChild(tree);
}

function drawSettlement(parent: Container, tile: WorldTile, civilization: Civilization | undefined, x: number, y: number): void {
  const city = new Container();
  city.position.set(x, y - 7);
  const color = civilization ? Number.parseInt(civilization.color.slice(1), 16) : 0xd9b96c;
  const count = tile.settlementLevel === 3 ? 6 : tile.settlementLevel === 2 ? 4 : 2;
  for (let index = 0; index < count; index += 1) {
    const offsetX = ((index % 3) - 1) * 7 + (index % 2) * 2;
    const offsetY = Math.floor(index / 3) * 5 - (index % 3) * 2;
    const height = tile.settlementLevel === 3 && index === 1 ? 16 : 7 + (index % 3) * 2;
    const building = new Graphics()
      .rect(offsetX - 3, offsetY - height, 7, height).fill({ color: 0xcab98c })
      .poly([offsetX - 5, offsetY - height, offsetX + 1, offsetY - height - 5, offsetX + 6, offsetY - height]).fill({ color })
      .rect(offsetX, offsetY - 5, 2, 3).fill({ color: 0xffd477, alpha: 0.9 });
    city.addChild(building);
  }
  parent.addChild(city);
}

export function WorldMap({ world, selectedId, onSelectCivilization }: Props) {
  const hostRef = useRef<HTMLDivElement>(null);
  const selectedRef = useRef(selectedId);
  selectedRef.current = selectedId;

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const app = new Application();
    let disposed = false;
    let initialized = false;
    let worldLayer: Container | undefined;

    const build = async () => {
      await app.init({ resizeTo: host, backgroundAlpha: 0, antialias: true, autoDensity: true, resolution: Math.min(devicePixelRatio, 2) });
      initialized = true;
      if (disposed) { app.destroy(true, { children: true }); return; }
      host.appendChild(app.canvas);
      worldLayer = new Container({ sortableChildren: true });
      worldLayer.scale.set(Math.max(0.68, Math.min(1.02, host.clientWidth / 970)));
      worldLayer.position.set(0, 8);
      app.stage.addChild(worldLayer);
      const centerX = host.clientWidth / (2 * worldLayer.scale.x);
      const top = Math.max(28, (host.clientHeight / worldLayer.scale.y - 570) / 2);

      const shadow = new Graphics().ellipse(centerX, 300, 440, 220).fill({ color: 0x020807, alpha: 0.35 });
      worldLayer.addChild(shadow);
      for (const tile of [...world.tiles].sort((a, b) => (a.x + a.y) - (b.x + b.y))) {
        const point = iso(tile, centerX, top);
        const owner = world.civilizations.find((civilization) => civilization.id === tile.ownerId);
        const tileGraphic = new Graphics()
          .poly([0, -TILE_H / 2, TILE_W / 2, 0, 0, TILE_H / 2, -TILE_W / 2, 0])
          .fill({ color: terrainColors[tile.terrain] })
          .stroke({ width: 1, color: tile.terrain === 'ocean' ? 0x2d6873 : 0x9eb18b, alpha: 0.12 });
        if (owner) tileGraphic.poly([0, -TILE_H / 2 + 2, TILE_W / 2 - 3, 0, 0, TILE_H / 2 - 2, -TILE_W / 2 + 3, 0]).fill({ color: Number.parseInt(owner.color.slice(1), 16), alpha: 0.13 });
        tileGraphic.position.set(point.x, point.y);
        tileGraphic.zIndex = tile.x + tile.y;
        tileGraphic.eventMode = 'static';
        tileGraphic.cursor = owner ? 'pointer' : 'default';
        if (owner) tileGraphic.on('pointertap', () => onSelectCivilization(owner.id));
        worldLayer.addChild(tileGraphic);

        if (tile.terrain === 'forest') {
          const trees = new Container(); trees.zIndex = tileGraphic.zIndex + 0.2;
          drawTree(trees, point.x - 7, point.y - 5, 0.68); drawTree(trees, point.x + 6, point.y - 3, 0.55);
          worldLayer.addChild(trees);
        }
        if (tile.terrain === 'mountain') {
          const mountain = new Graphics().poly([point.x - 18, point.y + 3, point.x, point.y - 33, point.x + 20, point.y + 3]).fill({ color: 0x53615f }).poly([point.x, point.y - 33, point.x + 7, point.y - 19, point.x + 1, point.y - 22, point.x - 5, point.y - 16]).fill({ color: 0xc2d2c9, alpha: 0.85 });
          mountain.zIndex = tileGraphic.zIndex + 0.3; worldLayer.addChild(mountain);
        }
        if (tile.settlementLevel > 0) {
          const settlement = new Container(); settlement.zIndex = tileGraphic.zIndex + 0.6;
          drawSettlement(settlement, tile, owner, point.x, point.y); worldLayer.addChild(settlement);
        }
      }

      for (const civilization of world.civilizations) {
        const tile = world.tiles.find((candidate) => candidate.x === civilization.capital.x && candidate.y === civilization.capital.y);
        if (!tile) continue;
        const point = iso(tile, centerX, top);
        const marker = new Container(); marker.position.set(point.x, point.y - 46); marker.zIndex = 999;
        const color = Number.parseInt(civilization.color.slice(1), 16);
        const halo = new Graphics().circle(0, 0, selectedRef.current === civilization.id ? 15 : 11).fill({ color, alpha: 0.22 }).stroke({ color, width: 1.5, alpha: 0.9 });
        const emblem = new Text({ text: civilization.emblem, style: { fill: civilization.accent, fontSize: 13, fontFamily: 'Manrope', fontWeight: '700' } });
        emblem.anchor.set(0.5); marker.addChild(halo, emblem); marker.eventMode = 'static'; marker.cursor = 'pointer'; marker.on('pointertap', () => onSelectCivilization(civilization.id));
        worldLayer.addChild(marker);
      }

      world.events.filter((event) => !event.resolved).slice(0, 4).forEach((event, index) => {
        const tile = world.tiles.find((candidate) => candidate.x === event.location.x && candidate.y === event.location.y);
        if (!tile) return;
        const point = iso(tile, centerX, top);
        const ring = new Graphics().circle(point.x, point.y, 10).stroke({ color: event.tone === 'danger' ? 0xff715f : 0xecc66f, width: 2, alpha: 0.85 });
        ring.zIndex = 990; ring.alpha = 0.85; worldLayer?.addChild(ring);
        app.ticker.add(() => { const pulse = 1 + Math.sin(app.ticker.lastTime * 0.004 + index) * 0.32; ring.scale.set(pulse); ring.alpha = 1.3 - pulse * 0.45; });
      });

      let elapsed = 0;
      app.ticker.add((ticker) => {
        elapsed += ticker.deltaTime;
        if (worldLayer) worldLayer.y = 8 + Math.sin(elapsed * 0.012) * 1.5;
      });
    };
    void build();
    return () => {
      disposed = true;
      if (initialized) app.destroy(true, { children: true });
    };
  }, [world.checksum, onSelectCivilization]);

  return <div className="world-canvas" ref={hostRef} aria-label="Изометрическая карта мира" />;
}
