# Duck Hunt

A pixel-art recreation of the classic Nintendo Duck Hunt game, built with vanilla JavaScript and HTML5 Canvas.

## Play Now

**Live demo:** https://duck-hunt-nintendo.netlify.app/

## Features

- **Pixel-art visuals**: Faithful sprite-based graphics with hand-crafted pixel art for ducks, dog, trees, clouds, and background
- **Classic gameplay**: Shoot ducks before they fly away — miss too many and it's game over
- **Obnoxious dog**: The dog laughs at you when you miss, with bouncing animation and repeated audio
- **Pause / Resume / Restart**: In-game UI buttons for full game control
- **Sound effects**: Gunshot, duck hit, and dog laugh audio

## Tech Stack

- Vanilla JavaScript (ES6 modules)
- HTML5 Canvas
- No dependencies

## Running Locally

```bash
git clone https://github.com/mishmish-mango/duck-hunt.git
cd duck-hunt
```

Then serve with any static file server:

```bash
npx serve .
```

Open http://localhost:3000

## Controls

- **Click** — Shoot
- **Pause button** — Pause the game
- **Resume button** — Resume after pause
- **Restart button** — Start a new game

## Project Structure

```
duck-hunt/
├── index.html
└── js/
    ├── main.js       # Game loop and state management
    ├── duck.js       # Duck behavior and movement
    ├── dog.js        # Dog laugh animation and logic
    ├── input.js      # Mouse input handling
    ├── renderer.js   # Canvas rendering
    ├── sprites.js    # Pixel-art sprite definitions
    ├── audio.js      # Sound effects
    └── ui.js         # Pause / resume / restart buttons
```
