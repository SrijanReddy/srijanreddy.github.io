# REZO GAMING LEAGUE

A retro arcade hub — 32 classic games in one CRT-soaked cabinet. No login, no signup, no frameworks. Just insert coin and play.

**Live:** https://srijanreddy.github.io

## Play

Open `index.html`, hit the 25¢ coin (or the INSERT COIN prompt), and the catalog unlocks. Every game runs in a fullscreen-friendly cabinet frame with scanlines.

## The lineup

| Game | Genre |
|------|-------|
| Snake I & II | Snake |
| Asteroids | Shooter |
| Centipede | Shooter |
| Missile Command | Shooter |
| Battle City | Shooter |
| Duck Hunt | Shooter |
| Offline Dino | Runner |
| Futuristic Racing | Racer |
| Car Simulator | Racer |
| Flappy Bird | Arcade |
| Frogger | Arcade |
| Donkey Kong | Platformer |
| Mario | Platformer |
| Q*bert | Puzzle |
| Pacman | Maze |
| Digger | Maze |
| Sokoban | Puzzle |
| 2048 | Puzzle |
| Tetris | Puzzle |
| Hextris | Puzzle |
| Minesweeper | Puzzle |
| Sliding Puzzle | Puzzle |
| Memory Match | Puzzle |
| Simon | Memory |
| Connect Four | Strategy |
| Tower Defender | Strategy |
| Lunar Lander | Physics |
| Arkanoid Bounce | Breakout |
| Ping-Pong | Sports |
| Type Master | Typing |
| Quiz Game Show | Quiz |

## How it's built

- **Static only.** Plain HTML/CSS/JS, zero build step, zero frameworks. The homepage's old Bootstrap (4.2.1 + 4.3.1 loaded together) was replaced with a single hand-rolled stylesheet: `css/arcade.css`.
- **One shared shell.** Every game page uses the same header/footer cabinet chrome from `css/arcade.css` — neon REZO marquee, scanline overlay, hard-shadow pixel cards.
- **Games are centralized, not reinvented.** Each game lives under `Games/<slug>/` and is loaded in an iframe from its own `target_<slug>.html` page. Most games are open-source projects (credited below); a couple are external embeds (the quiz runs from CodePen).
- **Add a game:** drop its files into `Games/<slug>/`, copy any `target_*.html` as a template (swap the title, iframe src, and about text), and add a card to the grid in `index.html`.

## Credits

Games belong to their authors. Sources and licenses live with each game under `Games/<slug>/`; notable ones:

- Hextris — [hextris/hextris](https://github.com/hextris/hextris) (GPL-3.0)
- Battle City — [vgrichina/battlecity](https://github.com/vgrichina/battlecity) (MIT)
- Sokoban — [uparix/uparix.github.io](https://github.com/uparix/uparix.github.io) (MIT)
- Minesweeper — [dipanshunamdev799/minesweeper](https://github.com/dipanshunamdev799/minesweeper) (MIT)
- Sliding Puzzle — [alfredang/openclaw-puzzle-game](https://github.com/alfredang/openclaw-puzzle-game) (MIT)
- Centipede — [perpetualbeta/centipede](https://github.com/perpetualbeta/centipede) (public domain)
- Q*bert — [delosman/qbert](https://github.com/delosman/qbert) (GPL-3.0)
- Asteroids — [fernandojavascrip21-dot/claude-asteroids](https://github.com/fernandojavascrip21-dot/claude-asteroids) (no license declared)
- Frogger — [alfredang/frogger-game](https://github.com/alfredang/frogger-game) (no license declared)
- Lunar Lander — [perldude69/LunarLander](https://github.com/perldude69/LunarLander) (no license declared)
- Missile Command — [mjwoolley/missile-command](https://github.com/mjwoolley/missile-command) (no license file; README claims MIT)
- Donkey Kong — [radiandev01/donkey-kong-game](https://github.com/radiandev01/donkey-kong-game) (no license declared)
- Digger — [lutzroeder/digger](https://github.com/lutzroeder/digger) (no license declared)
- Duck Hunt — [elnagdie/duck-hunt](https://github.com/elnagdie/duck-hunt) (no license declared)
- Simon — [ayushpatel-hub/simon-game-js](https://github.com/ayushpatel-hub/simon-game-js) (no license declared)
- Connect Four — [dennistarr/games-html](https://github.com/dennistarr/games-html) (no license declared)
- Memory Match — [jrc03c/matching-game-demo](https://github.com/jrc03c/matching-game-demo) (no license declared)

Unlicensed games are included with credit to their authors; if you're an author and want yours removed or re-credited, open an issue.
