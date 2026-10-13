// ============================================================
// DONKEY KONG - Arcade Game (Improved Edition)
// HTML5 Canvas + Vanilla JavaScript
// Features: Sound FX, Hammer, Pause, DeltaTime, Screen Shake
// ============================================================

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

const W = 480;
const H = 600;
canvas.width = W;
canvas.height = H;

// ---- AUDIO (Web Audio API retro synth sounds) ----
const AudioCtx = window.AudioContext || window.webkitAudioContext;
let audioCtx = null;
let muted = false;

function ensureAudio() {
  if (!audioCtx) audioCtx = new AudioCtx();
}

function playTone(freq, duration, type, vol, ramp) {
  if (muted || !audioCtx) return;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = type || 'square';
  osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
  if (ramp) osc.frequency.exponentialRampToValueAtTime(ramp, audioCtx.currentTime + duration);
  gain.gain.setValueAtTime(vol || 0.15, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
  osc.connect(gain).connect(audioCtx.destination);
  osc.start(); osc.stop(audioCtx.currentTime + duration);
}

function sfxJump() { playTone(250, 0.15, 'square', 0.12, 500); }
function sfxLand() { playTone(120, 0.08, 'triangle', 0.08); }
function sfxBarrelJump() { playTone(400, 0.2, 'square', 0.15, 800); }
function sfxDie() {
  playTone(400, 0.15, 'square', 0.2, 100);
  setTimeout(() => playTone(200, 0.3, 'sawtooth', 0.15, 50), 150);
}
function sfxWin() {
  [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => playTone(f, 0.2, 'square', 0.12), i * 120));
}
function sfxHammerPickup() {
  playTone(600, 0.1, 'square', 0.15, 1200);
  setTimeout(() => playTone(900, 0.15, 'square', 0.12), 100);
}
function sfxHammerSmash() { playTone(80, 0.2, 'sawtooth', 0.2, 40); }
function sfxCombo() { playTone(700, 0.1, 'triangle', 0.1, 1400); }

// ---- TOGGLE MUTE ----
function toggleMute() {
  muted = !muted;
  document.getElementById('btnMute').textContent = muted ? '🔇' : '🔊';
}
document.getElementById('btnMute').addEventListener('click', toggleMute);

// ---- STATE ----
let gameState = 'start'; // start, playing, paused, gameover, win
let score = 0;
let lives = 3;
let level = 1;
let highScore = parseInt(localStorage.getItem('dk_high') || '0');
let barrelTimer = 0;
let barrelInterval = 90;
let frameCount = 0;
let lastTime = 0;
let combo = 0;
let comboTimer = 0;

// ---- SCREEN SHAKE ----
let shakeTimer = 0;
let shakeIntensity = 0;

function triggerShake(duration, intensity) {
  shakeTimer = duration;
  shakeIntensity = intensity;
}

// ---- INPUT ----
const keys = {};
window.addEventListener('keydown', e => {
  keys[e.code] = true;
  e.preventDefault();
  ensureAudio();
  if (e.code === 'KeyP') togglePause();
  if (e.code === 'KeyM') toggleMute();
});
window.addEventListener('keyup', e => { keys[e.code] = false; });

function bindMobile(id, code) {
  const btn = document.getElementById(id);
  if (!btn) return;
  btn.addEventListener('touchstart', e => { e.preventDefault(); keys[code] = true; ensureAudio(); });
  btn.addEventListener('touchend', e => { e.preventDefault(); keys[code] = false; });
  btn.addEventListener('mousedown', () => { keys[code] = true; ensureAudio(); });
  btn.addEventListener('mouseup', () => { keys[code] = false; });
}
bindMobile('btnLeft', 'ArrowLeft');
bindMobile('btnRight', 'ArrowRight');
bindMobile('btnUp', 'ArrowUp');
bindMobile('btnDown', 'ArrowDown');
bindMobile('btnJump', 'Space');

// ---- PAUSE ----
function togglePause() {
  if (gameState === 'playing') {
    gameState = 'paused';
    document.getElementById('pauseScreen').style.display = 'flex';
    document.getElementById('pauseScore').textContent = score;
  } else if (gameState === 'paused') {
    gameState = 'playing';
    document.getElementById('pauseScreen').style.display = 'none';
    lastTime = performance.now();
  }
}
document.getElementById('btnPause').addEventListener('click', togglePause);

// ---- PLATFORMS ----
function createPlatforms() {
  const plats = [];
  const rows = 6;
  const platH = 10;
  const gapY = (H - 100) / rows;
  for (let i = 0; i < rows; i++) {
    const y = H - 40 - i * gapY;
    const offset = (i % 2 === 0) ? 0 : 40;
    const slope = (i % 2 === 0) ? 0.03 : -0.03;
    plats.push({ x: offset, y, w: W - 40 - offset + (i === 0 ? 40 : 0), h: platH, slope, row: i });
  }
  return plats;
}

// ---- LADDERS ----
function createLadders(platforms) {
  const ladders = [];
  for (let i = 0; i < platforms.length - 1; i++) {
    const p = platforms[i];
    const pAbove = platforms[i + 1];
    const numLadders = (i < platforms.length - 2) ? (1 + Math.floor(Math.random() * 2)) : 1;
    for (let j = 0; j < numLadders; j++) {
      const minX = Math.max(p.x, pAbove.x) + 30;
      const maxX = Math.min(p.x + p.w, pAbove.x + pAbove.w) - 30;
      if (maxX <= minX) continue;
      const lx = minX + Math.random() * (maxX - minX);
      ladders.push({ x: lx, y: pAbove.y + pAbove.h, w: 20, h: p.y - pAbove.y - pAbove.h });
    }
  }
  return ladders;
}

// ---- PLAYER ----
function createPlayer(platforms) {
  const p = platforms[0];
  return { x: p.x + 30, y: p.y - 28, w: 22, h: 28, vx: 0, vy: 0, onGround: true, onLadder: false, facing: 1, walkFrame: 0, invincible: 0, hasHammer: false, hammerTimer: 0 };
}

// ---- DONKEY KONG ----
function createDK(platforms) {
  const top = platforms[platforms.length - 1];
  return { x: top.x + 20, y: top.y - 52, w: 48, h: 52, frame: 0, throwTimer: 0 };
}

// ---- PRINCESS ----
function createPrincess(platforms) {
  const top = platforms[platforms.length - 1];
  return { x: top.x + top.w / 2, y: top.y - 30, w: 20, h: 30 };
}

// ---- HAMMER POWER-UP ----
let hammers = [];
function createHammers(platforms) {
  const h = [];
  // Place hammer on row 2 and row 4
  [1, 3].forEach(row => {
    if (row < platforms.length) {
      const p = platforms[row];
      h.push({ x: p.x + p.w * 0.6 + Math.random() * 60, y: p.y - 22, w: 18, h: 22, active: true, bob: Math.random() * Math.PI * 2 });
    }
  });
  return h;
}

// ---- BARRELS ----
let barrels = [];
function spawnBarrel(dk, platforms) {
  const topPlat = platforms[platforms.length - 1];
  barrels.push({ x: dk.x + dk.w, y: topPlat.y - 16, w: 16, h: 16, vx: 2.5 + level * 0.3, vy: 0, rotation: 0, row: platforms.length - 1, active: true });
}

// ---- COLLISION ----
function rectsOverlap(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

function isOnPlatform(entity, platforms) {
  for (const p of platforms) {
    const feetY = entity.y + entity.h;
    const slopeY = p.y + (entity.x - p.x) * (p.slope || 0);
    if (entity.x + entity.w > p.x && entity.x < p.x + p.w && feetY >= slopeY - 2 && feetY <= slopeY + 8) return p;
  }
  return null;
}

function isOnLadder(entity, ladders) {
  const cx = entity.x + entity.w / 2;
  const cy = entity.y + entity.h / 2;
  for (const l of ladders) {
    if (cx > l.x && cx < l.x + l.w && cy > l.y && cy < l.y + l.h + 10) return l;
  }
  return null;
}

// ---- PARTICLES ----
let particles = [];
function spawnParticles(x, y, color, count) {
  for (let i = 0; i < count; i++) {
    particles.push({
      x, y, vx: (Math.random() - 0.5) * 6, vy: (Math.random() - 0.5) * 6 - 2,
      life: 20 + Math.random() * 20, maxLife: 40, color, size: 2 + Math.random() * 3
    });
  }
}

// ---- GAME OBJECTS ----
let platforms, ladders, player, dk, princess;
function initLevel() {
  platforms = createPlatforms();
  ladders = createLadders(platforms);
  player = createPlayer(platforms);
  dk = createDK(platforms);
  princess = createPrincess(platforms);
  barrels = [];
  hammers = createHammers(platforms);
  particles = [];
  barrelTimer = 0;
  barrelInterval = Math.max(40, 90 - level * 10);
  combo = 0;
  comboTimer = 0;
}
initLevel();

// ---- DRAWING ----
function drawPlatforms() {
  for (const p of platforms) {
    ctx.fillStyle = '#c84c09';
    ctx.fillRect(p.x, p.y, p.w, p.h);
    ctx.fillStyle = '#ff7b39';
    for (let rx = p.x + 5; rx < p.x + p.w; rx += 20) {
      ctx.fillRect(rx, p.y + 2, 8, 3);
      ctx.fillRect(rx, p.y + p.h - 5, 8, 3);
    }
  }
}

function drawLadders() {
  ctx.strokeStyle = '#6fc3df';
  ctx.lineWidth = 2;
  for (const l of ladders) {
    ctx.beginPath();
    ctx.moveTo(l.x + 2, l.y); ctx.lineTo(l.x + 2, l.y + l.h);
    ctx.moveTo(l.x + l.w - 2, l.y); ctx.lineTo(l.x + l.w - 2, l.y + l.h);
    ctx.stroke();
    for (let ry = l.y + 10; ry < l.y + l.h; ry += 14) {
      ctx.beginPath(); ctx.moveTo(l.x + 2, ry); ctx.lineTo(l.x + l.w - 2, ry); ctx.stroke();
    }
  }
}

function drawPlayer() {
  if (player.invincible > 0 && Math.floor(player.invincible / 4) % 2) return;
  const px = player.x, py = player.y, f = player.facing;

  // Hammer glow
  if (player.hasHammer) {
    ctx.fillStyle = 'rgba(231, 76, 60, 0.2)';
    ctx.beginPath();
    ctx.arc(px + 11, py + 14, 22, 0, Math.PI * 2);
    ctx.fill();
  }

  // Body
  ctx.fillStyle = player.hasHammer ? '#f39c12' : '#e74c3c';
  ctx.fillRect(px + 4, py + 8, 14, 12);
  // Head
  ctx.fillStyle = '#ffd5a0'; ctx.fillRect(px + 6, py, 10, 10);
  // Hat
  ctx.fillStyle = player.hasHammer ? '#f39c12' : '#e74c3c';
  ctx.fillRect(px + 4, py - 2, 14, 4);
  // Eyes
  ctx.fillStyle = '#000'; ctx.fillRect(px + (f > 0 ? 12 : 8), py + 3, 2, 2);
  // Legs
  ctx.fillStyle = '#3498db';
  const lo = player.onGround ? Math.sin(player.walkFrame * 0.3) * 3 : 0;
  ctx.fillRect(px + 5, py + 20, 5, 8 + lo); ctx.fillRect(px + 12, py + 20, 5, 8 - lo);
  // Arms
  ctx.fillStyle = '#ffd5a0'; ctx.fillRect(px + 1, py + 10, 4, 8); ctx.fillRect(px + 17, py + 10, 4, 8);

  // Draw hammer weapon
  if (player.hasHammer) {
    const hx = f > 0 ? px + 18 : px - 10;
    const swingAngle = Math.sin(frameCount * 0.3) * 0.5;
    ctx.save();
    ctx.translate(hx + 5, py + 6);
    ctx.rotate(swingAngle);
    ctx.fillStyle = '#8B4513'; ctx.fillRect(-2, -12, 4, 16);
    ctx.fillStyle = '#666'; ctx.fillRect(-5, -18, 10, 8);
    ctx.restore();
  }
}

function drawDK() {
  const dx = dk.x, dy = dk.y;
  ctx.fillStyle = '#8B4513'; ctx.fillRect(dx + 6, dy + 14, 36, 30);
  ctx.fillStyle = '#D2691E'; ctx.fillRect(dx + 12, dy + 20, 24, 18);
  ctx.fillStyle = '#8B4513'; ctx.fillRect(dx + 10, dy, 28, 18);
  ctx.fillStyle = '#D2691E'; ctx.fillRect(dx + 14, dy + 4, 20, 12);
  ctx.fillStyle = '#fff'; ctx.fillRect(dx + 16, dy + 5, 6, 5); ctx.fillRect(dx + 26, dy + 5, 6, 5);
  ctx.fillStyle = '#000'; ctx.fillRect(dx + 18, dy + 6, 3, 3); ctx.fillRect(dx + 28, dy + 6, 3, 3);
  ctx.fillStyle = '#000'; ctx.fillRect(dx + 18, dy + 12, 12, 3);
  ctx.fillStyle = '#8B4513';
  const armY = dk.throwTimer > 0 ? -6 : 0;
  ctx.fillRect(dx, dy + 16 + armY, 8, 14); ctx.fillRect(dx + 40, dy + 16 + armY, 8, 14);
  ctx.fillRect(dx + 10, dy + 44, 10, 8); ctx.fillRect(dx + 28, dy + 44, 10, 8);
}

function drawPrincess() {
  const px = princess.x, py = princess.y;
  ctx.fillStyle = '#ff69b4'; ctx.fillRect(px + 3, py + 10, 14, 18); ctx.fillRect(px, py + 22, 20, 8);
  ctx.fillStyle = '#ffd5a0'; ctx.fillRect(px + 5, py, 10, 12);
  ctx.fillStyle = '#f1c40f'; ctx.fillRect(px + 4, py - 2, 12, 5); ctx.fillRect(px + 3, py + 2, 3, 8); ctx.fillRect(px + 14, py + 2, 3, 8);
  ctx.fillStyle = '#000'; ctx.fillRect(px + 7, py + 4, 2, 2); ctx.fillRect(px + 11, py + 4, 2, 2);
  if (Math.floor(frameCount / 30) % 2) { ctx.fillStyle = '#fff'; ctx.font = '8px monospace'; ctx.fillText('HELP!', px - 5, py - 8); }
}

function drawBarrels() {
  for (const b of barrels) {
    if (!b.active) continue;
    ctx.save();
    ctx.translate(b.x + b.w / 2, b.y + b.h / 2);
    ctx.rotate(b.rotation);
    ctx.fillStyle = '#c84c09'; ctx.fillRect(-b.w / 2, -b.h / 2, b.w, b.h);
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(-b.w / 2, -b.h / 2, b.w, 3);
    ctx.fillRect(-b.w / 2, b.h / 2 - 3, b.w, 3);
    ctx.fillRect(-b.w / 2, -1, b.w, 2);
    ctx.restore();
  }
}

function drawHammers() {
  for (const h of hammers) {
    if (!h.active) continue;
    const bob = Math.sin(frameCount * 0.05 + h.bob) * 3;
    const hx = h.x, hy = h.y + bob;
    // Glow
    ctx.fillStyle = 'rgba(241, 196, 15, 0.3)';
    ctx.beginPath(); ctx.arc(hx + 9, hy + 11, 16, 0, Math.PI * 2); ctx.fill();
    // Handle
    ctx.fillStyle = '#8B4513'; ctx.fillRect(hx + 7, hy + 6, 4, 16);
    // Head
    ctx.fillStyle = '#888'; ctx.fillRect(hx + 2, hy, 14, 10);
    ctx.fillStyle = '#aaa'; ctx.fillRect(hx + 4, hy + 2, 10, 6);
  }
}

function drawParticles() {
  for (const p of particles) {
    const alpha = p.life / p.maxLife;
    ctx.globalAlpha = alpha;
    ctx.fillStyle = p.color;
    ctx.fillRect(p.x, p.y, p.size, p.size);
  }
  ctx.globalAlpha = 1;
}

function drawBackground() {
  const grad = ctx.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0, '#0a0a2e'); grad.addColorStop(1, '#1a1a1a');
  ctx.fillStyle = grad; ctx.fillRect(0, 0, W, H);
}

// ---- UPDATE ----
function updatePlayer(dt) {
  const speed = 2.5 * dt, gravity = 0.5 * dt, jumpForce = -9;
  if (player.invincible > 0) player.invincible -= dt;

  // Hammer timer
  if (player.hasHammer) {
    player.hammerTimer -= dt;
    if (player.hammerTimer <= 0) { player.hasHammer = false; player.hammerTimer = 0; }
  }

  if (keys['ArrowLeft'] || keys['KeyA']) { player.vx = -speed; player.facing = -1; player.walkFrame++; }
  else if (keys['ArrowRight'] || keys['KeyD']) { player.vx = speed; player.facing = 1; player.walkFrame++; }
  else { player.vx = 0; }

  const ladder = isOnLadder(player, ladders);
  if (ladder) {
    if (keys['ArrowUp'] || keys['KeyW']) { player.onLadder = true; player.vy = -2.5 * dt; player.vx = 0; }
    else if (keys['ArrowDown'] || keys['KeyS']) { player.onLadder = true; player.vy = 2.5 * dt; player.vx = 0; }
    else if (player.onLadder) { player.vy = 0; }
  } else { player.onLadder = false; }

  if ((keys['Space'] || keys['ArrowUp']) && player.onGround && !player.onLadder) {
    player.vy = jumpForce;
    player.onGround = false;
    sfxJump();
  }

  if (!player.onLadder) player.vy += gravity;
  player.x += player.vx; player.y += player.vy;

  if (!player.onLadder) {
    const plat = isOnPlatform(player, platforms);
    if (plat && player.vy >= 0) {
      player.y = (plat.y + (player.x - plat.x) * (plat.slope || 0)) - player.h;
      player.vy = 0; player.onGround = true;
    } else if (!plat) { player.onGround = false; }
  }

  // Hammer pickup
  for (const h of hammers) {
    if (h.active && rectsOverlap(player, h)) {
      h.active = false;
      player.hasHammer = true;
      player.hammerTimer = 300; // ~5 seconds at 60fps
      sfxHammerPickup();
    }
  }

  if (player.x < 0) player.x = 0;
  if (player.x + player.w > W) player.x = W - player.w;
  if (player.y > H + 50) playerDie();
}

function updateBarrels(dt) {
  barrelTimer += dt;
  if (barrelTimer >= barrelInterval) { barrelTimer = 0; spawnBarrel(dk, platforms); dk.throwTimer = 15; }
  if (dk.throwTimer > 0) dk.throwTimer -= dt;

  // Combo timer
  if (comboTimer > 0) {
    comboTimer -= dt;
    if (comboTimer <= 0) { combo = 0; comboTimer = 0; }
  }

  for (const b of barrels) {
    if (!b.active) continue;
    b.vy = b.vy || 0;
    b.vy += 0.4 * dt;
    b.x += b.vx * dt; b.y += b.vy;
    b.rotation += b.vx * 0.08 * dt;

    const plat = isOnPlatform(b, platforms);
    if (plat && b.vy >= 0) {
      b.y = (plat.y + (b.x - plat.x) * (plat.slope || 0)) - b.h;
      b.vy = 0;
      if (plat.row !== b.row) { b.row = plat.row; b.vx = -b.vx; }
    }

    if (b.y > H + 50 || b.x < -50 || b.x > W + 50) b.active = false;

    if (player.invincible <= 0 && rectsOverlap(player, b)) {
      if (player.hasHammer) {
        // Smash barrel with hammer!
        score += 200;
        combo++;
        comboTimer = 120;
        if (combo > 1) { score += combo * 50; sfxCombo(); }
        spawnParticles(b.x + 8, b.y + 8, '#c84c09', 8);
        sfxHammerSmash();
        b.active = false;
      } else if (player.vy > 0 && player.y + player.h < b.y + 5) {
        score += 100;
        combo++;
        comboTimer = 120;
        if (combo > 1) { score += combo * 50; sfxCombo(); }
        b.active = false;
        sfxBarrelJump();
        spawnParticles(b.x + 8, b.y + 8, '#c84c09', 6);
      } else {
        playerDie();
        b.active = false;
      }
    }
  }

  for (const b of barrels) {
    if (!b.active) continue;
    if (!b.scored && player.y + player.h < b.y && Math.abs(player.x - b.x) < 30 && !player.onGround) {
      score += 100; b.scored = true; sfxBarrelJump();
    }
  }
  barrels = barrels.filter(b => b.active);
}

function updateParticles(dt) {
  for (const p of particles) {
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vy += 0.2 * dt;
    p.life -= dt;
  }
  particles = particles.filter(p => p.life > 0);
}

function checkWin() {
  if (rectsOverlap(player, princess)) {
    score += 1000 + level * 500;
    gameState = 'win';
    sfxWin();
    document.getElementById('winScreen').style.display = 'flex';
    document.getElementById('winScore').textContent = score;
    if (score > highScore) { highScore = score; localStorage.setItem('dk_high', highScore); }
    document.getElementById('winHighScore').textContent = highScore;
  }
}

function playerDie() {
  lives--;
  sfxDie();
  triggerShake(20, 6);
  spawnParticles(player.x + 11, player.y + 14, '#e74c3c', 12);
  combo = 0;
  comboTimer = 0;
  if (lives <= 0) {
    gameState = 'gameover';
    document.getElementById('gameOver').style.display = 'flex';
    document.getElementById('finalScore').textContent = score;
    if (score > highScore) { highScore = score; localStorage.setItem('dk_high', highScore); }
    document.getElementById('highScore').textContent = highScore;
  } else {
    const p = platforms[0];
    player.x = p.x + 30; player.y = p.y - player.h;
    player.vx = 0; player.vy = 0; player.onGround = true; player.onLadder = false;
    player.invincible = 90; player.hasHammer = false; player.hammerTimer = 0;
    barrels = [];
  }
  updateUI();
}

function updateUI() {
  document.getElementById('score').textContent = score;
  document.getElementById('lives').textContent = lives;
  document.getElementById('level').textContent = level;
  document.getElementById('hiScore').textContent = highScore;

  const hammerUI = document.getElementById('hammerUI');
  const hammerTimerEl = document.getElementById('hammerTimer');
  if (player.hasHammer) {
    hammerUI.style.display = 'inline';
    hammerTimerEl.textContent = Math.ceil(player.hammerTimer / 60) + 's';
  } else {
    hammerUI.style.display = 'none';
  }

  const comboUI = document.getElementById('comboUI');
  const comboCount = document.getElementById('comboCount');
  if (combo > 1) {
    comboUI.style.display = 'inline';
    comboCount.textContent = combo;
  } else {
    comboUI.style.display = 'none';
  }
}

// ---- MAIN LOOP ----
function gameLoop(timestamp) {
  if (!lastTime) lastTime = timestamp;
  const rawDt = (timestamp - lastTime) / (1000 / 60); // normalize to 60fps
  const dt = Math.min(rawDt, 3); // cap to prevent huge jumps
  lastTime = timestamp;
  frameCount++;

  // Screen shake
  let sx = 0, sy = 0;
  if (shakeTimer > 0) {
    sx = (Math.random() - 0.5) * shakeIntensity;
    sy = (Math.random() - 0.5) * shakeIntensity;
    shakeTimer -= dt;
    shakeIntensity *= 0.95;
  }

  ctx.save();
  ctx.translate(sx, sy);

  if (gameState === 'playing') {
    drawBackground(); drawPlatforms(); drawLadders(); drawHammers(); drawBarrels(); drawParticles(); drawDK(); drawPrincess(); drawPlayer();
    updatePlayer(dt); updateBarrels(dt); updateParticles(dt); checkWin(); updateUI();
  } else {
    drawBackground(); drawPlatforms(); drawLadders(); drawHammers(); drawDK(); drawPrincess(); drawParticles();
    updateParticles(dt);
  }

  ctx.restore();
  requestAnimationFrame(gameLoop);
}

// ---- START / RESTART ----
function handleStart() {
  ensureAudio();
  if (gameState === 'start') {
    gameState = 'playing'; document.getElementById('startScreen').style.display = 'none';
    lastTime = performance.now();
  } else if (gameState === 'gameover') {
    gameState = 'playing'; score = 0; lives = 3; level = 1;
    document.getElementById('gameOver').style.display = 'none'; initLevel(); updateUI();
    lastTime = performance.now();
  } else if (gameState === 'win') {
    level++; document.getElementById('winScreen').style.display = 'none';
    gameState = 'playing'; initLevel(); updateUI();
    lastTime = performance.now();
  } else if (gameState === 'paused') {
    togglePause();
  }
}

window.addEventListener('keydown', e => { if (e.code === 'Space' && gameState !== 'playing') handleStart(); });
const jumpBtn = document.getElementById('btnJump');
if (jumpBtn) jumpBtn.addEventListener('touchstart', () => { if (gameState !== 'playing') handleStart(); });

requestAnimationFrame(gameLoop);
