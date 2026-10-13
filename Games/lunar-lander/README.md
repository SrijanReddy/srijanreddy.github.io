# Lunar Lander

A browser-based retro pixel art Lunar Lander game built with vanilla HTML5 Canvas and JavaScript. No dependencies, no build step — open `index.html` directly in a browser.

## Features

- Procedurally generated terrain with a shareable seed — every run is unique
- WASD + Space controls with realistic Moon-like gravity and thrust physics
- Sinusoidal wind that shifts over time and increases with progression
- Multiple landing pads with score multipliers (×1 to ×10)
- Particle effects: thrust exhaust and crash debris
- Full HUD: score, lives, fuel bar, altitude, vertical/horizontal speed, wind arrow, gravity indicator
- CRT scanline overlay (toggle with `F`)
- High score persisted via `localStorage`
- Progression system: gravity, wind, and obstacle count increase each terrain

## Controls

| Key | Action |
|-----|--------|
| `A` | Rotate left |
| `D` | Rotate right |
| `W` | Retro-boost (small upward thrust) |
| `Space` | Main thruster |
| `F` | Toggle CRT scanline overlay |

## How to Play

1. Open `index.html` in any modern browser
2. Press **Start** on the menu screen
3. Pilot the lander to a flat pad and land safely:
   - Vertical speed must be under 20 px/s
   - Orientation must be within ±15° of vertical
   - Must land on a flat pad (not terrain)
4. Manage your fuel — it does not refill between landings
5. You have 3 lives; crashing loses one. Lose all three and it's game over.

## Scoring

| Event | Points |
|-------|--------|
| Land on ×1 pad | 1,000 |
| Land on ×2 pad | 2,000 |
| Land on ×5 pad | 5,000 |
| Land on ×10 pad | 10,000 |
| Fuel bonus | +1 pt per fuel unit remaining |
| Speed bonus (V-speed < 5 px/s) | +500 |

## Architecture

Vanilla JavaScript ES6 classes, no build step required.

| Module | Responsibility |
|--------|----------------|
| `src/config.js` | All game constants |
| `src/input.js` | Key state tracking |
| `src/terrain.js` | Midpoint displacement terrain, pad insertion, obstacles |
| `src/physics.js` | Gravity, thrust, wind, collision detection |
| `src/sprites.js` | Pixel art lander frames drawn to offscreen canvas |
| `src/particles.js` | Thrust sparks and explosion debris |
| `src/renderer.js` | Canvas drawing: terrain, lander, HUD, CRT overlay |
| `src/score.js` | Points, multipliers, bonuses, localStorage high score |
| `src/state.js` | State machine + fixed-timestep game loop |
| `src/game.js` | Entry point, wires all modules |

## Tests

Open `tests/test.html` directly in a browser to run the unit test suite covering terrain generation, physics, and scoring.
