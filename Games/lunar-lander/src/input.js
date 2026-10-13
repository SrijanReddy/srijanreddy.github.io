class InputHandler {
  constructor() {
    this.keys = {
      left: false,   // A
      right: false,  // D
      retro: false,  // W
      thrust: false, // Space
      crtToggle: false, // F — edge-triggered, reset each frame
    };
    this._crtPressed = false;
    window.addEventListener('keydown', e => this._onDown(e));
    window.addEventListener('keyup',   e => this._onUp(e));
  }

  _onDown(e) {
    switch (e.code) {
      case 'KeyA':     this.keys.left   = true; break;
      case 'KeyD':     this.keys.right  = true; break;
      case 'KeyW':     this.keys.retro  = true; break;
      case 'Space':    this.keys.thrust = true; e.preventDefault(); break;
      case 'KeyF':
        if (!this._crtPressed) { this.keys.crtToggle = true; this._crtPressed = true; }
        break;
    }
  }

  _onUp(e) {
    switch (e.code) {
      case 'KeyA':  this.keys.left   = false; break;
      case 'KeyD':  this.keys.right  = false; break;
      case 'KeyW':  this.keys.retro  = false; break;
      case 'Space': this.keys.thrust = false; break;
      case 'KeyF':  this._crtPressed = false; break;
    }
  }

  // Call once per frame after reading keys.crtToggle
  clearEdges() {
    this.keys.crtToggle = false;
  }
}
