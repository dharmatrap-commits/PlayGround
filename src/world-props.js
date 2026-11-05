import { TAU, hash2, roundedRect, lerp } from './util.js';

export function drawObject(ctx, o, time) {
  switch (o.kind) {
    case 'tree': drawTree(ctx, o, time); break;
    case 'bush': drawBush(ctx, o, time); break;
    case 'rock': drawRock(ctx, o); break;
    case 'boulder': drawBoulder(ctx, o); break;
    case 'crystal': drawCrystal(ctx, o, time); break;
    case 'deadtree': drawDeadTree(ctx, o); break;
    case 'house': drawHouse(ctx, o); break;
    case 'well': drawWell(ctx, o, time); break;
    case 'shrine': drawShrine(ctx, o, time); break;
    case 'campfire': drawCampfire(ctx, o, time); break;
    case 'stall': drawStall(ctx, o); break;
    case 'fence': drawFence(ctx, o); break;
    case 'lantern': drawLantern(ctx, o, time); break;
    case 'crate': drawCrate(ctx, o); break;
    case 'barrel': drawBarrel(ctx, o); break;
    case 'hay': drawHay(ctx, o); break;
    case 'bench': drawBench(ctx, o); break;
    case 'cart': drawCart(ctx, o); break;
    case 'sign': drawSign(ctx, o); break;
    case 'reed': drawReed(ctx, o, time); break;
    case 'lily': drawLily(ctx, o, time); break;
    case 'log': drawLog(ctx, o); break;
    case 'stump': drawStump(ctx, o); break;
    case 'fern': drawFern(ctx, o, time); break;
    case 'mushroom': drawMushroom(ctx, o); break;
    case 'flowers': drawFlowers(ctx, o, time); break;
    default: break;
  }
}

function shadow(ctx, x, y, rx, ry, alpha = 0.24, offset = 5) {
  ctx.fillStyle = `rgba(24,34,22,${alpha})`;
  ctx.beginPath();
  ctx.ellipse(x + offset * 0.6, y + offset, rx, ry, 0, 0, TAU);
  ctx.fill();
}

// ---------------------------------------------------------------------- flora
function drawTree(ctx, o, time) {
  const s = o.s;
  const sway = Math.sin(time * o.sway + o.seed) * 2.2 + Math.sin(time * 0.43 + o.seed * 2) * 0.8;
  ctx.save();
  ctx.translate(o.x, o.y);
  shadow(ctx, 0, 0, 30 * s, 9.5 * s, 0.22, 3);

  if (o.type === 'pine') {
    ctx.fillStyle = '#58412d';
    ctx.fillRect(-4 * s, -34 * s, 8 * s, 36 * s);
    ctx.fillStyle = '#6a4e35';
    ctx.fillRect(-4 * s, -34 * s, 3 * s, 36 * s);
    const layers = [
      [-16 * s, 0, 32 * s, 32 * s],
      [-12 * s, -30 * s, 25 * s, 26 * s],
      [-7 * s, -56 * s, 17 * s, 22 * s]
    ];
    for (let i = 0; i < layers.length; i++) {
      const [bx, by, bw, bh] = layers[i];
      const lift = -78 * s - i * 4;
      const peak = by + lift;
      ctx.fillStyle = o.tones[i] || o.tones[2];
      ctx.beginPath();
      ctx.moveTo(bx - sway * (i * 0.25), by);
      ctx.lineTo(sway * (1 + i * 0.2), peak);
      ctx.lineTo(bx + bw, by);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = 'rgba(30,52,28,0.32)';
      ctx.beginPath();
      ctx.moveTo(bx + bw * 0.5, by);
      ctx.lineTo(sway * (1 + i * 0.2), peak);
      ctx.lineTo(bx + bw, by);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = 'rgba(168,190,124,0.22)';
      ctx.beginPath();
      ctx.moveTo(bx + bw * 0.12, by - 1);
      ctx.lineTo(sway * (1 + i * 0.2) - 3, peak + 8 * s);
      ctx.lineTo(bx + bw * 0.32, by - 1);
      ctx.closePath();
      ctx.fill();
    }
  } else if (o.type === 'birch') {
    ctx.fillStyle = '#d9d6c4';
    ctx.beginPath();
    ctx.moveTo(-4 * s, 0);
    ctx.lineTo(-3 * s, -46 * s);
    ctx.lineTo(3 * s, -46 * s);
    ctx.lineTo(4 * s, 0);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#4b443a';
    for (let i = 0; i < 4; i++) ctx.fillRect(-3 * s, -37 * s + i * 8 * s, 6 * s, 1.5 * s);
    const c = o.tones;
    ctx.fillStyle = c[0];
    ctx.beginPath();
    ctx.ellipse(sway * 0.6, -62 * s, 27 * s, 24 * s, 0.1, 0, TAU);
    ctx.fill();
    ctx.fillStyle = c[1];
    ctx.beginPath();
    ctx.ellipse(sway * 0.6 - 8 * s, -68 * s, 20 * s, 17 * s, -0.2, 0, TAU);
    ctx.fill();
    ctx.fillStyle = c[2];
    ctx.beginPath();
    ctx.ellipse(sway * 0.5 - 13 * s, -73 * s, 11 * s, 9 * s, -0.4, 0, TAU);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,246,200,0.16)';
    ctx.beginPath();
    ctx.ellipse(sway * 0.5 - 15 * s, -77 * s, 7 * s, 5 * s, -0.4, 0, TAU);
    ctx.fill();
  } else {
    // Oak.
    ctx.fillStyle = '#5a4330';
    ctx.beginPath();
    ctx.moveTo(-6 * s, 0);
    ctx.lineTo(-4 * s, -44 * s);
    ctx.lineTo(4 * s, -48 * s);
    ctx.lineTo(6 * s, 0);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#4a3626';
    ctx.lineWidth = 2.6 * s;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(0, -36 * s);
    ctx.lineTo(-12 * s, -52 * s);
    ctx.moveTo(1, -40 * s);
    ctx.lineTo(13 * s, -56 * s);
    ctx.stroke();
    const c = o.tones;
    const blobs = [
      [-20, -68, 23], [17, -72, 24], [-3, -86, 27], [-25, -88, 17], [24, -92, 16]
    ];
    for (let i = 0; i < blobs.length; i++) {
      const [bx, by, br] = blobs[i];
      ctx.fillStyle = c[i % 2];
      ctx.beginPath();
      ctx.arc(bx * s + sway * (0.6 + i * 0.1), by * s, br * s, 0, TAU);
      ctx.fill();
    }
    ctx.fillStyle = c[2];
    ctx.beginPath();
    ctx.arc(-9 * s + sway * 0.8, -96 * s, 17 * s, 0, TAU);
    ctx.arc(13 * s + sway * 0.8, -88 * s, 13 * s, 0, TAU);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,240,170,0.13)';
    ctx.beginPath();
    ctx.arc(-12 * s + sway, -100 * s, 9 * s, 0, TAU);
    ctx.fill();
  }
  ctx.restore();
}

function drawBush(ctx, o, time) {
  const s = o.s;
  const sway = Math.sin(time * 0.9 + o.seed) * 1.2;
  ctx.save();
  ctx.translate(o.x, o.y);
  shadow(ctx, 0, 0, 20 * s, 6 * s, 0.18, 2);
  const c = o.tones;
  ctx.fillStyle = c[0];
  ctx.beginPath();
  ctx.ellipse(-9 * s + sway, -10 * s, 13 * s, 11 * s, -0.2, 0, TAU);
  ctx.ellipse(9 * s + sway, -11 * s, 14 * s, 12 * s, 0.2, 0, TAU);
  ctx.ellipse(sway, -17 * s, 15 * s, 13 * s, 0, 0, TAU);
  ctx.fill();
  ctx.fillStyle = c[1];
  ctx.beginPath();
  ctx.ellipse(-4 * s + sway, -19 * s, 9 * s, 8 * s, -0.3, 0, TAU);
  ctx.ellipse(9 * s + sway, -16 * s, 7 * s, 6 * s, 0.3, 0, TAU);
  ctx.fill();
  if (o.berries) {
    ctx.fillStyle = '#a94238';
    for (let i = 0; i < 5; i++) {
      const a = i * 1.7 + o.seed;
      ctx.beginPath();
      ctx.arc(Math.cos(a) * 10 * s + sway, -14 * s + Math.sin(a) * 7 * s, 1.9 * s, 0, TAU);
      ctx.fill();
    }
  }
  ctx.restore();
}

function drawRock(ctx, o) {
  const s = o.s;
  ctx.save();
  ctx.translate(o.x, o.y);
  shadow(ctx, 0, 1, 26 * s, 8 * s, 0.2, 3);
  ctx.save();
  ctx.scale(s, s);
  ctx.fillStyle = o.tones[2];
  ctx.beginPath();
  o.pts.forEach(([px, py], i) => i ? ctx.lineTo(px, py) : ctx.moveTo(px, py));
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = o.tones[0];
  ctx.beginPath();
  o.pts.forEach(([px, py], i) => i ? ctx.lineTo(px * 0.8, py * 0.8 - 3) : ctx.moveTo(px * 0.8, py * 0.8 - 3));
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = o.tones[1];
  ctx.beginPath();
  ctx.moveTo(o.pts[0][0] * 0.45, o.pts[0][1] * 0.45 - 6);
  ctx.lineTo(o.pts[2][0] * 0.6, o.pts[2][1] * 0.6 - 8);
  ctx.lineTo(o.pts[3][0] * 0.55, o.pts[3][1] * 0.55 - 4);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
  ctx.restore();
}

function drawBoulder(ctx, o) {
  const s = o.s;
  ctx.save();
  ctx.translate(o.x, o.y);
  shadow(ctx, 2, 6, 58 * s, 20 * s, 0.28, 6);
  ctx.save();
  ctx.scale(s, s);
  const pts = [];
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * TAU;
    const r = 46 + hash2(i, o.seed | 0, 7) * 16;
    pts.push([Math.cos(a) * r, Math.sin(a) * r * 0.7]);
  }
  ctx.fillStyle = '#62665d';
  ctx.beginPath();
  pts.forEach(([px, py], i) => i ? ctx.lineTo(px, py) : ctx.moveTo(px, py));
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#7d806f';
  ctx.beginPath();
  pts.forEach(([px, py], i) => i ? ctx.lineTo(px * 0.72, py * 0.72 - 10) : ctx.moveTo(px * 0.72, py * 0.72 - 10));
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#8f9182';
  ctx.beginPath();
  ctx.moveTo(-22, -22);
  ctx.lineTo(4, -30);
  ctx.lineTo(26, -12);
  ctx.lineTo(2, -8);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = 'rgba(92,110,64,0.45)';
  ctx.beginPath();
  ctx.ellipse(-18, 8, 18, 7, 0.2, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = 'rgba(42,47,43,0.5)';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(6, -2);
  ctx.lineTo(14, 12);
  ctx.lineTo(4, 20);
  ctx.stroke();
  ctx.restore();
  ctx.restore();
}

function drawCrystal(ctx, o, time) {
  const s = o.s;
  const pulse = 0.75 + Math.sin(time * 1.7 + o.seed) * 0.25;
  ctx.save();
  ctx.translate(o.x, o.y);
  shadow(ctx, 0, 0, 16 * s, 5 * s, 0.16, 2);
  const glow = ctx.createRadialGradient(0, -18 * s, 2, 0, -18 * s, 64 * s);
  glow.addColorStop(0, `rgba(122,218,238,${0.28 * pulse})`);
  glow.addColorStop(1, 'rgba(122,218,238,0)');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(0, -18 * s, 64 * s, 0, TAU);
  ctx.fill();
  const shards = [[-10, 0, 9, 44], [4, 0, 8, 58], [16, 0, 6, 34]];
  for (const [dx, dy, w, h] of shards) {
    ctx.fillStyle = 'rgba(88,168,190,0.92)';
    ctx.beginPath();
    ctx.moveTo(dx - w * s, dy);
    ctx.lineTo(dx - w * 0.55 * s, -h * s * 0.9);
    ctx.lineTo(dx, -h * s);
    ctx.lineTo(dx + w * 0.6 * s, -h * s * 0.62);
    ctx.lineTo(dx + w * s, dy);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = 'rgba(178,238,248,0.55)';
    ctx.beginPath();
    ctx.moveTo(dx - w * 0.3 * s, dy - 2);
    ctx.lineTo(dx - w * 0.1 * s, -h * s * 0.86);
    ctx.lineTo(dx + w * 0.1 * s, dy - 2);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

function drawDeadTree(ctx, o) {
  const s = o.s;
  ctx.save();
  ctx.translate(o.x, o.y);
  shadow(ctx, 0, 0, 24 * s, 8 * s, 0.18, 3);
  ctx.strokeStyle = '#574536';
  ctx.lineCap = 'round';
  ctx.lineWidth = 9 * s;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(-2 * s, -54 * s);
  ctx.stroke();
  ctx.lineWidth = 5 * s;
  ctx.beginPath();
  ctx.moveTo(-2 * s, -40 * s);
  ctx.lineTo(-22 * s, -68 * s);
  ctx.moveTo(-1 * s, -50 * s);
  ctx.lineTo(19 * s, -74 * s);
  ctx.moveTo(-22 * s, -68 * s);
  ctx.lineTo(-30 * s, -60 * s);
  ctx.moveTo(19 * s, -74 * s);
  ctx.lineTo(27 * s, -88 * s);
  ctx.stroke();
  ctx.strokeStyle = '#6d5844';
  ctx.lineWidth = 2 * s;
  ctx.beginPath();
  ctx.moveTo(-3 * s, -4);
  ctx.lineTo(-4 * s, -50 * s);
  ctx.stroke();
  ctx.restore();
}

// -------------------------------------------------------------------- village
function drawHouse(ctx, o) {
  const { x, y, w, h } = o;
  ctx.save();
  ctx.fillStyle = 'rgba(22,30,20,0.25)';
  roundedRect(ctx, x + 16, y + 24, w, h * 0.9, 12);
  ctx.fill();

  // Walls.
  roundedRect(ctx, x, y + h * 0.34, w, h * 0.66, 5);
  ctx.fillStyle = o.wall;
  ctx.fill();
  ctx.fillStyle = 'rgba(122,92,58,0.18)';
  ctx.fillRect(x, y + h * 0.34, w, 8);

  // Timber framing.
  ctx.strokeStyle = o.timber;
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(x + 8, y + h * 0.36);
  ctx.lineTo(x + 8, y + h);
  ctx.moveTo(x + w - 8, y + h * 0.36);
  ctx.lineTo(x + w - 8, y + h);
  ctx.moveTo(x + w * 0.3, y + h * 0.36);
  ctx.lineTo(x + w * 0.3, y + h);
  ctx.moveTo(x + w * 0.7, y + h * 0.36);
  ctx.lineTo(x + w * 0.7, y + h);
  ctx.moveTo(x + 8, y + h * 0.82);
  ctx.lineTo(x + w - 8, y + h * 0.82);
  ctx.stroke();

  // Windows.
  for (const wx of [x + w * 0.15, x + w * 0.72]) {
    const wy = y + h * 0.58;
    const ww = w * 0.13, wh = h * 0.16;
    ctx.fillStyle = '#42321f';
    ctx.fillRect(wx - 3, wy - 3, ww + 6, wh + 6);
    const gl = ctx.createLinearGradient(wx, wy, wx, wy + wh);
    gl.addColorStop(0, '#ffd98d');
    gl.addColorStop(1, '#d98a3f');
    ctx.fillStyle = gl;
    ctx.fillRect(wx, wy, ww, wh);
    ctx.strokeStyle = '#55402a';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(wx + ww / 2, wy);
    ctx.lineTo(wx + ww / 2, wy + wh);
    ctx.moveTo(wx, wy + wh / 2);
    ctx.lineTo(wx + ww, wy + wh / 2);
    ctx.stroke();
  }

  // Door.
  const dw = o.barn ? w * 0.34 : w * 0.17;
  const dh = h * (o.barn ? 0.5 : 0.38);
  const dx = x + w / 2 - dw / 2;
  const dy = y + h - dh;
  ctx.fillStyle = '#3b2b1d';
  ctx.beginPath();
  ctx.moveTo(dx, dy + dh);
  ctx.lineTo(dx, dy + 9);
  ctx.quadraticCurveTo(dx + dw / 2, dy - 8, dx + dw, dy + 9);
  ctx.lineTo(dx + dw, dy + dh);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#6a4e33';
  ctx.lineWidth = 4;
  ctx.stroke();
  if (o.barn) {
    ctx.strokeStyle = '#8a653f';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(dx + dw / 2, dy);
    ctx.lineTo(dx + dw / 2, dy + dh);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(dx + 4, dy + 6);
    ctx.lineTo(dx + dw - 4, dy + dh - 6);
    ctx.moveTo(dx + dw - 4, dy + 6);
    ctx.lineTo(dx + 4, dy + dh - 6);
    ctx.stroke();
  }

  // Roof.
  ctx.beginPath();
  ctx.moveTo(x - 18, y + h * 0.38);
  ctx.lineTo(x + 10, y - 6);
  ctx.lineTo(x + w - 10, y - 6);
  ctx.lineTo(x + w + 18, y + h * 0.38);
  ctx.closePath();
  ctx.fillStyle = o.roof;
  ctx.fill();
  ctx.strokeStyle = o.roofDark;
  ctx.lineWidth = 4;
  ctx.stroke();
  // Shingles.
  ctx.strokeStyle = o.roofDark;
  ctx.globalAlpha = 0.38;
  ctx.lineWidth = 1.6;
  for (let i = 1; i < 7; i++) {
    const t = i / 7;
    ctx.beginPath();
    ctx.moveTo(lerp(x + 6, x + 16, t), lerp(y + 2, y + h * 0.36, t));
    ctx.lineTo(lerp(x + w - 6, x + w - 16, t), lerp(y + 2, y + h * 0.36, t));
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
  // Ridge highlight and eave shadow.
  ctx.strokeStyle = 'rgba(255,224,170,0.36)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x + 12, y - 3);
  ctx.lineTo(x + w - 12, y - 3);
  ctx.stroke();
  ctx.fillStyle = 'rgba(40,38,28,0.24)';
  ctx.fillRect(x + 2, y + h * 0.33, w - 4, 8);
  // Moss on some roofs.
  if (hash2(o.x | 0, o.y | 0, 4) > 0.45) {
    ctx.fillStyle = 'rgba(94,118,60,0.36)';
    for (let i = 0; i < 4; i++) {
      const mx = x + 24 + hash2(i, o.x | 0, 9) * (w - 48);
      const my = y + 20 + hash2(i, o.y | 0, 11) * (h * 0.2);
      ctx.beginPath();
      ctx.ellipse(mx, my, 10 + hash2(i, 2, 3) * 12, 4 + hash2(i, 4, 5) * 4, 0.1, 0, TAU);
      ctx.fill();
    }
  }

  // Chimney.
  if (o.chimney) {
    const cx = x + w * 0.72;
    const cy = y - 18;
    ctx.fillStyle = 'rgba(30,26,20,0.3)';
    ctx.fillRect(cx + 5, cy + 7, 26, 26);
    ctx.fillStyle = '#8b7560';
    ctx.fillRect(cx, cy, 26, 26);
    ctx.fillStyle = '#6d5a48';
    ctx.fillRect(cx, cy, 26, 6);
    ctx.fillStyle = '#a08b73';
    ctx.fillRect(cx + 3, cy + 8, 8, 4);
  }

  // Hanging sign for the Elder's Hall.
  if (o.name) {
    ctx.strokeStyle = '#4f3b27';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x + w - 30, y + h * 0.5);
    ctx.lineTo(x + w - 4, y + h * 0.5);
    ctx.stroke();
    ctx.fillStyle = '#6b5336';
    roundedRect(ctx, x + w - 22, y + h * 0.47, 20, 26, 3);
    ctx.fill();
    ctx.strokeStyle = '#d8b06b';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(x + w - 15, y + h * 0.49);
    ctx.lineTo(x + w - 15, y + h * 0.53);
    ctx.moveTo(x + w - 18, y + h * 0.51);
    ctx.lineTo(x + w - 12, y + h * 0.51);
    ctx.stroke();
  }
  ctx.restore();
}

function drawWell(ctx, o, time) {
  const x = o.x, y = o.y;
  ctx.save();
  shadow(ctx, x, y, 52, 15, 0.25, 4);
  // Roof and posts sit above the stone ring.
  ctx.fillStyle = '#57412c';
  ctx.fillRect(x - 42, y - 74, 7, 62);
  ctx.fillRect(x + 35, y - 74, 7, 62);
  ctx.fillStyle = '#6b4d33';
  ctx.beginPath();
  ctx.moveTo(x - 60, y - 68);
  ctx.lineTo(x - 24, y - 104);
  ctx.lineTo(x + 24, y - 104);
  ctx.lineTo(x + 60, y - 68);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#4b3625';
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.strokeStyle = 'rgba(238,210,160,0.25)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x - 52, y - 72);
  ctx.lineTo(x - 20, y - 100);
  ctx.stroke();

  // Rope and bucket.
  ctx.strokeStyle = '#7a6647';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(x + 2, y - 66);
  ctx.lineTo(x + 2, y - 28);
  ctx.stroke();
  ctx.fillStyle = '#6e5436';
  ctx.fillRect(x - 7, y - 28, 18, 14);
  ctx.strokeStyle = '#3f2f20';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(x - 7, y - 28, 18, 14);

  // Stone ring.
  ctx.fillStyle = '#8f8b7d';
  ctx.beginPath();
  ctx.ellipse(x, y, 48, 34, 0, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#6c685e';
  ctx.beginPath();
  ctx.ellipse(x, y - 2, 39, 26, 0, 0, TAU);
  ctx.fill();
  const water = ctx.createRadialGradient(x - 8, y - 8, 2, x, y, 30);
  water.addColorStop(0, '#5e969c');
  water.addColorStop(1, '#27484f');
  ctx.fillStyle = water;
  ctx.beginPath();
  ctx.ellipse(x, y - 2, 31, 20, 0, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = `rgba(190,230,225,${0.2 + Math.sin(time * 1.6) * 0.08})`;
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.ellipse(x - 6, y - 5, 12, 5, 0, 0, TAU);
  ctx.stroke();
  // Stones on the rim.
  ctx.fillStyle = '#a29d8d';
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * TAU + 0.25;
    ctx.beginPath();
    ctx.ellipse(x + Math.cos(a) * 44, y + Math.sin(a) * 30, 7, 4.6, a, 0, TAU);
    ctx.fill();
  }
  ctx.restore();
}

function drawShrine(ctx, o, time) {
  const x = o.x, y = o.y;
  const pulse = 0.6 + Math.sin(time * 1.4) * 0.2;
  ctx.save();
  shadow(ctx, x, y, 34, 12, 0.22, 3);
  ctx.fillStyle = '#5a6350';
  ctx.beginPath();
  ctx.ellipse(x, y + 4, 34, 18, 0, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#7d8470';
  ctx.beginPath();
  ctx.ellipse(x, y, 28, 14, 0, 0, TAU);
  ctx.fill();
  // Standing stone.
  ctx.fillStyle = '#71766a';
  ctx.beginPath();
  ctx.moveTo(x - 19, y + 4);
  ctx.lineTo(x - 23, y - 48);
  ctx.lineTo(x - 9, y - 76);
  ctx.lineTo(x + 11, y - 72);
  ctx.lineTo(x + 21, y - 42);
  ctx.lineTo(x + 18, y + 4);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#8d917f';
  ctx.beginPath();
  ctx.moveTo(x - 14, y + 2);
  ctx.lineTo(x - 16, y - 46);
  ctx.lineTo(x - 5, y - 68);
  ctx.lineTo(x + 1, y - 40);
  ctx.lineTo(x + 1, y + 2);
  ctx.closePath();
  ctx.fill();
  // Glowing rune.
  ctx.strokeStyle = `rgba(150,236,158,${pulse})`;
  ctx.lineWidth = 3;
  ctx.shadowColor = 'rgba(120,230,140,0.8)';
  ctx.shadowBlur = 10;
  ctx.beginPath();
  ctx.moveTo(x - 4, y - 48);
  ctx.lineTo(x + 5, y - 38);
  ctx.lineTo(x - 5, y - 28);
  ctx.lineTo(x + 5, y - 18);
  ctx.stroke();
  ctx.shadowBlur = 0;
  // Moss and offerings.
  ctx.fillStyle = 'rgba(95,125,66,0.5)';
  ctx.beginPath();
  ctx.ellipse(x - 12, y - 2, 10, 5, 0.3, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#a79b7d';
  for (let i = 0; i < 4; i++) {
    ctx.beginPath();
    ctx.arc(x - 24 + i * 10, y + 16 + Math.sin(i * 2) * 4, 3, 0, TAU);
    ctx.fill();
  }
  ctx.restore();
}

function drawCampfire(ctx, o, time) {
  const x = o.x, y = o.y;
  ctx.save();
  shadow(ctx, x, y, 36, 12, 0.25, 3);
  ctx.fillStyle = '#69665c';
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * TAU;
    ctx.beginPath();
    ctx.ellipse(x + Math.cos(a) * 25, y + Math.sin(a) * 14, 7, 4.6, a, 0, TAU);
    ctx.fill();
  }
  ctx.strokeStyle = '#4f3623';
  ctx.lineWidth = 7;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x - 15, y + 5);
  ctx.lineTo(x + 15, y - 5);
  ctx.moveTo(x - 13, y - 6);
  ctx.lineTo(x + 14, y + 6);
  ctx.stroke();
  const flick = 1 + Math.sin(time * 8.3) * 0.08 + Math.sin(time * 13.7) * 0.05;
  const glow = ctx.createRadialGradient(x, y - 12, 2, x, y - 12, 44);
  glow.addColorStop(0, 'rgba(255,196,96,0.5)');
  glow.addColorStop(1, 'rgba(255,140,50,0)');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(x, y - 12, 44, 0, TAU);
  ctx.fill();
  // Flames.
  const flames = [
    [0, 21 * flick, 26 * flick, '#c94e22'],
    [-5, 14 * flick, 20 * flick, '#ef7c2c'],
    [4, 10 * flick, 15 * flick, '#ffb347'],
    [0, 5 * flick, 9 * flick, '#ffe9a3']
  ];
  for (const [dx, w, h, color] of flames) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(x + dx - w * 0.5, y - 2);
    ctx.quadraticCurveTo(x + dx - w * 0.6 + Math.sin(time * 5 + dx) * 3, y - h * 0.6, x + dx + Math.sin(time * 7 + dx) * 4, y - h);
    ctx.quadraticCurveTo(x + dx + w * 0.7, y - h * 0.5, x + dx + w * 0.5, y - 2);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

function drawStall(ctx, o) {
  const { x, y, w, h } = o;
  ctx.save();
  ctx.fillStyle = 'rgba(22,30,20,0.22)';
  roundedRect(ctx, x + 8, y + 14, w, h, 5);
  ctx.fill();
  // Table.
  roundedRect(ctx, x + 6, y + h * 0.52, w - 12, h * 0.42, 3);
  ctx.fillStyle = '#8b683f';
  ctx.fill();
  ctx.fillStyle = '#a47d4e';
  ctx.fillRect(x + 10, y + h * 0.55, w - 20, 4);
  // Posts.
  ctx.fillStyle = '#5a4129';
  ctx.fillRect(x + 4, y + 8, 6, h * 0.6);
  ctx.fillRect(x + w - 10, y + 8, 6, h * 0.6);
  // Awning stripes.
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(x - 6, y + 6);
  ctx.lineTo(x + w + 6, y + 6);
  ctx.lineTo(x + w + 12, y + h * 0.5);
  ctx.lineTo(x - 12, y + h * 0.5);
  ctx.closePath();
  ctx.clip();
  for (let i = 0; i < 7; i++) {
    ctx.fillStyle = i % 2 ? '#e3d3ac' : o.hue;
    ctx.fillRect(x - 12 + i * (w + 24) / 7, y + 2, (w + 24) / 7, h * 0.55);
  }
  ctx.fillStyle = 'rgba(38,32,22,0.2)';
  ctx.fillRect(x - 12, y + 2, w + 24, h * 0.1);
  ctx.restore();
  // Produce.
  const colors = ['#c25a38', '#d8a23d', '#6e8b3f', '#b4423e'];
  for (let i = 0; i < 9; i++) {
    ctx.fillStyle = colors[i % colors.length];
    ctx.beginPath();
    ctx.arc(x + 18 + (i % 4) * 22, y + h * 0.6 + Math.floor(i / 4) * 10, 4.4, 0, TAU);
    ctx.fill();
  }
  ctx.restore();
}

function drawFence(ctx, o) {
  const { x1, y1, x2, y2 } = o;
  const len = Math.hypot(x2 - x1, y2 - y1);
  const dx = (x2 - x1) / len;
  const dy = (y2 - y1) / len;
  ctx.save();
  ctx.strokeStyle = 'rgba(26,32,22,0.18)';
  ctx.lineWidth = 10;
  ctx.beginPath();
  ctx.moveTo(x1 + 5, y1 + 6);
  ctx.lineTo(x2 + 5, y2 + 6);
  ctx.stroke();
  // Two rails, drawn as a shallow height impression.
  ctx.strokeStyle = '#6e5133';
  ctx.lineWidth = 5;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x1, y1 - 14);
  ctx.lineTo(x2, y2 - 14);
  ctx.moveTo(x1, y1 - 6);
  ctx.lineTo(x2, y2 - 6);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(197,163,111,0.4)';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(x1, y1 - 16);
  ctx.lineTo(x2, y2 - 16);
  ctx.stroke();
  const posts = Math.max(2, Math.round(len / 62));
  for (let i = 0; i <= posts; i++) {
    const t = i / posts;
    const x = x1 + (x2 - x1) * t;
    const y = y1 + (y2 - y1) * t;
    ctx.fillStyle = '#56402a';
    ctx.fillRect(x - 4, y - 24, 8, 26);
    ctx.fillStyle = 'rgba(211,177,123,0.35)';
    ctx.fillRect(x - 3, y - 23, 2, 22);
  }
  void dx; void dy;
  ctx.restore();
}

function drawLantern(ctx, o, time) {
  const x = o.x, y = o.y;
  ctx.save();
  shadow(ctx, x, y, 14, 5, 0.2, 2);
  ctx.fillStyle = '#503b27';
  ctx.fillRect(x - 3, y - 58, 6, 60);
  ctx.fillRect(x - 14, y - 58, 28, 4);
  ctx.strokeStyle = '#3e2d1e';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(x + 10, y - 55);
  ctx.lineTo(x + 10, y - 46);
  ctx.stroke();
  ctx.fillStyle = '#3d2e20';
  ctx.fillRect(x + 3, y - 47, 14, 18);
  const glow = ctx.createLinearGradient(x + 5, y - 45, x + 5, y - 31);
  glow.addColorStop(0, '#ffe2a1');
  glow.addColorStop(1, '#e29a45');
  ctx.fillStyle = glow;
  ctx.fillRect(x + 5, y - 45, 10, 14);
  ctx.fillStyle = 'rgba(255,214,138,0.25)';
  ctx.beginPath();
  ctx.arc(x + 10, y - 38, 13 + Math.sin(time * 4.1) * 1.6, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#4d3826';
  ctx.fillRect(x + 2, y - 49, 16, 3);
  ctx.restore();
}

function drawCrate(ctx, o) {
  const s = o.s || 1;
  const x = o.x, y = o.y;
  ctx.save();
  shadow(ctx, x, y, 20 * s, 7 * s, 0.2, 2);
  const w = 32 * s, h = 28 * s;
  ctx.fillStyle = '#8a653e';
  ctx.fillRect(x - w / 2, y - h, w, h);
  ctx.fillStyle = '#a17a4d';
  ctx.fillRect(x - w / 2 + 3, y - h + 3, w - 6, 5);
  ctx.strokeStyle = '#5f4429';
  ctx.lineWidth = 3;
  ctx.strokeRect(x - w / 2, y - h, w, h);
  ctx.beginPath();
  ctx.moveTo(x - w / 2 + 3, y - h + 3);
  ctx.lineTo(x + w / 2 - 3, y - 3);
  ctx.moveTo(x + w / 2 - 3, y - h + 3);
  ctx.lineTo(x - w / 2 + 3, y - 3);
  ctx.stroke();
  ctx.restore();
}

function drawBarrel(ctx, o) {
  const s = o.s || 1;
  const x = o.x, y = o.y;
  ctx.save();
  shadow(ctx, x, y, 16 * s, 6 * s, 0.2, 2);
  ctx.fillStyle = '#75532f';
  ctx.beginPath();
  ctx.ellipse(x, y - 20 * s, 15 * s, 9 * s, 0, 0, TAU);
  ctx.fill();
  ctx.fillRect(x - 15 * s, y - 20 * s, 30 * s, 20 * s);
  ctx.fillStyle = '#8c6438';
  ctx.beginPath();
  ctx.ellipse(x, y - 20 * s, 15 * s, 9 * s, 0, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = '#4a3421';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x - 15 * s, y - 14 * s);
  ctx.lineTo(x + 15 * s, y - 14 * s);
  ctx.moveTo(x - 15 * s, y - 4 * s);
  ctx.lineTo(x + 15 * s, y - 4 * s);
  ctx.stroke();
  ctx.fillStyle = '#3f2c1c';
  ctx.beginPath();
  ctx.ellipse(x, y - 20 * s, 8 * s, 5 * s, 0, 0, TAU);
  ctx.fill();
  ctx.restore();
}

function drawHay(ctx, o) {
  const s = o.s || 1;
  const x = o.x, y = o.y;
  ctx.save();
  shadow(ctx, x, y, 28 * s, 9 * s, 0.2, 2);
  ctx.fillStyle = '#b99a55';
  ctx.beginPath();
  ctx.ellipse(x, y - 12 * s, 28 * s, 18 * s, 0, Math.PI, TAU);
  ctx.fill();
  ctx.fillRect(x - 28 * s, y - 12 * s, 56 * s, 12 * s);
  ctx.strokeStyle = 'rgba(135,106,48,0.6)';
  ctx.lineWidth = 2;
  for (let i = -2; i <= 2; i++) {
    ctx.beginPath();
    ctx.moveTo(x + i * 10 * s, y - 28 * s);
    ctx.lineTo(x + i * 11 * s, y - 2 * s);
    ctx.stroke();
  }
  ctx.fillStyle = 'rgba(240,214,145,0.35)';
  ctx.beginPath();
  ctx.ellipse(x - 8 * s, y - 22 * s, 14 * s, 6 * s, -0.2, 0, TAU);
  ctx.fill();
  ctx.restore();
}

function drawBench(ctx, o) {
  const x = o.x, y = o.y;
  ctx.save();
  shadow(ctx, x, y, 30, 7, 0.2, 2);
  ctx.fillStyle = '#6c5133';
  ctx.fillRect(x - 30, y - 18, 60, 10);
  ctx.fillStyle = '#886943';
  ctx.fillRect(x - 30, y - 21, 60, 5);
  ctx.fillStyle = '#4f3a24';
  ctx.fillRect(x - 26, y - 12, 5, 12);
  ctx.fillRect(x + 21, y - 12, 5, 12);
  ctx.restore();
}

function drawCart(ctx, o) {
  const x = o.x, y = o.y;
  ctx.save();
  shadow(ctx, x, y, 40, 12, 0.22, 3);
  ctx.fillStyle = '#7d5c37';
  ctx.fillRect(x - 28, y - 30, 56, 26);
  ctx.strokeStyle = '#4f3922';
  ctx.lineWidth = 3;
  ctx.strokeRect(x - 28, y - 30, 56, 26);
  ctx.fillStyle = '#5d4329';
  ctx.beginPath();
  ctx.arc(x - 24, y - 2, 12, 0, TAU);
  ctx.arc(x + 24, y - 2, 12, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#a98251';
  ctx.beginPath();
  ctx.arc(x - 24, y - 2, 5, 0, TAU);
  ctx.arc(x + 24, y - 2, 5, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = '#6b4c2e';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(x - 28, y - 18);
  ctx.lineTo(x - 58, y - 8);
  ctx.stroke();
  // Hay poking out.
  ctx.strokeStyle = '#c4a45e';
  ctx.lineWidth = 2;
  for (let i = 0; i < 5; i++) {
    ctx.beginPath();
    ctx.moveTo(x - 20 + i * 9, y - 28);
    ctx.lineTo(x - 14 + i * 9, y - 40);
    ctx.stroke();
  }
  ctx.restore();
}

function drawSign(ctx, o) {
  const x = o.x, y = o.y;
  ctx.save();
  shadow(ctx, x, y, 18, 5, 0.2, 2);
  ctx.fillStyle = '#584027';
  ctx.fillRect(x - 3, y - 58, 6, 60);
  ctx.fillStyle = '#7c5c37';
  ctx.beginPath();
  ctx.moveTo(x - 30, y - 64);
  ctx.lineTo(x + 22, y - 64);
  ctx.lineTo(x + 34, y - 53);
  ctx.lineTo(x + 22, y - 42);
  ctx.lineTo(x - 30, y - 42);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#4b3520';
  ctx.lineWidth = 2.5;
  ctx.stroke();
  ctx.strokeStyle = '#3c2b1a';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x - 20, y - 56);
  ctx.lineTo(x + 12, y - 56);
  ctx.moveTo(x - 20, y - 50);
  ctx.lineTo(x + 4, y - 50);
  ctx.stroke();
  // Second, smaller board.
  ctx.fillStyle = '#6e5231';
  ctx.fillRect(x + 2, y - 36, 28, 12);
  ctx.strokeRect(x + 2, y - 36, 28, 12);
  ctx.restore();
}

// ------------------------------------------------------------------ water bits
function drawReed(ctx, o, time) {
  const s = o.s;
  const sway = Math.sin(time * 1.4 + o.seed) * 4;
  ctx.save();
  ctx.translate(o.x, o.y);
  ctx.strokeStyle = 'rgba(94,120,60,0.8)';
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';
  for (let i = 0; i < 5; i++) {
    const dx = (i - 2) * 4;
    const h = (22 + hash2(i, o.seed | 0, 5) * 22) * s;
    ctx.beginPath();
    ctx.moveTo(dx, 0);
    ctx.quadraticCurveTo(dx + sway * 0.4, -h * 0.6, dx + sway, -h);
    ctx.stroke();
  }
  ctx.fillStyle = '#7c6335';
  ctx.beginPath();
  ctx.ellipse(sway * 0.6 - 2, -40 * s, 2.4, 6, 0.15, 0, TAU);
  ctx.fill();
  ctx.restore();
}

function drawLily(ctx, o, time) {
  ctx.save();
  ctx.translate(o.x, o.y);
  ctx.rotate(Math.sin(time * 0.3 + o.seed) * 0.05);
  ctx.fillStyle = 'rgba(72,112,62,0.85)';
  ctx.beginPath();
  ctx.ellipse(0, 0, 16 * o.s, 10 * o.s, 0.2, 0, TAU);
  ctx.fill();
  ctx.fillStyle = 'rgba(38,70,45,0.4)';
  ctx.beginPath();
  ctx.ellipse(2, 2, 10 * o.s, 6 * o.s, 0.2, 0, TAU);
  ctx.fill();
  if (o.s > 1) {
    ctx.fillStyle = '#efe6c8';
    ctx.beginPath();
    ctx.arc(3, -2, 3.2 * o.s, 0, TAU);
    ctx.fill();
  }
  ctx.restore();
}

// --------------------------------------------------------------- forest details
function drawLog(ctx, o) {
  const s = o.s;
  ctx.save();
  ctx.translate(o.x, o.y);
  ctx.rotate(o.angle);
  shadow(ctx, 0, 2, 42 * s, 9 * s, 0.18, 2);
  ctx.fillStyle = '#5c452c';
  roundedRect(ctx, -44 * s, -10 * s, 88 * s, 20 * s, 9 * s);
  ctx.fill();
  ctx.fillStyle = '#755a3a';
  roundedRect(ctx, -42 * s, -8 * s, 84 * s, 12 * s, 6 * s);
  ctx.fill();
  ctx.strokeStyle = 'rgba(46,34,22,0.5)';
  ctx.lineWidth = 1.6;
  for (let i = -3; i <= 3; i++) {
    ctx.beginPath();
    ctx.moveTo(i * 12 * s, -7 * s);
    ctx.lineTo(i * 12 * s + 8 * s, 3 * s);
    ctx.stroke();
  }
  ctx.fillStyle = '#8a6d45';
  ctx.beginPath();
  ctx.ellipse(-44 * s, 0, 5 * s, 10 * s, 0, 0, TAU);
  ctx.fill();
  ctx.restore();
}

function drawStump(ctx, o) {
  const s = o.s;
  ctx.save();
  ctx.translate(o.x, o.y);
  shadow(ctx, 0, 0, 16 * s, 5 * s, 0.18, 2);
  ctx.fillStyle = '#5d4830';
  ctx.beginPath();
  ctx.ellipse(0, -5 * s, 14 * s, 8 * s, 0, 0, TAU);
  ctx.fill();
  ctx.fillRect(-14 * s, -10 * s, 28 * s, 10 * s);
  ctx.fillStyle = '#8d6d46';
  ctx.beginPath();
  ctx.ellipse(0, -10 * s, 14 * s, 8 * s, 0, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = '#6c5235';
  ctx.lineWidth = 1.2;
  for (let i = 1; i < 4; i++) {
    ctx.beginPath();
    ctx.ellipse(0, -10 * s, i * 3.2 * s, i * 1.8 * s, 0, 0, TAU);
    ctx.stroke();
  }
  ctx.restore();
}

function drawFern(ctx, o, time) {
  const s = o.s;
  const sway = Math.sin(time * 0.9 + o.seed) * 0.08;
  ctx.save();
  ctx.translate(o.x, o.y);
  ctx.rotate(sway);
  ctx.strokeStyle = 'rgba(66,104,56,0.85)';
  ctx.lineWidth = 2 * s;
  ctx.lineCap = 'round';
  for (let i = 0; i < 6; i++) {
    const a = -Math.PI * 0.86 + (i / 5) * Math.PI * 0.72;
    const len = (16 + hash2(i, o.seed | 0, 3) * 14) * s;
    const ex = Math.cos(a) * len;
    const ey = Math.sin(a) * len;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(ex * 0.5, ey * 0.5 - 6 * s, ex, ey);
    ctx.stroke();
    // Fronds.
    ctx.lineWidth = 1.2 * s;
    for (let j = 1; j < 4; j++) {
      const t = j / 4;
      const px = ex * t;
      const py = ey * t - 4 * s * t;
      const side = j % 2 ? 1 : -1;
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.lineTo(px + Math.cos(a + side * 1.2) * 5 * s, py + Math.sin(a + side * 1.2) * 5 * s);
      ctx.stroke();
    }
    ctx.lineWidth = 2 * s;
  }
  ctx.restore();
}

function drawMushroom(ctx, o) {
  const s = o.s;
  ctx.save();
  ctx.translate(o.x, o.y);
  shadow(ctx, 0, 0, 8 * s, 3 * s, 0.15, 1);
  ctx.strokeStyle = '#d8cfb2';
  ctx.lineWidth = 3 * s;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(0, -9 * s);
  ctx.stroke();
  const cap = hash2(o.x | 0, o.y | 0, 5) > 0.5 ? '#b4513d' : '#c39a54';
  ctx.fillStyle = cap;
  ctx.beginPath();
  ctx.ellipse(0, -11 * s, 8 * s, 5 * s, 0, Math.PI, TAU);
  ctx.fill();
  ctx.fillStyle = 'rgba(247,240,219,0.7)';
  ctx.beginPath();
  ctx.arc(-2 * s, -12 * s, 1.6 * s, 0, TAU);
  ctx.arc(3 * s, -13 * s, 1.2 * s, 0, TAU);
  ctx.fill();
  ctx.restore();
}

function drawFlowers(ctx, o, time) {
  const s = o.s;
  const sway = Math.sin(time * 1.1 + o.seed) * 1.4;
  ctx.save();
  ctx.translate(o.x, o.y);
  ctx.strokeStyle = 'rgba(88,120,58,0.8)';
  ctx.lineWidth = 1.2;
  for (let i = 0; i < 5; i++) {
    const dx = (i - 2) * 5 * s;
    const h = (10 + hash2(i, o.seed | 0, 4) * 12) * s;
    ctx.beginPath();
    ctx.moveTo(dx, 0);
    ctx.quadraticCurveTo(dx + sway * 0.4, -h * 0.6, dx + sway, -h);
    ctx.stroke();
    const c = o.bright
      ? (i % 2 ? '#f2e6b2' : '#d9c4e8')
      : (i % 2 ? '#ead9a4' : '#c9b3d8');
    ctx.fillStyle = c;
    ctx.beginPath();
    ctx.arc(dx + sway, -h, 2.2 * s, 0, TAU);
    ctx.fill();
    ctx.fillStyle = 'rgba(226,170,54,0.8)';
    ctx.beginPath();
    ctx.arc(dx + sway, -h, 0.9 * s, 0, TAU);
    ctx.fill();
  }
  ctx.restore();
}
