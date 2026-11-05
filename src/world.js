import {
  clamp, mulberry32, ellipseMask, distToPolyline, dist
} from './util.js';
import {
  WORLD_W, WORLD_H, PLAY, VILLAGE, FOREST, POND, CAVE, PLAYER_START,
  RIVER, RIVER_W, BRIDGE, ROADS, BIOME, AREAS
} from './world-data.js';
import { buildWorldObjects } from './world-objects.js';

export {
  WORLD_W, WORLD_H, PLAY, VILLAGE, FOREST, POND, CAVE, PLAYER_START,
  RIVER, RIVER_W, BRIDGE, ROADS, BIOME, AREAS
};

const S = 0.25;

export class World {
  constructor() {
    this.rng = mulberry32(0x51a7e5);
    this.objects = [];
    this.decals = [];
    this.colliders = [];
    this.grid = new Map();
    this.gridCell = 320;
    this.lights = [];
    this.emitters = [];
    this.houses = [];
    this.elder = { x: 3592, y: 2438, name: 'Elder Rowan' };
    this.shrine = { x: 3368, y: 2382, level: 0 };
    this.bossHome = { x: 2860, y: 880 };
    this.bossActive = false;

    this.buildTerrain();
    this.buildWater();
    this.buildBiome();
    buildWorldObjects(this);
    this.buildSpatialIndex();
    this.buildMinimap();
    this.buildMountainRidges();
  }

  // ---------------------------------------------------------------- terrain
  buildTerrain() {
    const tw = Math.ceil(WORLD_W * S);
    const th = Math.ceil(WORLD_H * S);
    const c = document.createElement('canvas');
    c.width = tw; c.height = th;
    const g = c.getContext('2d');
    g.scale(S, S);
    const rng = mulberry32(991733);

    const sky = g.createLinearGradient(0, 0, WORLD_W * 0.2, WORLD_H);
    sky.addColorStop(0, '#84995f');
    sky.addColorStop(0.42, '#7c9459');
    sky.addColorStop(1, '#738d52');
    g.fillStyle = sky;
    g.fillRect(0, 0, WORLD_W, WORLD_H);

    // Large soft colour blooms.
    const blooms = ['#93a96b', '#6c8749', '#a0a76a', '#5f7d43', '#8fa066', '#7b9454'];
    for (let i = 0; i < 260; i++) {
      const x = rng() * WORLD_W;
      const y = rng() * WORLD_H;
      const r = 130 + rng() * 460;
      const grd = g.createRadialGradient(x, y, 0, x, y, r);
      grd.addColorStop(0, blooms[Math.floor(rng() * blooms.length)] + 'aa');
      grd.addColorStop(1, 'rgba(120,145,90,0)');
      g.globalAlpha = 0.1 + rng() * 0.12;
      g.fillStyle = grd;
      g.fillRect(x - r, y - r, r * 2, r * 2);
    }
    g.globalAlpha = 1;

    // The Whisperwood floor.
    const softEllipse = (cx, cy, rx, ry, inner, outer) => {
      const grd = g.createRadialGradient(0, 0, 0, 0, 0, 1);
      grd.addColorStop(0, inner);
      grd.addColorStop(0.72, inner);
      grd.addColorStop(1, outer);
      g.save();
      g.translate(cx, cy);
      g.scale(rx, ry);
      g.fillStyle = grd;
      g.beginPath();
      g.arc(0, 0, 1, 0, Math.PI * 2);
      g.fill();
      g.restore();
    };
    softEllipse(FOREST.x, FOREST.y, FOREST.rx * 1.18, FOREST.ry * 1.18, 'rgba(75,105,58,0.55)', 'rgba(75,105,58,0)');
    softEllipse(FOREST.x - 80, FOREST.y + 60, FOREST.rx * 0.94, FOREST.ry * 0.92, 'rgba(56,84,45,0.45)', 'rgba(56,84,45,0)');
    softEllipse(2260, 1500, 520, 430, 'rgba(64,92,50,0.4)', 'rgba(64,92,50,0)');

    // Northern stone reach.
    const high = g.createLinearGradient(0, 0, 0, 1700);
    high.addColorStop(0, 'rgba(128,126,102,0.9)');
    high.addColorStop(0.5, 'rgba(120,122,94,0.45)');
    high.addColorStop(1, 'rgba(120,130,90,0)');
    g.fillStyle = high;
    g.fillRect(0, 0, WORLD_W, 1750);
    for (let i = 0; i < 90; i++) {
      const x = rng() * WORLD_W;
      const y = rng() * 1500;
      const r = 40 + rng() * 150;
      softEllipse(x, y, r, r * (0.5 + rng() * 0.5), 'rgba(132,130,112,0.28)', 'rgba(132,130,112,0)');
    }

    // Village trodden earth.
    softEllipse(VILLAGE.x, VILLAGE.y, 610, 560, 'rgba(176,146,100,0.72)', 'rgba(176,146,100,0)');
    softEllipse(VILLAGE.x - 90, VILLAGE.y + 70, 430, 390, 'rgba(188,158,111,0.53)', 'rgba(188,158,111,0)');
    softEllipse(VILLAGE.x + 950, VILLAGE.y + 100, 330, 310, 'rgba(160,128,82,0.34)', 'rgba(160,128,82,0)');

    // Roads: wide soft shoulder, packed earth, pale centre.
    const strokeRoad = (pts, w, color, alpha) => {
      g.beginPath();
      g.moveTo(pts[0][0], pts[0][1]);
      for (let i = 1; i < pts.length; i++) g.lineTo(pts[i][0], pts[i][1]);
      g.lineCap = 'round';
      g.lineJoin = 'round';
      g.strokeStyle = color;
      g.globalAlpha = alpha;
      g.lineWidth = w;
      g.stroke();
      g.globalAlpha = 1;
    };
    for (const road of ROADS) {
      strokeRoad(road, 96, '#7d6947', 0.34);
      strokeRoad(road, 62, '#b3915f', 0.8);
      strokeRoad(road, 30, '#c8ab78', 0.42);
    }

    // River and pond.
    const strokeRiver = (w, color, alpha) => {
      g.beginPath();
      g.moveTo(RIVER[0][0], RIVER[0][1]);
      for (let i = 1; i < RIVER.length; i++) g.lineTo(RIVER[i][0], RIVER[i][1]);
      g.lineCap = 'round';
      g.lineJoin = 'round';
      g.strokeStyle = color;
      g.globalAlpha = alpha;
      g.lineWidth = w;
      g.stroke();
      g.globalAlpha = 1;
    };
    strokeRiver(RIVER_W + 62, '#5c6c52', 0.55);
    strokeRiver(RIVER_W + 22, '#6b7259', 0.85);
    strokeRiver(RIVER_W, '#3d6c75', 1);
    strokeRiver(RIVER_W * 0.66, '#467d86', 0.9);
    strokeRiver(RIVER_W * 0.22, '#7aa8aa', 0.35);
    softEllipse(POND.x, POND.y, POND.rx + 34, POND.ry + 30, 'rgba(91,105,79,0.9)', 'rgba(91,105,79,0)');
    softEllipse(POND.x, POND.y, POND.rx, POND.ry, '#3a6770', '#456f75');
    softEllipse(POND.x - 40, POND.y - 30, POND.rx * 0.7, POND.ry * 0.66, 'rgba(91,150,151,0.5)', 'rgba(91,150,151,0)');

    // Rock apron around the cave.
    softEllipse(CAVE.x, CAVE.y + 40, 620, 460, 'rgba(126,123,111,0.75)', 'rgba(126,123,111,0)');
    softEllipse(CAVE.x, CAVE.y + 120, 430, 300, 'rgba(107,105,95,0.55)', 'rgba(107,105,95,0)');

    // Texture noise.
    const img = g.getImageData(0, 0, tw, th);
    const d = img.data;
    let seed = 0x1234567;
    for (let i = 0; i < d.length; i += 4) {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      const n = (((seed >>> 15) & 255) - 128) * 0.085;
      d[i] = clamp(d[i] + n, 0, 255);
      d[i + 1] = clamp(d[i + 1] + n, 0, 255);
      d[i + 2] = clamp(d[i + 2] + n * 0.8, 0, 255);
    }
    g.putImageData(img, 0, 0);

    // Faint hand-painted speckle.
    g.globalAlpha = 0.16;
    for (let i = 0; i < 9000; i++) {
      const x = rng() * WORLD_W;
      const y = rng() * WORLD_H;
      const dark = rng() > 0.42;
      g.fillStyle = dark ? '#4d5f3e' : '#b4bd84';
      g.beginPath();
      g.arc(x, y, 1 + rng() * 3.4, 0, Math.PI * 2);
      g.fill();
    }
    g.globalAlpha = 1;

    this.terrain = c;
    this.terrainScale = S;
    this.terrainW = tw;
    this.terrainH = th;
  }

  // ------------------------------------------------------------- water mask
  buildWater() {
    const c = document.createElement('canvas');
    c.width = this.terrainW; c.height = this.terrainH;
    const g = c.getContext('2d');
    g.scale(S, S);
    g.fillStyle = '#000';
    g.fillRect(0, 0, WORLD_W, WORLD_H);
    g.strokeStyle = '#fff';
    g.fillStyle = '#fff';
    g.lineCap = 'round';
    g.lineJoin = 'round';
    g.lineWidth = RIVER_W - 14;
    g.beginPath();
    g.moveTo(RIVER[0][0], RIVER[0][1]);
    for (let i = 1; i < RIVER.length; i++) g.lineTo(RIVER[i][0], RIVER[i][1]);
    g.stroke();
    g.beginPath();
    g.ellipse(POND.x, POND.y, POND.rx - 18, POND.ry - 16, 0, 0, Math.PI * 2);
    g.fill();
    // Bridge deck is walkable.
    g.fillStyle = '#000';
    g.fillRect(BRIDGE.x, BRIDGE.y, BRIDGE.w, BRIDGE.h);

    const data = g.getImageData(0, 0, c.width, c.height).data;
    const mask = new Uint8Array(c.width * c.height);
    for (let i = 0, p = 0; i < data.length; i += 4, p++) mask[p] = data[i] > 100 ? 1 : 0;
    this.waterMask = mask;
    this.waterW = c.width;
    this.waterH = c.height;
  }

  isWater(x, y) {
    if (x < 0 || y < 0 || x >= WORLD_W || y >= WORLD_H) return false;
    const px = (x * S) | 0;
    const py = (y * S) | 0;
    return this.waterMask[py * this.waterW + px] === 1;
  }

  waterCircle(x, y, r) {
    if (this.isWater(x, y)) return true;
    const q = r * 0.72;
    return this.isWater(x - q, y) || this.isWater(x + q, y) || this.isWater(x, y - q) || this.isWater(x, y + q);
  }

  // ------------------------------------------------------------------ biome
  buildBiome() {
    this.biomeCell = 56;
    this.biomeCols = Math.ceil(WORLD_W / this.biomeCell);
    this.biomeRows = Math.ceil(WORLD_H / this.biomeCell);
    this.biome = new Uint8Array(this.biomeCols * this.biomeRows);
    const onRoad = (x, y) => {
      for (const road of ROADS) if (distToPolyline(x, y, road) < 40) return true;
      return false;
    };
    for (let gy = 0; gy < this.biomeRows; gy++) {
      for (let gx = 0; gx < this.biomeCols; gx++) {
        const x = (gx + 0.5) * this.biomeCell;
        const y = (gy + 0.5) * this.biomeCell;
        let b = BIOME.grass;
        if (this.isWater(x, y)) b = BIOME.water;
        else if (dist(x, y, VILLAGE.x, VILLAGE.y) < 560 || onRoad(x, y)) b = BIOME.dirt;
        else if (ellipseMask(x, y, FOREST.x, FOREST.y, FOREST.rx, FOREST.ry) < 1.02) b = BIOME.forest;
        else if (y < 1260 && (dist(x, y, CAVE.x, CAVE.y) < 640 || x < 900 || x > 4700)) b = BIOME.rock;
        else if (y < 900) b = BIOME.rock;
        this.biome[gy * this.biomeCols + gx] = b;
      }
    }
  }

  biomeAt(x, y) {
    const gx = clamp((x / this.biomeCell) | 0, 0, this.biomeCols - 1);
    const gy = clamp((y / this.biomeCell) | 0, 0, this.biomeRows - 1);
    return this.biome[gy * this.biomeCols + gx];
  }

  // -------------------------------------------------------------- collision
  addCollider(c) {
    c.id = this.colliders.length;
    this.colliders.push(c);
  }

  buildSpatialIndex() {
    this.grid.clear();
    for (const c of this.colliders) {
      let minX, minY, maxX, maxY;
      if (c.type === 'circle') {
        minX = c.x - c.r; maxX = c.x + c.r;
        minY = c.y - c.r; maxY = c.y + c.r;
      } else {
        minX = c.x; maxX = c.x + c.w;
        minY = c.y; maxY = c.y + c.h;
      }
      const x0 = Math.floor(minX / this.gridCell);
      const x1 = Math.floor(maxX / this.gridCell);
      const y0 = Math.floor(minY / this.gridCell);
      const y1 = Math.floor(maxY / this.gridCell);
      for (let gy = y0; gy <= y1; gy++) {
        for (let gx = x0; gx <= x1; gx++) {
          const key = gx + ',' + gy;
          let bucket = this.grid.get(key);
          if (!bucket) { bucket = []; this.grid.set(key, bucket); }
          bucket.push(c);
        }
      }
    }
  }

  queryColliders(x, y, r, out) {
    const result = out || [];
    result.length = 0;
    const x0 = Math.floor((x - r) / this.gridCell);
    const x1 = Math.floor((x + r) / this.gridCell);
    const y0 = Math.floor((y - r) / this.gridCell);
    const y1 = Math.floor((y + r) / this.gridCell);
    const seen = this._seen || (this._seen = new Set());
    seen.clear();
    for (let gy = y0; gy <= y1; gy++) {
      for (let gx = x0; gx <= x1; gx++) {
        const bucket = this.grid.get(gx + ',' + gy);
        if (!bucket) continue;
        for (const c of bucket) {
          if (seen.has(c.id)) continue;
          seen.add(c.id);
          result.push(c);
        }
      }
    }
    return result;
  }

  canOccupy(x, y, r) {
    if (x - r < PLAY.x || y - r < PLAY.y || x + r > PLAY.x + PLAY.w || y + r > PLAY.y + PLAY.h) return false;
    return !this.waterCircle(x, y, r);
  }

  pushOut(x, y, r, cols) {
    let px = x, py = y;
    for (const c of cols) {
      if (c.type === 'circle') {
        const dx = px - c.x;
        const dy = py - c.y;
        const min = c.r + r;
        const d = Math.hypot(dx, dy);
        if (d < min) {
          if (d < 0.0001) { px += min; }
          else {
            px = c.x + (dx / d) * min;
            py = c.y + (dy / d) * min;
          }
        }
      } else {
        const cx = clamp(px, c.x, c.x + c.w);
        const cy = clamp(py, c.y, c.y + c.h);
        let dx = px - cx;
        let dy = py - cy;
        const d = Math.hypot(dx, dy);
        if (d < r) {
          if (d > 0.0001) {
            px = cx + (dx / d) * r;
            py = cy + (dy / d) * r;
          } else {
            const left = px - c.x;
            const right = c.x + c.w - px;
            const top = py - c.y;
            const bottom = c.y + c.h - py;
            const m = Math.min(left, right, top, bottom);
            if (m === left) px = c.x - r;
            else if (m === right) px = c.x + c.w + r;
            else if (m === top) py = c.y - r;
            else py = c.y + c.h + r;
          }
        }
      }
    }
    return { x: px, y: py };
  }

  resolveMove(x, y, r, dx, dy) {
    let ox = x, oy = y;
    if (dx !== 0) {
      const nx = x + dx;
      if (this.canOccupy(nx, y, r)) x = nx;
    }
    if (dy !== 0) {
      const ny = y + dy;
      if (this.canOccupy(x, ny, r)) y = ny;
    }
    const cols = this.queryColliders(x, y, r + 6);
    if (cols.length) {
      const p = this.pushOut(x, y, r, cols);
      if (this.canOccupy(p.x, p.y, r)) { x = p.x; y = p.y; }
      else if (this.canOccupy(p.x, y, r)) { x = p.x; }
      else if (this.canOccupy(x, p.y, r)) { y = p.y; }
    }
    if (!this.canOccupy(x, y, r)) {
      if (this.canOccupy(ox, y, r)) { x = ox; }
      else if (this.canOccupy(x, oy, r)) { y = oy; }
      else { x = ox; y = oy; }
    }
    return { x, y };
  }

  // ---------------------------------------------------------------- queries
  nearbyObjects(x, y, r) {
    const out = [];
    for (const o of this.objects) {
      if (Math.abs(o.cx - x) < r + (o.rad || 0) && Math.abs(o.cy - y) < r + (o.rad || 0)) out.push(o);
    }
    return out;
  }

  areaAt(x, y) {
    let best = null;
    let bestScore = Infinity;
    for (const a of AREAS) {
      const d = dist(x, y, a.cx, a.cy);
      if (d < a.r && d / a.r < bestScore) { bestScore = d / a.r; best = a; }
    }
    return best || { key: 'valley', name: 'The Hollow Valley' };
  }

  buildMinimap() {
    const c = document.createElement('canvas');
    c.width = 400; c.height = 300;
    const g = c.getContext('2d');
    g.drawImage(this.terrain, 0, 0, c.width, c.height);
    const vg = g.createRadialGradient(200, 150, 80, 200, 150, 250);
    vg.addColorStop(0, 'rgba(0,0,0,0)');
    vg.addColorStop(1, 'rgba(6,10,7,0.65)');
    g.fillStyle = vg;
    g.fillRect(0, 0, 400, 300);
    this.minimapBase = c;
  }

  // ------------------------------------------------------- mountain silhouettes
  buildMountainRidges() {
    const rng = mulberry32(0x77aa33);
    const ridge = (count, step, origin, axis, dir, base) => {
      const front = [];
      const back = [];
      for (let i = 0; i <= count; i++) {
        const t = i / count;
        const pos = origin + i * step;
        const envelope = 0.5 + 0.5 * Math.sin(clamp(t, 0, 1) * Math.PI);
        const peak = (130 + rng() * 270) * (0.55 + envelope * 0.65);
        const peakBack = peak + 70 + rng() * 180;
        if (axis === 'x') {
          front.push([pos, base + dir * -peak]);
          back.push([pos, base + dir * -peakBack]);
        } else {
          front.push([base + dir * -peak, pos]);
          back.push([base + dir * -peakBack, pos]);
        }
      }
      return { front, back };
    };
    this.ridges = {
      top: ridge(30, (WORLD_W + 800) / 30, -400, 'x', 1, 560),
      bottom: ridge(30, (WORLD_W + 800) / 30, -400, 'x', -1, WORLD_H - 560),
      left: ridge(24, (WORLD_H + 800) / 24, -400, 'y', 1, 560),
      right: ridge(24, (WORLD_H + 800) / 24, -400, 'y', -1, WORLD_W - 560)
    };
    this.ridgeSnow = [];
    for (const key of ['top', 'bottom', 'left', 'right']) {
      const pts = this.ridges[key].back;
      for (let i = 1; i < pts.length - 1; i++) {
        const p = pts[i];
        const a = pts[i - 1];
        const b = pts[i + 1];
        if (key === 'top' || key === 'bottom') {
          if (p[1] < a[1] && p[1] < b[1]) this.ridgeSnow.push({ key, x: p[0], y: p[1], s: 18 + rng() * 22 });
        } else if (p[0] < a[0] && p[0] < b[0]) {
          this.ridgeSnow.push({ key, x: p[0], y: p[1], s: 18 + rng() * 22 });
        }
      }
    }
  }
}
