import { PIXEL, drawSprite } from './sprites.js';

// ---------------------------------------------------------------------------
// Pixel cloud sprite (16 cols × 7 rows)
// ---------------------------------------------------------------------------
const CLOUD_FRAME = [
  '....CCCC........',
  '..CCCCCCCC......',
  '.CCCCCCCCCCCC...',
  'CCCCCCCCCCCCCC..',
  '.CCCCCCCCCCCC...',
  '..CCCCCCCC......',
  '................',
];
const CLOUD_PALETTE = { C: '#dce8ff' };

// ---------------------------------------------------------------------------
// Pixel tree sprite (10 cols × 14 rows)
// Tree silhouette in three shades for depth.
// ---------------------------------------------------------------------------
const TREE_FRAME = [
  '....TT....',
  '...TTTT...',
  '..TTTTTT..',
  '.TTTTTTTTT',
  'TTTTTTTTTT',
  '..TTTTTT..',
  '.TTTTTDTTT',
  'TTTTDDDDTT',
  'TTTTTTTDDT',
  '...TTTT...',
  '...SSSS...',
  '...SSSS...',
  '...SSSS...',
  '...........',
];
const TREE_PALETTE = {
  T: '#3a7a2a',  // main foliage
  D: '#285a18',  // dark shadow side
  S: '#5a3010',  // trunk
};

// ---------------------------------------------------------------------------
// Pixel bush sprite (14 cols × 5 rows)
// ---------------------------------------------------------------------------
const BUSH_FRAME = [
  '....BBBB......',
  '..BBBBBBBBBB..',
  '.BBBBBBBBBBBB.',
  'BBBBBBBBBBBBBB',
  '.BBBBBBBBBBBB.',
];
const BUSH_PALETTE = { B: '#2a7010' };

// ---------------------------------------------------------------------------
// Background
// ---------------------------------------------------------------------------
const GROUND_Y_RATIO = 0.65;

export function drawBackground(ctx, W, H) {
  const groundY = Math.round(H * GROUND_Y_RATIO);

  // Flat sky
  ctx.fillStyle = '#5c94fc';
  ctx.fillRect(0, 0, W, groundY);

  // Pixel trees along the horizon (every 80px, staggered heights)
  const treeHeights = [1.0, 0.85, 1.1, 0.9, 1.05];
  for (let i = 0, x = -10; x < W + 20; x += 72, i++) {
    const scale = treeHeights[i % treeHeights.length];
    drawTree(ctx, x, groundY, scale);
  }

  // Flat ground
  ctx.fillStyle = '#5aaa2a';
  ctx.fillRect(0, groundY, W, H - groundY);

  // Darker ground edge strip (2 pixel rows thick)
  ctx.fillStyle = '#3a8a1a';
  ctx.fillRect(0, groundY, W, PIXEL * 2);

  // Pixel bushes
  for (let x = 20; x < W; x += 100) {
    drawBush(ctx, x, groundY + PIXEL);
  }
}

function drawTree(ctx, x, baseY, scale) {
  const treeH = TREE_FRAME.length;
  const treeW = TREE_FRAME[0].length;
  // Position so the bottom of the tree sits on the horizon
  const originY = baseY - treeH * PIXEL * scale;
  // Draw scaled: for simplicity just use PIXEL size (trees are background detail)
  drawSprite(ctx, TREE_FRAME, TREE_PALETTE, x, originY);
}

function drawBush(ctx, x, y) {
  const cols = BUSH_FRAME[0].length;
  drawSprite(ctx, BUSH_FRAME, BUSH_PALETTE, x - (cols * PIXEL) / 2, y);
}

// ---------------------------------------------------------------------------
// Animated clouds
// ---------------------------------------------------------------------------
export function drawClouds(ctx, time) {
  const positions = [
    { x: (time * 18) % 950 - 80, y: 48 },
    { x: (time * 11 + 320) % 950 - 80, y: 88 },
    { x: (time * 14 + 640) % 950 - 80, y: 32 },
  ];
  const cols = CLOUD_FRAME[0].length;
  positions.forEach(({ x, y }) => {
    drawSprite(ctx, CLOUD_FRAME, CLOUD_PALETTE, x - (cols * PIXEL) / 2, y);
  });
}
