heading('Physics');

{
  // Helper: create a mock input with all keys false
  function makeInput(overrides = {}) {
    return { keys: { left: false, right: false, retro: false, thrust: false, crtToggle: false, ...overrides } };
  }

  // Gravity applies with no input
  {
    const p = new Physics();
    const startY = p.y;
    p.update(makeInput());
    assertApprox('gravity increases vy each frame', p.vy, CONFIG.GRAVITY);
    assertApprox('y increases by vy after one frame', p.y, startY + p.vy, 0.01);
  }

  // Thrust reduces vy (thrust upward when angle=0)
  {
    const p = new Physics();
    p.update(makeInput({ thrust: true }));
    assert('thrust with angle=0 reduces vy (net upward)',
      p.vy < CONFIG.GRAVITY); // vy = gravity - thrust < gravity
    assertApprox('thrust with angle=0 does not change vx', p.vx, 0, 0.01);
  }

  // Thrust at 90° pushes right
  {
    const p = new Physics();
    p.angle = Math.PI / 2;
    p.update(makeInput({ thrust: true }));
    assert('thrust at 90° increases vx (pushes right)', p.vx > 0);
  }

  // Rotation changes angle
  {
    const p = new Physics();
    p.update(makeInput({ right: true }));
    assert('rotate right increases angle', p.angle > 0);
  }

  {
    const p = new Physics();
    p.update(makeInput({ left: true }));
    assert('rotate left decreases angle', p.angle < 0);
  }

  // Fuel drains on thrust
  {
    const p = new Physics();
    p.update(makeInput({ thrust: true }));
    assert('fuel decreases after main thrust', p.fuel < CONFIG.FUEL_CAPACITY);
    assert('fuel decreases by FUEL_THRUST_RATE',
      Math.abs(p.fuel - (CONFIG.FUEL_CAPACITY - CONFIG.FUEL_THRUST_RATE)) < 0.01);
  }

  // No thrust when fuel=0
  {
    const p = new Physics();
    p.fuel = 0;
    p.update(makeInput({ thrust: true }));
    assertApprox('no thrust when fuel=0 — vy only gravity', p.vy, CONFIG.GRAVITY);
  }

  // Horizontal wrap
  {
    const p = new Physics();
    p.x = -1; p.vx = 0;
    p.update(makeInput());
    assert('x wraps from left edge to right', p.x > CONFIG.W / 2);
  }

  {
    const p = new Physics();
    p.x = CONFIG.W + 1; p.vx = 0;
    p.update(makeInput());
    assert('x wraps from right edge to left', p.x < CONFIG.W / 2);
  }

  // checkCollision: above terrain = none
  {
    const p = new Physics();
    p.x = 400; p.y = 100; p.vy = 0;
    const pts = Array.from({ length: CONFIG.TERRAIN_COLS + 1 }, (_, i) => ({
      x: (i / CONFIG.TERRAIN_COLS) * CONFIG.W, y: 400,
    }));
    const r = p.checkCollision(pts, []);
    assert('above terrain returns none', r.result === 'none');
    assert('above terrain pad is null', r.pad === null);
  }

  // checkCollision: fast crash on pad
  // landerBottom = y + (11 * SPRITE_SCALE) / 2 = y + 16.5; terrain y = 400
  // need y + 16.5 >= 400 → y >= 383.5, use y = 390
  {
    const p = new Physics();
    p.x = 410; p.y = 390; p.vy = 10; p.angle = 0;
    const pts = Array.from({ length: CONFIG.TERRAIN_COLS + 1 }, (_, i) => ({
      x: (i / CONFIG.TERRAIN_COLS) * CONFIG.W, y: 400,
    }));
    const pad = { x: 380, y: 400, width: 80, multiplier: 2, startIdx: 0, endIdx: 5 };
    const r = p.checkCollision(pts, [pad]);
    assert('fast descent on pad returns crash', r.result === 'crash');
  }

  // checkCollision: safe landing on pad
  {
    const p = new Physics();
    p.x = 410; p.y = 390; p.vy = 1.0; p.angle = 0.1;
    const pts = Array.from({ length: CONFIG.TERRAIN_COLS + 1 }, (_, i) => ({
      x: (i / CONFIG.TERRAIN_COLS) * CONFIG.W, y: 400,
    }));
    const pad = { x: 380, y: 400, width: 80, multiplier: 2, startIdx: 0, endIdx: 5 };
    const r = p.checkCollision(pts, [pad]);
    assert('slow descent on pad returns land', r.result === 'land');
    assert('land result includes pad reference', r.pad === pad);
  }

  // checkCollision: crash off-pad (no pad)
  {
    const p = new Physics();
    p.x = 410; p.y = 390; p.vy = 0.5; p.angle = 0;
    const pts = Array.from({ length: CONFIG.TERRAIN_COLS + 1 }, (_, i) => ({
      x: (i / CONFIG.TERRAIN_COLS) * CONFIG.W, y: 400,
    }));
    const r = p.checkCollision(pts, []);
    assert('gentle hit off-pad (no pad) returns crash', r.result === 'crash');
  }

  // setDifficulty
  {
    const p = new Physics();
    p.setDifficulty(0);
    assertApprox('difficulty 0 gravity multiplier = 0.8', p.gravityMultiplier, 0.8);
    p.setDifficulty(1);
    assertApprox('difficulty 1 gravity multiplier = 1.5', p.gravityMultiplier, 1.5);
  }
}
