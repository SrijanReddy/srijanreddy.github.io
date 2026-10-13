import { PIXEL, drawSprite } from './sprites.js';

// ---------------------------------------------------------------------------
// Duck pixel sprites — 14 cols × 11 rows, facing RIGHT
// Flip horizontally when vx < 0.
// Colors:
//   G = medium green body
//   D = dark green wing
//   g = light green breast
//   Y = amber beak
//   W = eye white
//   K = eye pupil
//   O = orange feet
// ---------------------------------------------------------------------------
const PALETTE_GREEN = { G:'#58a828', D:'#1e5c0e', g:'#8acc44', Y:'#f0a010', W:'#f8f8f8', K:'#080808', O:'#d05000' };
const PALETTE_BLUE  = { G:'#2060c8', D:'#103890', g:'#60a0f0', Y:'#f0a010', W:'#f8f8f8', K:'#080808', O:'#d05000' };

// Frame 0 — wings mid
const F0 = [
  '..............',
  '......GGG.....',
  '.....GgWKG....',
  '....GgggggYYY.',
  '...GGGDDDGGGG.',
  '..GGGGDDDGGGG.',
  '..GGGGGDDGGGG.',
  '....GGGGGGG...',
  '.....GGGGG....',
  '.....GG.GG....',
  '.....OO.OO....',
];

// Frame 1 — wings up
const F1 = [
  '...DDDDDDDDD..',
  '..DDDDDDDDDDD.',
  '.....GGG......',
  '....GgWKG.....',
  '...GgggggYYY..',
  '...GGGGGGGGG..',
  '....GGGGGGG...',
  '....GGGGGGG...',
  '.....GGGGG....',
  '.....GG.GG....',
  '.....OO.OO....',
];

// Frame 2 — wings down
const F2 = [
  '..............',
  '......GGG.....',
  '.....GgWKG....',
  '....GgggggYYY.',
  '....GGGGGGGGG.',
  '....GGGGGGGGG.',
  '..DDDDDGGGGGG.',
  '..DDDDDDDGGG..',
  '....GGGGG.....',
  '.....GG.GG....',
  '.....OO.OO....',
];

const FRAMES = [F0, F1, F2];

// Sprite dimensions in canvas pixels
const SPRITE_COLS = 14;
const SPRITE_ROWS = 11;
const HALF_W = (SPRITE_COLS * PIXEL) / 2;
const HALF_H = (SPRITE_ROWS * PIXEL) / 2;

export class Duck {
  constructor(canvasW, canvasH, round) {
    this.W = canvasW;
    this.H = canvasH;
    this.color = Math.random() > 0.5 ? 'green' : 'blue';
    this.hitRadius = 24;

    this.x = Math.random() * (canvasW - 100) + 50;
    this.y = canvasH * 0.6;

    const speed = 120 + round * 15;
    const angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 0.6;
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;

    this.frame = 0;
    this.frameTimer = 0;
    this.frameDuration = 0.1;

    this.state = 'flying'; // 'flying' | 'hit' | 'falling'
    this.hitTimer = 0;
    this.fallVy = 0;
    this.escaped = false;
  }

  update(dt) {
    this.frameTimer += dt;
    if (this.frameTimer >= this.frameDuration) {
      this.frameTimer = 0;
      this.frame = (this.frame + 1) % 3;
    }

    if (this.state === 'flying') {
      this.x += this.vx * dt;
      this.y += this.vy * dt;
      if (this.x < 30 || this.x > this.W - 30) this.vx *= -1;
      if (this.y < 40) this.vy *= -1;
      if (this.y > this.H * 0.62) this.escaped = true;
    } else if (this.state === 'hit') {
      this.hitTimer += dt;
      if (this.hitTimer > 0.4) {
        this.state = 'falling';
        this.fallVy = 0;
      }
    } else if (this.state === 'falling') {
      this.fallVy += 800 * dt;
      this.y += this.fallVy * dt;
    }
  }

  isOffScreen() {
    return this.y > this.H + 50;
  }

  shoot(mx, my) {
    if (this.state !== 'flying') return false;
    const dx = mx - this.x;
    const dy = my - this.y;
    if (Math.sqrt(dx * dx + dy * dy) < this.hitRadius) {
      this.state = 'hit';
      this.vx = 0;
      this.vy = 0;
      return true;
    }
    return false;
  }

  draw(ctx) {
    const palette = this.color === 'green' ? PALETTE_GREEN : PALETTE_BLUE;
    const frame = FRAMES[this.frame];

    if (this.state === 'falling') {
      // Flip upside-down by drawing rotated 180° around center
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate(Math.PI);
      drawSprite(ctx, frame, palette, -HALF_W, -HALF_H);
      ctx.restore();
    } else {
      const flipX = this.vx < 0;
      drawSprite(ctx, frame, palette, this.x - HALF_W, this.y - HALF_H, flipX);
    }
  }
}
