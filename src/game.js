import { TAU, clamp, lerp, dist, angleTo } from './util.js';
import { PLAYER_START, FOREST, WORLD_W, WORLD_H } from './world-data.js';
import {
  initFx, puff, debris, sparks, addRing, addText, updateFx, updateAmbient,
  updatePickups, footstep, spawnPickup
} from './game-fx.js';
import {
  resetEnemies, updateEnemies, updateSpawner, damageEnemy
} from './game-enemies.js';

const SUBTITLES = {
  village: 'A quiet place, for now',
  forest: 'Old trees, older shadows',
  cave: 'Do not answer the knocking',
  pond: 'Where the sky rests',
  highlands: 'Above the green, the bare stone',
  fields: 'The valley feeds its people',
  valley: 'A mountain holds its breath'
};

function makePlayer() {
  return {
    x: PLAYER_START.x,
    y: PLAYER_START.y,
    r: 16,
    speed: 260,
    hp: 100,
    maxHp: 100,
    mana: 100,
    maxMana: 100,
    damage: 30,
    burstDamage: 40,
    essence: 0,
    facing: -Math.PI / 2,
    aimAngle: -Math.PI / 2,
    moving: false,
    walk: 0,
    throwCd: 0,
    burstCd: 0,
    invuln: 0,
    cast: 0,
    hurt: 0,
    manaFlash: 0,
    footTimer: 0,
    dead: false
  };
}

export class Game {
  constructor(world, audio) {
    this.world = world;
    this.audio = audio;
    this.ui = null;
    this.time = 0;
    this.playTime = 0;
    this.started = false;
    this.paused = false;
    this.finished = false;
    this.viewport = { w: window.innerWidth, h: window.innerHeight };
    this.zoom = 1;
    this.camera = { x: PLAYER_START.x, y: PLAYER_START.y };
    this.aim = { x: PLAYER_START.x + 100, y: PLAYER_START.y - 50 };
    this.aimMode = 'mouse';
    this.shake = 0;
    this.hurtFlash = 0;
    this.areaKey = 'village';
    this.areaTimer = 0;
    this.prompt = null;
    this.projectiles = [];
    this.bossActive = false;
    this.sheep = [];
    this.setViewport(this.viewport.w, this.viewport.h);
    this.newRun(false);
    this.started = false;
  }

  setViewport(w, h) {
    this.viewport.w = w;
    this.viewport.h = h;
    this.zoom = clamp(w / 720, 0.9, 1.24);
  }

  newRun(announce = true) {
    this.started = true;
    this.paused = false;
    this.dead = false;
    this.finished = false;
    this.player = makePlayer();
    this.quest = { stage: 0, kills: 0, target: 8, bossDead: false };
    this.stats = { kills: 0, deaths: 0, essence: 0, shrines: 0 };
    this.playTime = 0;
    this.projectiles = [];
    this.world.shrine.level = 0;
    this.world.bossActive = false;
    this.initWorldState();
    if (announce && this.ui) {
      this.ui.showArea('Hollowmere Village', SUBTITLES.village);
      this.ui.showToast('WASD to walk · hold LMB to hurl stones', 'gold');
    }
  }

  start() {
    if (this.started) {
      this.paused = false;
      return;
    }
    this.started = true;
    this.playTime = 0;
    this.camera.x = this.player.x;
    this.camera.y = this.player.y;
    if (this.ui) {
      this.ui.showArea('Hollowmere Village', SUBTITLES.village);
      this.ui.showToast('WASD to walk · hold LMB to hurl stones', 'gold');
    }
  }

  initWorldState() {
    initFx(this);
    this.bossActive = false;
    resetEnemies(this);
    this.projectiles = [];
    this.camera.x = this.player.x;
    this.camera.y = this.player.y;
    this.shake = 0;
    this.hurtFlash = 0;
    this.areaKey = null;
    this.areaTimer = 0;
    this.spawnAcc = 0;
    this.buildSheep();
    this.aim = { x: this.player.x + 120, y: this.player.y - 60 };
    this.prompt = null;
  }

  buildSheep() {
    this.sheep = [];
    const flocks = [
      { x: 3875, y: 3140, w: 260, h: 120, n: 4 },
      { x: 4320, y: 2410, w: 400, h: 400, n: 4 }
    ];
    for (const f of flocks) {
      for (let i = 0; i < f.n; i++) {
        this.sheep.push({
          x: f.x + Math.random() * f.w,
          y: f.y + Math.random() * f.h,
          tx: f.x + Math.random() * f.w,
          ty: f.y + Math.random() * f.h,
          timer: Math.random() * 4,
          walk: Math.random() * 10,
          dir: Math.random() * TAU,
          phase: Math.random() * 10,
          bounds: f
        });
      }
    }
  }

  respawn() {
    const p = this.player;
    this.dead = false;
    p.dead = false;
    p.hp = p.maxHp;
    p.mana = p.maxMana;
    p.invuln = 2.2;
    p.x = this.world.shrine.x + 58;
    p.y = this.world.shrine.y + 66;
    this.camera.x = p.x;
    this.camera.y = p.y;
    this.bossActive = false;
    if (this.boss) {
      this.boss.x = this.world.bossHome.x;
      this.boss.y = this.world.bossHome.y;
      this.boss.aggro = false;
      this.boss.windup = 0;
    }
    for (const e of this.enemies) {
      if (!e.isBoss) e.aggro = false;
    }
    this.hurtFlash = 0;
    this.shake = 0;
    this.audio.play('heal');
    this.ui?.hideDeath();
    this.ui?.showToast('The stone remembers you. Rise.', 'gold');
  }

  update(dt, input, active) {
    this.time += dt;
    const p = this.player;
    if (active) {
      this.playTime += dt;
      this.updatePlayer(dt, input);
      this.updateProjectiles(dt);
      updateEnemies(this, dt);
      updatePickups(this, dt);
      updateSpawner(this, dt);
      this.updateSheep(dt);
      this.updateArea(dt);
      this.updatePrompt();
      updateAmbient(this, dt);
      if (this.quest.stage === 3 && this.quest.bossDead) {
        this.setQuestStage(4);
        this.ui?.showToast('The Warden is dead. Return to Elder Rowan.', 'gold');
      }
      p.invuln = Math.max(0, p.invuln - dt);
      p.cast = Math.max(0, p.cast - dt);
      p.manaFlash = Math.max(0, p.manaFlash - dt);
      p.throwCd = Math.max(0, p.throwCd - dt);
      p.burstCd = Math.max(0, p.burstCd - dt);
      p.mana = Math.min(p.maxMana, p.mana + 9.5 * dt);
      p.hurt = Math.max(0, p.hurt - dt * 2);
      this.lastHurt = (this.lastHurt || 0) + dt;
      if (this.lastHurt > 7 && p.hp < p.maxHp && !p.dead) p.hp = Math.min(p.maxHp, p.hp + 1.4 * dt);
    } else {
      updateAmbient(this, dt);
    }
    updateFx(this, dt);
    this.updateCamera(dt);
    this.shake *= Math.exp(-7 * dt);
    this.hurtFlash = Math.max(0, this.hurtFlash - dt * 2.4);
  }

  updatePlayer(dt, input) {
    const p = this.player;
    const move = input.getMove();
    p.moving = move.mag > 0.08;
    if (p.moving) {
      p.facing = Math.atan2(move.y, move.x);
      const sp = p.speed;
      const res = this.world.resolveMove(p.x, p.y, p.r, move.x * sp * dt, move.y * sp * dt);
      p.x = res.x;
      p.y = res.y;
      p.walk += dt * 9;
      p.footTimer -= dt;
      if (p.footTimer <= 0) {
        p.footTimer = 0.2;
        footstep(this, p.x, p.y, this.world.biomeAt(p.x, p.y));
        if (Math.random() > 0.6) this.audio.play('step');
      }
    }

    const aim = this.computeAim(input);
    this.aim = aim.point;
    this.aimMode = aim.mode;
    p.aimAngle = Math.atan2(aim.point.y - p.y, aim.point.x - p.x);

    if (input.consumeThrowQueue()) this.tryThrow(input);
    if (input.isThrowing() && input.aimMode() !== 'touch') this.tryThrow(input);
    if (input.consumePressed('Space') || input.consumeBurst()) this.castBurst();
    if (input.consumePressed('KeyE')) this.interact();
  }

  screenToWorld(sx, sy) {
    return {
      x: this.camera.x + (sx - this.viewport.w / 2) / this.zoom,
      y: this.camera.y + (sy - this.viewport.h / 2) / this.zoom
    };
  }

  nearestEnemy(x, y, maxDist = 1000) {
    let best = null;
    let bd = maxDist;
    for (const e of this.enemies) {
      if (e.dead) continue;
      const d = dist(x, y, e.x, e.y);
      if (d < bd) { bd = d; best = e; }
    }
    return best;
  }

  bestInCone(px, py, dx, dy, maxDist, maxAngle) {
    let best = null;
    let bestScore = Infinity;
    const base = Math.atan2(dy, dx);
    for (const e of this.enemies) {
      if (e.dead) continue;
      const d = dist(px, py, e.x, e.y);
      if (d > maxDist || d < 10) continue;
      const a = Math.atan2(e.y - py, e.x - px);
      let da = Math.abs(a - base);
      if (da > Math.PI) da = TAU - da;
      if (da > maxAngle) continue;
      const score = d * (1 + da / (maxAngle + 0.001) * 1.6);
      if (score < bestScore) { bestScore = score; best = e; }
    }
    return best;
  }

  computeAim(input) {
    const p = this.player;
    const useTouch = input.touchMode && !input.mouse.seen;
    if (useTouch) {
      let dx = input.lastAimDir.x;
      let dy = input.lastAimDir.y;
      if (input.aimTouch && input.aimTouch.moved) {
        dx = input.aimTouch.x - input.aimTouch.sx;
        dy = input.aimTouch.y - input.aimTouch.sy;
        const l = Math.hypot(dx, dy) || 1;
        dx /= l; dy /= l;
      }
      if (input.touchThrowHeld) {
        const near = this.nearestEnemy(p.x, p.y, 900);
        if (near) return { point: { x: near.x, y: near.y }, mode: 'auto' };
        return {
          point: { x: p.x + Math.cos(p.aimAngle || 0) * 420, y: p.y + Math.sin(p.aimAngle || 0) * 420 },
          mode: 'auto'
        };
      }
      const target = this.bestInCone(p.x, p.y, dx, dy, 820, 0.38);
      if (target) return { point: { x: target.x, y: target.y }, mode: 'touch' };
      return { point: { x: p.x + dx * 520, y: p.y + dy * 520 }, mode: 'touch', dir: { x: dx, y: dy } };
    }

    if (input.touchThrowHeld) {
      const near = this.nearestEnemy(p.x, p.y, 900);
      if (near) return { point: { x: near.x, y: near.y }, mode: 'auto' };
      return { point: { x: p.x + Math.cos(p.facing) * 420, y: p.y + Math.sin(p.facing) * 420 }, mode: 'auto' };
    }

    const w = this.screenToWorld(input.mouse.x, input.mouse.y);
    let point = w;
    const near = this.nearestEnemy(w.x, w.y, 86);
    if (near) point = { x: near.x, y: near.y };
    return { point, mode: 'mouse' };
  }

  tryThrow(input) {
    const p = this.player;
    if (p.throwCd > 0 || p.dead || this.finished) return;
    if (p.mana < 9) {
      p.manaFlash = 0.6;
      p.throwCd = 0.3;
      this.audio.play('invalid');
      return;
    }
    const aim = this.computeAim(input).point;
    let tx = aim.x;
    let ty = aim.y;
    if (dist(p.x, p.y, tx, ty) < 45) {
      tx = p.x + Math.cos(p.aimAngle) * 180;
      ty = p.y + Math.sin(p.aimAngle) * 180;
    }
    p.mana -= 9;
    p.throwCd = 0.34;
    p.cast = 0.2;
    const sx = p.x + Math.cos(p.aimAngle) * 20;
    const sy = p.y - 10 + Math.sin(p.aimAngle) * 16;
    const d = dist(sx, sy, tx, ty);
    const dur = clamp(d / 920, 0.16, 0.75);
    this.projectiles.push({
      sx, sy, tx, ty, x: sx, y: sy,
      t: 0, dur,
      arc: clamp(d * 0.24, 30, 150),
      dmg: p.damage,
      radius: 64,
      rot: Math.random() * TAU,
      spin: (Math.random() - 0.5) * 18
    });
    this.audio.play('throw');
    puff(this, sx, sy, 3, '166,158,128', 0.5);
    sparks(this, sx, sy, 3, '196,214,150');
  }

  castBurst() {
    const p = this.player;
    if (p.dead || this.finished) return;
    if (p.burstCd > 0) {
      this.audio.play('invalid');
      return;
    }
    if (p.mana < 28) {
      p.manaFlash = 0.7;
      this.audio.play('invalid');
      this.ui?.showToast('Not enough mana.', 'gold');
      return;
    }
    p.mana -= 28;
    p.burstCd = 4.5;
    p.cast = 0.35;
    this.shake = Math.max(this.shake, 11);
    this.audio.play('burst');
    addRing(this, p.x, p.y, 26, 190, '190,220,150', 0.55, 8);
    addRing(this, p.x, p.y, 10, 120, '255,226,160', 0.35, 4);
    debris(this, p.x, p.y + 4, 24, '156,146,118', 1.5);
    puff(this, p.x, p.y + 8, 18, '178,164,128', 1.4);
    for (const e of this.enemies) {
      if (e.dead) continue;
      const d = dist(p.x, p.y, e.x, e.y);
      if (d < 195) {
        const falloff = 1 - (d / 195) * 0.45;
        damageEnemy(this, e, p.burstDamage * falloff, 46, Math.atan2(e.y - p.y, e.x - p.x));
        e.aggro = true;
        e.aggroTimer = 5;
      }
    }
  }

  updateProjectiles(dt) {
    for (const pr of this.projectiles) {
      if (pr.done) continue;
      pr.t += dt;
      pr.rot += pr.spin * dt;
      const k = clamp(pr.t / pr.dur, 0, 1);
      const ease = k;
      pr.x = lerp(pr.sx, pr.tx, ease);
      pr.y = lerp(pr.sy, pr.ty, ease);
      if (k > 0.08 && k < 0.97) {
        let hit = null;
        for (const e of this.enemies) {
          if (e.dead) continue;
          if (dist(pr.x, pr.y, e.x, e.y) < e.r + 15) { hit = e; break; }
        }
        if (hit) {
          this.detonate(pr, hit.x, hit.y);
          continue;
        }
      }
      if (k >= 1) this.detonate(pr, pr.tx, pr.ty);
    }
    this.projectiles = this.projectiles.filter((p) => !p.done);
  }

  detonate(pr, x, y) {
    pr.done = true;
    const p = this.player;
    const water = this.world.isWater(x, y);
    if (water) {
      for (let i = 0; i < 14; i++) {
        addRing(this, x, y, 2, 20 + Math.random() * 34, '158,208,212', 0.4, 2);
      }
      puff(this, x, y, 10, '176,216,218', 0.9);
      this.audio.play('impact');
    } else {
      addRing(this, x, y, 6, pr.radius, '214,190,140', 0.42, 3);
      debris(this, x, y, 12, '148,140,118', 1);
      puff(this, x, y, 10, '184,170,136', 0.9);
      this.audio.play('impact');
    }
    this.shake = Math.max(this.shake, clamp(7 - dist(x, y, p.x, p.y) / 140, 1.5, 7));
    for (const e of this.enemies) {
      if (e.dead) continue;
      const d = dist(x, y, e.x, e.y);
      if (d < pr.radius + e.r) {
        const falloff = 1 - (d / (pr.radius + e.r)) * 0.45;
        damageEnemy(this, e, pr.dmg * falloff, 26, Math.atan2(e.y - y, e.x - x));
        e.aggro = true;
        e.aggroTimer = 5;
      }
    }
  }

  damagePlayer(dmg, source) {
    const p = this.player;
    if (p.dead || p.invuln > 0 || this.finished) return;
    p.hp -= dmg;
    p.invuln = 0.92;
    p.hurt = 1;
    this.hurtFlash = 1;
    this.shake = Math.max(this.shake, 10);
    this.lastHurt = 0;
    this.audio.play('hurt');
    if (navigator.vibrate) { try { navigator.vibrate(45); } catch {} }
    addText(this, p.x, p.y - 38, '-' + Math.round(dmg), '#ff9b86', 16);
    puff(this, p.x, p.y, 7, '170,110,96', 0.8);
    if (source) {
      const a = Math.atan2(p.y - source.y, p.x - source.x);
      const res = this.world.resolveMove(p.x, p.y, p.r, Math.cos(a) * 26, Math.sin(a) * 26);
      p.x = res.x;
      p.y = res.y;
    }
    if (p.hp <= 0) {
      p.hp = 0;
      p.dead = true;
      this.dead = true;
      this.stats.deaths++;
      this.audio.play('enemyDie');
      this.ui?.showDeath();
    }
  }

  updatePrompt() {
    const p = this.player;
    if (p.dead || this.finished || this.dead) { this.prompt = null; return; }
    const candidates = [];
    const dElder = dist(p.x, p.y, this.world.elder.x, this.world.elder.y);
    if (dElder < 118) candidates.push({ type: 'elder', d: dElder, x: this.world.elder.x, y: this.world.elder.y, label: this.quest.stage === 0 ? 'Speak with Elder Rowan' : 'Talk to Elder Rowan' });
    const dShrine = dist(p.x, p.y, this.world.shrine.x, this.world.shrine.y);
    if (dShrine < 105) {
      const cost = 25 + this.stats.shrines * 20;
      candidates.push({
        type: 'shrine', d: dShrine, x: this.world.shrine.x, y: this.world.shrine.y,
        label: p.essence >= cost ? `Infuse the shrine (${cost} essence)` : `Shrine asks for ${cost} essence`
      });
    }
    for (const s of this.world.signs) {
      const d = dist(p.x, p.y, s.x, s.y);
      if (d < 88) candidates.push({ type: 'sign', d, x: s.x, y: s.y, sign: s, label: 'Read the signpost' });
    }
    candidates.sort((a, b) => a.d - b.d);
    this.prompt = candidates[0] || null;
  }

  interact() {
    if (this.ui?.dialogueOpen) return;
    const target = this.prompt;
    if (!target) return;
    if (target.type === 'elder') this.talkToElder();
    else if (target.type === 'shrine') this.useShrine();
    else if (target.type === 'sign') {
      this.audio.play('pickup');
      this.ui?.showDialogue({
        name: target.sign.type === 'cave' ? 'Weathered Warning' : 'Village Signpost',
        portrait: '!',
        lines: target.sign.text.split('\n')
      });
    }
  }

  talkToElder() {
    const q = this.quest;
    this.audio.play('pickup');
    if (q.stage === 0) {
      this.ui?.showDialogue({
        name: 'Elder Rowan',
        portrait: 'R',
        lines: [
          'You came, earth-child. Good. The valley has been restless since the moon turned thin.',
          'Gloomlings creep out of the Whisperwood. Eight have been seen circling the old stones. Take your staff and thin them.',
          'Hurl the mountain\u2019s bones. Return when the woods are quiet.'
        ],
        onDone: () => {
          this.quest.stage = 1;
          this.quest.kills = 0;
          this.audio.play('quest');
          this.ui?.showToast('New task — Thin the gloom in the Whisperwood.', 'gold');
        }
      });
    } else if (q.stage === 1) {
      this.ui?.showDialogue({
        name: 'Elder Rowan',
        portrait: 'R',
        lines: [
          `The gloom still gathers. ${this.quest.kills} of eight have fallen. The stone remembers each one.`,
          'The Whisperwood lies west, across the bridge. Do not let them circle behind you.'
        ]
      });
    } else if (q.stage === 2) {
      this.ui?.showDialogue({
        name: 'Elder Rowan',
        portrait: 'R',
        lines: [
          'The woods breathe again. You have the mountain\u2019s favour — take it. Your well of power deepens.',
          'But something below has noticed you. The Hollow Warden stirs at the Maw, north of the village.',
          'Go to the cave mouth. End it before it climbs into the valley. I will keep the fire lit.'
        ],
        onDone: () => {
          const p = this.player;
          p.maxMana += 20;
          p.mana = p.maxMana;
          p.hp = Math.min(p.maxHp, p.hp + 30);
          this.audio.play('heal');
          this.audio.play('quest');
          if (this.quest.bossDead) {
            this.quest.stage = 4;
            this.ui?.showToast('The Warden already lies dead. Return to Elder Rowan.', 'gold');
          } else {
            this.quest.stage = 3;
            this.ui?.showToast('New task — Slay the Hollow Warden at the Maw.', 'gold');
          }
        }
      });
    } else if (q.stage === 3) {
      this.ui?.showDialogue({
        name: 'Elder Rowan',
        portrait: 'R',
        lines: [
          'The Warden waits in the dark at the back of the Maw. Its fists are the size of doors.',
          'Strike from range. Move when the ground begins to glow. The mountain favours the patient.'
        ]
      });
    } else if (q.stage === 4) {
      this.ui?.showDialogue({
        name: 'Elder Rowan',
        portrait: 'R',
        lines: [
          'It is done. The knocking under the mountain has stopped.',
          'The valley will remember this. Not with a statue — with quiet mornings. That is better.',
          'Rest now, earth-child. The stones are yours to walk among.'
        ],
        onDone: () => {
          this.quest.stage = 5;
          this.finished = true;
          this.audio.play('victory');
          this.ui?.showVictory(this.stats, this.playTime, this.player.essence);
        }
      });
    } else {
      this.ui?.showDialogue({
        name: 'Elder Rowan',
        portrait: 'R',
        lines: ['The fire is warm and the valley is quiet. Stay as long as you like, earth-child.']
      });
    }
  }

  useShrine() {
    const cost = 25 + this.stats.shrines * 20;
    const p = this.player;
    if (p.essence < cost) {
      this.audio.play('invalid');
      this.ui?.showToast(`The shrine is thirsty. It asks for ${cost} earth essence.`, 'gold');
      return;
    }
    p.essence -= cost;
    this.stats.shrines++;
    this.world.shrine.level = this.stats.shrines;
    p.maxHp += 10;
    p.damage += 4;
    p.hp = Math.min(p.maxHp, p.hp + 30);
    p.mana = p.maxMana;
    this.audio.play('heal');
    addRing(this, this.world.shrine.x, this.world.shrine.y, 12, 130, '150,236,158', 0.8, 5);
    sparks(this, this.world.shrine.x, this.world.shrine.y - 30, 22, '158,238,170');
    this.ui?.showToast('The stone answers. +10 life, +4 stone damage.', 'gold');
    addText(this, p.x, p.y - 40, 'The stone answers', '#b8ecc0', 15);
  }

  onEnemyKilled(e) {
    this.stats.kills++;
    if (e.isBoss) {
      this.quest.bossDead = true;
      this.bossActive = false;
      this.audio.play('quest');
      this.ui?.showToast('The Hollow Warden falls. The valley exhales.', 'gold');
      if (this.quest.stage === 3) this.setQuestStage(4);
      return;
    }
    if (this.quest.stage === 1) {
      this.quest.kills++;
      if (this.quest.kills >= this.quest.target) {
        this.setQuestStage(2);
        this.audio.play('quest');
        this.ui?.showToast('The gloom thins. Return to Elder Rowan.', 'gold');
      }
    }
  }

  setQuestStage(stage) {
    this.quest.stage = stage;
  }

  initWorldStateDone() {}

  updateCamera(dt) {
    const p = this.player;
    const halfW = this.viewport.w / (2 * this.zoom);
    const halfH = this.viewport.h / (2 * this.zoom);
    const leadX = clamp((this.aim.x - p.x) * 0.12, -80, 80);
    const leadY = clamp((this.aim.y - p.y) * 0.12, -60, 60);
    const tx = clamp(p.x + leadX, halfW, Math.max(halfW, WORLD_W - halfW));
    const ty = clamp(p.y + leadY, halfH, Math.max(halfH, WORLD_H - halfH));
    const k = 1 - Math.exp(-7 * dt);
    this.camera.x = lerp(this.camera.x, tx, k);
    this.camera.y = lerp(this.camera.y, ty, k);
  }

  updateArea(dt) {
    this.areaTimer -= dt;
    if (this.areaTimer > 0) return;
    this.areaTimer = 0.55;
    const area = this.world.areaAt(this.player.x, this.player.y);
    if (area.key !== this.areaKey) {
      this.areaKey = area.key;
      if (area.key !== 'valley') {
        this.ui?.showArea(area.name, SUBTITLES[area.key] || '');
      }
    }
  }

  updateSheep(dt) {
    for (const s of this.sheep) {
      s.timer -= dt;
      s.walk += dt * (s.moving ? 6 : 2);
      if (s.timer <= 0) {
        s.timer = 2 + Math.random() * 5;
        const b = s.bounds;
        s.tx = b.x + Math.random() * b.w;
        s.ty = b.y + Math.random() * b.h;
      }
      const d = dist(s.x, s.y, s.tx, s.ty);
      s.moving = d > 8;
      if (s.moving) {
        const a = Math.atan2(s.ty - s.y, s.tx - s.x);
        s.dir = a;
        s.x += Math.cos(a) * 22 * dt;
        s.y += Math.sin(a) * 22 * dt;
      }
    }
  }

  // --------------------------------------------------------------- quest UI
  questInfo() {
    const q = this.quest;
    if (q.stage === 0) return { title: 'A Valley Unsettled', objective: 'Speak with Elder Rowan by the village well.' };
    if (q.stage === 1) return { title: 'Stone and Shadow', objective: `Thin the gloom in the Whisperwood — <b>${q.kills}/${q.target}</b> corrupted slain.` };
    if (q.stage === 2) return { title: 'Stone and Shadow', objective: 'Return to Elder Rowan at the village well.' };
    if (q.stage === 3) return { title: 'The Hollow Below', objective: 'Slay the Hollow Warden at the Maw, north of the village.' };
    if (q.stage === 4) return { title: 'The Hollow Below', objective: 'Return to Elder Rowan in the village.' };
    return { title: 'The Valley Breathes', objective: 'The valley is safe. Wander, or speak with Rowan.' };
  }

  objective() {
    const q = this.quest;
    if (q.stage === 0 || q.stage === 2 || q.stage === 4) return { x: this.world.elder.x, y: this.world.elder.y, label: 'Elder Rowan' };
    if (q.stage === 1) {
      const e = this.nearestEnemy(this.player.x, this.player.y, 1400);
      if (e) return { x: e.x, y: e.y, label: 'Gloom' };
      return { x: FOREST.x, y: FOREST.y, label: 'The Whisperwood' };
    }
    if (q.stage === 3) return { x: this.world.bossHome.x, y: this.world.bossHome.y, label: 'The Maw' };
    return null;
  }

  bossInfo() {
    if (!this.boss || this.boss.dead) return null;
    if (!this.bossActive) return null;
    return { hp: Math.max(0, this.boss.hp), maxHp: this.boss.maxHp, name: 'THE HOLLOW WARDEN' };
  }

  promptForUi() {
    return this.prompt ? { label: this.prompt.label, type: this.prompt.type } : null;
  }
}
