// Keyboard, mouse and touch input. Touch uses a dynamic left-thumb stick,
// a right-half aim drag, and two action buttons.
export class Input {
  constructor(canvas) {
    this.canvas = canvas;
    this.keys = new Set();
    this.pressed = new Set();
    this.mouse = { x: window.innerWidth / 2, y: window.innerHeight / 2, down: false, seen: false };
    this.touchThrowHeld = false;
    this.burstQueued = false;
    this.throwQueue = 0;
    this.aimTouch = null;
    this.lastAimDir = { x: 1, y: 0 };
    this.facing = { x: 1, y: 0 };

    this.joy = { active: false, pointer: null, ox: 0, oy: 0, dx: 0, dy: 0, mag: 0 };
    this.coarse = window.matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    this.touchMode = this.coarse || window.innerWidth < 820;
    if (this.touchMode) document.body.classList.add('touch-ui');
    if (this.coarse) document.body.classList.add('coarse');

    this.bind();
  }

  bind() {
    window.addEventListener('keydown', (e) => {
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(e.code)) e.preventDefault();
      if (!this.keys.has(e.code)) this.pressed.add(e.code);
      this.keys.add(e.code);
    });
    window.addEventListener('keyup', (e) => {
      this.keys.delete(e.code);
    });
    window.addEventListener('blur', () => {
      this.keys.clear();
      this.mouse.down = false;
      this.touchThrowHeld = false;
      this.resetJoystick();
    });

    window.addEventListener('mousemove', (e) => {
      this.mouse.x = e.clientX;
      this.mouse.y = e.clientY;
      this.mouse.seen = true;
    });
    window.addEventListener('mousedown', (e) => {
      if (e.target === this.canvas && e.button === 0) this.mouse.down = true;
    });
    window.addEventListener('mouseup', (e) => {
      if (e.button === 0) this.mouse.down = false;
    });
    window.addEventListener('contextmenu', (e) => e.preventDefault());

    const c = this.canvas;
    c.addEventListener('pointerdown', (e) => {
      if (e.pointerType === 'mouse') {
        if (e.button === 0) this.mouse.down = true;
        this.mouse.x = e.clientX;
        this.mouse.y = e.clientY;
        this.mouse.seen = true;
        return;
      }
      // Touch aim on the right half of the world.
      if (e.clientX < window.innerWidth * 0.4) return;
      e.preventDefault();
      this.aimTouch = { id: e.pointerId, sx: e.clientX, sy: e.clientY, x: e.clientX, y: e.clientY, moved: false };
      try { c.setPointerCapture(e.pointerId); } catch {}
    });
    c.addEventListener('pointermove', (e) => {
      if (e.pointerType === 'mouse') {
        this.mouse.x = e.clientX;
        this.mouse.y = e.clientY;
        return;
      }
      if (!this.aimTouch || this.aimTouch.id !== e.pointerId) return;
      e.preventDefault();
      const a = this.aimTouch;
      a.x = e.clientX;
      a.y = e.clientY;
      const dx = a.x - a.sx;
      const dy = a.y - a.sy;
      if (Math.hypot(dx, dy) > 12) a.moved = true;
      if (a.moved) {
        const l = Math.hypot(dx, dy) || 1;
        this.lastAimDir = { x: dx / l, y: dy / l };
      }
    });
    const endAim = (e) => {
      if (this.aimTouch && this.aimTouch.id === e.pointerId) {
        const a = this.aimTouch;
        if (a.moved) {
          const dx = a.x - a.sx;
          const dy = a.y - a.sy;
          const l = Math.hypot(dx, dy) || 1;
          this.lastAimDir = { x: dx / l, y: dy / l };
        }
        this.throwQueue = Math.min(2, this.throwQueue + 1);
        this.aimTouch = null;
      }
    };
    c.addEventListener('pointerup', endAim);
    c.addEventListener('pointercancel', (e) => {
      if (this.aimTouch && this.aimTouch.id === e.pointerId) this.aimTouch = null;
    });

    this.bindJoystick();
    this.bindButtons();
  }

  bindJoystick() {
    const zone = document.getElementById('joy-zone');
    const base = document.getElementById('joy-base');
    const knob = document.getElementById('joy-knob');
    if (!zone || !base || !knob) return;
    const radius = 46;
    const start = (e) => {
      if (e.pointerType === 'mouse') return;
      e.preventDefault();
      this.joy.active = true;
      this.joy.pointer = e.pointerId;
      this.joy.ox = e.clientX;
      this.joy.oy = e.clientY;
      base.style.left = e.clientX + 'px';
      base.style.top = e.clientY + 'px';
      base.style.display = 'block';
      document.body.classList.add('joystick-active');
      knob.style.transform = 'translate(0px, 0px)';
      try { zone.setPointerCapture(e.pointerId); } catch {}
    };
    const move = (e) => {
      if (!this.joy.active || this.joy.pointer !== e.pointerId) return;
      e.preventDefault();
      let dx = e.clientX - this.joy.ox;
      let dy = e.clientY - this.joy.oy;
      const d = Math.hypot(dx, dy);
      if (d > radius) {
        dx = (dx / d) * radius;
        dy = (dy / d) * radius;
      }
      this.joy.dx = dx / radius;
      this.joy.dy = dy / radius;
      this.joy.mag = Math.min(1, d / radius);
      knob.style.transform = `translate(${dx}px, ${dy}px)`;
    };
    const end = (e) => {
      if (this.joy.pointer !== e.pointerId) return;
      this.resetJoystick();
    };
    zone.addEventListener('pointerdown', start);
    zone.addEventListener('pointermove', move);
    zone.addEventListener('pointerup', end);
    zone.addEventListener('pointercancel', end);
  }

  resetJoystick() {
    this.joy.active = false;
    this.joy.pointer = null;
    this.joy.dx = 0;
    this.joy.dy = 0;
    this.joy.mag = 0;
    const base = document.getElementById('joy-base');
    if (base) base.style.display = 'none';
    document.body.classList.remove('joystick-active');
  }

  bindButtons() {
    const throwBtn = document.getElementById('btn-throw');
    const burstBtn = document.getElementById('btn-burst');
    if (throwBtn) {
      const on = (e) => {
        e.preventDefault();
        this.touchThrowHeld = true;
        this.autoAim = true;
      };
      const off = (e) => {
        e.preventDefault();
        this.touchThrowHeld = false;
      };
      throwBtn.addEventListener('pointerdown', on);
      throwBtn.addEventListener('pointerup', off);
      throwBtn.addEventListener('pointercancel', off);
      throwBtn.addEventListener('pointerleave', off);
    }
    if (burstBtn) {
      burstBtn.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        this.burstQueued = true;
      });
    }
  }

  justPressed(code) {
    return this.pressed.has(code);
  }

  consumePressed(code) {
    if (!this.pressed.has(code)) return false;
    this.pressed.delete(code);
    return true;
  }

  getMove() {
    let x = 0;
    let y = 0;
    if (this.keys.has('KeyA') || this.keys.has('ArrowLeft')) x -= 1;
    if (this.keys.has('KeyD') || this.keys.has('ArrowRight')) x += 1;
    if (this.keys.has('KeyW') || this.keys.has('ArrowUp')) y -= 1;
    if (this.keys.has('KeyS') || this.keys.has('ArrowDown')) y += 1;
    if (this.joy.active) {
      x += this.joy.dx;
      y += this.joy.dy;
    }
    const len = Math.hypot(x, y);
    if (len > 1) { x /= len; y /= len; }
    if (len > 0.01) this.facing = { x: x / (len || 1), y: y / (len || 1) };
    return { x, y, mag: Math.min(1, len) };
  }

  isThrowing() {
    return this.mouse.down || this.touchThrowHeld;
  }

  consumeThrowQueue() {
    if (this.throwQueue <= 0) return false;
    this.throwQueue--;
    return true;
  }

  consumeBurst() {
    if (!this.burstQueued) return false;
    this.burstQueued = false;
    return true;
  }

  aimMode() {
    if (this.aimTouch) return 'touch';
    if (this.touchThrowHeld) return 'auto';
    return 'mouse';
  }

  endFrame() {
    this.pressed.clear();
  }
}
