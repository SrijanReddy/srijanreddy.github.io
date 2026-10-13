class ParticleSystem {
  constructor() {
    this.particles = [];
  }

  // Spawn thrust exhaust from lander nozzle position
  spawnThrust(x, y, angle, count = 4) {
    for (let i = 0; i < count; i++) {
      const spread = (Math.random() - 0.5) * 0.8;
      const speed  = 1.5 + Math.random() * 2;
      // Exhaust goes opposite to thrust direction (away from nozzle)
      const ax = -Math.sin(angle) + spread;
      const ay =  Math.cos(angle) + spread;
      this.particles.push({
        x, y,
        vx: ax * speed,
        vy: ay * speed,
        life:  1.0,
        decay: 0.06 + Math.random() * 0.06,
        color: Math.random() < 0.5 ? CONFIG.COLOR_FLAME : CONFIG.COLOR_FLAME_CORE,
        size:  1 + Math.floor(Math.random() * 2),
      });
    }
  }

  // Spawn explosion debris burst
  spawnExplosion(x, y, count = 28) {
    for (let i = 0; i < count; i++) {
      const a     = Math.random() * Math.PI * 2;
      const speed = 1 + Math.random() * 4;
      this.particles.push({
        x, y,
        vx: Math.cos(a) * speed,
        vy: Math.sin(a) * speed,
        life:  1.0,
        decay: 0.025 + Math.random() * 0.03,
        color: Math.random() < 0.4 ? CONFIG.COLOR_FLAME_CORE : CONFIG.COLOR_FLAME,
        size:  2 + Math.floor(Math.random() * 3),
      });
    }
  }

  update() {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x    += p.vx;
      p.y    += p.vy;
      p.vy   += CONFIG.GRAVITY * 0.3; // slight gravity on particles
      p.life -= p.decay;
      if (p.life <= 0) this.particles.splice(i, 1);
    }
  }

  draw(ctx) {
    const ss = CONFIG.SPRITE_SCALE;
    for (const p of this.particles) {
      ctx.globalAlpha = Math.max(0, p.life);
      ctx.fillStyle   = p.color;
      ctx.fillRect(Math.round(p.x), Math.round(p.y), p.size * ss, p.size * ss);
    }
    ctx.globalAlpha = 1;
  }

  clear() {
    this.particles = [];
  }
}
