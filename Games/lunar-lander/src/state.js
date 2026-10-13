const STATE = {
  MENU:     'MENU',
  PLAYING:  'PLAYING',
  LANDED:   'LANDED',
  CRASHED:  'CRASHED',
  GAME_OVER: 'GAME_OVER',
};

class StateMachine {
  constructor() {
    this.current   = STATE.MENU;
    this.prev      = null;
    this._handlers = {};
  }

  on(state, { enter, update, render }) {
    this._handlers[state] = {
      enter:  enter  || (() => {}),
      update: update || (() => {}),
      render: render || (() => {}),
    };
  }

  transition(next) {
    this.prev    = this.current;
    this.current = next;
    const h = this._handlers[next];
    if (h && h.enter) h.enter();
  }

  update(dt) {
    const h = this._handlers[this.current];
    if (h) h.update(dt);
  }

  render() {
    const h = this._handlers[this.current];
    if (h) h.render();
  }
}

class GameLoop {
  constructor(stateMachine) {
    this.sm    = stateMachine;
    this._raf  = null;
    this._last = 0;
  }

  start() {
    this._last = performance.now();
    this._raf  = requestAnimationFrame(ts => this._tick(ts));
  }

  stop() {
    if (this._raf) { cancelAnimationFrame(this._raf); this._raf = null; }
  }

  _tick(ts) {
    const elapsed = ts - this._last;
    this._last    = ts;

    // Fixed timestep: how many 60fps frames elapsed (max 3 to prevent spiral of death)
    const steps = Math.min(Math.max(1, Math.round(elapsed / (1000 / 60))), 3);
    for (let i = 0; i < steps; i++) this.sm.update(1);
    this.sm.render();

    this._raf = requestAnimationFrame(t => this._tick(t));
  }
}
