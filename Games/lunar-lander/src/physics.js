class Physics {
  constructor() {
    this.gravityMultiplier = 1.0;
    this.windStrength = 0.5;
    this.wind = { phase: 0, force: 0 };
    this.reset();
  }

  reset() {
    this.x     = CONFIG.LANDER_START_X;
    this.y     = CONFIG.LANDER_START_Y;
    this.vx    = 0;
    this.vy    = 0;
    this.angle = 0;   // radians; 0 = upright
    this.fuel  = CONFIG.FUEL_CAPACITY;
    this.thrustActive = false;
    this.retroActive  = false;
  }

  // dt: number of frames elapsed (1 at 60fps)
  update(input, dt = 1) {
    this.thrustActive = false;
    this.retroActive  = false;

    const hasFuel = this.fuel > 0;

    // Rotation
    if (input.keys.left && hasFuel) {
      this.angle -= CONFIG.ROTATE_SPEED * dt;
      this.fuel  -= CONFIG.FUEL_ROTATE_RATE * dt;
    }
    if (input.keys.right && hasFuel) {
      this.angle += CONFIG.ROTATE_SPEED * dt;
      this.fuel  -= CONFIG.FUEL_ROTATE_RATE * dt;
    }
    this.fuel = Math.max(0, this.fuel);

    // Clamp angle to [-π, π]
    this.angle = ((this.angle + Math.PI) % (2 * Math.PI)) - Math.PI;

    // Main thrust (Space)
    if (input.keys.thrust && hasFuel) {
      this.vx += Math.sin(this.angle) * CONFIG.THRUST_FORCE * dt;
      this.vy -= Math.cos(this.angle) * CONFIG.THRUST_FORCE * dt;
      this.fuel -= CONFIG.FUEL_THRUST_RATE * dt;
      this.thrustActive = true;
    }

    // Retro boost (W) — always upward
    if (input.keys.retro && hasFuel) {
      this.vy -= CONFIG.RETRO_FORCE * dt;
      this.fuel -= CONFIG.FUEL_RETRO_RATE * dt;
      this.retroActive = true;
    }
    this.fuel = Math.max(0, this.fuel);

    // Wind
    this.wind.phase += (2 * Math.PI / CONFIG.WIND_PERIOD) * dt;
    this.wind.force = Math.sin(this.wind.phase) * CONFIG.WIND_BASE * this.windStrength;
    this.vx += this.wind.force * dt;

    // Gravity
    this.vy += CONFIG.GRAVITY * this.gravityMultiplier * dt;

    // Integrate position
    this.x += this.vx * dt;
    this.y += this.vy * dt;

    // Wrap horizontally
    if (this.x < 0) this.x += CONFIG.W;
    if (this.x > CONFIG.W) this.x -= CONFIG.W;
  }

  // Check collision against terrain points array.
  // Returns: { result: 'none'|'land'|'crash', pad: pad|null }
  checkCollision(terrainPoints, pads) {
    const col = Math.floor((this.x / CONFIG.W) * CONFIG.TERRAIN_COLS);
    const idx = Math.max(0, Math.min(col, terrainPoints.length - 1));
    const groundY = terrainPoints[idx].y;
    // Approximate lander bottom: center y + half of sprite height in pixels
    const landerBottom = this.y + (11 * CONFIG.SPRITE_SCALE) / 2;

    if (landerBottom < groundY) return { result: 'none', pad: null };

    // Find if we're over a pad
    const pad = pads.find(p => this.x >= p.x && this.x <= p.x + p.width) || null;

    const safeLanding = pad &&
      this.vy <= CONFIG.MAX_LAND_V_SPEED &&
      Math.abs(this.angle) <= CONFIG.MAX_LAND_ANGLE;

    return { result: safeLanding ? 'land' : 'crash', pad };
  }

  // Check collision against obstacles. Returns true if hit.
  checkObstacleCollision(obstacles) {
    const hw = (9 * CONFIG.SPRITE_SCALE) / 2;
    const hh = (11 * CONFIG.SPRITE_SCALE) / 2;
    for (const o of obstacles) {
      if (o.type === 'rock') {
        const dx = this.x - o.x, dy = this.y - o.y;
        if (Math.sqrt(dx * dx + dy * dy) < hw * 0.7 + o.r) return true;
      } else if (o.type === 'satellite') {
        if (this.x > o.x - hw && this.x < o.x + o.w + hw &&
            this.y > o.y - hh && this.y < o.y + o.h + hh) return true;
      }
    }
    return false;
  }

  setDifficulty(scale) {
    this.gravityMultiplier = 0.8 + scale * 0.7;    // 0.8 → 1.5
    this.windStrength      = 0.5 + scale * 1.5;    // 0.5 → 2.0
  }
}
