import { TAU, clamp, dist, hash2, range } from './util.js';

export function initFx(game) {
  game.particles = [];
  game.effects = [];
  game.texts = [];
  game.pickups = [];
}

export function addParticle(game, p) {
  if (game.particles.length > 620) game.particles.shift();
  p.life = p.life ?? 1;
  p.maxLife = p.maxLife ?? p.life;
  p.vx = p.vx ?? 0;
  p.vy = p.vy ?? 0;
  p.size = p.size ?? 4;
  p.color = p.color ?? '180,170,140';
  p.drag = p.drag ?? 1.5;
  p.gravity = p.gravity ?? 0;
  p.rot = p.rot ?? 0;
  p.spin = p.spin ?? 0;
  p.alpha = p.alpha ?? 1;
  game.particles.push(p);
  return p;
}

export function puff(game, x, y, count = 8, color = '181,164,126', power = 1) {
  for (let i = 0; i < count; i++) {
    const a = Math.random() * TAU;
    const sp = range(Math.random, 20, 90) * power;
    addParticle(game, {
      kind: 'dust', x: x + Math.cos(a) * range(Math.random, 2, 14), y: y + Math.sin(a) * range(Math.random, 2, 10),
      vx: Math.cos(a) * sp, vy: Math.sin(a) * sp * 0.55 - 8,
      life: range(Math.random, 0.45, 0.9), size: range(Math.random, 3, 8) * power, color,
      drag: 3.2
    });
  }
}

export function debris(game, x, y, count = 10, color = '138,133,120', power = 1) {
  for (let i = 0; i < count; i++) {
    const a = -Math.PI / 2 + (Math.random() - 0.5) * 3.2;
    const sp = range(Math.random, 60, 220) * power;
    addParticle(game, {
      kind: 'debris', x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp * 0.6 - 90,
      life: range(Math.random, 0.35, 0.75), size: range(Math.random, 2, 5) * power, color,
      gravity: 520, drag: 0.4, spin: range(Math.random, -12, 12), rot: Math.random() * TAU
    });
  }
}

export function sparks(game, x, y, count = 6, color = '255,206,130') {
  for (let i = 0; i < count; i++) {
    const a = Math.random() * TAU;
    const sp = range(Math.random, 40, 160);
    addParticle(game, {
      kind: 'spark', x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp,
      life: range(Math.random, 0.2, 0.5), size: range(Math.random, 1.5, 3.2), color, drag: 2.4
    });
  }
}

export function addRing(game, x, y, r0, r1, color = '208,178,120', life = 0.5, width = 4) {
  game.effects.push({ kind: 'ring', x, y, r0, r1, color, life, maxLife: life, width });
}

export function addTelegraph(game, x, y, r, life = 0.7, color = '212,86,68') {
  game.effects.push({ kind: 'telegraph', x, y, r, color, life, maxLife: life });
}

export function addText(game, x, y, text, color = '#f0d79e', size = 14) {
  if (game.texts.length > 40) game.texts.shift();
  game.texts.push({ x, y, text, color, size, life: 1, maxLife: 1, vy: -44, drift: (Math.random() - 0.5) * 18 });
}

export function spawnPickup(game, x, y, kind, value = 1, scatter = true) {
  const a = Math.random() * TAU;
  const sp = scatter ? range(Math.random, 40, 140) : 0;
  game.pickups.push({
    x, y, kind, value,
    vx: Math.cos(a) * sp, vy: Math.sin(a) * sp,
    bob: Math.random() * 6, life: 26,
    collected: false
  });
}

export function updatePickups(game, dt) {
  const p = game.player;
  for (const it of game.pickups) {
    it.life -= dt;
    it.bob += dt * 3.4;
    it.x += it.vx * dt;
    it.y += it.vy * dt;
    it.vx *= Math.exp(-3.5 * dt);
    it.vy *= Math.exp(-3.5 * dt);
    const d = dist(it.x, it.y, p.x, p.y);
    if (d < 190) {
      const pull = 520 * (1 - d / 190) + 60;
      it.x += ((p.x - it.x) / (d || 1)) * pull * dt;
      it.y += ((p.y - it.y) / (d || 1)) * pull * dt;
    }
    if (d < 24) {
      it.collected = true;
      if (it.kind === 'heart') {
        if (p.hp < p.maxHp) {
          const heal = Math.min(it.value, p.maxHp - p.hp);
          p.hp += heal;
          addText(game, p.x, p.y - 30, '+' + Math.round(heal) + ' life', '#9fe08a', 14);
          game.audio.play('heal');
        } else {
          p.essence += 3;
          game.stats.essence += 3;
          game.audio.play('pickup');
        }
      } else {
        p.essence += it.value;
        game.stats.essence += it.value;
        game.audio.play('pickup');
        if (game.pickups.length < 4) addText(game, it.x, it.y - 16, '+' + it.value, '#ecc47c', 12);
      }
    }
  }
  game.pickups = game.pickups.filter((it) => !it.collected && it.life > 0);
}

export function updateFx(game, dt) {
  const parts = game.particles;
  for (let i = parts.length - 1; i >= 0; i--) {
    const p = parts[i];
    p.life -= dt;
    if (p.life <= 0) { parts.splice(i, 1); continue; }
    const drag = p.drag ? Math.exp(-p.drag * dt) : 1;
    p.vx *= drag;
    p.vy *= drag;
    if (p.kind === 'smoke' || p.kind === 'fog') {
      p.x += (p.vx + 8) * dt;
      p.y += (p.vy - 6) * dt;
      p.size += dt * (p.kind === 'fog' ? 26 : 13);
    } else if (p.kind === 'ember') {
      p.x += (p.vx + Math.sin(game.time * 5 + p.y * 0.03) * 12) * dt;
      p.y += (p.vy - 22) * dt;
    } else if (p.kind === 'leaf') {
      p.x += (p.vx + Math.sin(game.time * 1.7 + p.rot) * 16) * dt;
      p.y += (p.vy + 8) * dt;
      p.rot += p.spin * dt;
    } else if (p.kind === 'firefly') {
      p.x += Math.sin(game.time * 0.8 + p.seed) * 13 * dt;
      p.y += Math.cos(game.time * 0.64 + p.seed * 1.7) * 10 * dt;
    } else {
      p.vy += (p.gravity || 0) * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
    }
    p.rot += (p.spin || 0) * dt;
  }

  for (let i = game.effects.length - 1; i >= 0; i--) {
    const e = game.effects[i];
    e.life -= dt;
    if (e.life <= 0) game.effects.splice(i, 1);
  }

  for (let i = game.texts.length - 1; i >= 0; i--) {
    const t = game.texts[i];
    t.life -= dt;
    t.y += t.vy * dt;
    t.x += t.drift * dt;
    t.vy *= 0.96;
    if (t.life <= 0) game.texts.splice(i, 1);
  }
}

export function updateAmbient(game, dt) {
  const px = game.player.x;
  const py = game.player.y;
  for (const em of game.world.emitters) {
    const d = dist(em.x, em.y, px, py);
    if (d > 1500) continue;
    em.acc += dt * em.rate;
    while (em.acc >= 1) {
      em.acc -= 1;
      const a = Math.random() * TAU;
      const rr = Math.random() * (em.radius || 40);
      const x = em.x + Math.cos(a) * rr;
      const y = em.y + Math.sin(a) * rr;
      switch (em.type) {
        case 'smoke':
          addParticle(game, {
            kind: 'smoke', x, y, vx: 4 + Math.random() * 6, vy: -14 - Math.random() * 10,
            life: 3.2 + Math.random() * 1.6, size: 7 + Math.random() * 7, color: '168,160,144', alpha: 0.3, drag: 0.1
          });
          break;
        case 'ember':
          addParticle(game, {
            kind: 'ember', x, y, vx: (Math.random() - 0.5) * 18, vy: -30 - Math.random() * 30,
            life: 0.7 + Math.random() * 0.9, size: 1.5 + Math.random() * 2, color: Math.random() > 0.4 ? '255,168,72' : '255,214,128', drag: 0.6
          });
          break;
        case 'fog':
          if (game.particles.filter((p) => p.kind === 'fog').length > 20) break;
          addParticle(game, {
            kind: 'fog', x, y, vx: (Math.random() - 0.5) * 8, vy: -4 - Math.random() * 6,
            life: 5 + Math.random() * 4, size: 34 + Math.random() * 40, color: '160,178,172', alpha: 0.1, drag: 0.05
          });
          break;
        case 'firefly':
          addParticle(game, {
            kind: 'firefly', x, y, life: 3.6 + Math.random() * 3.4, size: 1.6 + Math.random() * 1.4,
            color: Math.random() > 0.35 ? '214,232,128' : '154,224,180', seed: Math.random() * 10, alpha: 0.9
          });
          break;
        case 'sparkle':
          addParticle(game, {
            kind: 'sparkle', x, y, life: 1 + Math.random() * 1.6, size: 1 + Math.random() * 1.8,
            color: em.color || '126,220,240', vy: -6 - Math.random() * 12, drag: 0.2
          });
          break;
        case 'leaf':
          addParticle(game, {
            kind: 'leaf', x: x + (Math.random() - 0.5) * 700, y: y + (Math.random() - 0.5) * 500,
            vx: -8 + Math.random() * 16, vy: 8 + Math.random() * 16, life: 6 + Math.random() * 5,
            size: 2.5 + Math.random() * 2.5, color: Math.random() > 0.5 ? '112,132,70' : '150,130,70',
            rot: Math.random() * TAU, spin: (Math.random() - 0.5) * 3, drag: 0.02
          });
          break;
        default:
          break;
      }
    }
  }
}

export function footstep(game, x, y, biome) {
  const color = biome === 1 ? '183,164,122' : biome === 4 ? '150,148,136' : '155,168,112';
  for (let i = 0; i < 3; i++) {
    addParticle(game, {
      kind: 'dust', x: x + (Math.random() - 0.5) * 12, y: y + 3 + Math.random() * 4,
      vx: (Math.random() - 0.5) * 24, vy: -6 - Math.random() * 12,
      life: 0.4 + Math.random() * 0.25, size: 2.5 + Math.random() * 3, color, drag: 3
    });
  }
}

export function updateEmittersForRenderer(game) {
  // Ambient emitters are updated in updateAmbient; this hook is kept for ordering.
  void game;
}

export function enemyDeathFx(game, e) {
  const count = e.isBoss ? 45 : 14;
  puff(game, e.x, e.y, count, e.type === 'gloom' ? '92,72,110' : '125,121,110', e.isBoss ? 2 : 1);
  debris(game, e.x, e.y, e.isBoss ? 28 : 8, e.type === 'gloom' ? '95,76,120' : '132,127,112', e.isBoss ? 1.8 : 1);
  sparks(game, e.x, e.y, e.isBoss ? 30 : 6, e.type === 'gloom' ? '196,142,235' : '255,196,110');
  addRing(game, e.x, e.y, 10, e.isBoss ? 190 : 48, e.isBoss ? '246,166,90' : '180,166,132', e.isBoss ? 0.9 : 0.45, e.isBoss ? 8 : 3);
}

export function randomOf(rng) {
  return rng();
}

export function leafColor() {
  return hash2(Math.random() * 1000 | 0, Math.random() * 1000 | 0, 5);
}

export function clampToView(game, x, y) {
  return { x: clamp(x, 0, game.viewport.w), y: clamp(y, 0, game.viewport.h) };
}
