import { TAU, clamp, lerp } from './util.js';

// ---------------------------------------------------------------------- player
export function drawPlayer(ctx, game, time) {
  const p = game.player;
  if (p.dead) return;
  const bob = p.moving ? Math.sin(p.walk) * 2.2 : Math.sin(time * 1.8) * 0.7;
  const blink = p.invuln > 0 && p.hurt > 0.05 ? 0.62 + Math.abs(Math.sin(time * 22)) * 0.38 : 1;

  ctx.save();
  ctx.fillStyle = 'rgba(18,28,20,0.32)';
  ctx.beginPath();
  ctx.ellipse(p.x + 4, p.y + 15, 21, 8, 0, 0, TAU);
  ctx.fill();

  ctx.translate(p.x, p.y + bob);
  ctx.globalAlpha = blink;

  // Staff is drawn behind the body half the time so it reads in depth.
  const a = p.aimAngle;
  const staffX = Math.cos(a) * 12;
  const staffY = Math.sin(a) * 8 - 2;
  const tipX = staffX + Math.cos(a) * 40;
  const tipY = staffY + Math.sin(a) * 40;
  if (Math.sin(a) < 0) drawStaff(ctx, staffX, staffY, tipX, tipY, p, time);
  drawFeet(ctx, p, time);
  drawCloak(ctx, p, time);
  drawHead(ctx, p, time);
  if (Math.sin(a) >= 0) drawStaff(ctx, staffX, staffY, tipX, tipY, p, time);

  // Held stone.
  if (p.cast > 0 || p.throwCd > 0.12) {
    ctx.fillStyle = '#88857a';
    ctx.beginPath();
    ctx.arc(staffX + Math.cos(a + 1.6) * 7, staffY + Math.sin(a + 1.6) * 7, 4.4, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#b0ac9c';
    ctx.beginPath();
    ctx.arc(staffX + Math.cos(a + 1.6) * 7 - 1, staffY + Math.sin(a + 1.6) * 7 - 1, 2, 0, TAU);
    ctx.fill();
  }

  if (p.hurt > 0.2) {
    ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = `rgba(210,90,70,${p.hurt * 0.16})`;
    ctx.beginPath();
    ctx.arc(0, -10, 26, 0, TAU);
    ctx.fill();
    ctx.globalCompositeOperation = 'source-over';
  }
  ctx.restore();
}

function drawFeet(ctx, p, time) {
  const step = p.moving ? Math.sin(p.walk) * 5 : 0;
  ctx.fillStyle = '#3d2f24';
  ctx.beginPath();
  ctx.ellipse(-6, 11 + step * 0.35, 5, 3.2, -0.2, 0, TAU);
  ctx.ellipse(6, 11 - step * 0.35, 5, 3.2, 0.2, 0, TAU);
  ctx.fill();
  void time;
}

function drawCloak(ctx, p, time) {
  const sway = Math.sin(time * 1.6 + 1) * 1.2;
  // Cloak body.
  ctx.fillStyle = '#2c554d';
  ctx.beginPath();
  ctx.moveTo(-15, 9);
  ctx.quadraticCurveTo(-19, -6, -10, -14);
  ctx.quadraticCurveTo(0, -18, 10, -14);
  ctx.quadraticCurveTo(19, -6, 15, 9);
  ctx.quadraticCurveTo(9 + sway, 14, 0, 12);
  ctx.quadraticCurveTo(-9 - sway, 14, -15, 9);
  ctx.closePath();
  ctx.fill();
  // Cloak fold highlight.
  ctx.fillStyle = 'rgba(112,156,132,0.4)';
  ctx.beginPath();
  ctx.moveTo(-10, -10);
  ctx.quadraticCurveTo(-4, -2, -6 + sway, 9);
  ctx.quadraticCurveTo(-1, 10, 2, -10);
  ctx.closePath();
  ctx.fill();
  // Gold trim.
  ctx.strokeStyle = 'rgba(217,176,104,0.65)';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(-13, 8);
  ctx.quadraticCurveTo(0, 12, 13, 8);
  ctx.stroke();
  // Shoulder mantle.
  ctx.fillStyle = '#23443e';
  ctx.beginPath();
  ctx.ellipse(0, -11, 13, 7, 0, 0, TAU);
  ctx.fill();
  // Clasp.
  ctx.fillStyle = '#d8b06b';
  ctx.beginPath();
  ctx.arc(0, -8, 2.4, 0, TAU);
  ctx.fill();
}

function drawHead(ctx, p, time) {
  const faceShift = Math.cos(p.facing) * 1.6;
  ctx.fillStyle = '#1d3733';
  ctx.beginPath();
  ctx.arc(0, -21, 11, 0, TAU);
  ctx.fill();
  // Hood point.
  ctx.beginPath();
  ctx.moveTo(-8, -26);
  ctx.quadraticCurveTo(-2, -36, 6, -29);
  ctx.quadraticCurveTo(1, -27, -8, -26);
  ctx.fillStyle = '#162b28';
  ctx.fill();
  // Face.
  ctx.fillStyle = '#d4ad84';
  ctx.beginPath();
  ctx.ellipse(faceShift, -19, 6.3, 6.8, 0, 0, TAU);
  ctx.fill();
  // Shadow under hood.
  ctx.fillStyle = 'rgba(24,42,38,0.55)';
  ctx.beginPath();
  ctx.ellipse(-1.5 + faceShift, -22.5, 6.6, 4.2, 0, Math.PI, TAU);
  ctx.fill();
  // Eyes (tiny, toward facing).
  ctx.fillStyle = '#2c251d';
  const ex = faceShift + Math.cos(p.facing) * 1.4;
  const ey = -19 + Math.sin(p.facing) * 1.2;
  ctx.beginPath();
  ctx.arc(ex - 2.1, ey, 0.85, 0, TAU);
  ctx.arc(ex + 2.1, ey, 0.85, 0, TAU);
  ctx.fill();
  // Hood rim.
  ctx.strokeStyle = 'rgba(201,164,92,0.5)';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.arc(0, -21, 10.6, Math.PI * 1.08, Math.PI * 1.92);
  ctx.stroke();
  void time;
}

function drawStaff(ctx, hx, hy, tx, ty, p, time) {
  const a = Math.atan2(ty - hy, tx - hx);
  // Staff shaft.
  ctx.strokeStyle = '#5e442c';
  ctx.lineWidth = 3.4;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(hx - Math.cos(a) * 10, hy - Math.sin(a) * 10);
  ctx.lineTo(tx, ty);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(153,116,72,0.5)';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(hx - Math.cos(a) * 8, hy - Math.sin(a) * 8);
  ctx.lineTo(tx, ty);
  ctx.stroke();
  // Hand.
  ctx.fillStyle = '#d4ad84';
  ctx.beginPath();
  ctx.arc(hx, hy, 3.4, 0, TAU);
  ctx.fill();
  // Crystal tip.
  const pulse = 0.7 + Math.sin(time * 4 + p.walk) * 0.18 + (p.cast > 0 ? 0.3 : 0);
  const glow = ctx.createRadialGradient(tx, ty, 1, tx, ty, 16);
  glow.addColorStop(0, `rgba(171,231,150,${0.55 * pulse})`);
  glow.addColorStop(1, 'rgba(140,210,140,0)');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(tx, ty, 16, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#a9d58a';
  ctx.beginPath();
  ctx.moveTo(tx, ty - 6.5);
  ctx.lineTo(tx + 4.4, ty);
  ctx.lineTo(tx, ty + 6.5);
  ctx.lineTo(tx - 4.4, ty);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = 'rgba(230,255,210,0.75)';
  ctx.beginPath();
  ctx.moveTo(tx, ty - 5);
  ctx.lineTo(tx + 2, ty - 1);
  ctx.lineTo(tx, ty + 1.6);
  ctx.closePath();
  ctx.fill();
}

// --------------------------------------------------------------------- enemies
export function drawEnemy(ctx, game, e, time) {
  if (e.dead) return;
  ctx.save();
  // Ground shadow.
  const fly = e.type === 'bat' ? 22 : e.type === 'gloom' ? 10 : 0;
  ctx.fillStyle = 'rgba(20,26,20,0.28)';
  ctx.beginPath();
  ctx.ellipse(e.x, e.y + e.r * 0.55, e.r * (e.type === 'warden' ? 1.5 : 0.95), e.r * 0.32, 0, 0, TAU);
  ctx.fill();

  const bob = e.moving ? Math.sin(e.walk) * (e.isBoss ? 3 : 2) : Math.sin(time * 2 + e.seed) * 1.6;
  if (e.type === 'bat') drawBat(ctx, e, time, -fly + bob);
  else if (e.type === 'gloom') drawGloom(ctx, e, time, bob);
  else if (e.type === 'warden') drawWarden(ctx, e, time, bob);
  else drawWretch(ctx, e, time, bob);

  if (e.hitFlash > 0) {
    ctx.globalAlpha = Math.min(0.5, e.hitFlash * 2.6);
    ctx.fillStyle = '#fff6e6';
    ctx.beginPath();
    ctx.ellipse(e.x, e.y - e.r * (e.isBoss ? 1.1 : 0.8), e.r * (e.isBoss ? 1.1 : 0.85), e.r * (e.isBoss ? 1.3 : 1), 0, 0, TAU);
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  // Warden aura.
  if (e.isBoss && game.bossActive) {
    ctx.globalCompositeOperation = 'lighter';
    const pulse = 0.08 + Math.sin(time * 3) * 0.03;
    ctx.strokeStyle = `rgba(232,140,80,${pulse})`;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(e.x, e.y + 8, 70, 28, 0, 0, TAU);
    ctx.stroke();
    ctx.globalCompositeOperation = 'source-over';
  }

  // Health bar for ordinary wounded enemies.
  if (!e.isBoss && e.hp < e.maxHp) {
    const w = 38;
    const x = e.x - w / 2;
    const y = e.y - e.r * 1.9 - (e.type === 'gloom' ? 10 : 0) - (e.type === 'bat' ? 20 : 0);
    ctx.fillStyle = 'rgba(10,14,10,0.65)';
    ctx.fillRect(x - 1, y - 1, w + 2, 6);
    ctx.fillStyle = e.type === 'gloom' ? '#b06fd0' : e.type === 'bat' ? '#9a7fd0' : '#c9884e';
    ctx.fillRect(x, y, w * clamp(e.hp / e.maxHp, 0, 1), 4);
  }
  ctx.restore();
}

function drawGloom(ctx, e, time, bob) {
  ctx.save();
  ctx.translate(e.x, e.y - 8 + bob);
  const r = e.r;
  // Tendrils.
  ctx.strokeStyle = 'rgba(54,40,68,0.85)';
  ctx.lineWidth = 5;
  ctx.lineCap = 'round';
  for (let i = -1; i <= 1; i++) {
    ctx.beginPath();
    ctx.moveTo(i * 7, 2);
    ctx.quadraticCurveTo(i * 8 + Math.sin(time * 3 + i) * 3, 10, i * 10 + Math.sin(time * 2.4 + i * 2) * 4, 17);
    ctx.stroke();
  }
  // Body.
  const g = ctx.createRadialGradient(-4, -7, 2, 0, 0, r * 1.3);
  g.addColorStop(0, '#5e477a');
  g.addColorStop(0.7, '#3a2b4c');
  g.addColorStop(1, '#261c33');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.ellipse(0, 0, r, r * 1.05, 0, 0, TAU);
  ctx.fill();
  // Wispy highlight.
  ctx.fillStyle = 'rgba(155,120,196,0.35)';
  ctx.beginPath();
  ctx.ellipse(-5, -6, r * 0.45, r * 0.3, -0.4, 0, TAU);
  ctx.fill();
  // Eyes.
  const aggro = e.aggro;
  ctx.fillStyle = aggro ? '#ffb0e8' : '#d18ae8';
  ctx.beginPath();
  ctx.ellipse(-5, -2, 2.4, 3.2, 0, 0, TAU);
  ctx.ellipse(5, -2, 2.4, 3.2, 0, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#fff2ff';
  ctx.beginPath();
  ctx.arc(-5, -3, 0.9, 0, TAU);
  ctx.arc(5, -3, 0.9, 0, TAU);
  ctx.fill();
  // Little claws.
  ctx.strokeStyle = 'rgba(120,92,150,0.75)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-r * 0.8, 2);
  ctx.lineTo(-r * 1.15, 7);
  ctx.moveTo(r * 0.8, 2);
  ctx.lineTo(r * 1.15, 7);
  ctx.stroke();
  ctx.restore();
}

function drawWretch(ctx, e, time, bob) {
  ctx.save();
  ctx.translate(e.x, e.y + bob);
  const r = e.r;
  const windup = e.windup > 0;
  const armLift = windup ? -16 : 0;
  // Legs.
  ctx.fillStyle = '#55584f';
  ctx.fillRect(-r * 0.55, -4, r * 0.42, 12);
  ctx.fillRect(r * 0.14, -4, r * 0.42, 12);
  // Arms.
  ctx.fillStyle = '#64675c';
  ctx.beginPath();
  ctx.ellipse(-r * 0.95, -r * 0.55 + armLift, r * 0.35, r * 0.5, -0.3, 0, TAU);
  ctx.ellipse(r * 0.95, -r * 0.55 - armLift, r * 0.35, r * 0.5, 0.3, 0, TAU);
  ctx.fill();
  // Body.
  ctx.fillStyle = '#5f6258';
  ctx.beginPath();
  ctx.moveTo(-r * 0.8, 0);
  ctx.lineTo(-r * 0.9, -r * 1.1);
  ctx.lineTo(-r * 0.35, -r * 1.5);
  ctx.lineTo(r * 0.35, -r * 1.5);
  ctx.lineTo(r * 0.9, -r * 1.1);
  ctx.lineTo(r * 0.8, 0);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#767a6d';
  ctx.beginPath();
  ctx.moveTo(-r * 0.5, -r * 0.25);
  ctx.lineTo(-r * 0.55, -r * 1.05);
  ctx.lineTo(-r * 0.15, -r * 1.3);
  ctx.lineTo(-r * 0.1, -r * 0.2);
  ctx.closePath();
  ctx.fill();
  // Moss.
  ctx.fillStyle = 'rgba(104,128,70,0.6)';
  ctx.beginPath();
  ctx.ellipse(r * 0.4, -r * 1.25, r * 0.32, r * 0.14, 0.2, 0, TAU);
  ctx.fill();
  // Glowing cracks.
  ctx.strokeStyle = e.aggro ? 'rgba(246,164,86,0.9)' : 'rgba(220,150,90,0.55)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-r * 0.3, -r * 0.5);
  ctx.lineTo(-r * 0.05, -r * 0.85);
  ctx.lineTo(-r * 0.2, -r * 1.1);
  ctx.moveTo(r * 0.35, -r * 0.4);
  ctx.lineTo(r * 0.15, -r * 0.7);
  ctx.stroke();
  // Head.
  ctx.fillStyle = '#50534b';
  ctx.beginPath();
  ctx.arc(0, -r * 1.55, r * 0.42, 0, TAU);
  ctx.fill();
  ctx.fillStyle = e.aggro ? '#ffc46a' : '#b78a56';
  ctx.beginPath();
  ctx.arc(-r * 0.16, -r * 1.58, r * 0.09, 0, TAU);
  ctx.arc(r * 0.16, -r * 1.58, r * 0.09, 0, TAU);
  ctx.fill();
  ctx.restore();
  void time;
}

function drawBat(ctx, e, time, yOff) {
  ctx.save();
  ctx.translate(e.x, e.y + yOff);
  const flap = Math.sin(time * 17 + e.seed) * 0.7;
  const r = e.r;
  // Wings.
  ctx.fillStyle = '#3b2f52';
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(-r * 1.8, -12 + flap * 14, -r * 2.4, 4 + flap * 8);
  ctx.quadraticCurveTo(-r * 1.4, 2, -r * 0.5, 7);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(r * 1.8, -12 + flap * 14, r * 2.4, 4 + flap * 8);
  ctx.quadraticCurveTo(r * 1.4, 2, r * 0.5, 7);
  ctx.closePath();
  ctx.fill();
  // Body.
  ctx.fillStyle = '#4a3a62';
  ctx.beginPath();
  ctx.ellipse(0, 0, r * 0.65, r * 0.9, 0, 0, TAU);
  ctx.fill();
  // Ears.
  ctx.beginPath();
  ctx.moveTo(-r * 0.4, -r * 0.7);
  ctx.lineTo(-r * 0.75, -r * 1.4);
  ctx.lineTo(-r * 0.1, -r * 0.9);
  ctx.moveTo(r * 0.4, -r * 0.7);
  ctx.lineTo(r * 0.75, -r * 1.4);
  ctx.lineTo(r * 0.1, -r * 0.9);
  ctx.fill();
  // Eyes.
  ctx.fillStyle = '#f89acb';
  ctx.beginPath();
  ctx.arc(-2.4, -2, 1.2, 0, TAU);
  ctx.arc(2.4, -2, 1.2, 0, TAU);
  ctx.fill();
  ctx.restore();
  void time;
}

function drawWarden(ctx, e, time, bob) {
  ctx.save();
  ctx.translate(e.x, e.y + bob);
  const s = e.r / 46;
  const windup = e.windup > 0;
  const raise = windup ? -22 : 0;
  // Feet.
  ctx.fillStyle = '#4c4f47';
  ctx.beginPath();
  ctx.ellipse(-26 * s, 6, 17 * s, 10 * s, 0.1, 0, TAU);
  ctx.ellipse(26 * s, 6, 17 * s, 10 * s, -0.1, 0, TAU);
  ctx.fill();
  // Arms.
  ctx.fillStyle = '#63665a';
  ctx.beginPath();
  ctx.ellipse(-52 * s, -46 * s + raise, 18 * s, 30 * s, -0.24, 0, TAU);
  ctx.ellipse(52 * s, -46 * s - raise, 18 * s, 30 * s, 0.24, 0, TAU);
  ctx.fill();
  // Body.
  const bodyG = ctx.createLinearGradient(0, -100 * s, 0, 10);
  bodyG.addColorStop(0, '#767a6c');
  bodyG.addColorStop(1, '#55584f');
  ctx.fillStyle = bodyG;
  ctx.beginPath();
  ctx.moveTo(-38 * s, 4);
  ctx.lineTo(-46 * s, -70 * s);
  ctx.lineTo(-28 * s, -102 * s);
  ctx.lineTo(28 * s, -102 * s);
  ctx.lineTo(46 * s, -70 * s);
  ctx.lineTo(38 * s, 4);
  ctx.closePath();
  ctx.fill();
  // Chest facets.
  ctx.fillStyle = '#838778';
  ctx.beginPath();
  ctx.moveTo(-26 * s, -10);
  ctx.lineTo(-30 * s, -74 * s);
  ctx.lineTo(-8 * s, -94 * s);
  ctx.lineTo(-4 * s, -14);
  ctx.closePath();
  ctx.fill();
  // Glowing core.
  const coreG = ctx.createRadialGradient(0, -52 * s, 2, 0, -52 * s, 40 * s);
  coreG.addColorStop(0, 'rgba(255,182,96,0.9)');
  coreG.addColorStop(0.4, 'rgba(238,128,62,0.55)');
  coreG.addColorStop(1, 'rgba(200,80,40,0)');
  ctx.fillStyle = coreG;
  ctx.beginPath();
  ctx.arc(0, -52 * s, 40 * s, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#ef9d52';
  ctx.beginPath();
  ctx.moveTo(0, -68 * s);
  ctx.lineTo(9 * s, -52 * s);
  ctx.lineTo(0, -36 * s);
  ctx.lineTo(-9 * s, -52 * s);
  ctx.closePath();
  ctx.fill();
  // Cracks.
  ctx.strokeStyle = 'rgba(246,160,82,0.8)';
  ctx.lineWidth = 2.6;
  ctx.beginPath();
  ctx.moveTo(-30 * s, -30);
  ctx.lineTo(-14 * s, -44 * s);
  ctx.lineTo(-22 * s, -62 * s);
  ctx.moveTo(28 * s, -24);
  ctx.lineTo(16 * s, -38 * s);
  ctx.lineTo(24 * s, -58 * s);
  ctx.stroke();
  // Head.
  ctx.fillStyle = '#4d5048';
  ctx.beginPath();
  ctx.ellipse(0, -112 * s, 25 * s, 21 * s, 0, 0, TAU);
  ctx.fill();
  // Horns.
  ctx.fillStyle = '#8e8874';
  ctx.beginPath();
  ctx.moveTo(-20 * s, -120 * s);
  ctx.lineTo(-34 * s, -148 * s);
  ctx.lineTo(-11 * s, -131 * s);
  ctx.closePath();
  ctx.moveTo(20 * s, -120 * s);
  ctx.lineTo(34 * s, -148 * s);
  ctx.lineTo(11 * s, -131 * s);
  ctx.closePath();
  ctx.fill();
  // Eyes.
  ctx.fillStyle = '#ffbd72';
  ctx.beginPath();
  ctx.ellipse(-9 * s, -114 * s, 3.6 * s, 2.4 * s, 0, 0, TAU);
  ctx.ellipse(9 * s, -114 * s, 3.6 * s, 2.4 * s, 0, 0, TAU);
  ctx.fill();
  // Moss.
  ctx.fillStyle = 'rgba(100,124,68,0.55)';
  ctx.beginPath();
  ctx.ellipse(-24 * s, -94 * s, 12 * s, 5 * s, 0.2, 0, TAU);
  ctx.ellipse(20 * s, -18, 14 * s, 6 * s, 0.1, 0, TAU);
  ctx.fill();
  // Wind-up flare.
  if (windup) {
    ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = `rgba(255,150,80,${0.15 + Math.sin(time * 14) * 0.05})`;
    ctx.beginPath();
    ctx.arc(0, -60 * s, 70 * s, 0, TAU);
    ctx.fill();
    ctx.globalCompositeOperation = 'source-over';
  }
  ctx.restore();
}

// ---------------------------------------------------------------------- sheep
export function drawSheep(ctx, s, time) {
  ctx.save();
  ctx.fillStyle = 'rgba(20,28,20,0.22)';
  ctx.beginPath();
  ctx.ellipse(s.x + 2, s.y + 8, 18, 6, 0, 0, TAU);
  ctx.fill();
  const bob = Math.sin(time * 2 + s.phase) * 0.6 + (s.moving ? Math.sin(s.walk) * 1.3 : 0);
  ctx.translate(s.x, s.y + bob);
  ctx.fillStyle = '#3d3a33';
  ctx.fillRect(-8, 4, 3, 7);
  ctx.fillRect(5, 4, 3, 7);
  ctx.fillStyle = '#e6e0cd';
  ctx.beginPath();
  ctx.ellipse(0, -5, 15, 11, 0, 0, TAU);
  ctx.arc(-8, -8, 7, 0, TAU);
  ctx.arc(7, -9, 8, 0, TAU);
  ctx.arc(0, -13, 8, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#d7cfba';
  ctx.beginPath();
  ctx.ellipse(2, -3, 9, 6, 0.2, 0, TAU);
  ctx.fill();
  // Head.
  const hx = 12 * Math.cos(s.dir + (Math.cos(s.dir) < 0 ? Math.PI : 0));
  ctx.fillStyle = '#4b4438';
  ctx.beginPath();
  ctx.ellipse(hx * 0.5, 0, 5.5, 4.5, 0.1, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#efe8d4';
  ctx.beginPath();
  ctx.arc(hx * 0.5 - 1, -1, 2, 0, TAU);
  ctx.fill();
  ctx.restore();
}

// ------------------------------------------------------------------ projectiles
export function drawProjectile(ctx, pr, time) {
  const k = clamp(pr.t / pr.dur, 0, 1);
  const z = Math.sin(k * Math.PI) * pr.arc;
  const scale = 1 + z / 260;
  // Shadow.
  ctx.fillStyle = `rgba(18,26,18,${0.24 - Math.min(0.15, z / 900)})`;
  ctx.beginPath();
  ctx.ellipse(pr.x, pr.y, 12 * scale, 4.5 * scale, 0, 0, TAU);
  ctx.fill();
  // Trail.
  ctx.strokeStyle = 'rgba(180,180,158,0.18)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(pr.sx + (pr.tx - pr.sx) * Math.max(0, k - 0.08), pr.sy + (pr.ty - pr.sy) * Math.max(0, k - 0.08) - Math.sin(Math.max(0, k - 0.08) * Math.PI) * pr.arc);
  ctx.lineTo(pr.x, pr.y - z);
  ctx.stroke();
  // Rock.
  ctx.save();
  ctx.translate(pr.x, pr.y - z);
  ctx.rotate(pr.rot);
  const r = 8.5 * (1 + z / 500);
  ctx.fillStyle = '#77766a';
  ctx.beginPath();
  ctx.moveTo(-r, -r * 0.25);
  ctx.lineTo(-r * 0.35, -r * 0.95);
  ctx.lineTo(r * 0.65, -r * 0.8);
  ctx.lineTo(r, r * 0.2);
  ctx.lineTo(r * 0.25, r * 0.85);
  ctx.lineTo(-r * 0.8, r * 0.6);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#989687';
  ctx.beginPath();
  ctx.moveTo(-r * 0.6, -r * 0.4);
  ctx.lineTo(-r * 0.15, -r * 0.75);
  ctx.lineTo(r * 0.4, -r * 0.55);
  ctx.lineTo(-r * 0.1, -r * 0.1);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = 'rgba(213,205,172,0.5)';
  ctx.beginPath();
  ctx.arc(-r * 0.25, -r * 0.4, r * 0.22, 0, TAU);
  ctx.fill();
  ctx.restore();
  void time;
}

// ---------------------------------------------------------------------- pickups
export function drawPickup(ctx, it, time) {
  const bob = Math.sin(it.bob) * 3.5;
  const fade = it.life < 3 ? Math.max(0.2, it.life / 3) : 1;
  ctx.save();
  ctx.globalAlpha = fade;
  if (it.kind === 'heart') {
    const y = it.y - 14 + bob;
    const glow = ctx.createRadialGradient(it.x, y, 1, it.x, y, 20);
    glow.addColorStop(0, 'rgba(235,110,100,0.5)');
    glow.addColorStop(1, 'rgba(235,110,100,0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(it.x, y, 20, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#df6a62';
    ctx.beginPath();
    ctx.moveTo(it.x, y + 6);
    ctx.bezierCurveTo(it.x - 11, y - 2, it.x - 6, y - 11, it.x, y - 5);
    ctx.bezierCurveTo(it.x + 6, y - 11, it.x + 11, y - 2, it.x, y + 6);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,210,200,0.6)';
    ctx.beginPath();
    ctx.arc(it.x - 3, y - 4, 2, 0, TAU);
    ctx.fill();
  } else {
    const y = it.y - 12 + bob;
    const glow = ctx.createRadialGradient(it.x, y, 1, it.x, y, 16);
    glow.addColorStop(0, 'rgba(255,196,104,0.55)');
    glow.addColorStop(1, 'rgba(255,170,60,0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(it.x, y, 16, 0, TAU);
    ctx.fill();
    ctx.save();
    ctx.translate(it.x, y);
    ctx.rotate(time * 1.4 + it.bob);
    ctx.fillStyle = '#e8ad58';
    ctx.beginPath();
    ctx.moveTo(0, -7);
    ctx.lineTo(5, 0);
    ctx.lineTo(0, 7);
    ctx.lineTo(-5, 0);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#ffe0a0';
    ctx.beginPath();
    ctx.moveTo(0, -5);
    ctx.lineTo(2.5, 0);
    ctx.lineTo(0, 2);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
  ctx.restore();
}

// --------------------------------------------------------------------- effects
export function drawGroundEffects(ctx, game) {
  for (const e of game.effects) {
    if (e.kind !== 'telegraph') continue;
    const t = 1 - e.life / e.maxLife;
    const pulse = 0.6 + Math.sin(game.time * 18) * 0.2;
    ctx.save();
    ctx.globalAlpha = 0.28 + t * 0.5;
    ctx.fillStyle = `rgba(${e.color},0.13)`;
    ctx.beginPath();
    ctx.arc(e.x, e.y, e.r, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = `rgba(${e.color},${0.35 + pulse * 0.4})`;
    ctx.lineWidth = 3;
    ctx.setLineDash([10, 7]);
    ctx.beginPath();
    ctx.arc(e.x, e.y, e.r * (0.4 + t * 0.6), 0, TAU);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
  }
}

export function drawEffects(ctx, game) {
  for (const e of game.effects) {
    if (e.kind !== 'ring') continue;
    const t = 1 - e.life / e.maxLife;
    const r = lerp(e.r0, e.r1, t);
    const alpha = (1 - t) * 0.75;
    ctx.strokeStyle = `rgba(${e.color},${alpha})`;
    ctx.lineWidth = e.width * (1 - t * 0.4);
    ctx.beginPath();
    ctx.arc(e.x, e.y, r, 0, TAU);
    ctx.stroke();
    ctx.strokeStyle = `rgba(${e.color},${alpha * 0.25})`;
    ctx.lineWidth = e.width * 2.2;
    ctx.beginPath();
    ctx.arc(e.x, e.y, r * 0.96, 0, TAU);
    ctx.stroke();
  }
}

export function drawParticles(ctx, game) {
  for (const p of game.particles) {
    const a = clamp(p.life / p.maxLife, 0, 1) * (p.alpha ?? 1);
    if (a <= 0.01) continue;
    if (p.kind === 'spark' || p.kind === 'sparkle' || p.kind === 'ember' || p.kind === 'firefly') {
      ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = `rgba(${p.color},${a * 0.25})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * 3, 0, TAU);
      ctx.fill();
      ctx.fillStyle = `rgba(${p.color},${a})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, TAU);
      ctx.fill();
      ctx.globalCompositeOperation = 'source-over';
    } else if (p.kind === 'smoke' || p.kind === 'fog') {
      ctx.fillStyle = `rgba(${p.color},${a * 0.32})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, TAU);
      ctx.fill();
    } else if (p.kind === 'leaf') {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.fillStyle = `rgba(${p.color},${a * 0.85})`;
      ctx.beginPath();
      ctx.ellipse(0, 0, p.size, p.size * 0.45, 0, 0, TAU);
      ctx.fill();
      ctx.restore();
    } else if (p.kind === 'debris') {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.fillStyle = `rgba(${p.color},${a})`;
      ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.8);
      ctx.restore();
    } else {
      ctx.fillStyle = `rgba(${p.color},${a * 0.55})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, TAU);
      ctx.fill();
    }
  }
}

export function drawTexts(ctx, game) {
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  for (const t of game.texts) {
    const a = clamp(t.life / t.maxLife, 0, 1);
    ctx.globalAlpha = a;
    ctx.font = `600 ${t.size}px Georgia, serif`;
    ctx.fillStyle = 'rgba(20,18,12,0.65)';
    ctx.fillText(t.text, t.x + 1, t.y + 1);
    ctx.fillStyle = t.color;
    ctx.fillText(t.text, t.x, t.y);
  }
  ctx.globalAlpha = 1;
}
