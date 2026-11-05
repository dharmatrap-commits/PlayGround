import { TAU, clamp, dist, range, mulberry32 } from './util.js';
import {
  addParticle, addRing, addTelegraph, addText, debris, enemyDeathFx, puff,
  sparks, spawnPickup
} from './game-fx.js';
import { PLAY, VILLAGE } from './world-data.js';

export const ENEMY_TYPES = {
  gloom: { r: 16, hp: 38, speed: 98, dmg: 10, aggro: 400, atkRange: 44, windup: 0.44, cooldown: 1.25, essence: 2, name: 'Gloomling' },
  wretch: { r: 23, hp: 108, speed: 74, dmg: 17, aggro: 430, atkRange: 56, windup: 0.62, cooldown: 1.75, essence: 4, name: 'Stone Wretch' },
  bat: { r: 13, hp: 26, speed: 160, dmg: 8, aggro: 440, atkRange: 38, windup: 0.3, cooldown: 0.9, essence: 2, name: 'Maw Bat' },
  warden: { r: 46, hp: 560, speed: 82, dmg: 26, aggro: 620, atkRange: 120, windup: 0.85, cooldown: 2.6, essence: 30, name: 'The Hollow Warden' }
};

let idCounter = 1;
const spawnRng = mulberry32(0x9a1f2c);

export function makeEnemy(game, type, x, y, zone) {
  const t = ENEMY_TYPES[type];
  return {
    id: idCounter++,
    type,
    name: t.name,
    x, y,
    r: t.r,
    hp: t.hp,
    maxHp: t.hp,
    speed: t.speed,
    dmg: t.dmg,
    aggroRange: t.aggro,
    atkRange: t.atkRange,
    windupMax: t.windup,
    cooldownMax: t.cooldown,
    essence: t.essence,
    home: { x, y },
    zone: zone || null,
    state: 'wander',
    aggro: false,
    aggroTimer: 0,
    windup: 0,
    cd: 0.5 + Math.random() * 1.4,
    dir: Math.random() * TAU,
    moving: false,
    walk: Math.random() * 10,
    hitFlash: 0,
    wanderTimer: Math.random() * 2,
    tx: x,
    ty: y,
    isBoss: type === 'warden',
    summonDone: false,
    dead: false,
    seed: Math.random() * 100,
    stuck: 0
  };
}

export function resetEnemies(game) {
  game.enemies = [];
  game.bossActive = false;
  game.bossKilled = false;
  game.zoneTimers = {};
  const boss = makeEnemy(game, 'warden', game.world.bossHome.x, game.world.bossHome.y, null);
  boss.state = 'idle';
  game.boss = boss;
  game.enemies.push(boss);
  for (const zone of game.world.zones) {
    game.zoneTimers[zone.id] = 0;
    for (let i = 0; i < zone.count; i++) spawnFromZone(game, zone);
  }
}

export function spawnFromZone(game, zone) {
  for (let attempt = 0; attempt < 40; attempt++) {
    const a = Math.random() * TAU;
    const rr = Math.sqrt(Math.random()) * zone.r;
    const x = clamp(zone.x + Math.cos(a) * rr, PLAY.x + 60, PLAY.x + PLAY.w - 60);
    const y = clamp(zone.y + Math.sin(a) * rr, PLAY.y + 60, PLAY.y + PLAY.h - 60);
    const type = zone.type;
    const t = ENEMY_TYPES[type];
    if (!game.world.canOccupy(x, y, t.r + 6)) continue;
    if (dist(x, y, game.player.x, game.player.y) < 360) continue;
    if (dist(x, y, VILLAGE.x, VILLAGE.y) < 520) continue;
    const e = makeEnemy(game, type, x, y, zone);
    game.enemies.push(e);
    addRing(game, x, y, 8, 42, '132,116,158', 0.6, 2);
    puff(game, x, y, 5, '90,80,105', 0.6);
    return e;
  }
  return null;
}

function moveTowards(game, e, tx, ty, speed, dt) {
  const dx = tx - e.x;
  const dy = ty - e.y;
  const len = Math.hypot(dx, dy);
  if (len < 1) { e.moving = false; return; }
  e.dir = Math.atan2(dy, dx);
  e.moving = true;
  const sp = speed;
  const res = game.world.resolveMove(e.x, e.y, e.r, (dx / len) * sp * dt, (dy / len) * sp * dt);
  if (Math.abs(res.x - e.x) + Math.abs(res.y - e.y) < 0.2) {
    e.stuck += dt;
    if (e.stuck > 0.5) {
      e.dir += 1.4 + Math.random();
      e.tx = e.x + Math.cos(e.dir) * 90;
      e.ty = e.y + Math.sin(e.dir) * 90;
      e.stuck = 0;
    }
  } else {
    e.stuck = 0;
  }
  e.x = res.x;
  e.y = res.y;
}

function startAttack(game, e) {
  e.windup = e.windupMax;
  e.cd = e.cooldownMax;
  if (e.isBoss) {
    addTelegraph(game, e.x, e.y + 10, 178, e.windupMax + 0.1, '214,92,60');
    game.audio.play('boss');
  } else {
    addTelegraph(game, e.x, e.y, e.atkRange + 18, e.windupMax, '204,92,70');
  }
}

function strike(game, e) {
  const p = game.player;
  const d = dist(e.x, e.y, p.x, p.y);
  if (e.isBoss) {
    const radius = 178;
    addRing(game, e.x, e.y + 8, 20, radius, '231,140,80', 0.55, 9);
    addRing(game, e.x, e.y + 8, 8, radius * 0.7, '255,205,130', 0.4, 5);
    debris(game, e.x, e.y + 6, 22, '148,138,116', 1.5);
    puff(game, e.x, e.y + 10, 18, '174,162,134', 1.5);
    game.shake = Math.max(game.shake, 14);
    game.audio.play('burst');
    if (d < radius + p.r) game.damagePlayer(e.dmg, e);
  } else {
    addRing(game, e.x, e.y, 6, e.atkRange + 22, '188,98,78', 0.32, 3);
    sparks(game, (e.x + p.x) / 2, (e.y + p.y) / 2, 5, '226,150,110');
    game.audio.play('hit');
    if (d < e.atkRange + p.r + 10) game.damagePlayer(e.dmg, e);
  }
}

function summonMinions(game, e) {
  for (let i = 0; i < 2; i++) {
    const a = Math.random() * TAU;
    const x = e.x + Math.cos(a) * 90;
    const y = e.y + Math.sin(a) * 90;
    const m = makeEnemy(game, 'gloom', x, y, null);
    m.aggro = true;
    m.aggroTimer = 10;
    m.home = { x, y };
    game.enemies.push(m);
    addRing(game, x, y, 4, 50, '170,120,210', 0.6, 3);
    puff(game, x, y, 8, '92,72,110', 0.9);
  }
  game.ui?.showToast('The Warden calls the dark to its side.', 'gold');
}

export function updateEnemies(game, dt) {
  const p = game.player;
  const others = game.enemies;

  for (const e of others) {
    if (e.dead) continue;
    e.hitFlash = Math.max(0, e.hitFlash - dt);
    e.aggroTimer = Math.max(0, e.aggroTimer - dt);
    e.walk += dt * (e.moving ? 7 : 2);
    e.cd = Math.max(0, e.cd - dt);

    if (e.isBoss) {
      const dp = dist(e.x, e.y, p.x, p.y);
      if (!game.bossActive && dp < 560) {
        game.bossActive = true;
        game.audio.play('boss');
        game.ui?.showToast('The Hollow Warden wakes.', 'gold');
        game.ui?.showBoss(true);
        game.shake = Math.max(game.shake, 8);
        addRing(game, e.x, e.y, 20, 240, '222,142,84', 0.9, 6);
      }
      if (!game.bossActive) {
        e.moving = false;
        continue;
      }
    }

    if (e.windup > 0) {
      e.moving = false;
      e.windup -= dt;
      if (e.windup <= 0) strike(game, e);
      continue;
    }

    const dp = dist(e.x, e.y, p.x, p.y);
    const leash = dist(e.x, e.y, e.home.x, e.home.y);
    const playerNearHome = dist(p.x, p.y, e.home.x, e.home.y) < 980;

    if (dp < e.aggroRange && playerNearHome) e.aggro = true;
    if (e.aggroTimer > 0) e.aggro = true;
    if (e.isBoss && game.bossActive) e.aggro = true;
    if (e.aggro && (leash > 1200 || dp > 1300) && !e.isBoss) {
      e.aggro = false;
      e.state = 'return';
    }

    if (e.aggro && !game.player.dead) {
      if (dp <= e.atkRange && e.cd <= 0) {
        startAttack(game, e);
        continue;
      }
      // Boss gets a burst of speed when winding up the distance.
      const sp = e.isBoss ? (dp > 220 ? e.speed * 1.25 : e.speed) : e.speed;
      moveTowards(game, e, p.x, p.y, sp, dt);
      if (e.isBoss && e.hp < e.maxHp * 0.5 && !e.summonDone) {
        e.summonDone = true;
        summonMinions(game, e);
      }
    } else {
      e.state = 'wander';
      e.wanderTimer -= dt;
      if (e.wanderTimer <= 0) {
        e.wanderTimer = 1.6 + Math.random() * 3;
        const a = Math.random() * TAU;
        const r = 40 + Math.random() * 110;
        e.tx = e.home.x + Math.cos(a) * r;
        e.ty = e.home.y + Math.sin(a) * r;
      }
      if (dist(e.x, e.y, e.tx, e.ty) > 12) moveTowards(game, e, e.tx, e.ty, e.speed * 0.32, dt);
      else e.moving = false;
    }

    // Soft separation so packs don't stack.
    for (const o of others) {
      if (o === e || o.dead) continue;
      const dx = e.x - o.x;
      const dy = e.y - o.y;
      const min = e.r + o.r;
      const d2 = dx * dx + dy * dy;
      if (d2 > 0.01 && d2 < min * min) {
        const d = Math.sqrt(d2);
        const push = (min - d) * 0.45;
        e.x += (dx / d) * push;
        e.y += (dy / d) * push;
      }
    }
  }

  game.enemies = game.enemies.filter((e) => !e.dead);
}

export function damageEnemy(game, e, dmg, knock = 0, dir = 0) {
  if (!e || e.dead) return;
  e.hp -= dmg;
  e.hitFlash = 0.18;
  e.aggro = true;
  e.aggroTimer = Math.max(e.aggroTimer, 5);
  addText(game, e.x + (Math.random() - 0.5) * 14, e.y - e.r - 18, Math.round(dmg), e.isBoss ? '#ffd08a' : '#f4e4c0', e.isBoss ? 19 : 14);
  sparks(game, e.x, e.y - e.r * 0.4, 4, e.type === 'gloom' ? '186,140,226' : '240,205,150');
  if (knock && !e.isBoss) {
    const res = game.world.resolveMove(e.x, e.y, e.r, Math.cos(dir) * knock, Math.sin(dir) * knock);
    e.x = res.x;
    e.y = res.y;
  }
  if (e.isBoss) {
    game.ui?.showBoss(true);
    game.shake = Math.max(game.shake, 3);
  }
  if (e.hp <= 0) killEnemy(game, e);
}

export function killEnemy(game, e) {
  if (e.dead) return;
  e.dead = true;
  enemyDeathFx(game, e);
  game.audio.play(e.isBoss ? 'victory' : 'enemyDie');
  game.onEnemyKilled(e);

  if (e.isBoss) {
    game.shake = Math.max(game.shake, 22);
    game.bossActive = false;
    for (let i = 0; i < 9; i++) spawnPickup(game, e.x, e.y, 'essence', 5, true);
    spawnPickup(game, e.x, e.y, 'heart', 40, false);
    game.ui?.showBoss(false);
  } else {
    const orbs = e.type === 'wretch' ? 2 + (Math.random() > 0.5 ? 1 : 0) : 1 + (Math.random() > 0.7 ? 1 : 0);
    for (let i = 0; i < orbs; i++) spawnPickup(game, e.x, e.y, 'essence', e.essence, true);
    const heartChance = e.type === 'wretch' ? 0.24 : e.type === 'bat' ? 0.1 : 0.16;
    if (Math.random() < heartChance) spawnPickup(game, e.x, e.y, 'heart', 18, true);
  }
}

export function updateSpawner(game, dt) {
  if (!game.world.zones) return;
  for (const zone of game.world.zones) {
    let alive = 0;
    for (const e of game.enemies) {
      if (!e.dead && e.zone && e.zone.id === zone.id) alive++;
    }
    if (alive >= zone.count) continue;
    game.zoneTimers[zone.id] = (game.zoneTimers[zone.id] || 0) - dt;
    if (game.zoneTimers[zone.id] <= 0) {
      game.zoneTimers[zone.id] = zone.respawn;
      spawnFromZone(game, zone);
    }
  }
}
