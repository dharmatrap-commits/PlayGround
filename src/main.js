import { World } from './world.js';
import { Game } from './game.js';
import { UI } from './ui.js';
import { Input } from './input.js';
import { Renderer } from './render.js';
import { AudioEngine } from './audio.js';

const canvas = document.getElementById('game');
const audio = new AudioEngine();
let world;
let game;
let ui;
let input;
let renderer;
let last = 0;
let muted = false;

function boot() {
  const t0 = performance.now();
  world = new World();
  game = new Game(world, audio);
  ui = new UI(game);
  input = new Input(canvas);
  renderer = new Renderer(canvas, world);
  renderer.resize(game);

  // Keep the simulation viewport in sync with the window and visual canvas.
  window.addEventListener('resize', () => renderer.resize(game));
  window.addEventListener('orientationchange', () => {
    setTimeout(() => renderer.resize(game), 120);
  });

  ui.hideLoading();
  ui.setMuted(muted);

  const startBtn = document.getElementById('start-btn');
  startBtn?.addEventListener('click', () => {
    audio.start();
    game.start();
    ui.startPresentation();
    canvas.focus?.();
    last = performance.now();
  });

  document.getElementById('btn-mute')?.addEventListener('click', toggleMute);
  document.getElementById('btn-pause')?.addEventListener('click', () => {
    if (!game.started || game.dead || game.finished) return;
    setPaused(!game.paused);
  });
  document.getElementById('resume-btn')?.addEventListener('click', () => setPaused(false));
  document.getElementById('respawn-btn')?.addEventListener('click', () => {
    if (!game.dead) return;
    game.respawn();
  });
  document.getElementById('again-btn')?.addEventListener('click', () => {
    game.newRun(true);
    ui.hideVictory();
    ui.hideDeath();
    ui.setPaused(false);
    ui.startPresentation();
    audio.start();
    audio.play('quest');
  });

  document.getElementById('dialogue')?.addEventListener('click', () => ui.advanceDialogue());
  document.getElementById('interact')?.addEventListener('click', () => game.interact());

  document.addEventListener('pointerdown', () => audio.start(), { once: true });

  document.addEventListener('visibilitychange', () => {
    if (document.hidden && game.started && !game.dead && !game.finished) setPaused(true);
  });

  requestAnimationFrame(loop);

  // Small inspection handle for debugging and automated smoke tests.
  window.__valley = { game, world, ui, input, renderer, audio };
  console.log(`Valley of Stone ready in ${Math.round(performance.now() - t0)}ms`);
}

function toggleMute() {
  muted = !muted;
  audio.setMuted(muted);
  ui.setMuted(muted);
  if (!muted) audio.start();
}

function setPaused(paused) {
  if (game.finished || game.dead) return;
  game.paused = paused;
  ui.setPaused(paused);
  if (!paused) last = performance.now();
}

function handleShortcuts() {
  // Dialogue takes priority over gameplay hotkeys.
  if (ui.dialogueOpen) {
    if (input.consumePressed('KeyE') || input.consumePressed('Enter') || input.consumePressed('Space')) {
      ui.advanceDialogue();
    }
    // Swallow pause/mute while reading.
    input.consumePressed('Escape');
    input.consumePressed('KeyP');
    return;
  }

  if (input.consumePressed('KeyM')) toggleMute();

  if (input.consumePressed('Escape') || input.consumePressed('KeyP')) {
    if (game.started && !game.dead && !game.finished) setPaused(!game.paused);
  }

  if (input.consumePressed('KeyR') && game.dead) {
    game.respawn();
  }

  if (input.consumePressed('Enter') && game.finished) {
    game.newRun(true);
    ui.hideVictory();
    ui.startPresentation();
    audio.start();
  }
}

function loop(now) {
  requestAnimationFrame(loop);
  const dt = Math.min(0.05, Math.max(0, (now - last) / 1000 || 0));
  last = now;

  if (!world) return;

  handleShortcuts();

  const active = game.started && !game.paused && !game.dead && !game.finished && !ui.dialogueOpen;
  game.update(dt, input, active);
  renderer.render(game, game.time);
  ui.sync(game);
  ui.update(dt);
  input.endFrame();
}

// Let the loading screen paint before the (synchronous) world build.
requestAnimationFrame(() => setTimeout(boot, 20));
