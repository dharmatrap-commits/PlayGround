import { TAU, mulberry32, range, ellipseMask, distToPolyline, dist, pick } from './util.js';
import { PLAY, VILLAGE, FOREST, CAVE, ROADS } from './world-data.js';

const rng = mulberry32(0x3f19a7);

function nearRoad(x, y, pad) {
  for (const road of ROADS) if (distToPolyline(x, y, road) < pad) return true;
  return false;
}

function add(world, o, cr) {
  o.cx = o.cx ?? o.x;
  o.cy = o.cy ?? o.y;
  o.sortY = o.sortY ?? o.y;
  world.objects.push(o);
  if (cr) world.addCollider({ type: 'circle', x: o.x, y: o.y, r: cr });
}

export function buildNature(world) {
  const spacing = new Map();
  const key = (x, y) => (Math.floor(x / 52) + ',' + Math.floor(y / 52));
  const spaced = (x, y, min) => {
    const gx = Math.floor(x / 52);
    const gy = Math.floor(y / 52);
    for (let j = -1; j <= 1; j++) {
      for (let i = -1; i <= 1; i++) {
        const bucket = spacing.get((gx + i) + ',' + (gy + j));
        if (!bucket) continue;
        for (const p of bucket) if (dist(x, y, p[0], p[1]) < min) return false;
      }
    }
    return true;
  };
  const remember = (x, y) => {
    const k = key(x, y);
    if (!spacing.has(k)) spacing.set(k, []);
    spacing.get(k).push([x, y]);
  };

  const blockedForNature = (x, y) => {
    if (x < PLAY.x + 10 || x > PLAY.x + PLAY.w - 10 || y < PLAY.y + 10 || y > PLAY.y + PLAY.h - 10) return true;
    if (dist(x, y, VILLAGE.x, VILLAGE.y) < 650) return true;
    if (dist(x, y, CAVE.x, CAVE.y) < 470) return true;
    if (world.isWater(x, y) || world.waterCircle(x, y, 36)) return true;
    if (nearRoad(x, y, 46)) return true;
    return false;
  };

  const pinePalettes = [
    ['#2d472c', '#3b5a34', '#4a6c3d'],
    ['#324c2c', '#416034', '#50723e'],
    ['#294429', '#365331', '#42613a'],
    ['#3a5730', '#4a6839', '#5b7b44']
  ];
  const oakPalettes = [
    ['#3c5c31', '#4d743a', '#5d8645'],
    ['#466b34', '#56823e', '#67944b'],
    ['#506b34', '#628241', '#73984d'],
    ['#6d6a34', '#807b3e', '#948d49']
  ];
  const birchPalettes = [
    ['#5c783c', '#749247', '#88a557'],
    ['#63803a', '#7d9b48', '#93af58'],
    ['#6e7f3a', '#889b47', '#a0b056']
  ];

  const makeTree = (x, y, forest) => {
    const roll = rng();
    let type = 'pine';
    if (forest) type = roll < 0.58 ? 'pine' : roll < 0.92 ? 'oak' : 'birch';
    else type = roll < 0.3 ? 'pine' : roll < 0.82 ? 'oak' : 'birch';
    const palettes = type === 'pine' ? pinePalettes : type === 'oak' ? oakPalettes : birchPalettes;
    const tones = pick(rng, palettes);
    const s = range(rng, 0.75, 1.32);
    add(world, {
      kind: 'tree', type, x, y, cx: x, cy: y, rad: 100 * s, s,
      tones, seed: rng() * 100, sway: 0.7 + rng() * 0.7
    }, type === 'pine' ? 12 * s : 14 * s);
    remember(x, y);
  };

  // Dense Whisperwood.
  for (let i = 0; i < 2100; i++) {
    const a = rng() * TAU;
    const r = Math.sqrt(rng());
    const x = FOREST.x + Math.cos(a) * FOREST.rx * r * 0.97;
    const y = FOREST.y + Math.sin(a) * FOREST.ry * r * 0.97;
    if (ellipseMask(x, y, FOREST.x, FOREST.y, FOREST.rx, FOREST.ry) > 1) continue;
    if (blockedForNature(x, y)) continue;
    if (!spaced(x, y, 42)) continue;
    makeTree(x, y, true);
  }

  // A grove between the wood and the village.
  for (let i = 0; i < 260; i++) {
    const a = rng() * TAU;
    const r = Math.sqrt(rng());
    const x = 2400 + Math.cos(a) * 470 * r;
    const y = 1400 + Math.sin(a) * 430 * r;
    if (blockedForNature(x, y)) continue;
    if (!spaced(x, y, 58)) continue;
    makeTree(x, y, true);
  }

  // Scattered valley trees.
  for (let i = 0; i < 420; i++) {
    const x = range(rng, PLAY.x + 40, PLAY.x + PLAY.w - 40);
    const y = range(rng, PLAY.y + 40, PLAY.y + PLAY.h - 40);
    const veg = world.biomeAt(x, y);
    if (veg === 0 || veg === 4) continue;
    if (blockedForNature(x, y)) continue;
    if (ellipseMask(x, y, FOREST.x, FOREST.y, FOREST.rx, FOREST.ry) < 1.4) continue;
    if (rng() > 0.3) continue;
    if (!spaced(x, y, 70)) continue;
    makeTree(x, y, false);
  }

  // High stone pines.
  for (let i = 0; i < 110; i++) {
    const x = range(rng, 900, 4500);
    const y = range(rng, 620, 1380);
    if (world.isWater(x, y) || dist(x, y, CAVE.x, CAVE.y) < 480) continue;
    if (world.biomeAt(x, y) !== 4) continue;
    if (!spaced(x, y, 110)) continue;
    if (rng() > 0.5) continue;
    makeTree(x, y, false);
  }

  // Bushes.
  for (let i = 0; i < 620; i++) {
    const x = range(rng, PLAY.x, PLAY.x + PLAY.w);
    const y = range(rng, PLAY.y, PLAY.y + PLAY.h);
    if (blockedForNature(x, y)) continue;
    const inForest = ellipseMask(x, y, FOREST.x, FOREST.y, FOREST.rx, FOREST.ry) < 1.1;
    if (!inForest && rng() > 0.35) continue;
    const s = range(rng, 0.5, 1.15);
    add(world, {
      kind: 'bush', x, y, cx: x, cy: y, rad: 34 * s, s, seed: rng() * 100,
      berries: rng() > 0.55,
      tones: rng() > 0.5 ? ['#3e5f33', '#4f753d', '#618b49'] : ['#4b6633', '#5d7c3e', '#6f9149']
    });
  }

  // Stones: highlands, cave apron and the odd valley boulder.
  for (let i = 0; i < 430; i++) {
    let x, y;
    if (rng() < 0.55) {
      x = range(rng, PLAY.x, PLAY.x + PLAY.w);
      y = range(rng, PLAY.y, 1500);
    } else {
      x = range(rng, PLAY.x, PLAY.x + PLAY.w);
      y = range(rng, PLAY.y, PLAY.y + PLAY.h);
    }
    if (world.isWater(x, y) || world.waterCircle(x, y, 30)) continue;
    if (dist(x, y, VILLAGE.x, VILLAGE.y) < 540) continue;
    if (nearRoad(x, y, 40)) continue;
    if (dist(x, y, CAVE.x, CAVE.y) < 420) continue;
    const s = range(rng, 0.55, 1.65);
    if (rng() > 0.4) continue;
    const pts = [];
    const n = 7 + Math.floor(rng() * 3);
    for (let j = 0; j < n; j++) {
      const a = (j / n) * TAU;
      const r = (0.72 + rng() * 0.4) * 26;
      pts.push([Math.cos(a) * r, Math.sin(a) * r * 0.82]);
    }
    add(world, {
      kind: 'rock', x, y, cx: x, cy: y, rad: 40 * s, s, seed: rng() * 100,
      pts, tones: rng() > 0.5 ? ['#8a8578', '#a19b8b', '#6f6c62'] : ['#7d7d73', '#94958a', '#62665f']
    }, 18 * s);
  }

  // Fallen logs and stumps.
  for (let i = 0; i < 90; i++) {
    const x = range(rng, FOREST.x - FOREST.rx, FOREST.x + FOREST.rx);
    const y = range(rng, FOREST.y - FOREST.ry, FOREST.y + FOREST.ry);
    if (blockedForNature(x, y)) continue;
    if (rng() > 0.42) continue;
    if (rng() > 0.5) {
      add(world, { kind: 'log', x, y, cx: x, cy: y, rad: 46, s: range(rng, 0.8, 1.3), sortY: y + 8, angle: rng() * TAU, seed: rng() * 10 }, 20);
    } else {
      add(world, { kind: 'stump', x, y, cx: x, cy: y, rad: 26, s: range(rng, 0.7, 1.2), sortY: y + 2, seed: rng() * 10 }, 12);
    }
  }

  // Ferns, mushrooms, flowers.
  for (let i = 0; i < 900; i++) {
    const x = range(rng, PLAY.x, PLAY.x + PLAY.w);
    const y = range(rng, PLAY.y, PLAY.y + PLAY.h);
    if (blockedForNature(x, y)) continue;
    const inForest = ellipseMask(x, y, FOREST.x, FOREST.y, FOREST.rx, FOREST.ry) < 1.1;
    if (!inForest && rng() > 0.4) continue;
    if (rng() > 0.42) continue;
    const roll = rng();
    if (roll < 0.46) {
      add(world, { kind: 'fern', x, y, cx: x, cy: y, rad: 24, s: range(rng, 0.6, 1.15), sortY: y, seed: rng() * 20 });
    } else if (roll < 0.72) {
      add(world, { kind: 'mushroom', x, y, cx: x, cy: y, rad: 16, s: range(rng, 0.7, 1.3), sortY: y, seed: rng() * 20 });
    } else if (roll < 0.9) {
      add(world, { kind: 'flowers', x, y, cx: x, cy: y, rad: 18, s: range(rng, 0.7, 1.25), sortY: y, seed: rng() * 20 });
    } else {
      add(world, { kind: 'stump', x, y, cx: x, cy: y, rad: 26, s: range(rng, 0.6, 1), sortY: y + 2, seed: rng() * 10 }, 10);
    }
  }

  // Flower drifts in the meadows.
  for (let i = 0; i < 260; i++) {
    const x = range(rng, PLAY.x + 100, PLAY.x + PLAY.w - 100);
    const y = range(rng, PLAY.y + 100, PLAY.y + PLAY.h - 100);
    if (world.biomeAt(x, y) !== 2) continue;
    if (dist(x, y, VILLAGE.x, VILLAGE.y) < 620) continue;
    if (rng() > 0.45) continue;
    add(world, { kind: 'flowers', x, y, cx: x, cy: y, rad: 20, s: range(rng, 0.8, 1.4), sortY: y, seed: rng() * 20, bright: true });
  }
}
