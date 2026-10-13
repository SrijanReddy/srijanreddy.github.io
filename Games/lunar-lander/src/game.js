window.addEventListener('load', () => {
  const canvas    = document.getElementById('game');
  const input     = new InputHandler();
  const renderer  = new Renderer(canvas);
  const sprites   = new SpriteSheet();
  const particles = new ParticleSystem();
  const score     = new ScoreSystem();
  const sm        = new StateMachine();
  const loop      = new GameLoop(sm);

  let physics   = new Physics();
  let terrain   = null;
  let seed      = Math.floor(Math.random() * 99999);
  let runIndex  = 0;     // counts successful landings in this session
  let frameCount = 0;
  let lives     = CONFIG.LIVES_START;

  // Flash overlay
  let flashColor = '#000000', flashAlpha = 0;

  // Explosion animation state
  let explodeFrame = 0, explodeTimer = 0;

  // Landed overlay timer and points display
  let landedTimer = 0, lastEarned = 0;

  function difficultyScale() {
    return Math.min(runIndex / 10, 1.0);
  }

  function newTerrain() {
    terrain = TerrainGen.generate(seed, difficultyScale());
    physics.setDifficulty(difficultyScale());
  }

  function startRun() {
    physics.reset();
    particles.clear();
    newTerrain();
    frameCount  = 0;
    flashAlpha  = 0;
    explodeFrame = 0;
    explodeTimer = 0;
    sm.transition(STATE.PLAYING);
  }

  // ── MENU ──────────────────────────────────────────────────────────────────
  sm.on(STATE.MENU, {
    enter() {},
    update() {
      if (input.keys.thrust) {
        lives = CONFIG.LIVES_START;
        score.reset();
        runIndex = 0;
        seed = Math.floor(Math.random() * 99999);
        startRun();
      }
      if (input.keys.crtToggle) renderer.toggleCRT();
      input.clearEdges();
    },
    render() {
      renderer.clear();
      const ctx  = renderer.ctx;
      const cx   = CONFIG.W / 2;

      ctx.textAlign   = 'center';
      ctx.shadowColor = CONFIG.COLOR_HUD;

      ctx.font      = `bold ${CONFIG.SPRITE_SCALE * 8}px monospace`;
      ctx.fillStyle = CONFIG.COLOR_HUD;
      ctx.shadowBlur = 10;
      ctx.fillText('LUNAR LANDER', cx, CONFIG.H / 2 - 90);

      ctx.font      = `${CONFIG.SPRITE_SCALE * 4}px monospace`;
      ctx.shadowBlur = 5;
      ctx.fillText('PRESS SPACE TO LAUNCH', cx, CONFIG.H / 2 - 20);
      ctx.fillText(`HIGH SCORE: ${score.highScore}`, cx, CONFIG.H / 2 + 30);
      ctx.fillText(`SEED: ${seed}`, cx, CONFIG.H / 2 + 70);

      ctx.font      = `${CONFIG.SPRITE_SCALE * 3}px monospace`;
      ctx.fillStyle = '#009900';
      ctx.shadowBlur = 2;
      ctx.fillText('WASD ROTATE/BOOST  \u25A0 THRUST  F CRT', cx, CONFIG.H / 2 + 120);
      ctx.fillText('\u25A0 = SPACE', cx, CONFIG.H / 2 + 148);

      ctx.shadowBlur = 0;
      ctx.textAlign  = 'left';
      renderer.drawCRT();
    },
  });

  // ── PLAYING ────────────────────────────────────────────────────────────────
  sm.on(STATE.PLAYING, {
    update(dt) {
      frameCount++;

      if (input.keys.crtToggle) renderer.toggleCRT();
      input.clearEdges();

      // Move satellites
      for (const o of terrain.obstacles) {
        if (o.type === 'satellite') {
          o.x += o.vx * dt;
          if (o.x < -40) o.x = CONFIG.W + 40;
          if (o.x > CONFIG.W + 40) o.x = -40;
        }
      }

      physics.update(input, dt);

      // Spawn thrust exhaust from nozzle (below center in lander space)
      if (physics.thrustActive || physics.retroActive) {
        const nozzleOffset = 14 * CONFIG.SPRITE_SCALE / 2;
        const nx = physics.x + Math.sin(physics.angle) * nozzleOffset;
        const ny = physics.y + Math.cos(physics.angle) * nozzleOffset;
        particles.spawnThrust(nx, ny, physics.angle);
      }
      particles.update();

      // Flash decay
      if (flashAlpha > 0) flashAlpha = Math.max(0, flashAlpha - 0.025);

      // Collision checks
      const col = physics.checkCollision(terrain.points, terrain.pads);
      if (col.result === 'land') {
        lastEarned  = score.addLanding(col.pad, physics.vy, physics.fuel);
        flashColor  = '#003300';
        flashAlpha  = 0.6;
        landedTimer = 150;
        sm.transition(STATE.LANDED);
        return;
      }
      if (col.result === 'crash' || physics.checkObstacleCollision(terrain.obstacles)) {
        flashColor   = '#330000';
        flashAlpha   = 0.7;
        explodeFrame = 0;
        explodeTimer = 0;
        particles.spawnExplosion(physics.x, physics.y);
        sm.transition(STATE.CRASHED);
        return;
      }
    },
    render() {
      renderer.clear();
      renderer.drawTerrain(terrain);
      renderer.drawObstacles(terrain.obstacles);
      particles.draw(renderer.ctx);
      renderer.drawLander(physics, sprites);
      renderer.drawHUD({
        score:    score.score,
        lives,
        time:     frameCount,
        fuel:     physics.fuel,
        vy:       physics.vy,
        vx:       physics.vx,
        altitude: _altitude(),
        wind:     physics.wind.force,
        gravity:  physics.gravityMultiplier,
        seed,
      });
      renderer.drawScreenFlash(flashColor, flashAlpha);
      renderer.drawCRT();
    },
  });

  // ── LANDED ─────────────────────────────────────────────────────────────────
  sm.on(STATE.LANDED, {
    enter() { landedTimer = 150; },
    update(dt) {
      landedTimer--;
      if (flashAlpha > 0) flashAlpha = Math.max(0, flashAlpha - 0.015);
      if (input.keys.crtToggle) renderer.toggleCRT();
      input.clearEdges();
      if (landedTimer <= 0 || input.keys.thrust) {
        runIndex++;
        seed = Math.floor(Math.random() * 99999);
        startRun();
      }
    },
    render() {
      renderer.clear();
      renderer.drawTerrain(terrain);
      renderer.drawObstacles(terrain.obstacles);
      renderer.drawLander(physics, sprites);
      renderer.drawHUD({
        score: score.score, lives, time: frameCount,
        fuel: physics.fuel, vy: 0, vx: 0,
        altitude: 0, wind: 0, gravity: physics.gravityMultiplier, seed,
      });
      const ctx = renderer.ctx;
      ctx.textAlign   = 'center';
      ctx.shadowColor = CONFIG.COLOR_HUD;
      ctx.fillStyle   = CONFIG.COLOR_HUD;
      ctx.font = `bold ${CONFIG.SPRITE_SCALE * 6}px monospace`;
      ctx.shadowBlur = 8;
      ctx.fillText('LANDED!', CONFIG.W / 2, CONFIG.H / 2 - 40);
      ctx.font = `${CONFIG.SPRITE_SCALE * 4}px monospace`;
      ctx.shadowBlur = 4;
      ctx.fillText(`+${lastEarned} PTS`, CONFIG.W / 2, CONFIG.H / 2 + 10);
      ctx.font = `${CONFIG.SPRITE_SCALE * 3}px monospace`;
      ctx.fillStyle   = '#009900';
      ctx.shadowBlur  = 2;
      ctx.fillText('SPACE TO CONTINUE', CONFIG.W / 2, CONFIG.H / 2 + 55);
      ctx.shadowBlur = 0;
      ctx.textAlign  = 'left';
      renderer.drawScreenFlash(flashColor, flashAlpha);
      renderer.drawCRT();
    },
  });

  // ── CRASHED ────────────────────────────────────────────────────────────────
  sm.on(STATE.CRASHED, {
    enter() { explodeFrame = 0; explodeTimer = 0; },
    update(dt) {
      explodeTimer++;
      particles.update();
      if (flashAlpha > 0) flashAlpha = Math.max(0, flashAlpha - 0.015);
      if (explodeTimer % 7 === 0 && explodeFrame < 5) explodeFrame++;
      if (input.keys.crtToggle) renderer.toggleCRT();
      input.clearEdges();

      if (explodeTimer > 100) {
        lives--;
        if (lives <= 0) {
          score.saveHighScore();
          sm.transition(STATE.GAME_OVER);
        } else {
          startRun();
        }
      }
    },
    render() {
      renderer.clear();
      renderer.drawTerrain(terrain);
      renderer.drawObstacles(terrain.obstacles);
      particles.draw(renderer.ctx);
      renderer.drawExplosion(physics.x, physics.y, explodeFrame, sprites);
      renderer.drawHUD({
        score: score.score, lives, time: frameCount,
        fuel: 0, vy: 0, vx: 0,
        altitude: 0, wind: 0, gravity: physics.gravityMultiplier, seed,
      });
      renderer.drawScreenFlash(flashColor, flashAlpha);
      renderer.drawCRT();
    },
  });

  // ── GAME OVER ──────────────────────────────────────────────────────────────
  sm.on(STATE.GAME_OVER, {
    enter() {},
    update() {
      if (input.keys.thrust) {
        runIndex = 0;
        seed     = Math.floor(Math.random() * 99999);
        sm.transition(STATE.MENU);
      }
      if (input.keys.crtToggle) renderer.toggleCRT();
      input.clearEdges();
    },
    render() {
      renderer.clear();
      const ctx = renderer.ctx;
      ctx.textAlign = 'center';

      ctx.fillStyle   = '#ff3333';
      ctx.shadowColor = '#ff3333';
      ctx.font        = `bold ${CONFIG.SPRITE_SCALE * 8}px monospace`;
      ctx.shadowBlur  = 12;
      ctx.fillText('GAME OVER', CONFIG.W / 2, CONFIG.H / 2 - 90);

      ctx.fillStyle   = CONFIG.COLOR_HUD;
      ctx.shadowColor = CONFIG.COLOR_HUD;
      ctx.font        = `${CONFIG.SPRITE_SCALE * 4}px monospace`;
      ctx.shadowBlur  = 5;
      ctx.fillText(`SCORE: ${score.score}`, CONFIG.W / 2, CONFIG.H / 2 - 10);
      ctx.fillText(`BEST:  ${score.highScore}`, CONFIG.W / 2, CONFIG.H / 2 + 40);

      ctx.font       = `${CONFIG.SPRITE_SCALE * 3}px monospace`;
      ctx.fillStyle  = '#009900';
      ctx.shadowBlur = 2;
      ctx.fillText('SPACE TO PLAY AGAIN', CONFIG.W / 2, CONFIG.H / 2 + 100);

      ctx.shadowBlur = 0;
      ctx.textAlign  = 'left';
      renderer.drawCRT();
    },
  });

  // ── Helpers ────────────────────────────────────────────────────────────────
  function _altitude() {
    if (!terrain) return 0;
    const col = Math.floor((physics.x / CONFIG.W) * CONFIG.TERRAIN_COLS);
    const idx = Math.max(0, Math.min(col, terrain.points.length - 1));
    return Math.max(0, terrain.points[idx].y - physics.y);
  }

  loop.start();
});
