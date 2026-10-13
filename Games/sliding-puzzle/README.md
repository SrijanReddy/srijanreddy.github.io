# 🧩 OpenClaw Puzzle Game

[![GitHub Pages](https://img.shields.io/badge/demo-live-brightgreen?style=for-the-badge&logo=github)](https://alfredang.github.io/openclaw-puzzle-game/)
[![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/HTML)
[![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/CSS)
[![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)](LICENSE)

A modern, sleek sliding puzzle game (n-puzzle) with a dark cyberpunk aesthetic. Built with zero dependencies — just pure HTML, CSS, and JavaScript.

## 🎮 [▶ Play Now](https://alfredang.github.io/openclaw-puzzle-game/)

---

## About

The classic **sliding puzzle** (also known as the 15-puzzle) challenges you to arrange numbered tiles in order by sliding them into an empty space. This implementation features multiple grid sizes, a built-in timer, move counter, personal best tracking, and a satisfying confetti celebration when you win.

---

## ✨ Features

- **Multiple Difficulties** — 3×3 (Easy), 4×4 (Classic), 5×5 (Hard)
- **Move Counter & Timer** — Track your solving performance
- **Personal Best Tracking** — Saved to local storage per difficulty
- **Visual Feedback** — Correctly placed tiles glow green
- **Win Celebration** — Confetti animation on completion 🎉
- **Responsive Design** — Fully playable on mobile, tablet, and desktop
- **Dark Cyberpunk Theme** — Easy on the eyes, beautiful to look at
- **Guaranteed Solvable** — Shuffles use valid moves so every puzzle is solvable

---

## 🕹️ How to Play

1. **Select difficulty** — Choose 3×3, 4×4, or 5×5 from the dropdown
2. **Click/tap a tile** adjacent to the empty space to slide it
3. **Arrange all tiles** in numerical order (1, 2, 3... from top-left)
4. **Beat your best time** — Your records are saved automatically

> 💡 **Tip:** Start by solving the top row first, then work your way down row by row.

---

## 📁 File Structure

```
openclaw-puzzle-game/
├── index.html                  # Main HTML entry point
├── css/
│   └── style.css               # All styles, animations, responsive design
├── js/
│   └── game.js                 # Game logic, rendering, state management
├── .github/
│   └── workflows/
│       └── deploy.yml          # GitHub Actions → GitHub Pages deployment
├── README.md                   # You are here
└── LICENSE                     # MIT License
```

---

## 🚀 Tech Stack

| Technology | Purpose |
|------------|---------|
| **HTML5** | Semantic markup and structure |
| **CSS3** | Dark theme, CSS Grid layout, animations, transitions |
| **JavaScript (ES6+)** | Game logic, DOM manipulation, local storage |
| **GitHub Actions** | CI/CD pipeline for automatic deployment |
| **GitHub Pages** | Free static site hosting |

**Zero dependencies. No build tools. No frameworks.** Just clean, modern web standards.

---

## 🛠️ Local Development

```bash
# Clone the repo
git clone https://github.com/alfredang/openclaw-puzzle-game.git
cd openclaw-puzzle-game

# Open in browser (any method works)
open index.html
# or
python3 -m http.server 8080
```

---

## 🤖 Acknowledgements

Built with the assistance of **[OpenClaw](https://openclaw.ai)** — an AI-powered agent platform that turns ideas into reality. This entire project was created, deployed, and managed through OpenClaw's autonomous agent capabilities.

- 🌐 [OpenClaw Website](https://openclaw.ai)
- 📖 [OpenClaw Docs](https://docs.openclaw.ai)
- 💬 [OpenClaw Discord](https://discord.com/invite/clawd)
- 🐙 [OpenClaw GitHub](https://github.com/openclaw/openclaw)

---

## 📄 License

MIT — do whatever you want with it.
