# Centipede

A faithful browser-based recreation of the classic Centipede arcade game. Single self-contained HTML file — no dependencies, no build step, no install.

## How to Play

Open `centipede.html` in any modern browser.

### Controls

| Key | Action |
|-----|--------|
| Arrow keys / `W` `A` `S` `D` | Move |
| `space` | Fire |
| `P` / `esc` | Pause |

### Objective

Shoot the centipede as it winds down through the mushroom field. Destroy all segments to clear the wave. Avoid the centipede, spiders, fleas, and scorpions.

### Enemies

- **Centipede** — descends through the field, splitting when hit. Head segments score 100 points, body segments 10.
- **Spider** — bounces erratically through the player zone. Proximity scoring: 900 (close), 600 (mid), 300 (far).
- **Flea** — drops vertically, planting mushrooms as it falls. 200 points.
- **Scorpion** — crosses the screen horizontally, poisoning mushrooms it touches. Poisoned mushrooms cause centipede segments to plunge straight to the bottom. 1,000 points.

### Mechanics

- Mushrooms take 4 hits to destroy (1 point each). Damaged mushrooms are restored between lives (5 points each).
- Extra life awarded every 12,000 points.
- 14 colour palette themes that cycle as you progress through waves.
- High scores (top 10) are saved to localStorage with name entry.

## Technical Details

- ~1,070 lines of vanilla JavaScript
- HTML5 Canvas rendering at 60fps with device pixel ratio scaling
- Web Audio API for all sound effects (synthesised, no audio files)
- Responsive — scales to fit the browser window
- Zero external dependencies

---

Centipede is provided by [Jorvik Software](https://jorviksoftware.cc/). If you find it useful, consider [buying me a coffee](https://jorviksoftware.cc/donate).
