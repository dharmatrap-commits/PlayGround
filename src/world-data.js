// Static geography shared by simulation and rendering.
export const WORLD_W = 5600;
export const WORLD_H = 4200;

// Walkable rectangle. The mountain ring is drawn beyond it.
export const PLAY = { x: 560, y: 560, w: 4480, h: 3080 };

export const VILLAGE = { x: 3520, y: 2520 };
export const FOREST = { x: 1450, y: 2320, rx: 980, ry: 860 };
export const POND = { x: 1230, y: 3490, rx: 370, ry: 245 };
export const CAVE = { x: 2860, y: 870 };
export const PLAYER_START = { x: 3465, y: 2662 };
export const RIVER_W = 170;
export const BRIDGE = { x: 2490, y: 2470, w: 350, h: 180 };

export const RIVER = [
  [3020, -100], [2960, 360], [2860, 860], [2770, 1380], [2720, 1880],
  [2690, 2280], [2660, 2620], [2610, 3020], [2540, 3420], [2580, 3840], [2670, 4300]
];

export const ROADS = [
  [[1760, 2600], [2100, 2600], [2380, 2580], [2540, 2570], [2800, 2565], [3120, 2570], [3400, 2570], [3700, 2560], [4040, 2550], [4300, 2535]],
  [[3420, 2480], [3370, 2280], [3320, 2000], [3230, 1740], [3110, 1470], [3000, 1200], [2930, 1000], [2900, 930]],
  [[2500, 2620], [2280, 2660], [2040, 2590], [1790, 2470], [1560, 2390]],
  [[2560, 2620], [2340, 2760], [2090, 2960], [1850, 3180], [1600, 3370], [1400, 3430]],
  [[3520, 2660], [3500, 2920], [3550, 3150], [3640, 3380], [3700, 3610]],
  [[3860, 2560], [4080, 2570], [4300, 2620], [4530, 2720], [4700, 2920]]
];

export const BIOME = { water: 0, dirt: 1, grass: 2, forest: 3, rock: 4 };

// Main area labels shown when the player crosses into a region.
export const AREAS = [
  { key: 'village', name: 'Hollowmere Village', cx: VILLAGE.x, cy: VILLAGE.y, r: 640 },
  { key: 'forest', name: 'The Whisperwood', cx: FOREST.x, cy: FOREST.y, r: 1080 },
  { key: 'cave', name: 'The Maw', cx: CAVE.x, cy: CAVE.y + 110, r: 360 },
  { key: 'pond', name: 'Mirror Pond', cx: POND.x, cy: POND.y, r: 470 },
  { key: 'highlands', name: 'The Stone Reach', cx: 3000, cy: 1350, r: 620 },
  { key: 'fields', name: 'Amber Fields', cx: 4530, cy: 2620, r: 430 }
];
