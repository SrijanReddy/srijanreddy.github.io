class SpriteSheet {
  constructor() {
    this.frames = {};
    this._build();
  }

  _pixel(ctx, col, row, colorCode, scale) {
    const colors = {
      1: CONFIG.COLOR_LANDER,
      2: '#003300',
      3: CONFIG.COLOR_WINDOW,
      4: CONFIG.COLOR_FLAME,
      5: CONFIG.COLOR_FLAME_CORE,
    };
    if (!colors[colorCode]) return;
    ctx.fillStyle = colors[colorCode];
    ctx.fillRect(col * scale, row * scale, scale, scale);
  }

  _makeCanvas(w, h) {
    const c = document.createElement('canvas');
    c.width  = w * CONFIG.SPRITE_SCALE;
    c.height = h * CONFIG.SPRITE_SCALE;
    return c;
  }

  // Draw the 9×10 lander body (no flame) onto ctx at sprite scale s
  _drawLanderBody(ctx, s) {
    // Row 0: cap peak
    [[3,1],[4,1],[5,1]].forEach(([c,v]) => this._pixel(ctx,c,0,v,s));
    // Row 1: upper hull
    [[2,1],[3,1],[4,1],[5,1],[6,1]].forEach(([c,v]) => this._pixel(ctx,c,1,v,s));
    // Row 2: window
    [[1,1],[2,1],[3,3],[4,3],[5,3],[6,1],[7,1]].forEach(([c,v]) => this._pixel(ctx,c,2,v,s));
    // Row 3: window lower
    [[0,1],[1,1],[2,1],[3,3],[4,3],[5,3],[6,1],[7,1],[8,1]].forEach(([c,v]) => this._pixel(ctx,c,3,v,s));
    // Row 4: main body
    for (let c = 0; c < 9; c++) this._pixel(ctx,c,4,1,s);
    // Row 5: main body
    for (let c = 0; c < 9; c++) this._pixel(ctx,c,5,1,s);
    // Row 6: lower hull taper
    [[1,1],[2,1],[3,1],[4,1],[5,1],[6,1],[7,1]].forEach(([c,v]) => this._pixel(ctx,c,6,v,s));
    // Row 7: thruster nozzle + leg roots
    [[2,2],[3,2],[4,2],[5,2],[6,2]].forEach(([c,v]) => this._pixel(ctx,c,7,v,s));
    [[0,1],[8,1]].forEach(([c,v]) => this._pixel(ctx,c,7,v,s));
    // Row 8: legs spread
    [[0,1],[8,1]].forEach(([c,v]) => this._pixel(ctx,c,8,v,s));
    // Row 9: feet pads
    [[0,1],[1,1],[7,1],[8,1]].forEach(([c,v]) => this._pixel(ctx,c,9,v,s));
  }

  _build() {
    const s = CONFIG.SPRITE_SCALE;

    // IDLE frame — 9×10 body
    {
      const c = this._makeCanvas(9, 10);
      this._drawLanderBody(c.getContext('2d'), s);
      this.frames.idle = c;
    }

    // THRUST MAIN — body + 3 flame rows below nozzle
    {
      const c = this._makeCanvas(9, 14);
      const ctx = c.getContext('2d');
      this._drawLanderBody(ctx, s);
      // Row 10: wide flame base
      [[3,4],[4,5],[5,4]].forEach(([col,v]) => this._pixel(ctx,col,10,v,s));
      // Row 11: mid flame
      [[3,4],[4,4],[5,4]].forEach(([col,v]) => this._pixel(ctx,col,11,v,s));
      // Row 12: flame tip
      this._pixel(ctx,4,12,5,s);
      this._pixel(ctx,4,13,4,s);
      this.frames.thrust = c;
    }

    // THRUST LEFT (rotate left = right side jet fires)
    {
      const c = this._makeCanvas(12, 10);
      const ctx = c.getContext('2d');
      this._drawLanderBody(ctx, s);
      // Side jet on right (cols 9-11, row 5)
      this._pixel(ctx,9,5,4,s);
      this._pixel(ctx,10,5,5,s);
      this._pixel(ctx,11,5,4,s);
      this.frames.thrustLeft = c;
    }

    // THRUST RIGHT (rotate right = left side jet fires)
    {
      const c = this._makeCanvas(12, 10);
      const ctx = c.getContext('2d');
      ctx.save();
      ctx.translate(3 * s, 0);
      this._drawLanderBody(ctx, s);
      ctx.restore();
      // Side jet on left (cols 0-2 of the 12-wide canvas, row 5)
      this._pixel(ctx,0,5,4,s);
      this._pixel(ctx,1,5,5,s);
      this._pixel(ctx,2,5,4,s);
      this.frames.thrustRight = c;
    }

    // EXPLOSION — 6 frames of expanding debris ring
    this.frames.explosion = [];
    for (let f = 0; f < 6; f++) {
      const size = 9 + f * 5;
      const c = this._makeCanvas(size, size);
      const ctx = c.getContext('2d');
      const cx = (size / 2) * s;
      const cy = (size / 2) * s;
      const r  = (3 + f * 4) * s;
      const dots = 8 + f * 3;
      for (let d = 0; d < dots; d++) {
        const a  = (d / dots) * Math.PI * 2;
        const px = cx + Math.cos(a) * r;
        const py = cy + Math.sin(a) * r;
        ctx.fillStyle = f < 3 ? CONFIG.COLOR_FLAME_CORE : CONFIG.COLOR_FLAME;
        ctx.fillRect(Math.round(px) - s, Math.round(py) - s, s * 2, s * 2);
      }
      // Inner core flash on early frames
      if (f < 2) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(cx - s, cy - s, s * 2, s * 2);
      }
      this.frames.explosion.push(c);
    }
  }

  getFrame(name, explodeFrame = 0) {
    if (name === 'explosion') return this.frames.explosion[Math.min(explodeFrame, 5)];
    return this.frames[name] || this.frames.idle;
  }
}
