import { TAU, clamp } from './util.js';
import { WORLD_W, WORLD_H } from './world-data.js';
import { drawGround, drawMountains, drawDecals } from './world-art.js';
import { drawObject } from './world-props.js';
import {
  drawPlayer, drawEnemy, drawSheep, drawProjectile, drawPickup,
  drawGroundEffects, drawEffects, drawParticles, drawTexts
} from './render-entities.js';

// Screen-space renderer. Everything in the world is drawn under a camera
// transform; HUD-style markers and atmospheric overlays are drawn afterwards.
export class Renderer {
  constructor(canvas, world) {
    this.canvas = canvas;
    this.world = world;
    this.ctx = canvas.getContext('2d', { alpha: false });
    this.dpr = 1;
    this.w = window.innerWidth;
    this.h = window.innerHeight;
    this.resize(null);
  }

  resize(game) {
    const w = Math.max(320, window.innerWidth);
    const h = Math.max(320, window.innerHeight);
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.w = w;
    this.h = h;
    this.canvas.width = Math.round(w * this.dpr);
    this.canvas.height = Math.round(h * this.dpr);
    this.canvas.style.width = w + 'px';
    this.canvas.style.height = h + 'px';
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    this.ctx.imageSmoothingEnabled = true;
    if (game) game.setViewport(w, h);
  }

  render(game, time) {
    const ctx = this.ctx;
    const { w, h } = this;
    const zoom = game.zoom || 1;

    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.fillStyle = '#11170f';
    ctx.fillRect(0, 0, w, h);

    // Camera view in world coordinates, with a generous cull margin.
    const view = {
      x: game.camera.x - w / (2 * zoom),
      y: game.camera.y - h / (2 * zoom),
      w: w / zoom,
      h: h / zoom
    };

    const shake = game.shake || 0;
    const sx = shake > 0.2 ? Math.sin(time * 71) * shake * 0.55 : 0;
    const sy = shake > 0.2 ? Math.cos(time * 63) * shake * 0.45 : 0;

    ctx.save();
    ctx.translate(w / 2, h / 2);
    ctx.scale(zoom, zoom);
    ctx.translate(-game.camera.x + sx, -game.camera.y + sy);

    drawGround(this.world, ctx, view, time, 1);
    drawDecals(this.world, ctx, view, time);
    drawMountains(this.world, ctx, view, time);
    drawGroundEffects(ctx, game);

    this.drawWorldObjects(ctx, game, view, time);
    this.drawLights(ctx, game, view, time);
    drawEffects(ctx, game);
    drawParticles(ctx, game);
    drawTexts(ctx, game);

    this.drawAim(ctx, game, time);
    ctx.restore();

    this.drawOverlays(ctx, game, time);
    this.drawObjective(ctx, game, time);
    this.drawControlsCoach(ctx, game, time);
  }

  visible(x, y, pad) {
    // Uses the current view window stored for this frame.
    const v = this._view;
    return x > v.x - pad && x < v.x + v.w + pad && y > v.y - pad && y < v.y + v.h + pad;
  }

  drawWorldObjects(ctx, game, view, time) {
    this._view = view;
    const list = [];

    // Static props.
    for (const o of this.world.objects) {
      const pad = Math.max(90, (o.rad || 60) + 60);
      if (o.cx < view.x - pad || o.cx > view.x + view.w + pad) continue;
      if (o.cy < view.y - pad || o.cy > view.y + view.h + pad) continue;
      list.push({ y: o.sortY ?? o.cy ?? o.y, draw: () => drawObject(ctx, o, time) });
    }

    // Elder Rowan.
    const elder = this.world.elder;
    if (this.visible(elder.x, elder.y, 80)) {
      list.push({ y: elder.y, draw: () => this.drawElder(ctx, game, time) });
    }

    // Sheep.
    for (const s of game.sheep) {
      if (!this.visible(s.x, s.y, 60)) continue;
      list.push({ y: s.y + 6, draw: () => drawSheep(ctx, s, time) });
    }

    // Enemies.
    for (const e of game.enemies) {
      if (e.dead || !this.visible(e.x, e.y, e.isBoss ? 220 : 90)) continue;
      list.push({ y: e.y + e.r * 0.45, draw: () => drawEnemy(ctx, game, e, time) });
    }

    // Projectiles sit slightly above the ground.
    for (const pr of game.projectiles) {
      if (!this.visible(pr.x, pr.y, 80)) continue;
      list.push({ y: pr.y + 40, draw: () => drawProjectile(ctx, pr, time) });
    }

    // Pickups.
    for (const it of game.pickups) {
      if (!this.visible(it.x, it.y, 50)) continue;
      list.push({ y: it.y, draw: () => drawPickup(ctx, it, time) });
    }

    // Player.
    if (!game.player.dead && this.visible(game.player.x, game.player.y, 80)) {
      list.push({ y: game.player.y + 12, draw: () => drawPlayer(ctx, game, time) });
    }

    list.sort((a, b) => a.y - b.y);
    for (const item of list) item.draw();
  }

  drawElder(ctx, game, time) {
    const e = this.world.elder;
    const bob = Math.sin(time * 1.5) * 0.6;
    ctx.save();
    ctx.fillStyle = 'rgba(18,26,18,0.3)';
    ctx.beginPath();
    ctx.ellipse(e.x + 3, e.y + 12, 17, 6, 0, 0, TAU);
    ctx.fill();

    ctx.translate(e.x, e.y + bob);
    // Simple staff.
    ctx.strokeStyle = '#6d5438';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(13, 10);
    ctx.lineTo(16, -46);
    ctx.stroke();
    ctx.fillStyle = '#9fd08a';
    ctx.beginPath();
    ctx.arc(16, -47, 4.2, 0, TAU);
    ctx.fill();

    // Robe.
    ctx.fillStyle = '#8e7650';
    ctx.beginPath();
    ctx.moveTo(-11, 11);
    ctx.quadraticCurveTo(-14, -8, -8, -18);
    ctx.quadraticCurveTo(0, -23, 8, -18);
    ctx.quadraticCurveTo(14, -8, 11, 11);
    ctx.quadraticCurveTo(0, 15, -11, 11);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = 'rgba(222,200,154,0.35)';
    ctx.beginPath();
    ctx.moveTo(-6, -14);
    ctx.quadraticCurveTo(-2, -2, -4, 10);
    ctx.quadraticCurveTo(1, 11, 3, -14);
    ctx.closePath();
    ctx.fill();

    // Head, hair and beard.
    ctx.fillStyle = '#d6b18b';
    ctx.beginPath();
    ctx.arc(0, -27, 8, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#d9d3c4';
    ctx.beginPath();
    ctx.arc(0, -30, 8.2, Math.PI * 0.92, Math.PI * 2.08);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(-6, -23);
    ctx.quadraticCurveTo(0, -8, 6, -23);
    ctx.quadraticCurveTo(0, -18, -6, -23);
    ctx.fill();
    ctx.fillStyle = '#3a2e22';
    ctx.beginPath();
    ctx.arc(-3, -27, 0.9, 0, TAU);
    ctx.arc(3, -27, 0.9, 0, TAU);
    ctx.fill();

    // Little gold circlet.
    ctx.strokeStyle = 'rgba(222,184,104,0.85)';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.arc(0, -27, 8.3, Math.PI * 1.12, Math.PI * 1.88);
    ctx.stroke();
    ctx.restore();

    // Interaction hint glow when near.
    const p = game.player;
    if (Math.hypot(p.x - e.x, p.y - e.y) < 150 && !game.finished) {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.strokeStyle = 'rgba(238,204,132,0.28)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(e.x, e.y + 12, 24, 9, 0, 0, TAU);
      ctx.stroke();
      ctx.restore();
    }
  }

  drawLights(ctx, game, view, time) {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (const l of this.world.lights) {
      if (!this.visible(l.x, l.y, l.r + 40)) continue;
      const flick = 1 + Math.sin(time * 7.3 + (l.seed || 0)) * (l.flicker || 0);
      const pulse = (l.strength || 0.4) * flick * 0.34;
      const g = ctx.createRadialGradient(l.x, l.y, 2, l.x, l.y, l.r);
      g.addColorStop(0, `rgba(${l.color},${clamp(pulse, 0, 0.5)})`);
      g.addColorStop(0.45, `rgba(${l.color},${clamp(pulse * 0.35, 0, 0.2)})`);
      g.addColorStop(1, `rgba(${l.color},0)`);
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(l.x, l.y, l.r, 0, TAU);
      ctx.fill();
    }
    ctx.restore();
  }

  drawAim(ctx, game, time) {
    const p = game.player;
    if (p.dead || !game.started) return;
    const a = p.aimAngle;
    const aim = game.aim;
    if (!Number.isFinite(a) || !aim) return;

    const dx = aim.x - p.x;
    const dy = aim.y - p.y;
    const d = Math.hypot(dx, dy);
    if (d < 26) return;

    const ux = dx / d;
    const uy = dy / d;
    const start = 34;
    const end = Math.min(d, 250);
    const pulse = 0.5 + Math.sin(time * 5) * 0.16;

    ctx.save();
    ctx.strokeStyle = `rgba(226,210,158,${0.22 + pulse * 0.14})`;
    ctx.lineWidth = 1.5;
    ctx.setLineDash([5, 9]);
    ctx.lineDashOffset = -time * 22;
    ctx.beginPath();
    ctx.moveTo(p.x + ux * start, p.y - 10 + uy * start);
    ctx.lineTo(p.x + ux * end, p.y - 10 + uy * end);
    ctx.stroke();
    ctx.setLineDash([]);

    const rx = p.x + ux * end;
    const ry = p.y - 10 + uy * end;
    ctx.strokeStyle = `rgba(240,222,168,${0.3 + pulse * 0.25})`;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.arc(rx, ry, 7 + pulse * 2.4, 0, TAU);
    ctx.stroke();
    ctx.fillStyle = 'rgba(240,222,168,0.5)';
    ctx.beginPath();
    ctx.arc(rx, ry, 1.8, 0, TAU);
    ctx.fill();
    ctx.restore();
  }

  worldToScreen(game, x, y) {
    return {
      x: (x - game.camera.x) * game.zoom + this.w / 2,
      y: (y - game.camera.y) * game.zoom + this.h / 2
    };
  }

  drawOverlays(ctx, game, time) {
    const { w, h } = this;
    // Warm vignette for depth.
    const vg = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.36, w / 2, h / 2, Math.max(w, h) * 0.78);
    vg.addColorStop(0, 'rgba(0,0,0,0)');
    vg.addColorStop(1, 'rgba(6,10,7,0.46)');
    ctx.fillStyle = vg;
    ctx.fillRect(0, 0, w, h);

    // Hurt flash at the screen edges.
    const hurt = Math.max(game.hurtFlash || 0, 0);
    if (hurt > 0.01) {
      const hg = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.22, w / 2, h / 2, Math.max(w, h) * 0.7);
      hg.addColorStop(0, 'rgba(150,30,20,0)');
      hg.addColorStop(1, `rgba(150,30,20,${hurt * 0.55})`);
      ctx.fillStyle = hg;
      ctx.fillRect(0, 0, w, h);
    }

    // Subtle warning ring when badly wounded.
    const p = game.player;
    if (!p.dead && p.hp / p.maxHp < 0.3 && game.started) {
      const alpha = (0.08 + Math.sin(time * 4) * 0.04) * (1 - p.hp / p.maxHp);
      const lg = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.3, w / 2, h / 2, Math.max(w, h) * 0.7);
      lg.addColorStop(0, 'rgba(170,30,24,0)');
      lg.addColorStop(1, `rgba(170,30,24,${alpha})`);
      ctx.fillStyle = lg;
      ctx.fillRect(0, 0, w, h);
    }
  }

  drawObjective(ctx, game, time) {
    if (!game.started || game.dead || game.finished) return;
    const obj = game.objective();
    if (!obj) return;
    const s = this.worldToScreen(game, obj.x, obj.y);
    const margin = 54;
    const onScreen = s.x > 40 && s.x < this.w - 40 && s.y > 90 && s.y < this.h - 40;
    const pulse = 0.6 + Math.sin(time * 3.2) * 0.25;

    ctx.save();
    if (onScreen) {
      const bob = Math.sin(time * 2.4) * 3;
      const y = s.y - Math.max(34, (obj.y === this.world.elder.y ? 58 : 46)) + bob;
      ctx.translate(s.x, y);
      ctx.rotate(Math.PI / 4);
      ctx.fillStyle = `rgba(246,206,124,${pulse})`;
      ctx.fillRect(-6, -6, 12, 12);
      ctx.strokeStyle = 'rgba(38,28,14,0.8)';
      ctx.lineWidth = 1.6;
      ctx.strokeRect(-6, -6, 12, 12);
      ctx.restore();

      ctx.save();
      ctx.fillStyle = 'rgba(244,225,180,0.7)';
      ctx.font = '600 12px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(obj.label.toUpperCase(), s.x, y - 14);
      ctx.restore();
      return;
    }

    // Off-screen: clamp a pointer to the screen edge.
    const cx = this.w / 2;
    const cy = this.h / 2;
    let dx = s.x - cx;
    let dy = s.y - cy;
    const len = Math.hypot(dx, dy) || 1;
    dx /= len;
    dy /= len;
    const rx = (this.w / 2 - margin);
    const ry = (this.h / 2 - margin);
    const t = Math.min(rx / Math.abs(dx || 0.0001), ry / Math.abs(dy || 0.0001));
    const px = cx + dx * t;
    const py = cy + dy * t;

    ctx.translate(px, py);
    ctx.rotate(Math.atan2(dy, dx) + Math.PI / 4);
    ctx.fillStyle = `rgba(246,206,124,${pulse})`;
    ctx.fillRect(-6, -6, 12, 12);
    ctx.strokeStyle = 'rgba(38,28,14,0.8)';
    ctx.lineWidth = 1.6;
    ctx.strokeRect(-6, -6, 12, 12);
    ctx.restore();

    ctx.save();
    ctx.fillStyle = 'rgba(244,225,180,0.66)';
    ctx.font = '600 11px system-ui, sans-serif';
    ctx.textAlign = 'center';
    const label = obj.label.toUpperCase();
    const lx = clamp(px, 60, this.w - 60);
    const ly = clamp(py + (dy > 0 ? 28 : -22), 70, this.h - 24);
    ctx.fillText(label, lx, ly);
    ctx.restore();
  }

  drawControlsCoach(ctx, game, time) {
    // First-minute nudge for desktop players, fades once they move.
    if (!game.started || game.paused || game.finished || game.dead) return;
    if (game.playTime > 16) return;
    if (game.player.x !== 3465 || game.player.y !== 2662) {
      // Player has moved from spawn; fade out naturally.
      if (game.playTime > 2) return;
    }
    const alpha = clamp(1.2 - game.playTime / 14, 0, 1) * 0.8;
    if (alpha <= 0.01) return;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = 'rgba(16,20,15,0.55)';
    ctx.font = '500 13px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Hold left mouse to hurl stones  ·  Space for stoneburst  ·  E to interact', this.w / 2, this.h - 34);
    ctx.restore();
    void time;
    void WORLD_W;
    void WORLD_H;
  }
}
