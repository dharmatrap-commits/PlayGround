import { clamp, formatTime } from './util.js';
import { VILLAGE, CAVE, FOREST, POND } from './world-data.js';

export class UI {
  constructor(game) {
    this.game = game;
    game.ui = this;
    this.el = {
      hud: document.getElementById('hud'),
      title: document.getElementById('title-screen'),
      hpFill: document.getElementById('hp-fill'),
      hpText: document.getElementById('hp-text'),
      mpFill: document.getElementById('mp-fill'),
      mpText: document.getElementById('mp-text'),
      questTitle: document.getElementById('quest-title'),
      questObjective: document.getElementById('quest-objective'),
      essence: document.getElementById('essence'),
      minimap: document.getElementById('minimap'),
      prompt: document.getElementById('interact'),
      promptText: document.getElementById('interact-text'),
      bossBar: document.getElementById('boss-bar'),
      bossFill: document.getElementById('boss-fill'),
      bossName: document.querySelector('.boss-name'),
      toast: document.getElementById('toast'),
      areaLabel: document.getElementById('area-label'),
      areaName: document.getElementById('area-name'),
      dialogue: document.getElementById('dialogue'),
      dlgName: document.getElementById('dlg-name'),
      dlgText: document.getElementById('dlg-text'),
      dlgPortrait: document.getElementById('dlg-portrait'),
      death: document.getElementById('death-screen'),
      victory: document.getElementById('victory-screen'),
      victoryStats: document.getElementById('victory-stats'),
      victoryText: document.getElementById('victory-text'),
      pause: document.getElementById('pause-screen'),
      mute: document.getElementById('btn-mute'),
      pauseBtn: document.getElementById('btn-pause'),
      burstBtn: document.getElementById('btn-burst'),
      throwBtn: document.getElementById('btn-throw'),
      loading: document.getElementById('loading')
    };
    this.toastTimer = 0;
    this.areaTimer = 0;
    this.dialogue = null;
    this.lastQuest = '';
    this.minimapAcc = 0;
    this.bossVisible = false;

    const mm = this.el.minimap;
    if (mm) { mm.width = 400; mm.height = 300; }
    this.mm = mm ? mm.getContext('2d') : null;

    this.el.dialogue?.addEventListener('click', () => this.advanceDialogue());
  }

  hideLoading() {
    const l = this.el.loading;
    if (!l) return;
    l.classList.add('out');
    setTimeout(() => l.classList.add('hidden'), 520);
  }

  showHud() {
    this.el.hud?.classList.remove('hidden');
  }

  hideTitle() {
    this.el.title?.classList.add('hidden');
  }

  startPresentation() {
    this.showHud();
    this.hideTitle();
  }

  showToast(text, kind = '') {
    const t = this.el.toast;
    if (!t) return;
    t.textContent = text;
    t.className = 'toast show ' + (kind || '');
    this.toastTimer = kind === 'gold' ? 4 : 3.2;
  }

  showArea(name, subtitle = '') {
    const a = this.el.areaLabel;
    const n = this.el.areaName;
    if (!a || !n) return;
    n.innerHTML = `${name}${subtitle ? `<small>${subtitle}</small>` : ''}`;
    a.classList.add('show');
    this.areaTimer = 3.1;
  }

  showDialogue({ name, lines, portrait = 'R', onDone = null }) {
    this.dialogue = { name, lines, index: 0, onDone, shown: 0, full: lines[0] || '', finished: false };
    const d = this.el.dialogue;
    if (!d) return;
    d.classList.remove('hidden');
    this.el.dlgName.textContent = name;
    this.el.dlgPortrait.textContent = portrait;
    this.el.dlgText.textContent = '';
  }

  get dialogueOpen() {
    return !!this.dialogue;
  }

  advanceDialogue() {
    const d = this.dialogue;
    if (!d) return;
    if (d.shown < d.full.length) {
      d.shown = d.full.length;
      this.el.dlgText.textContent = d.full;
      return;
    }
    d.index++;
    if (d.index >= d.lines.length) {
      this.dialogue = null;
      this.el.dialogue?.classList.add('hidden');
      const cb = d.onDone;
      if (cb) cb();
      return;
    }
    d.full = d.lines[d.index];
    d.shown = 0;
    this.el.dlgText.textContent = '';
  }

  update(dt) {
    if (this.dialogue) {
      const d = this.dialogue;
      if (d.shown < d.full.length) {
        d.shown = Math.min(d.full.length, d.shown + dt * 58);
        this.el.dlgText.textContent = d.full.slice(0, Math.floor(d.shown));
      } else {
        this.el.dlgText.textContent = d.full;
      }
    }
    if (this.toastTimer > 0) {
      this.toastTimer -= dt;
      if (this.toastTimer <= 0) this.el.toast?.classList.remove('show');
    }
    if (this.areaTimer > 0) {
      this.areaTimer -= dt;
      if (this.areaTimer <= 0) this.el.areaLabel?.classList.remove('show');
    }
  }

  sync(game) {
    const p = game.player;
    if (!p) return;
    const hpPct = clamp((p.hp / p.maxHp) * 100, 0, 100);
    const mpPct = clamp((p.mana / p.maxMana) * 100, 0, 100);
    if (this.el.hpFill) this.el.hpFill.style.width = hpPct + '%';
    if (this.el.hpText) this.el.hpText.textContent = `${Math.ceil(p.hp)} / ${Math.round(p.maxHp)}`;
    if (this.el.mpFill) this.el.mpFill.style.width = mpPct + '%';
    if (this.el.mpText) this.el.mpText.textContent = `${Math.ceil(p.mana)} / ${Math.round(p.maxMana)}`;
    if (this.el.essence) this.el.essence.textContent = p.essence;

    const info = game.questInfo();
    const key = info.title + '|' + info.objective;
    if (key !== this.lastQuest) {
      this.lastQuest = key;
      if (this.el.questTitle) this.el.questTitle.textContent = info.title;
      if (this.el.questObjective) this.el.questObjective.innerHTML = info.objective;
    }

    const prompt = game.promptForUi();
    const showPrompt = !!prompt && !this.dialogue && !game.dead && !game.finished && !game.paused;
    if (this.el.prompt) {
      this.el.prompt.classList.toggle('hidden', !showPrompt);
      if (showPrompt) {
        this.el.promptText.textContent = prompt.label;
      }
    }

    const boss = game.bossInfo();
    if (boss) {
      this.bossVisible = true;
      this.el.bossBar?.classList.remove('hidden');
      if (this.el.bossFill) this.el.bossFill.style.width = clamp(boss.hp / boss.maxHp * 100, 0, 100) + '%';
      if (this.el.bossName) this.el.bossName.textContent = boss.name;
    } else if (this.bossVisible) {
      this.bossVisible = false;
      this.el.bossBar?.classList.add('hidden');
    }

    if (this.el.burstBtn) {
      this.el.burstBtn.classList.toggle('cooldown', p.burstCd > 0.05);
    }
    if (this.el.throwBtn) {
      this.el.throwBtn.classList.toggle('cooldown', p.mana < 9);
    }

    this.minimapAcc += 1;
    if (this.minimapAcc >= 2) {
      this.minimapAcc = 0;
      this.drawMinimap(game);
    }
  }

  drawMinimap(game) {
    const ctx = this.mm;
    if (!ctx) return;
    const W = 400, H = 300;
    const sx = W / 5600;
    const sy = H / 4200;
    ctx.clearRect(0, 0, W, H);
    ctx.drawImage(game.world.minimapBase, 0, 0, W, H);
    // Soft vignette.
    const vg = ctx.createRadialGradient(W / 2, H / 2, 90, W / 2, H / 2, 250);
    vg.addColorStop(0, 'rgba(0,0,0,0)');
    vg.addColorStop(1, 'rgba(4,8,5,0.55)');
    ctx.fillStyle = vg;
    ctx.fillRect(0, 0, W, H);

    // Landmarks.
    const mark = (x, y, color, r = 4) => {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(x * sx, y * sy, r, 0, Math.PI * 2);
      ctx.fill();
    };
    mark(VILLAGE.x, VILLAGE.y, 'rgba(238,204,140,0.9)', 5);
    mark(CAVE.x, CAVE.y, 'rgba(116,186,206,0.9)', 4.5);
    mark(FOREST.x, FOREST.y, 'rgba(108,150,92,0.85)', 5);
    mark(POND.x, POND.y, 'rgba(101,158,166,0.8)', 3.5);

    // Enemies.
    for (const e of game.enemies) {
      if (e.dead) continue;
      if (e.isBoss) {
        mark(e.x, e.y, 'rgba(238,138,70,0.95)', 5);
      } else {
        ctx.fillStyle = e.type === 'gloom' ? 'rgba(186,128,214,0.85)' : e.type === 'bat' ? 'rgba(170,140,214,0.8)' : 'rgba(208,154,104,0.85)';
        ctx.beginPath();
        ctx.arc(e.x * sx, e.y * sy, 2.2, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Objective diamond.
    const obj = game.objective();
    if (obj) {
      const ox = obj.x * sx;
      const oy = obj.y * sy;
      const pulse = 0.6 + Math.sin(game.time * 3) * 0.3;
      ctx.save();
      ctx.translate(ox, oy);
      ctx.rotate(Math.PI / 4);
      ctx.fillStyle = `rgba(246,206,124,${pulse})`;
      ctx.fillRect(-5, -5, 10, 10);
      ctx.strokeStyle = 'rgba(36,28,16,0.8)';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(-5, -5, 10, 10);
      ctx.restore();
    }

    // Player arrow.
    const px = game.player.x * sx;
    const py = game.player.y * sy;
    ctx.save();
    ctx.translate(px, py);
    ctx.rotate(game.player.facing + Math.PI / 2);
    ctx.fillStyle = '#f8e7bd';
    ctx.beginPath();
    ctx.moveTo(0, -7);
    ctx.lineTo(5, 5);
    ctx.lineTo(0, 2);
    ctx.lineTo(-5, 5);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = 'rgba(30,24,14,0.8)';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();

    // Compass letter.
    ctx.fillStyle = 'rgba(239,213,158,0.9)';
    ctx.font = '600 13px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('N', W - 18, 20);
  }

  showBoss(show = true) {
    this.bossVisible = show;
    this.el.bossBar?.classList.toggle('hidden', !show);
  }

  showDeath() {
    this.el.death?.classList.remove('hidden');
    this.el.prompt?.classList.add('hidden');
  }

  hideDeath() {
    this.el.death?.classList.add('hidden');
  }

  showVictory(stats, playTime, essence) {
    this.el.victory?.classList.remove('hidden');
    if (this.el.victoryStats) {
      this.el.victoryStats.innerHTML = `
        <div><b>${stats.kills}</b><span>creatures felled</span></div>
        <div><b>${formatTime(playTime)}</b><span>time in the valley</span></div>
        <div><b>${essence}</b><span>earth essence</span></div>
        <div><b>${stats.shrines}</b><span>shrine blessings</span></div>`;
    }
  }

  hideVictory() {
    this.el.victory?.classList.add('hidden');
  }

  setPaused(paused) {
    this.el.pause?.classList.toggle('hidden', !paused);
    if (paused) this.el.prompt?.classList.add('hidden');
  }

  setMuted(muted) {
    if (!this.el.mute) return;
    this.el.mute.classList.toggle('muted', muted);
    const span = this.el.mute.querySelector('.sound-on');
    if (span) span.textContent = muted ? '✕' : '♪';
    this.el.mute.setAttribute('aria-label', muted ? 'Unmute sound' : 'Mute sound');
  }
}
