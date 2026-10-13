# Frogger: Nature Hop 🐸

[![Play Demo](https://img.shields.io/badge/Play-Demo-success?style=for-the-badge&logo=github)](https://alfredang.github.io/Frogger-game/)

![Frogger Preview](assets/images/preview.png)

A cute, modern, and polished Frogger-style game built with vanilla HTML, CSS, and JavaScript. Help the frog cross the busy road and dangerous river to reach safety!

## Features
- 🎮 **Classic Gameplay**: Dodge cars and hop on logs
- 🎨 **Cute Aesthetic**: Modern vector-style graphics and pastel colors
- 📱 **Responsive**: Playable on desktop and tablet
- 🔊 **Sound Effects**: Audio feedback for jumps, collisions, and winning
- 🏆 **Score System**: Track your score and lives

## How to Play
- **Arrow Keys** or **WASD** to move
- **P** to Pause

## Getting Started

### 1. Clone Git and Run Locally
Clone the repository and open `index.html` in your browser:
```bash
git clone https://github.com/alfredang/Frogger-game.git
cd Frogger-game
# Open index.html in your default browser
open index.html 
```

### 2. Run with Docker (from Docker Hub)
Pull the pre-built image from Docker Hub and run it:
```bash
docker pull tertiaryinfotech/frogger-game:latest
docker run -d -p 8080:80 tertiaryinfotech/frogger-game:latest
```
Access the game at `http://localhost:8080`.

### 3. Build Image Locally and Run
Build the image from the source code:
```bash
docker build -t frogger-game .
docker run -d -p 8081:80 frogger-game
```
Access the game at `http://localhost:8081`.

