import type { Civilization, Terrain, WorldSnapshot, WorldTile } from '@civi/shared';
import { Application, Assets, Container, Graphics, Sprite, Text, type Texture } from 'pixi.js';
import { useEffect, useRef } from 'react';

const terrainColors: Record<Terrain, number> = {
  ocean: 0x66a9cb,
  coast: 0x70c5c3,
  plains: 0xa2cf78,
  forest: 0x62a36f,
  hills: 0xc2b977,
  mountain: 0xa7b1b3,
  desert: 0xddbd73,
};
const TILE_W = 62;
const TILE_H = 31;
const ASSET_ROOT = '/assets/kenney-sketch-town';

interface Props { world: WorldSnapshot; selectedId: string | undefined; onSelectCivilization: (id: string) => void }
interface MapTextures { house: Texture; houseWindows: Texture; roofs: Texture[]; churchRoofs: Texture[]; castles: Texture[]; tree: Texture; grove: Texture; rocks: Texture }
interface Walker { container: Container; leftLeg: Graphics; rightLeg: Graphics; start: { x: number; y: number }; end: { x: number; y: number }; phase: number; duration: number }

function iso(tile: WorldTile, centerX: number, top: number): { x: number; y: number } {
  return { x: centerX + (tile.x - tile.y) * TILE_W / 2, y: top + (tile.x + tile.y) * TILE_H / 2 - tile.elevation * 19 };
}

function shade(color: number, factor: number): number {
  const red = Math.max(0, Math.min(255, Math.round(((color >> 16) & 255) * factor)));
  const green = Math.max(0, Math.min(255, Math.round(((color >> 8) & 255) * factor)));
  const blue = Math.max(0, Math.min(255, Math.round((color & 255) * factor)));
  return (red << 16) | (green << 8) | blue;
}

async function loadMapTextures(): Promise<MapTextures> {
  const paths = [
    'building_doorWindows_S.png', 'building_windows_S.png',
    'roof_gableBeige_S.png', 'roof_gableBrown_S.png', 'roof_gableGreen_S.png', 'roof_gablePurple_S.png',
    'roof_churchBeige_S.png', 'roof_churchBrown_S.png', 'roof_churchGreen_S.png', 'roof_churchPurple_S.png',
    'castle_towerBeige_S.png', 'castle_towerBrown_S.png', 'castle_towerGreen_S.png', 'castle_towerPurple_S.png',
    'tree_single_S.png', 'tree_multiple_S.png', 'rocks_grass_S.png',
  ];
  const loaded = await Promise.all(paths.map((path) => Assets.load<Texture>(`${ASSET_ROOT}/${path}`)));
  const at = (index: number): Texture => {
    const texture = loaded[index];
    if (!texture) throw new Error(`Map texture ${index} failed to load`);
    return texture;
  };
  return {
    house: at(0), houseWindows: at(1), roofs: loaded.slice(2, 6), churchRoofs: loaded.slice(6, 10),
    castles: loaded.slice(10, 14), tree: at(14), grove: at(15), rocks: at(16),
  };
}

function addSprite(parent: Container, texture: Texture, x: number, y: number, scale: number): Sprite {
  const sprite = new Sprite(texture);
  sprite.anchor.set(0.5, 0.86);
  sprite.position.set(x, y);
  sprite.scale.set(scale);
  parent.addChild(sprite);
  return sprite;
}

function paletteFor(civilization: Civilization | undefined): number {
  if (!civilization) return 0;
  return [...civilization.id].reduce((sum, letter) => sum + letter.charCodeAt(0), 0) % 4;
}

function pickTexture(textures: Texture[], index: number): Texture {
  const texture = textures[index] ?? textures[0];
  if (!texture) throw new Error('Map texture palette is empty');
  return texture;
}

function drawSettlement(parent: Container, tile: WorldTile, civilization: Civilization | undefined, x: number, y: number, textures: MapTextures): void {
  const city = new Container();
  const palette = paletteFor(civilization);
  city.addChild(new Graphics().ellipse(x, y + 3, tile.settlementLevel === 3 ? 25 : 18, 7).fill({ color: 0x4a4b3e, alpha: 0.18 }));

  const house = (dx: number, dy: number, scale: number, church = false) => {
    addSprite(city, dx % 2 === 0 ? textures.house : textures.houseWindows, x + dx, y + dy, scale);
    addSprite(city, church ? pickTexture(textures.churchRoofs, palette) : pickTexture(textures.roofs, palette), x + dx, y + dy - 1, scale);
  };

  if (tile.settlementLevel === 3) {
    addSprite(city, pickTexture(textures.castles, palette), x, y + 2, 0.19);
    house(-14, 5, 0.105);
    const color = civilization ? Number.parseInt(civilization.color.slice(1), 16) : 0xb87842;
    city.addChild(new Graphics().moveTo(x, y - 35).lineTo(x, y - 45).stroke({ color: 0x66523b, width: 1.4 }).poly([x, y - 45, x + 8, y - 42, x, y - 39]).fill({ color }));
  } else if (tile.settlementLevel === 2) {
    house(-8, -1, 0.145, true);
    house(10, 5, 0.12);
  } else {
    house(0, 2, 0.14);
  }
  parent.addChild(city);
}

function makeCitizen(color: number): { container: Container; leftLeg: Graphics; rightLeg: Graphics } {
  const container = new Container();
  const shadow = new Graphics().ellipse(0, 2.5, 5, 2).fill({ color: 0x30413a, alpha: 0.2 });
  const leftLeg = new Graphics().roundRect(-2.1, -1, 1.6, 4, 0.7).fill({ color: 0x3d4a52 });
  const rightLeg = new Graphics().roundRect(0.5, -1, 1.6, 4, 0.7).fill({ color: 0x3d4a52 });
  const body = new Graphics().poly([-4, -1, -2.7, -7, 2.7, -7, 4, -1]).fill({ color }).stroke({ color: 0xffffff, width: 0.7, alpha: 0.8 });
  const head = new Graphics().circle(0, -9, 2.8).fill({ color: 0xf0c9a5 }).stroke({ color: 0x7a5b46, width: 0.6 });
  const hat = new Graphics().poly([-3.6, -10.3, 0, -13, 3.6, -10.3]).fill({ color: shade(color, 0.7) });
  container.addChild(shadow, leftLeg, rightLeg, body, head, hat);
  return { container, leftLeg, rightLeg };
}

function addTerrainDetail(layer: Container, tile: WorldTile, point: { x: number; y: number }, zIndex: number): void {
  if (tile.terrain === 'ocean' || tile.terrain === 'coast') {
    const waves = new Graphics()
      .moveTo(point.x - 13, point.y - 2).lineTo(point.x - 4, point.y - 5).lineTo(point.x + 3, point.y - 3)
      .moveTo(point.x + 5, point.y + 4).lineTo(point.x + 12, point.y + 1).stroke({ color: 0xeaf8fb, width: 1.2, alpha: 0.45 });
    waves.zIndex = zIndex + 0.1; layer.addChild(waves);
  } else if (tile.terrain === 'plains') {
    const grass = new Graphics().moveTo(point.x - 9, point.y + 2).lineTo(point.x - 7, point.y - 3).moveTo(point.x - 7, point.y + 1).lineTo(point.x - 3, point.y - 2).stroke({ color: 0x638e54, width: 1, alpha: 0.48 });
    grass.zIndex = zIndex + 0.1; layer.addChild(grass);
  } else if (tile.terrain === 'desert') {
    const grains = new Graphics().circle(point.x - 8, point.y, 1.2).fill({ color: 0xb99049, alpha: 0.5 }).circle(point.x + 7, point.y + 3, 0.9).fill({ color: 0xf2d99a, alpha: 0.7 });
    grains.zIndex = zIndex + 0.1; layer.addChild(grains);
  }
}

export function WorldMap({ world, selectedId, onSelectCivilization }: Props) {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const app = new Application();
    let disposed = false;
    let initialized = false;

    const build = async () => {
      await app.init({ resizeTo: host, backgroundAlpha: 0, antialias: true, autoDensity: true, resolution: Math.min(devicePixelRatio, 2) });
      initialized = true;
      if (disposed) { app.destroy(true, { children: true }); return; }
      host.appendChild(app.canvas);
      const textures = await loadMapTextures();
      if (disposed) { app.destroy(true, { children: true }); return; }

      const worldLayer = new Container({ sortableChildren: true });
      worldLayer.scale.set(Math.max(0.72, Math.min(1.08, host.clientWidth / 990)));
      worldLayer.position.set(0, 10);
      app.stage.addChild(worldLayer);
      const centerX = host.clientWidth / (2 * worldLayer.scale.x);
      const top = Math.max(36, (host.clientHeight / worldLayer.scale.y - 590) / 2);

      const shadow = new Graphics().ellipse(centerX, 315, 445, 222).fill({ color: 0x496759, alpha: 0.13 });
      worldLayer.addChild(shadow);
      for (const tile of [...world.tiles].sort((a, b) => (a.x + a.y) - (b.x + b.y))) {
        const point = iso(tile, centerX, top);
        const owner = world.civilizations.find((civilization) => civilization.id === tile.ownerId);
        const topColor = terrainColors[tile.terrain];
        const tileGraphic = new Graphics()
          .poly([-TILE_W / 2, 0, 0, TILE_H / 2, 0, TILE_H / 2 + 5, -TILE_W / 2, 5]).fill({ color: shade(topColor, 0.73) })
          .poly([TILE_W / 2, 0, 0, TILE_H / 2, 0, TILE_H / 2 + 5, TILE_W / 2, 5]).fill({ color: shade(topColor, 0.83) })
          .poly([0, -TILE_H / 2, TILE_W / 2, 0, 0, TILE_H / 2, -TILE_W / 2, 0]).fill({ color: topColor }).stroke({ width: 1.2, color: 0xffffff, alpha: tile.terrain === 'ocean' ? 0.18 : 0.3 });
        if (owner) tileGraphic.poly([0, -TILE_H / 2 + 2, TILE_W / 2 - 4, 0, 0, TILE_H / 2 - 2, -TILE_W / 2 + 4, 0]).fill({ color: Number.parseInt(owner.color.slice(1), 16), alpha: 0.12 });
        tileGraphic.position.set(point.x, point.y);
        tileGraphic.zIndex = tile.x + tile.y;
        tileGraphic.eventMode = 'static';
        tileGraphic.cursor = owner ? 'pointer' : 'default';
        if (owner) tileGraphic.on('pointertap', () => onSelectCivilization(owner.id));
        worldLayer.addChild(tileGraphic);
        addTerrainDetail(worldLayer, tile, point, tileGraphic.zIndex);

        if (tile.terrain === 'forest') {
          const trees = addSprite(worldLayer, (tile.x + tile.y) % 2 === 0 ? textures.grove : textures.tree, point.x, point.y + 5, 0.13);
          trees.zIndex = tileGraphic.zIndex + 0.3;
        }
        if (tile.terrain === 'hills' && (tile.x + tile.y) % 3 === 0) {
          const rocks = addSprite(worldLayer, textures.rocks, point.x, point.y + 5, 0.1); rocks.zIndex = tileGraphic.zIndex + 0.25;
        }
        if (tile.terrain === 'mountain') {
          const mountain = new Graphics().poly([point.x - 18, point.y + 4, point.x, point.y - 34, point.x + 20, point.y + 4]).fill({ color: 0x7f9299 }).poly([point.x, point.y - 34, point.x + 8, point.y - 19, point.x + 1, point.y - 22, point.x - 6, point.y - 16]).fill({ color: 0xf6fbf8, alpha: 0.95 }).stroke({ color: 0xffffff, width: 0.8, alpha: 0.45 });
          mountain.zIndex = tileGraphic.zIndex + 0.35; worldLayer.addChild(mountain);
        }
        if (tile.settlementLevel > 0) {
          const settlement = new Container(); settlement.zIndex = tileGraphic.zIndex + 0.65;
          drawSettlement(settlement, tile, owner, point.x, point.y, textures); worldLayer.addChild(settlement);
        }
      }

      const walkers: Walker[] = [];
      for (const civilization of world.civilizations) {
        const color = Number.parseInt(civilization.color.slice(1), 16);
        const walkable = world.tiles.filter((tile) => tile.ownerId === civilization.id && !['ocean', 'coast', 'mountain'].includes(tile.terrain)).sort((a, b) => Math.hypot(a.x - civilization.capital.x, a.y - civilization.capital.y) - Math.hypot(b.x - civilization.capital.x, b.y - civilization.capital.y));
        if (walkable.length < 2) continue;
        for (let index = 0; index < 3; index += 1) {
          const startTile = walkable[index % walkable.length];
          const endTile = walkable[(index + 2) % walkable.length];
          if (!startTile || !endTile) continue;
          const person = makeCitizen(color);
          const start = iso(startTile, centerX, top); const end = iso(endTile, centerX, top);
          person.container.position.set(start.x, start.y - 4); person.container.zIndex = 850 + start.y / 1000;
          worldLayer.addChild(person.container);
          walkers.push({ ...person, start, end, phase: (index / 3) + (paletteFor(civilization) * 0.13), duration: 6800 + index * 900 });
        }
      }

      for (const civilization of world.civilizations) {
        const tile = world.tiles.find((candidate) => candidate.x === civilization.capital.x && candidate.y === civilization.capital.y);
        if (!tile) continue;
        const point = iso(tile, centerX, top);
        const marker = new Container(); marker.position.set(point.x, point.y - 54); marker.zIndex = 999;
        const color = Number.parseInt(civilization.color.slice(1), 16);
        const halo = new Graphics().circle(0, 0, selectedId === civilization.id ? 17 : 13).fill({ color: 0xffffff, alpha: 0.92 }).stroke({ color, width: selectedId === civilization.id ? 3 : 2, alpha: 0.95 });
        const emblem = new Text({ text: civilization.emblem, style: { fill: color, fontSize: 14, fontFamily: 'Manrope', fontWeight: '700' } });
        emblem.anchor.set(0.5); marker.addChild(halo, emblem); marker.eventMode = 'static'; marker.cursor = 'pointer'; marker.on('pointertap', () => onSelectCivilization(civilization.id));
        worldLayer.addChild(marker);
      }

      world.events.filter((event) => !event.resolved).slice(0, 4).forEach((event, index) => {
        const tile = world.tiles.find((candidate) => candidate.x === event.location.x && candidate.y === event.location.y);
        if (!tile) return;
        const point = iso(tile, centerX, top);
        const color = event.tone === 'danger' ? 0xdc5b49 : 0xc18a27;
        const marker = new Container(); marker.position.set(point.x, point.y); marker.zIndex = 1000;
        const ring = new Graphics().circle(0, 0, 12).fill({ color, alpha: 0.08 }).stroke({ color, width: 2, alpha: 0.7 });
        const stem = new Graphics().moveTo(0, -8).lineTo(0, -21).stroke({ color, width: 2 });
        const badge = new Graphics().circle(0, -29, 11).fill({ color: 0xffffff }).stroke({ color, width: 2.5 });
        const symbol = new Text({ text: '!', style: { fill: color, fontSize: 14, fontFamily: 'Manrope', fontWeight: '800' } }); symbol.anchor.set(0.5); symbol.position.y = -29;
        const labelBox = new Graphics().roundRect(-30, -54, 60, 15, 7).fill({ color }).stroke({ color: 0xffffff, width: 1, alpha: 0.8 });
        const label = new Text({ text: 'СОБЫТИЕ', style: { fill: 0xffffff, fontSize: 7.5, fontFamily: 'Manrope', fontWeight: '800', letterSpacing: 0.8 } }); label.anchor.set(0.5); label.position.y = -46.5;
        marker.addChild(ring, stem, badge, symbol, labelBox, label); worldLayer.addChild(marker);
        app.ticker.add(() => { const pulse = 1 + Math.sin(app.ticker.lastTime * 0.004 + index) * 0.16; ring.scale.set(pulse); ring.alpha = 1.15 - pulse * 0.55; });
      });

      app.ticker.add(() => {
        const time = app.ticker.lastTime;
        for (const walker of walkers) {
          const raw = ((time / walker.duration) + walker.phase) % 1;
          const direction = raw < 0.5 ? raw * 2 : (1 - raw) * 2;
          const progress = direction * direction * (3 - 2 * direction);
          const stride = Math.sin(time * 0.012 + walker.phase * 10);
          walker.container.x = walker.start.x + (walker.end.x - walker.start.x) * progress;
          walker.container.y = walker.start.y + (walker.end.y - walker.start.y) * progress - 5 + Math.abs(stride) * -1.2;
          walker.container.zIndex = 850 + walker.container.y / 1000;
          walker.leftLeg.y = stride * 1.2; walker.rightLeg.y = -stride * 1.2;
          walker.container.scale.x = walker.end.x >= walker.start.x ? 1 : -1;
        }
      });
    };
    void build();
    return () => {
      disposed = true;
      if (initialized) app.destroy(true, { children: true });
    };
  }, [world.checksum, selectedId, onSelectCivilization]);

  return <div className="world-canvas" ref={hostRef} aria-label="Изометрическая карта мира с городами, жителями и мировыми событиями" />;
}
