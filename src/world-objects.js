import { TAU, range, mulberry32, dist } from './util.js';
import { CAVE, VILLAGE, WORLD_W, WORLD_H, POND, BRIDGE, PLAYER_START } from './world-data.js';
import { buildNature } from './world-nature.js';

const rng = mulberry32(0xbadc0de);

function obj(world, o) {
  o.cx = o.cx ?? o.x;
  o.cy = o.cy ?? o.y;
  o.rad = o.rad ?? 60;
  o.sortY = o.sortY ?? o.cy;
  world.objects.push(o);
  return o;
}

function circle(world, x, y, r) {
  world.addCollider({ type: 'circle', x, y, r });
}

function rect(world, x, y, w, h) {
  world.addCollider({ type: 'rect', x, y, w, h });
}

export function buildWorldObjects(world) {
  world.signs = [];
  buildVillage(world);
  buildCave(world);
  buildWaterProps(world);
  buildNature(world);

  world.zones = [
    { id: 'forest', type: 'gloom', x: 1250, y: 2220, r: 690, count: 6, respawn: 5.5 },
    { id: 'grove', type: 'gloom', x: 1960, y: 1420, r: 380, count: 2, respawn: 8 },
    { id: 'ridge', type: 'wretch', x: 3660, y: 1480, r: 430, count: 2, respawn: 9 },
    { id: 'north', type: 'wretch', x: 2260, y: 900, r: 360, count: 2, respawn: 8 },
    { id: 'south', type: 'gloom', x: 4180, y: 3180, r: 520, count: 3, respawn: 6.5 },
    { id: 'west', type: 'wretch', x: 980, y: 3080, r: 420, count: 2, respawn: 9 },
    { id: 'cave', type: 'bat', x: 3120, y: 1150, r: 300, count: 2, respawn: 10 }
  ];
}

// ------------------------------------------------------------------- village
function buildVillage(world) {
  const houses = [
    { x: 3088, y: 2172, w: 238, h: 176, roof: '#8f4c39', roofDark: '#6d362a', wall: '#e2cda6', timber: '#6a4f36', chimney: true, name: "Elder's Hall" },
    { x: 3740, y: 2148, w: 216, h: 160, roof: '#647148', roofDark: '#4b5736', wall: '#ddc9a1', timber: '#6c5238', chimney: true },
    { x: 3958, y: 2600, w: 224, h: 168, roof: '#7a4a3a', roofDark: '#5f352b', wall: '#e3d0aa', timber: '#6b5038', chimney: true },
    { x: 3118, y: 2768, w: 208, h: 158, roof: '#50636c', roofDark: '#3b4b53', wall: '#d9c7a4', timber: '#625039', chimney: true },
    { x: 3628, y: 2874, w: 268, h: 184, roof: '#67503a', roofDark: '#4d3b2b', wall: '#c39a67', timber: '#54402d', chimney: false, barn: true }
  ];

  for (const h of houses) {
    h.kind = 'house';
    h.cx = h.x + h.w / 2;
    h.cy = h.y + h.h / 2;
    h.rad = Math.max(h.w, h.h) / 2 + 40;
    h.sortY = h.y + h.h + 8;
    world.objects.push(h);
    world.houses.push(h);
    rect(world, h.x + 8, h.y + h.h * 0.3, h.w - 16, h.h * 0.66);
    world.lights.push({ x: h.x + h.w * 0.26, y: h.y + h.h * 0.78, r: 105, color: '255,178,92', strength: 0.5, flicker: 0.12, seed: rng() * 10 });
    world.lights.push({ x: h.x + h.w * 0.73, y: h.y + h.h * 0.78, r: 86, color: '255,164,80', strength: 0.38, flicker: 0.1, seed: rng() * 10 });
    if (h.chimney) {
      world.emitters.push({ type: 'smoke', x: h.x + h.w * 0.72, y: h.y - 10, rate: 0.55, acc: rng(), drift: 18 });
    }
  }

  // Well
  obj(world, { kind: 'well', x: 3508, y: 2502, cx: 3508, cy: 2502, rad: 80, sortY: 2540 });
  circle(world, 3508, 2502, 46);
  world.emitters.push({ type: 'firefly', x: 3508, y: 2502, rate: 0.4, acc: 0, radius: 80 });

  // Earth shrine
  obj(world, { kind: 'shrine', x: world.shrine.x, y: world.shrine.y, cx: world.shrine.x, cy: world.shrine.y, rad: 60, sortY: world.shrine.y + 8 });
  circle(world, world.shrine.x, world.shrine.y, 24);
  world.lights.push({ x: world.shrine.x, y: world.shrine.y - 34, r: 150, color: '146,224,154', strength: 0.5, flicker: 0.18, seed: 3.2 });

  // Campfire
  obj(world, { kind: 'campfire', x: 3318, y: 2652, cx: 3318, cy: 2652, rad: 54, sortY: 2662 });
  circle(world, 3318, 2652, 30);
  world.lights.push({ x: 3318, y: 2640, r: 250, color: '255,148,64', strength: 0.9, flicker: 0.3, seed: 1.4 });
  world.emitters.push({ type: 'ember', x: 3318, y: 2640, rate: 14, acc: 0 });

  // Market stalls
  obj(world, { kind: 'stall', x: 3660, y: 2640, w: 132, h: 86, cx: 3726, cy: 2683, rad: 90, sortY: 2728, hue: '#a84a3c' });
  rect(world, 3662, 2676, 128, 44);
  obj(world, { kind: 'stall', x: 3814, y: 2738, w: 118, h: 80, cx: 3873, cy: 2778, rad: 84, sortY: 2818, hue: '#5d6f3d' });
  rect(world, 3816, 2768, 114, 42);

  // Fences, crates, hay, lanterns
  const lanterns = [[3098, 2578], [3330, 2580], [3772, 2572], [4010, 2566], [3432, 2452], [3468, 2860]];
  for (const [x, y] of lanterns) {
    obj(world, { kind: 'lantern', x, y, cx: x, cy: y, rad: 30, sortY: y + 4 });
    world.lights.push({ x, y: y - 40, r: 130, color: '255,193,105', strength: 0.55, flicker: 0.14, seed: rng() * 9 });
  }

  obj(world, { kind: 'crate', x: 3268, y: 2330, cx: 3268, cy: 2330, rad: 24, sortY: 2354 });
  circle(world, 3268, 2330, 18);
  obj(world, { kind: 'crate', x: 3904, y: 2312, cx: 3904, cy: 2312, rad: 24, sortY: 2336 });
  circle(world, 3904, 2312, 18);
  obj(world, { kind: 'crate', x: 3246, y: 2896, cx: 3246, cy: 2896, rad: 24, sortY: 2920 });
  circle(world, 3246, 2896, 18);
  obj(world, { kind: 'barrel', x: 3564, y: 2348, cx: 3564, cy: 2348, rad: 22, sortY: 2370 });
  circle(world, 3564, 2348, 15);
  obj(world, { kind: 'barrel', x: 3968, y: 2712, cx: 3968, cy: 2712, rad: 22, sortY: 2734 });
  circle(world, 3968, 2712, 15);
  obj(world, { kind: 'barrel', x: 3312, y: 2704, cx: 3312, cy: 2704, rad: 22, sortY: 2726 });
  circle(world, 3312, 2704, 15);
  obj(world, { kind: 'hay', x: 3988, y: 2928, cx: 3988, cy: 2928, rad: 36, sortY: 2960 });
  circle(world, 3988, 2928, 26);
  obj(world, { kind: 'bench', x: 3242, y: 2688, cx: 3242, cy: 2688, rad: 38, sortY: 2700 });
  circle(world, 3242, 2688, 24);
  obj(world, { kind: 'cart', x: 4222, y: 2608, cx: 4222, cy: 2608, rad: 54, sortY: 2660 });
  circle(world, 4222, 2608, 38);

  // Village + cave signposts
  addSign(world, 3006, 2602, 'village');
  addSign(world, 3086, 1148, 'cave');

  // Fences and field.
  world.decals.push({ kind: 'field', x: 4300, y: 2380, w: 460, h: 480 });
  fence(world, 4300, 2380, 4760, 2380);
  fence(world, 4300, 2860, 4760, 2860);
  fence(world, 4300, 2380, 4300, 2560);
  fence(world, 4300, 2640, 4300, 2860);
  fence(world, 4760, 2380, 4760, 2860);

  // A small paddock by the barn.
  fence(world, 3860, 3120, 4160, 3120);
  fence(world, 3860, 3120, 3860, 3280);
  fence(world, 4160, 3120, 4160, 3280);
  fence(world, 3860, 3280, 3990, 3280);
  fence(world, 4070, 3280, 4160, 3280);

  // Elder's collider (the character itself is drawn by the game).
  circle(world, world.elder.x, world.elder.y, 15);

  // Ground litter for life.
  const litter = [
    [3400, 2540, 'barrel'], [3620, 2510, 'crate'], [3180, 2600, 'hay'], [3740, 2820, 'crate'],
    [3890, 2670, 'barrel'], [3300, 2860, 'crate'], [3590, 2790, 'hay'], [4150, 2330, 'hay']
  ];
  for (const [x, y, kind] of litter) {
    obj(world, { kind, x, y, cx: x, cy: y, rad: 22, sortY: y + 10, s: 0.8 });
    circle(world, x, y, 13);
  }
}

function fence(world, x1, y1, x2, y2) {
  obj(world, { kind: 'fence', x1, y1, x2, y2, cx: (x1 + x2) / 2, cy: (y1 + y2) / 2, rad: Math.abs(x2 - x1) / 2 + 40, sortY: Math.max(y1, y2) + 6 });
  if (x1 === x2) rect(world, x1 - 7, Math.min(y1, y2), 14, Math.abs(y2 - y1));
  else rect(world, Math.min(x1, x2), y1 - 7, Math.abs(x2 - x1), 14);
}

function addSign(world, x, y, type) {
  const texts = {
    village: 'Hollowmere Village\nFounded on good stone.\nThe Maw — north road.',
    cave: 'BEWARE THE MAW\nDo not answer the knocking\nfrom below. — R.'
  };
  obj(world, { kind: 'sign', x, y, cx: x, cy: y, rad: 30, sortY: y + 6, type });
  world.signs.push({ x, y, type, text: texts[type] });
}

// ---------------------------------------------------------------------- cave
function buildCave(world) {
  world.decals.push({ kind: 'cave', x: CAVE.x, y: CAVE.y });
  const boulders = [
    [2560, 900, 104], [2660, 1050, 82], [2478, 742, 78],
    [3156, 898, 104], [3054, 1052, 88], [3222, 744, 82],
    [2706, 668, 58], [3010, 672, 62],
    [2702, 1120, 56], [3018, 1138, 62],
    [3380, 940, 92], [2420, 940, 86]
  ];
  for (const [x, y, r] of boulders) {
    obj(world, { kind: 'boulder', x, y, cx: x, cy: y, rad: r, sortY: y + r * 0.7, s: r / 60, seed: rng() * 99 });
    circle(world, x, y, r * 0.74);
  }
  // Back wall of the shallow cave.
  rect(world, 2734, 606, 252, 74);

  const crystals = [
    [2724, 1018, 1.25], [2994, 1012, 1.1], [2836, 690, 0.72],
    [3270, 1114, 0.9], [2510, 1096, 0.8]
  ];
  for (const [x, y, s] of crystals) {
    obj(world, { kind: 'crystal', x, y, cx: x, cy: y, rad: 40 * s, sortY: y + 10, s, seed: rng() * 20 });
    world.lights.push({ x, y: y - 30, r: 170 * s, color: '112,201,224', strength: 0.65, flicker: 0.16, seed: rng() * 10 });
  }
  world.lights.push({ x: CAVE.x, y: CAVE.y + 10, r: 300, color: '79,152,190', strength: 0.36, flicker: 0.08, seed: 6.2 });
  world.emitters.push({ type: 'fog', x: 2850, y: 1120, rate: 2.6, acc: 0, radius: 130 });
  world.emitters.push({ type: 'fog', x: 2870, y: 760, rate: 2.2, acc: 1, radius: 90 });
  world.emitters.push({ type: 'sparkle', x: 2836, y: 690, rate: 2, acc: 0, color: '126,220,240' });
  world.emitters.push({ type: 'sparkle', x: 2724, y: 1018, rate: 1.5, acc: 0.6, color: '126,220,240' });

  obj(world, { kind: 'deadtree', x: 2458, y: 1218, cx: 2458, cy: 1218, rad: 70, sortY: 1224, s: 1.1, seed: 4 });
  obj(world, { kind: 'deadtree', x: 3268, y: 1236, cx: 3268, cy: 1236, rad: 70, sortY: 1242, s: 0.9, seed: 9 });
  circle(world, 2458, 1218, 16);
  circle(world, 3268, 1236, 14);
}

// --------------------------------------------------------------- water props
function buildWaterProps(world) {
  world.decals.push({ kind: 'bridge', x: BRIDGE.x, y: BRIDGE.y, w: BRIDGE.w, h: BRIDGE.h });
  world.decals.push({ kind: 'dock', x: 1188, y: 3180, w: 124, h: 190 });

  // Reeds and lily pads.
  for (let i = 0; i < 34; i++) {
    const a = rng() * TAU;
    const x = POND.x + Math.cos(a) * (POND.rx - 24 + rng() * 42);
    const y = POND.y + Math.sin(a) * (POND.ry - 20 + rng() * 34);
    if (world.isWater(x, y)) {
      if (rng() > 0.55) obj(world, { kind: 'lily', x, y, cx: x, cy: y, rad: 20, sortY: y, s: 0.7 + rng() * 0.6, seed: rng() * 10 });
      else obj(world, { kind: 'reed', x, y, cx: x, cy: y, rad: 26, sortY: y + 6, s: 0.7 + rng() * 0.7, seed: rng() * 10 });
    }
  }
  // A few reeds along the near river bank.
  for (let i = 0; i < 26; i++) {
    const t = rng();
    const seg = Math.floor(t * 5);
    const x = 2660 + (rng() - 0.5) * 60;
    const y = 1500 + seg * 420 + rng() * 300;
    if (!world.isWater(x, y)) {
      obj(world, { kind: 'reed', x, y, cx: x, cy: y, rad: 24, sortY: y + 6, s: 0.6 + rng() * 0.6, seed: rng() * 10 });
    }
  }
  world.emitters.push({ type: 'firefly', x: POND.x, y: POND.y - 80, rate: 2.4, acc: 0, radius: 320 });
  world.emitters.push({ type: 'firefly', x: 1250, y: 2380, rate: 1.4, acc: 0, radius: 400 });
  world.emitters.push({ type: 'leaf', x: 1500, y: 2350, rate: 1.8, acc: 0, radius: 900 });
}
