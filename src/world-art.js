import { TAU, hash2, clamp, mulberry32, roundedRect } from './util.js';
import {
  WORLD_W, WORLD_H, RIVER, RIVER_W, POND, BRIDGE, CAVE, BIOME
} from './world-data.js';

// ---------------------------------------------------------------- ground layer
export function drawGround(world, ctx, view, time, quality = 1) {
  const S = world.terrainScale;
  const sx = clamp(view.x * S, 0, world.terrainW);
  const sy = clamp(view.y * S, 0, world.terrainH);
  const sw = clamp(view.w * S + 1, 1, world.terrainW - sx);
  const sh = clamp(view.h * S + 1, 1, world.terrainH - sy);
  ctx.imageSmoothingEnabled = true;
  ctx.drawImage(world.terrain, sx, sy, sw, sh, view.x, view.y, view.w, view.h);

  drawWaterShimmer(ctx, view, time);

  // Crisp little details, one or two per visible biome cell.
  const cell = 56;
  const x0 = Math.floor(view.x / cell) - 1;
  const x1 = Math.floor((view.x + view.w) / cell) + 1;
  const y0 = Math.floor(view.y / cell) - 1;
  const y1 = Math.floor((view.y + view.h) / cell) + 1;
  const density = quality > 0.75 ? 1 : 0.55;

  for (let gy = y0; gy <= y1; gy++) {
    for (let gx = x0; gx <= x1; gx++) {
      const h = hash2(gx, gy, 77);
      if (h > 0.62 * density) continue;
      const x = (gx + 0.15 + hash2(gx, gy, 5) * 0.7) * cell;
      const y = (gy + 0.15 + hash2(gx, gy, 9) * 0.7) * cell;
      const b = world.biomeAt(x, y);
      if (b === BIOME.water) continue;
      const h2 = hash2(gx, gy, 31);
      const sway = Math.sin(time * 1.25 + h2 * 14) * 1.2;
      ctx.lineCap = 'round';

      if (b === BIOME.dirt) {
        if (h2 > 0.5) {
          ctx.fillStyle = h2 > 0.78 ? 'rgba(90,72,46,0.28)' : 'rgba(220,192,138,0.22)';
          ctx.beginPath();
          ctx.ellipse(x, y, 1.6 + h2 * 2.4, 1 + h2 * 1.4, h2 * 3, 0, TAU);
          ctx.fill();
        } else {
          ctx.strokeStyle = 'rgba(143,120,78,0.34)';
          ctx.lineWidth = 1.1;
          ctx.beginPath();
          ctx.moveTo(x - 4, y + 2);
          ctx.lineTo(x + sway, y - 4);
          ctx.stroke();
        }
      } else if (b === BIOME.rock) {
        ctx.fillStyle = 'rgba(92,92,82,0.28)';
        ctx.beginPath();
        ctx.ellipse(x, y, 2 + h2 * 3, 1.4 + h2 * 2, h2 * 2, 0, TAU);
        ctx.fill();
      } else if (b === BIOME.forest) {
        const shade = h2 > 0.5 ? 'rgba(44,69,36,0.42)' : 'rgba(106,135,74,0.34)';
        ctx.strokeStyle = shade;
        ctx.lineWidth = 1.35;
        ctx.beginPath();
        ctx.moveTo(x - 2, y + 3);
        ctx.quadraticCurveTo(x + sway, y - 2, x + sway * 0.6, y - 7);
        ctx.moveTo(x + 3, y + 3);
        ctx.quadraticCurveTo(x + 5 + sway, y - 1, x + 4 + sway * 0.6, y - 5);
        ctx.stroke();
        if (h2 > 0.82) {
          ctx.fillStyle = 'rgba(198,180,110,0.35)';
          ctx.beginPath();
          ctx.arc(x + 3, y - 3, 1.6, 0, TAU);
          ctx.fill();
        }
      } else {
        const tone = h2 > 0.6 ? 'rgba(128,154,89,0.46)' : 'rgba(72,99,52,0.38)';
        ctx.strokeStyle = tone;
        ctx.lineWidth = 1.15;
        ctx.beginPath();
        ctx.moveTo(x - 2.5, y + 4);
        ctx.quadraticCurveTo(x - 3 + sway, y, x - 3.5 + sway, y - 6);
        ctx.moveTo(x + 1, y + 4);
        ctx.quadraticCurveTo(x + 1 + sway * 0.7, y - 1, x + sway * 0.5, y - 8);
        ctx.moveTo(x + 4, y + 4);
        ctx.quadraticCurveTo(x + 5 + sway, y + 1, x + 5, y - 4);
        ctx.stroke();
        if (h2 > 0.92) {
          ctx.fillStyle = h2 > 0.96 ? 'rgba(235,224,166,0.75)' : 'rgba(212,190,220,0.6)';
          ctx.beginPath();
          ctx.arc(x + 4.5, y - 6, 2.1, 0, TAU);
          ctx.fill();
          ctx.fillStyle = 'rgba(255,255,255,0.45)';
          ctx.beginPath();
          ctx.arc(x + 4.2, y - 6.5, 0.8, 0, TAU);
          ctx.fill();
        }
      }
    }
  }
}

function drawWaterShimmer(ctx, view, time) {
  const visible = (x, y) => x > view.x - 80 && x < view.x + view.w + 80 && y > view.y - 80 && y < view.y + view.h + 80;
  ctx.lineCap = 'round';
  // River glints.
  const step = 0.055;
  for (let i = 0; i < RIVER.length - 1; i++) {
    const a = RIVER[i];
    const b = RIVER[i + 1];
    const segLen = Math.hypot(b[0] - a[0], b[1] - a[1]);
    const count = Math.max(1, Math.floor(segLen / 110));
    for (let j = 0; j < count; j++) {
      const t = (j + 0.5) / count;
      const x = a[0] + (b[0] - a[0]) * t;
      const y = a[1] + (b[1] - a[1]) * t;
      if (!visible(x, y)) continue;
      const h = hash2(i, j, 3);
      const dx = (b[0] - a[0]) / segLen;
      const dy = (b[1] - a[1]) / segLen;
      const nx = -dy;
      const ny = dx;
      const off = (h - 0.5) * RIVER_W * 0.5;
      const ph = time * 0.7 + h * 9;
      const len = 14 + h * 26;
      const alpha = 0.1 + 0.08 * (0.5 + 0.5 * Math.sin(ph));
      ctx.strokeStyle = `rgba(176,222,220,${alpha.toFixed(3)})`;
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.moveTo(x + nx * off - dx * len, y + ny * off - dy * len);
      ctx.quadraticCurveTo(x + nx * (off + 5), y + ny * (off + 5), x + nx * off + dx * len, y + ny * off + dy * len);
      ctx.stroke();
    }
  }
  // Pond rings.
  if (visible(POND.x, POND.y)) {
    for (let k = 0; k < 3; k++) {
      const phase = (time * 0.11 + k * 0.33) % 1;
      const r = 40 + phase * 240;
      ctx.strokeStyle = `rgba(173,220,218,${(0.1 * (1 - phase)).toFixed(3)})`;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.ellipse(POND.x - 50, POND.y - 30, r, r * 0.62, 0, 0, TAU);
      ctx.stroke();
    }
    // Lily glints.
    for (let i = 0; i < 7; i++) {
      const a = i * 2.399;
      const x = POND.x + Math.cos(a) * 140;
      const y = POND.y + Math.sin(a) * 84;
      ctx.fillStyle = 'rgba(90,128,72,0.55)';
      ctx.beginPath();
      ctx.ellipse(x, y, 13, 8, a, 0, TAU);
      ctx.fill();
      ctx.fillStyle = 'rgba(238,232,203,0.6)';
      ctx.beginPath();
      ctx.arc(x + 3, y - 2, 2.4, 0, TAU);
      ctx.fill();
    }
  }
}

// ------------------------------------------------------------------- mountains
export function drawMountains(world, ctx, view, time) {
  const near = (x, y, pad) => x < view.x + view.w + pad && x > view.x - pad && y < view.y + view.h + pad && y > view.y - pad;
  if (view.y < 900) {
    drawBand(ctx, WORLD_W, 560, 11, time, 'top');
  }
  if (view.y + view.h > WORLD_H - 900) {
    ctx.save();
    ctx.transform(1, 0, 0, -1, 0, WORLD_H);
    drawBand(ctx, WORLD_W, 560, 27, time, 'bottom');
    ctx.restore();
  }
  if (view.x < 900) {
    ctx.save();
    ctx.transform(0, 1, 1, 0, 0, 0);
    drawBand(ctx, WORLD_H, 560, 43, time, 'left');
    ctx.restore();
  }
  if (view.x + view.w > WORLD_W - 900) {
    ctx.save();
    ctx.transform(0, 1, -1, 0, WORLD_W, 0);
    drawBand(ctx, WORLD_H, 560, 61, time, 'right');
    ctx.restore();
  }
}

function drawBand(ctx, length, base, seed, time, side) {
  const rng = mulberry32(seed * 7919 + 13);
  const x0 = -420;
  const x1 = length + 420;
  // Body of the range.
  const g = ctx.createLinearGradient(0, -400, 0, base + 30);
  g.addColorStop(0, '#414a4b');
  g.addColorStop(0.38, '#5a605f');
  g.addColorStop(0.82, '#747770');
  g.addColorStop(1, '#62665f');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(x0, base);
  ctx.lineTo(x0, -420);
  ctx.lineTo(x1, -420);
  ctx.lineTo(x1, base);
  ctx.closePath();
  ctx.fill();

  // Faceted peak shapes, with snow.
  const count = Math.ceil((x1 - x0) / 250);
  for (let i = 0; i < count; i++) {
    const x = x0 + (i + 0.5) * ((x1 - x0) / count) + (rng() - 0.5) * 110;
    const w = 130 + rng() * 200;
    const h = 110 + rng() * 300;
    const apexY = base - h;
    if (apexY < -380) continue;
    const dark = rng() > 0.5;
    ctx.fillStyle = dark ? 'rgba(84,91,88,0.55)' : 'rgba(125,128,118,0.45)';
    ctx.beginPath();
    ctx.moveTo(x - w * 0.5, base + 10);
    ctx.lineTo(x, apexY);
    ctx.lineTo(x + w * 0.5, base + 10);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = 'rgba(48,54,53,0.36)';
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.moveTo(x, apexY + 4);
    ctx.lineTo(x + (rng() - 0.5) * 40, base + 10);
    ctx.stroke();
    if (h > 260) {
      ctx.fillStyle = 'rgba(232,237,232,0.82)';
      ctx.beginPath();
      ctx.moveTo(x - 3, apexY + 2);
      ctx.lineTo(x - w * 0.16, apexY + 34 + rng() * 16);
      ctx.lineTo(x - w * 0.02, apexY + 22);
      ctx.lineTo(x + w * 0.09, apexY + 42);
      ctx.lineTo(x + w * 0.18, apexY + 30);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.35)';
      ctx.beginPath();
      ctx.moveTo(x - 1, apexY + 4);
      ctx.lineTo(x - w * 0.06, apexY + 20);
      ctx.lineTo(x + w * 0.04, apexY + 24);
      ctx.closePath();
      ctx.fill();
    }
  }

  // Rock striations.
  for (let i = 0; i < 26; i++) {
    const x = x0 + rng() * (x1 - x0);
    const y = base - rng() * 430;
    ctx.strokeStyle = `rgba(43,50,49,${0.1 + rng() * 0.2})`;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + 18 + rng() * 42, y - 7 - rng() * 18);
    ctx.stroke();
  }

  // Jagged talus edge spilling into the valley.
  ctx.fillStyle = '#5d615a';
  ctx.beginPath();
  ctx.moveTo(x0, base - 26);
  let bx = x0;
  while (bx < x1) {
    const w = 48 + rng() * 120;
    const d = 6 + rng() * 30;
    ctx.lineTo(bx + w * 0.45, base - 26 + d);
    ctx.lineTo(bx + w, base - 20);
    bx += w;
  }
  ctx.lineTo(x1, base + 8);
  ctx.lineTo(x0, base + 8);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = 'rgba(35,42,40,0.5)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x0, base - 22);
  bx = x0;
  while (bx < x1) {
    const w = 48 + rng() * 120;
    ctx.lineTo(bx + w * 0.45, base - 22 + (rng() * 24));
    ctx.lineTo(bx + w, base - 18);
    bx += w;
  }
  ctx.stroke();

  // A handful of drifting mist bands at the foot.
  for (let i = 0; i < 5; i++) {
    const y = base - 30 - rng() * 80;
    const x = x0 + rng() * (x1 - x0);
    const w = 260 + rng() * 420;
    ctx.fillStyle = `rgba(207,218,214,${0.035 + rng() * 0.04})`;
    ctx.beginPath();
    ctx.ellipse(x + Math.sin(time * 0.04 + i) * 30, y, w * 0.5, 26 + rng() * 18, 0, 0, TAU);
    ctx.fill();
  }
}

// ---------------------------------------------------------------------- decals
export function drawDecals(world, ctx, view, time) {
  for (const d of world.decals) {
    switch (d.kind) {
      case 'field': drawField(ctx, d, time); break;
      case 'bridge': drawBridge(ctx, d); break;
      case 'dock': drawDock(ctx, d); break;
      case 'cave': drawCave(ctx, d, time); break;
      default: break;
    }
  }
}

function drawField(ctx, d, time) {
  ctx.save();
  roundedRect(ctx, d.x, d.y, d.w, d.h, 20);
  ctx.fillStyle = '#6d5438';
  ctx.fill();
  ctx.strokeStyle = 'rgba(58,43,28,0.55)';
  ctx.lineWidth = 5;
  ctx.stroke();
  const rows = 15;
  for (let i = 0; i < rows; i++) {
    const y = d.y + 18 + i * ((d.h - 34) / rows);
    ctx.strokeStyle = 'rgba(51,37,24,0.5)';
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.moveTo(d.x + 16, y);
    ctx.lineTo(d.x + d.w - 16, y);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(168,139,92,0.18)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(d.x + 16, y + 4);
    ctx.lineTo(d.x + d.w - 16, y + 4);
    ctx.stroke();
    for (let j = 0; j < 18; j++) {
      const x = d.x + 22 + j * ((d.w - 44) / 18) + Math.sin(i * 2 + j) * 2;
      const h = hash2(i, j, 9);
      const sway = Math.sin(time * 1.1 + i + j * 0.7) * 1.3;
      ctx.strokeStyle = h > 0.5 ? 'rgba(114,145,68,0.85)' : 'rgba(88,120,52,0.85)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x, y + 2);
      ctx.quadraticCurveTo(x + sway, y - 7, x + sway * 1.4, y - 13);
      ctx.stroke();
      if (h > 0.9) {
        ctx.fillStyle = h > 0.95 ? '#d98a3c' : '#c9b34e';
        ctx.beginPath();
        ctx.arc(x + sway * 1.4, y - 14, 3.4, 0, TAU);
        ctx.fill();
      }
    }
  }
  ctx.restore();
}

function drawBridge(ctx, d) {
  ctx.save();
  ctx.fillStyle = 'rgba(20,28,24,0.28)';
  roundedRect(ctx, d.x + 10, d.y + 16, d.w, d.h, 12);
  ctx.fill();
  roundedRect(ctx, d.x, d.y, d.w, d.h, 10);
  ctx.fillStyle = '#8a6b45';
  ctx.fill();
  const planks = 22;
  for (let i = 0; i < planks; i++) {
    const y = d.y + 6 + i * ((d.h - 12) / planks);
    ctx.fillStyle = i % 2 === 0 ? 'rgba(191,159,108,0.55)' : 'rgba(88,66,43,0.4)';
    ctx.fillRect(d.x + 5, y, d.w - 10, (d.h - 12) / planks - 2);
  }
  ctx.strokeStyle = '#4f3b27';
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(d.x + 8, d.y + 9);
  ctx.lineTo(d.x + d.w - 8, d.y + 9);
  ctx.moveTo(d.x + 8, d.y + d.h - 9);
  ctx.lineTo(d.x + d.w - 8, d.y + d.h - 9);
  ctx.stroke();
  for (let i = 0; i < 7; i++) {
    const x = d.x + 12 + i * ((d.w - 24) / 6);
    ctx.fillStyle = '#4a3724';
    ctx.fillRect(x, d.y + 2, 7, 16);
    ctx.fillRect(x, d.y + d.h - 18, 7, 16);
  }
  ctx.restore();
}

function drawDock(ctx, d) {
  ctx.save();
  ctx.fillStyle = 'rgba(20,27,24,0.25)';
  roundedRect(ctx, d.x + 8, d.y + 12, d.w, d.h, 6);
  ctx.fill();
  roundedRect(ctx, d.x, d.y, d.w, d.h, 4);
  ctx.fillStyle = '#8a6c48';
  ctx.fill();
  for (let i = 0; i < 16; i++) {
    const y = d.y + 4 + i * ((d.h - 8) / 16);
    ctx.fillStyle = i % 2 ? 'rgba(190,154,101,0.4)' : 'rgba(95,72,46,0.32)';
    ctx.fillRect(d.x + 4, y, d.w - 8, (d.h - 8) / 16 - 2);
  }
  ctx.fillStyle = '#4c3823';
  for (const [x, y] of [[d.x + 2, d.y + 8], [d.x + d.w - 8, d.y + 8], [d.x + 2, d.y + d.h - 10], [d.x + d.w - 8, d.y + d.h - 10]]) {
    ctx.fillRect(x, y, 7, 11);
  }
  ctx.restore();
}

function drawCave(ctx, d, time) {
  const x = d.x;
  const y = d.y;
  ctx.save();

  // Deep stone shelf.
  ctx.fillStyle = 'rgba(56,58,53,0.5)';
  ctx.beginPath();
  ctx.ellipse(x, y + 190, 520, 280, 0, 0, TAU);
  ctx.fill();

  // Main massif.
  const grd = ctx.createLinearGradient(x, y - 460, x, y + 290);
  grd.addColorStop(0, '#555b58');
  grd.addColorStop(0.52, '#73766e');
  grd.addColorStop(1, '#575b55');
  ctx.fillStyle = grd;
  ctx.beginPath();
  ctx.moveTo(x - 600, y + 320);
  ctx.lineTo(x - 560, y - 40);
  ctx.lineTo(x - 430, y - 230);
  ctx.lineTo(x - 300, y - 320);
  ctx.lineTo(x - 150, y - 390);
  ctx.lineTo(x - 30, y - 330);
  ctx.lineTo(x + 60, y - 420);
  ctx.lineTo(x + 190, y - 350);
  ctx.lineTo(x + 330, y - 380);
  ctx.lineTo(x + 470, y - 280);
  ctx.lineTo(x + 560, y - 90);
  ctx.lineTo(x + 600, y + 320);
  ctx.closePath();
  ctx.fill();

  // Rock faces.
  ctx.fillStyle = 'rgba(128,128,116,0.42)';
  ctx.beginPath();
  ctx.moveTo(x + 20, y - 400);
  ctx.lineTo(x + 300, y - 360);
  ctx.lineTo(x + 430, y - 120);
  ctx.lineTo(x + 210, y - 190);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = 'rgba(58,64,61,0.42)';
  ctx.beginPath();
  ctx.moveTo(x - 560, y + 60);
  ctx.lineTo(x - 370, y - 210);
  ctx.lineTo(x - 170, y - 260);
  ctx.lineTo(x - 280, y + 120);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = 'rgba(100,104,94,0.35)';
  ctx.beginPath();
  ctx.moveTo(x - 90, y - 340);
  ctx.lineTo(x + 130, y - 360);
  ctx.lineTo(x + 60, y - 120);
  ctx.lineTo(x - 200, y - 150);
  ctx.closePath();
  ctx.fill();

  // A shelf of cracks and ledges.
  ctx.strokeStyle = 'rgba(42,49,46,0.5)';
  ctx.lineWidth = 4;
  for (const [x1, y1, x2, y2] of [
    [x - 470, y - 40, x - 330, y - 120],
    [x + 350, y - 60, x + 470, y - 140],
    [x - 140, y - 330, x - 60, y - 190],
    [x + 140, y - 300, x + 210, y - 170],
    [x - 410, y + 100, x - 260, y + 60]
  ]) {
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo((x1 + x2) / 2 + 18, (y1 + y2) / 2);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  }

  // The mouth.
  ctx.beginPath();
  ctx.moveTo(x - 138, y + 170);
  ctx.lineTo(x - 138, y - 35);
  ctx.bezierCurveTo(x - 138, y - 150, x - 60, y - 170, x, y - 174);
  ctx.bezierCurveTo(x + 62, y - 170, x + 138, y - 150, x + 138, y - 35);
  ctx.lineTo(x + 138, y + 170);
  ctx.closePath();
  const voidg = ctx.createRadialGradient(x, y + 20, 20, x, y - 20, 300);
  voidg.addColorStop(0, '#04070a');
  voidg.addColorStop(0.55, '#070d12');
  voidg.addColorStop(1, '#101a1e');
  ctx.fillStyle = voidg;
  ctx.fill();

  // Wet rim light around the arch.
  ctx.strokeStyle = 'rgba(130,171,178,0.28)';
  ctx.lineWidth = 5;
  ctx.stroke();

  // Glow far inside.
  const glow = ctx.createRadialGradient(x, y + 120, 0, x, y + 120, 120);
  glow.addColorStop(0, `rgba(70,148,168,${0.25 + Math.sin(time * 1.3) * 0.05})`);
  glow.addColorStop(1, 'rgba(70,148,168,0)');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.ellipse(x, y + 120, 120, 70, 0, 0, TAU);
  ctx.fill();

  // Rune carvings flanking the mouth.
  ctx.strokeStyle = 'rgba(116,205,221,0.5)';
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  const runes = [[-205, 10], [205, 20], [-240, -80], [245, -70]];
  for (let i = 0; i < runes.length; i++) {
    const [rx, ry] = runes[i];
    const pulse = 0.4 + 0.3 * Math.sin(time * 1.6 + i);
    ctx.globalAlpha = pulse;
    ctx.beginPath();
    ctx.moveTo(x + rx - 12, y + ry + 14);
    ctx.lineTo(x + rx, y + ry - 12);
    ctx.lineTo(x + rx + 12, y + ry + 8);
    ctx.lineTo(x + rx - 4, y + ry + 4);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;

  // Stepping stones into the dark.
  ctx.fillStyle = 'rgba(99,102,92,0.5)';
  for (let i = 0; i < 4; i++) {
    ctx.beginPath();
    ctx.ellipse(x - 40 + i * 26, y + 150 + i * 28, 28 - i * 2, 13 - i, 0.2, 0, TAU);
    ctx.fill();
  }

  ctx.restore();
}
