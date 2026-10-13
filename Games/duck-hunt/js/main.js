import { drawBackground, drawClouds } from './renderer.js';
import { Duck } from './duck.js';
import { Dog } from './dog.js';
import { InputHandler, drawCrosshair } from './input.js';
import { Audio } from './audio.js';
import { drawHUD, drawTitleScreen, drawRoundStart, drawGameOver, drawMuteButton, drawPauseButton, drawBangEffect, drawPaused, BUTTONS } from './ui.js';

const CANVAS_W = 800;
const CANVAS_H = 600;
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.width = CANVAS_W;
canvas.height = CANVAS_H;

function resize() {
  const scale = Math.min(window.innerWidth / CANVAS_W, window.innerHeight / CANVAS_H);
  canvas.style.width = `${CANVAS_W * scale}px`;
  canvas.style.height = `${CANVAS_H * scale}px`;
}
window.addEventListener('resize', resize);
resize();

const STATE = {
  TITLE: 'TITLE',
  ROUND_START: 'ROUND_START',
  PLAYING: 'PLAYING',
  DOG_LAUGH: 'DOG_LAUGH',
  DOG_RETRIEVE: 'DOG_RETRIEVE',
  ROUND_END: 'ROUND_END',
  GAME_OVER: 'GAME_OVER',
};

const game = {
  state: STATE.TITLE,
  paused: false,
  round: 1,
  score: 0,
  highScore: parseInt(localStorage.getItem('duckHuntHighScore') || '0'),
  shotsLeft: 3,
  ducksThisRound: 1,
  ducksHit: 0,
  ducksMissed: 0,
  consecutiveMisses: 0,
  stateTimer: 0,
  ducks: [],
  dog: null,
  bangEffects: [],
};

function restartGame() {
  game.paused = false;
  game.round = 1;
  game.score = 0;
  game.consecutiveMisses = 0;
  game.ducks = [];
  game.bangEffects = [];
  game.dog = new Dog(CANVAS_W, CANVAS_H);
  setState(STATE.TITLE);
}

// Keyboard shortcuts still work as convenience
window.addEventListener('keydown', (e) => {
  if (e.key === 'p' || e.key === 'P' || e.key === 'Escape') {
    const pauseable = [STATE.PLAYING, STATE.DOG_LAUGH, STATE.DOG_RETRIEVE, STATE.ROUND_START];
    if (pauseable.includes(game.state)) game.paused = !game.paused;
  }
  if (e.key === 'r' || e.key === 'R') restartGame();
});

game.dog = new Dog(CANVAS_W, CANVAS_H);
const input = new InputHandler(canvas);

function getDucksForRound(round) {
  return round >= 5 ? 2 : 1;
}

function spawnDucks() {
  const count = getDucksForRound(game.round);
  game.ducksThisRound = count;
  game.ducksHit = 0;
  game.ducksMissed = 0;
  game.shotsLeft = 3 * count;
  game.ducks = [];
  for (let i = 0; i < count; i++) {
    game.ducks.push(new Duck(CANVAS_W, CANVAS_H, game.round));
  }
}

function setState(newState) {
  game.state = newState;
  game.stateTimer = 0;
}

function startRound() {
  spawnDucks();
  setState(STATE.PLAYING);
}

function update(dt) {
  game.stateTimer += dt;
  game.dog.update(dt);

  // Decay bang effects
  game.bangEffects = game.bangEffects.filter(e => {
    e.timer -= dt;
    return e.timer > 0;
  });

  if (game.state === STATE.TITLE) {
    const click = input.consumeClick();
    if (click) {
      game.round = 1;
      game.score = 0;
      game.consecutiveMisses = 0;
      setState(STATE.ROUND_START);
      Audio.titleMusic();
    }
    return;
  }

  if (game.state === STATE.ROUND_START) {
    if (game.stateTimer > 2.0) startRound();
    return;
  }

  if (game.state === STATE.PLAYING) {
    const click = input.consumeClick();

    if (click && game.shotsLeft > 0) {
      Audio.gunshot();
      game.shotsLeft--;
      let hit = false;
      for (const duck of game.ducks) {
        if (duck.shoot(click.x, click.y)) {
          hit = true;
          game.ducksHit++;
          game.score += 100 * game.round;
          game.bangEffects.push({ x: click.x, y: click.y, timer: 0.6 });
          Audio.duckHit();
          break;
        }
      }

      // Out of shots with ducks still flying — dog laughs
      if (game.shotsLeft === 0 && game.ducks.every(d => d.state === 'flying')) {
        game.consecutiveMisses++;
        game.dog.showLaugh();
        Audio.dogLaugh();
        setState(STATE.DOG_LAUGH);
        return;
      }
    }

    // Update ducks
    for (const duck of game.ducks) {
      duck.update(dt);
    }

    // Check if all ducks resolved (fallen off screen or escaped)
    const allResolved = game.ducks.every(d => d.isOffScreen() || d.escaped);
    if (allResolved) {
      if (game.ducksHit > 0) {
        game.consecutiveMisses = 0;
        game.dog.showRetrieve();
        Audio.dogRetrieve();
        setState(STATE.DOG_RETRIEVE);
      } else {
        game.consecutiveMisses++;
        game.dog.showLaugh();
        Audio.dogLaugh();
        setState(STATE.DOG_LAUGH);
      }
    }
    return;
  }

  if (game.state === STATE.DOG_LAUGH) {
    // Replay laugh audio every 1.4 seconds
    if (Math.floor(game.stateTimer / 0.8) > Math.floor((game.stateTimer - dt) / 0.8)) {
      Audio.dogLaugh();
    }
  }

  if (game.state === STATE.DOG_LAUGH || game.state === STATE.DOG_RETRIEVE) {
    if (game.dog.state === 'hidden' && game.stateTimer > 0.5) {
      if (game.consecutiveMisses >= 3) {
        if (game.score > game.highScore) {
          game.highScore = game.score;
          localStorage.setItem('duckHuntHighScore', game.highScore);
        }
        Audio.gameOver();
        setState(STATE.GAME_OVER);
      } else {
        game.round++;
        setState(STATE.ROUND_START);
      }
    }
    return;
  }

  if (game.state === STATE.GAME_OVER) {
    input.consumeClick(); // consume clicks (handled by button click listener)
    return;
  }
}

function draw() {
  ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
  drawBackground(ctx, CANVAS_W, CANVAS_H);
  drawClouds(ctx, totalTime);

  for (const duck of game.ducks) duck.draw(ctx);
  game.dog.draw(ctx);

  for (const e of game.bangEffects) {
    drawBangEffect(ctx, e.x, e.y, e.timer / 0.6);
  }

  if (game.state !== STATE.TITLE) {
    drawHUD(ctx, game, CANVAS_W, CANVAS_H);
  }

  if (game.state === STATE.TITLE) {
    drawTitleScreen(ctx, CANVAS_W, CANVAS_H, game.highScore);
  } else if (game.state === STATE.ROUND_START) {
    drawRoundStart(ctx, CANVAS_W, CANVAS_H, game.round);
  } else if (game.state === STATE.GAME_OVER) {
    drawGameOver(ctx, CANVAS_W, CANVAS_H, game.score, game.highScore);
  }

  if (game.paused) drawPaused(ctx, CANVAS_W, CANVAS_H);
  if (game.state !== STATE.TITLE && game.state !== STATE.GAME_OVER) {
    drawPauseButton(ctx, game.paused, CANVAS_W);
  }
  drawMuteButton(ctx, Audio.muted, CANVAS_W);
  drawCrosshair(ctx, input.mouseX, input.mouseY);
}

function hitButton(btn, x, y) {
  return x >= btn.x && x <= btn.x + btn.w && y >= btn.y && y <= btn.y + btn.h;
}

// Button click handler
canvas.addEventListener('click', (e) => {
  const rect = canvas.getBoundingClientRect();
  const x = (e.clientX - rect.left) * (canvas.width / rect.width);
  const y = (e.clientY - rect.top) * (canvas.height / rect.height);

  // Mute button — always active
  if (hitButton(BUTTONS.mute(CANVAS_W), x, y)) {
    Audio.muted = !Audio.muted;
    return;
  }

  // Pause button — visible during gameplay
  if (!game.paused && game.state !== STATE.TITLE && game.state !== STATE.GAME_OVER) {
    if (hitButton(BUTTONS.pause(CANVAS_W), x, y)) {
      const pauseable = [STATE.PLAYING, STATE.DOG_LAUGH, STATE.DOG_RETRIEVE, STATE.ROUND_START];
      if (pauseable.includes(game.state)) { game.paused = true; return; }
    }
  }

  // Pause screen buttons
  if (game.paused) {
    if (hitButton(BUTTONS.resume(CANVAS_W, CANVAS_H), x, y))  { game.paused = false; return; }
    if (hitButton(BUTTONS.restart(CANVAS_W, CANVAS_H), x, y)) { restartGame(); return; }
    return; // block other clicks while paused
  }

  // Game over restart button
  if (game.state === STATE.GAME_OVER) {
    if (hitButton(BUTTONS.restart(CANVAS_W, CANVAS_H), x, y) && game.stateTimer > 1.0) {
      restartGame();
      return;
    }
  }
});

let lastTime = 0;
let totalTime = 0;
function gameLoop(timestamp) {
  const dt = Math.min((timestamp - lastTime) / 1000, 0.05);
  lastTime = timestamp;
  if (!game.paused) {
    totalTime += dt;
    update(dt);
  }
  draw();
  requestAnimationFrame(gameLoop);
}

requestAnimationFrame((timestamp) => {
  lastTime = timestamp;
  requestAnimationFrame(gameLoop);
});
