// Button hit regions — used by both draw functions and click detection in main.js
export const BUTTONS = {
  pause:   (W)    => ({ x: W - 100, y: 10,        w: 40,  h: 30 }),
  mute:    (W)    => ({ x: W - 50,  y: 10,        w: 40,  h: 30 }),
  resume:  (W, H) => ({ x: W/2 - 110, y: H/2 + 20,  w: 220, h: 52 }),
  restart: (W, H) => ({ x: W/2 - 110, y: H/2 + 90,  w: 220, h: 52 }),
};

function drawButton(ctx, rect, label, bg = 'rgba(255,221,0,0.9)', fg = '#000') {
  ctx.fillStyle = bg;
  ctx.beginPath();
  ctx.roundRect(rect.x, rect.y, rect.w, rect.h, 6);
  ctx.fill();
  ctx.fillStyle = fg;
  ctx.font = 'bold 18px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(label, rect.x + rect.w / 2, rect.y + rect.h / 2 + 6);
  ctx.textAlign = 'left';
}

export function drawHUD(ctx, game, W, H) {
  // Score
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 20px monospace';
  ctx.fillText(`SCORE  ${String(game.score).padStart(6, '0')}`, 20, 36);
  ctx.fillText(`HI     ${String(game.highScore).padStart(6, '0')}`, 20, 60);

  // Round
  ctx.fillText(`ROUND  ${game.round}`, W - 180, 36);

  // Shot bullets — total scales with duck count (3 per duck)
  const totalShots = game.ducksThisRound * 3;
  const bulletColor = '#ffdd00';
  const bulletSpacing = 22;
  const bulletsStartX = W / 2 - (totalShots - 1) * bulletSpacing / 2;
  for (let i = 0; i < totalShots; i++) {
    const filled = i < game.shotsLeft;
    ctx.fillStyle = filled ? bulletColor : '#555';
    ctx.beginPath();
    ctx.ellipse(bulletsStartX + i * bulletSpacing, H - 30, 7, 12, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#888';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }

  // Ducks hit this round
  ctx.fillStyle = '#fff';
  ctx.font = '16px monospace';
  ctx.fillText(`DUCKS: ${game.ducksHit}/${game.ducksThisRound}`, W / 2 + 60, H - 22);
}

export function drawBangEffect(ctx, x, y, alpha) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = '#ffdd00';
  ctx.font = 'bold 28px monospace';
  ctx.fillText('BANG!', x - 40, y - 20);
  ctx.restore();
}

export function drawTitleScreen(ctx, W, H, highScore) {
  ctx.fillStyle = 'rgba(0,0,0,0.6)';
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#ffdd00';
  ctx.font = 'bold 56px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('DUCK HUNT', W / 2, H / 2 - 60);
  ctx.fillStyle = '#fff';
  ctx.font = '24px monospace';
  ctx.fillText('Click to Start', W / 2, H / 2 + 10);
  ctx.font = '18px monospace';
  ctx.fillText(`HIGH SCORE: ${highScore}`, W / 2, H / 2 + 50);
  ctx.textAlign = 'left';
}

export function drawRoundStart(ctx, W, H, round) {
  ctx.fillStyle = 'rgba(0,0,0,0.55)';
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#ffdd00';
  ctx.font = 'bold 40px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(`ROUND ${round}`, W / 2, H / 2);
  ctx.textAlign = 'left';
}

export function drawGameOver(ctx, W, H, score, highScore) {
  ctx.fillStyle = 'rgba(0,0,0,0.7)';
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#ff4444';
  ctx.font = 'bold 52px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('GAME OVER', W / 2, H / 2 - 60);
  ctx.fillStyle = '#fff';
  ctx.font = '26px monospace';
  ctx.fillText(`SCORE: ${score}`, W / 2, H / 2);
  ctx.fillText(`BEST:  ${highScore}`, W / 2, H / 2 + 40);
  ctx.textAlign = 'left';
  drawButton(ctx, BUTTONS.restart(W, H), '↺  RESTART');
}

export function drawPaused(ctx, W, H) {
  ctx.fillStyle = 'rgba(0,0,0,0.55)';
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#ffdd00';
  ctx.font = 'bold 48px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('PAUSED', W / 2, H / 2 - 20);
  ctx.textAlign = 'left';
  drawButton(ctx, BUTTONS.resume(W, H),  '▶  RESUME');
  drawButton(ctx, BUTTONS.restart(W, H), '↺  RESTART', 'rgba(255,100,100,0.9)');
}

export function drawPauseButton(ctx, paused, W) {
  const btn = BUTTONS.pause(W);
  ctx.fillStyle = 'rgba(0,0,0,0.4)';
  ctx.beginPath();
  ctx.roundRect(btn.x, btn.y, btn.w, btn.h, 4);
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.font = '18px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(paused ? '▶' : '⏸', btn.x + btn.w / 2, btn.y + btn.h / 2 + 6);
  ctx.textAlign = 'left';
}

export function drawMuteButton(ctx, muted, W) {
  const btn = BUTTONS.mute(W);
  ctx.fillStyle = 'rgba(0,0,0,0.4)';
  ctx.beginPath();
  ctx.roundRect(btn.x, btn.y, btn.w, btn.h, 4);
  ctx.fill();
  ctx.fillStyle = muted ? '#888' : '#fff';
  ctx.font = '18px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(muted ? '🔇' : '🔊', btn.x + btn.w / 2, btn.y + btn.h / 2 + 6);
  ctx.textAlign = 'left';
}
