// Shared pixel-art sprite utility
// Each virtual "pixel" = PIXEL × PIXEL actual screen pixels
export const PIXEL = 4;

// Draw a sprite defined as an array of strings.
// Each character maps to a color in `palette`; '.' = transparent.
// (originX, originY) = top-left corner of the sprite in canvas pixels.
// flipX = mirror horizontally (for left-facing ducks).
export function drawSprite(ctx, frame, palette, originX, originY, flipX = false) {
  const rows = frame.length;
  const cols = frame[0].length;
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const ch = frame[row][flipX ? (cols - 1 - col) : col];
      if (ch === '.' || !palette[ch]) continue;
      ctx.fillStyle = palette[ch];
      ctx.fillRect(
        Math.round(originX) + col * PIXEL,
        Math.round(originY) + row * PIXEL,
        PIXEL, PIXEL
      );
    }
  }
}
