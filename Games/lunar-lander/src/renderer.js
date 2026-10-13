class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx    = canvas.getContext('2d');
    canvas.width  = CONFIG.W;
    canvas.height = CONFIG.H;
    this.crtEnabled = true;
  }

  clear() {
    this.ctx.fillStyle = CONFIG.COLOR_BG;
    this.ctx.fillRect(0, 0, CONFIG.W, CONFIG.H);
  }

  drawTerrain(terrainData) {
    const { points, pads } = terrainData;
    const ctx = this.ctx;

    // Filled terrain body
    ctx.beginPath();
    ctx.moveTo(0, CONFIG.H);
    ctx.lineTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) ctx.lineTo(points[i].x, points[i].y);
    ctx.lineTo(CONFIG.W, CONFIG.H);
    ctx.closePath();
    ctx.fillStyle = CONFIG.COLOR_TERRAIN_FILL;
    ctx.fill();

    // Terrain outline
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) ctx.lineTo(points[i].x, points[i].y);
    ctx.strokeStyle = CONFIG.COLOR_TERRAIN;
    ctx.lineWidth   = 2;
    ctx.stroke();

    // Landing pads
    const labelSize = Math.round(6 * CONFIG.SPRITE_SCALE / 3);
    ctx.font      = `bold ${labelSize}px monospace`;
    ctx.textAlign = 'center';
    for (const pad of pads) {
      // Pad surface
      ctx.fillStyle = CONFIG.COLOR_PAD;
      ctx.fillRect(pad.x, pad.y - 2, pad.width, 4);
      // Blinking markers at pad edges
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(pad.x - 1, pad.y - 4, 3, 6);
      ctx.fillRect(pad.x + pad.width - 2, pad.y - 4, 3, 6);
      // Multiplier label above pad
      ctx.fillStyle   = CONFIG.COLOR_PAD;
      ctx.shadowColor = CONFIG.COLOR_PAD;
      ctx.shadowBlur  = 5;
      ctx.fillText(`\xD7${pad.multiplier}`, pad.x + pad.width / 2, pad.y - 10);
      ctx.shadowBlur = 0;
    }
    ctx.textAlign = 'left';
  }

  drawObstacles(obstacles) {
    const ctx = this.ctx;
    for (const o of obstacles) {
      if (o.type === 'rock') {
        ctx.fillStyle   = CONFIG.COLOR_OBSTACLE;
        ctx.strokeStyle = '#555';
        ctx.lineWidth   = 1;
        ctx.beginPath();
        ctx.arc(o.x, o.y, o.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      } else if (o.type === 'satellite') {
        // Body
        ctx.fillStyle = CONFIG.COLOR_SATELLITE;
        ctx.fillRect(o.x - o.w / 2, o.y - o.h / 2, o.w, o.h);
        // Solar panels
        ctx.fillStyle = '#334466';
        ctx.fillRect(o.x - o.w / 2 - 12, o.y - 2, 12, 4);
        ctx.fillRect(o.x + o.w / 2,       o.y - 2, 12, 4);
        // Antenna
        ctx.strokeStyle = CONFIG.COLOR_SATELLITE;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(o.x, o.y - o.h / 2);
        ctx.lineTo(o.x, o.y - o.h / 2 - 6);
        ctx.stroke();
      }
    }
  }

  drawLander(physics, sprites) {
    const ctx = this.ctx;
    let frameName = 'idle';
    if (physics.thrustActive) {
      frameName = 'thrust';
    } else if (physics.retroActive) {
      frameName = 'thrust'; // retro boost also shows main flame
    }

    const frame = sprites.getFrame(frameName);
    const sw = frame.width, sh = frame.height;

    ctx.save();
    ctx.translate(Math.round(physics.x), Math.round(physics.y));
    ctx.rotate(physics.angle);
    ctx.drawImage(frame, -sw / 2, -sh / 2);
    ctx.restore();
  }

  drawExplosion(x, y, frameIdx, sprites) {
    const img = sprites.getFrame('explosion', frameIdx);
    this.ctx.drawImage(img, Math.round(x - img.width / 2), Math.round(y - img.height / 2));
  }

  drawHUD(state) {
    // state: { score, lives, time, fuel, vy, vx, altitude, wind, gravity, seed }
    const ctx  = this.ctx;
    const s    = CONFIG.SPRITE_SCALE;
    const fs   = Math.round(6 * s / 3);   // font size ~6px at 1×
    const lh   = fs + 4;                   // line height

    ctx.font      = `${fs}px monospace`;
    ctx.shadowBlur = 3;

    const fuelPct = Math.max(0, state.fuel / CONFIG.FUEL_CAPACITY);

    // ── Left column ──────────────────────────────────────────────
    ctx.textAlign   = 'left';
    ctx.fillStyle   = CONFIG.COLOR_HUD;
    ctx.shadowColor = CONFIG.COLOR_HUD;
    let y = fs + 4;
    const lx = 10;

    ctx.fillText(`SCORE  ${state.score}`, lx, y); y += lh;

    // Lives as small triangle icons
    ctx.fillText('LIVES  ', lx, y);
    const lifeX = lx + ctx.measureText('LIVES  ').width;
    for (let i = 0; i < state.lives; i++) {
      ctx.fillText('\u25B2', lifeX + i * (fs + 2), y);
    }
    y += lh;

    // Timer MM:SS
    const totalSec = Math.floor(state.time / 60);
    const mm  = String(Math.floor(totalSec / 60)).padStart(2, '0');
    const ss2 = String(totalSec % 60).padStart(2, '0');
    ctx.fillText(`TIME   ${mm}:${ss2}`, lx, y); y += lh;
    ctx.fillText(`SEED   ${state.seed}`, lx, y);

    // ── Right column ─────────────────────────────────────────────
    ctx.textAlign = 'right';
    const rx = CONFIG.W - 10;
    y = fs + 4;

    const alt   = Math.max(0, Math.round(state.altitude));
    const vSign = state.vy >= 0 ? '+' : '';
    const hSign = state.vx >= 0 ? '+' : '';
    // Convert px/frame to px/s for display (×60)
    const vspd  = (state.vy * 60).toFixed(1);
    const hspd  = (state.vx * 60).toFixed(1);

    ctx.fillStyle   = CONFIG.COLOR_HUD;
    ctx.shadowColor = CONFIG.COLOR_HUD;
    ctx.fillText(`ALT    ${alt}`, rx, y); y += lh;

    // V-speed: red if too fast for landing
    const vFast = Math.abs(state.vy) > CONFIG.MAX_LAND_V_SPEED;
    ctx.fillStyle   = vFast ? '#ff4444' : CONFIG.COLOR_HUD;
    ctx.shadowColor = ctx.fillStyle;
    ctx.fillText(`V-SPD  ${vSign}${vspd}`, rx, y); y += lh;

    ctx.fillStyle   = CONFIG.COLOR_HUD;
    ctx.shadowColor = CONFIG.COLOR_HUD;
    ctx.fillText(`H-SPD  ${hSign}${hspd}`, rx, y); y += lh;

    // Fuel bar
    const barCells   = 10;
    const filledCells = Math.round(fuelPct * barCells);
    const bar = '\u2588'.repeat(filledCells) + '\u2591'.repeat(barCells - filledCells);
    ctx.fillStyle   = fuelPct > 0.25 ? CONFIG.COLOR_HUD : '#ff4444';
    ctx.shadowColor = ctx.fillStyle;
    ctx.fillText(`FUEL   [${bar}]`, rx, y); y += lh;

    ctx.fillStyle   = CONFIG.COLOR_HUD;
    ctx.shadowColor = CONFIG.COLOR_HUD;

    // Wind direction arrow
    const wAbs = Math.abs(state.wind * 1000);
    const wDir = state.wind >= 0 ? '\u2192' : '\u2190';
    ctx.fillText(`WIND   ${wDir} ${wAbs.toFixed(1)}`, rx, y); y += lh;

    ctx.fillText(`GRAV   ${state.gravity.toFixed(2)}\xD7`, rx, y);

    ctx.shadowBlur = 0;
    ctx.textAlign  = 'left';
  }

  drawScreenFlash(color, alpha) {
    if (alpha <= 0) return;
    this.ctx.globalAlpha = Math.min(1, alpha);
    this.ctx.fillStyle   = color;
    this.ctx.fillRect(0, 0, CONFIG.W, CONFIG.H);
    this.ctx.globalAlpha = 1;
  }

  drawCRT() {
    if (!this.crtEnabled) return;
    const ctx = this.ctx;
    // Scanlines
    ctx.globalAlpha = 0.15;
    ctx.fillStyle   = '#000000';
    for (let y = 0; y < CONFIG.H; y += 3) {
      ctx.fillRect(0, y, CONFIG.W, 1);
    }
    ctx.globalAlpha = 1;
    // Vignette
    const grad = ctx.createRadialGradient(
      CONFIG.W / 2, CONFIG.H / 2, CONFIG.H * 0.28,
      CONFIG.W / 2, CONFIG.H / 2, CONFIG.H * 0.75,
    );
    grad.addColorStop(0, 'rgba(0,0,0,0)');
    grad.addColorStop(1, 'rgba(0,0,0,0.5)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, CONFIG.W, CONFIG.H);
  }

  toggleCRT() {
    this.crtEnabled = !this.crtEnabled;
  }
}
