import { PIXEL, drawSprite } from './sprites.js';

// ---------------------------------------------------------------------------
// Dog pixel sprites — 12 cols × 16 rows
// Anchored at bottom-center: feet sit at (x, groundY).
//
// Colors:
//   B = dark brown outline  '#3a1808'
//   F = light fur / face    '#e8a840'
//   T = medium brown ears+body '#c87030'
//   M = cream muzzle        '#f8e0a8'
//   N = nose                '#1a0808'
//   W = eye white           '#f8f8f8'
//   P = pupil               '#080808'
//   D = duck (held)         '#58a828'
// ---------------------------------------------------------------------------
const PALETTE = { B:'#3a1808', F:'#e8a840', T:'#c87030', M:'#f8e0a8', N:'#1a0808', W:'#f8f8f8', P:'#080808', D:'#58a828' };

// Holding state — happy expression, duck held above head
const DOG_HOLD = [
  '....DDDDDD..',   // duck held above
  '...DDDDDDDD.',   // duck
  '..TT....TT..',   // ear tops (medium brown — floppy dog ears)
  '.TFFB..BFFT.',   // ears flop beside head
  '.TFFBBBBFFT.',   // ear base meets head
  '.BFFFFFFFFB.',   // forehead
  '.BFWPFFWPFB.',   // eyes open (white + pupil)
  '.BFMMNNNMMB.',   // muzzle top + 3-wide nose
  '..BMMMMMMB..',   // muzzle lower (narrower = looks like snout)
  '..BBBBBBBB..',   // chin/jaw
  '..BTTTTTTB..',   // body top
  '.BTTTTTTTB..',   // body mid
  '.BTTTTTTTB..',   // body mid
  '..BBBBBBBB..',   // body bottom
  '...BB..BB...',   // legs
  '..BBBB.BBBB.',   // feet
];

// Laughing frame A — eyes squeezed shut, mouth wide open
const DOG_LAUGH_A = [
  '............',
  '............',
  '..TT....TT..',   // ear tops
  '.TFFB..BFFT.',   // ears
  '.TFFBBBBFFT.',   // ear base
  '.BFFFFFFFFB.',   // forehead
  '.BBBBBBBBB..',   // eyes squeezed shut
  '.BFMMNNNMMB.',   // muzzle + nose
  '.BBBBBBBBBB.',   // very wide open mouth
  '..BWWWWWWB..',   // lots of teeth
  '...BBBBBBB..',   // chin
  '..BTTTTTTB..',   // body top
  '.BTTTTTTTB..',   // body mid
  '..BBBBBBBB..',   // body bottom
  '...BB..BB...',   // legs
  '..BBBB.BBBB.',   // feet
];

// Laughing frame B — ^^ eyes, medium open mouth
const DOG_LAUGH_B = [
  '............',
  '............',
  '..TT....TT..',   // ear tops
  '.TFFB..BFFT.',   // ears
  '.TFFBBBBFFT.',   // ear base
  '.BFFFFFFFFB.',   // forehead
  '.BB.BBB.BB..',   // ^^ squinty eyes
  '.BFMMNNNMMB.',   // muzzle + nose
  '.BBFFFFF.BB.',   // medium open mouth
  '..BWWWWWBB..',   // teeth
  '..BBBBBBB...',   // chin
  '..BTTTTTTB..',   // body top
  '.BTTTTTTTB..',   // body mid
  '..BBBBBBBB..',   // body bottom
  '...BB..BB...',   // legs
  '..BBBB.BBBB.',   // feet
];

const SPRITE_COLS = 12;
const SPRITE_ROWS = 16;
const HALF_W = (SPRITE_COLS * PIXEL) / 2;
const FULL_H = SPRITE_ROWS * PIXEL;

export class Dog {
  constructor(canvasW, canvasH) {
    this.W = canvasW;
    this.H = canvasH;
    this.x = canvasW / 2;
    this.groundY = canvasH * 0.65 + 10;
    this.y = this.groundY + FULL_H; // starts hidden below grass
    this.state = 'hidden';
    this.timer = 0;
    this.duration = 3.5;
    this.frame = 0;
    this.frameTimer = 0;
  }

  showLaugh() {
    this.state = 'laughing';
    this.timer = 0;
    this.y = this.groundY + FULL_H;
    this.x = this.W / 2 + (Math.random() - 0.5) * 200;
  }

  showRetrieve() {
    this.state = 'holding';
    this.timer = 0;
    this.y = this.groundY + FULL_H;
    this.x = this.W / 2 + (Math.random() - 0.5) * 200;
  }

  update(dt) {
    this.frameTimer += dt;
    const frameDur = this.state === 'laughing' ? 0.08 : 0.2;
    if (this.frameTimer > frameDur) {
      this.frameTimer = 0;
      this.frame = (this.frame + 1) % 2;
    }

    if (this.state === 'hidden') return;

    this.timer += dt;
    const targetY = this.groundY;

    if (this.timer <= this.duration) {
      // Rising phase — feet rise up to groundY
      if (this.y > targetY) {
        this.y -= 180 * dt;
        if (this.y < targetY) this.y = targetY;
      }
    } else {
      // Lowering phase
      this.y += 180 * dt;
      if (this.y >= this.groundY + FULL_H) {
        this.y = this.groundY + FULL_H;
        this.state = 'hidden';
      }
    }
  }

  isVisible() {
    return this.state !== 'hidden' || this.y < this.groundY + FULL_H;
  }

  draw(ctx) {
    if (!this.isVisible()) return;
    let frame;
    if (this.state === 'laughing') {
      frame = this.frame === 0 ? DOG_LAUGH_A : DOG_LAUGH_B;
    } else {
      frame = DOG_HOLD;
    }
    // Bounce up and down while laughing
    const bounceY = this.state === 'laughing' ? Math.sin(this.timer * 18) * 5 : 0;
    drawSprite(ctx, frame, PALETTE, this.x - HALF_W, this.y - FULL_H + bounceY);
  }
}
