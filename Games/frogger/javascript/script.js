/**
 * Frogger: Nature Hop
 * Main Game Script
 */

const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');

// Game Constants
const GRID_SIZE = 40; // Size of one grid square
const COLS = 14; // 560px / 40
const ROWS = 16; // 640px / 40 (Top 1 goal, 15 play area)
// Canvas size: 560x640

// Colors
const COLOR_GRASS = '#81c784';
const COLOR_ROAD = '#546e7a';
const COLOR_WATER = '#4fc3f7';
const COLOR_GOAL = '#ffd54f'; // Safe zones at top
const COLOR_FROG = '#43a047'; // Fallback if no image

// Game States
const GAME_STATE = {
    START: 0,
    PLAYING: 1,
    PAUSED: 2,
    GAME_OVER: 3,
    LEVEL_COMPLETE: 4
};

class SoundManager {
    constructor() {
        this.sounds = {
            jump: new Audio('assets/sounds/jump.mp3'),
            collision: new Audio('assets/sounds/collision.mp3'),
            win: new Audio('assets/sounds/win.mp3'),
            gameover: new Audio('assets/sounds/gameover.mp3'),
            click: new Audio('assets/sounds/click.mp3')
        };
        // Preload and adjust volume
        for (let key in this.sounds) {
            this.sounds[key].volume = 0.3;
            // Catch errors if files don't exist or permissions block
            this.sounds[key].onerror = () => console.log(`Sound ${key} failed to load`);
        }
    }

    play(name) {
        try {
            if (this.sounds[name]) {
                this.sounds[name].currentTime = 0;
                this.sounds[name].play().catch(e => console.log('Audio play blocked:', e));
            }
        } catch (e) {
            console.log('Audio error:', e);
        }
    }
}

const soundManager = new SoundManager();

// --- CLASSES ---


class Frog {
    constructor() {
        this.reset();
        this.width = GRID_SIZE * 0.8;
        this.height = GRID_SIZE * 0.8;
        this.image = null; // To be implemented if we add assets
    }

    reset() {
        // Start at bottom center
        this.x = (COLS / 2) * GRID_SIZE; // Center roughly
        this.y = (ROWS - 1) * GRID_SIZE;
        this.speed = GRID_SIZE;
        this.moving = false;
        this.direction = 'up';
    }

    draw() {
        ctx.fillStyle = COLOR_FROG;

        ctx.save();
        ctx.translate(this.x + GRID_SIZE / 2, this.y + GRID_SIZE / 2);

        // Simple Frog Shape (Circle + Legs)
        ctx.beginPath();
        ctx.arc(0, 0, this.width / 2, 0, Math.PI * 2);
        ctx.fill();

        // Eyes
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(-8, -8, 6, 0, Math.PI * 2);
        ctx.arc(8, -8, 6, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = 'black';
        ctx.beginPath();
        ctx.arc(-8, -8, 2, 0, Math.PI * 2);
        ctx.arc(8, -8, 2, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }

    move(dir) {
        if (game.state !== GAME_STATE.PLAYING) return;

        switch (dir) {
            case 'up':
                if (this.y > 0) this.y -= this.speed;
                break;
            case 'down':
                if (this.y < (ROWS - 1) * GRID_SIZE) this.y += this.speed;
                break;
            case 'left':
                if (this.x > 0) this.x -= this.speed;
                break;
            case 'right':
                if (this.x < (COLS - 1) * GRID_SIZE) this.x += this.speed;
                break;
        }
        soundManager.play('jump');
        // Snap to grid just in case
        this.x = Math.round(this.x / GRID_SIZE) * GRID_SIZE;
        this.y = Math.round(this.y / GRID_SIZE) * GRID_SIZE;
    }
}

class Obstacle {
    constructor(x, y, width, speed, type) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = GRID_SIZE;
        this.speed = speed;
        this.type = type; // 'car', 'log', 'turtle'
    }

    update() {
        this.x += this.speed;

        // Wrap around logic
        if (this.speed > 0 && this.x > canvas.width) {
            this.x = -this.width;
        } else if (this.speed < 0 && this.x + this.width < 0) {
            this.x = canvas.width;
        }
    }

    draw() {
        if (this.type === 'car') {
            ctx.fillStyle = '#ef5350'; // Red car default
            // Car Body
            ctx.fillRect(this.x + 2, this.y + 5, this.width - 4, this.height - 10);
            // Roof
            ctx.fillStyle = '#e57373';
            ctx.fillRect(this.x + 10, this.y + 8, this.width - 20, this.height - 16);
        } else if (this.type === 'log') {
            ctx.fillStyle = '#795548'; // Brown log
            ctx.fillRect(this.x, this.y + 5, this.width, this.height - 10);
        } else if (this.type === 'turtle') {
            ctx.fillStyle = '#66bb6a'; // Green turtle
            // Draw multiple circles for turtles
            let numTurtles = Math.floor(this.width / GRID_SIZE);
            for (let i = 0; i < numTurtles; i++) {
                ctx.beginPath();
                ctx.arc(this.x + i * GRID_SIZE + GRID_SIZE / 2, this.y + GRID_SIZE / 2, GRID_SIZE / 2 - 4, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    }
}

class Particle {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.size = Math.random() * 5 + 2;
        this.speedX = Math.random() * 4 - 2;
        this.speedY = Math.random() * 4 - 2;
        this.life = 30;
    }
    update() {
        this.x += this.speedX;
        this.y += this.speedY;
        this.life--;
    }
    draw() {
        ctx.fillStyle = this.color;
        ctx.globalAlpha = this.life / 30;
        ctx.fillRect(this.x, this.y, this.size, this.size);
        ctx.globalAlpha = 1;
    }
}

class Game {
    constructor() {
        this.state = GAME_STATE.START;
        this.score = 0;
        this.lives = 3;
        this.level = 1;
        this.gameSpeed = 1;

        this.frog = new Frog();
        this.obstacles = [];
        this.particles = [];

        // UI Elements
        this.scoreEl = document.getElementById('score');
        this.livesEl = document.getElementById('lives');
        this.levelEl = document.getElementById('level');

        // Define Lanes
        // Rows 0: Goal
        // Rows 1-6: River (Water)
        // Rows 7: Grass (Safe)
        // Rows 8-12: Road
        // Rows 13-14: Grass (Start)
        // Row 15: Start Position

        this.lanes = [
            { type: 'goal', y: 0 },
            { type: 'water', y: 1 * GRID_SIZE, speed: 2, obsType: 'log', width: 3 },
            { type: 'water', y: 2 * GRID_SIZE, speed: -1.5, obsType: 'turtle', width: 2 },
            { type: 'water', y: 3 * GRID_SIZE, speed: 2.5, obsType: 'log', width: 4 },
            { type: 'water', y: 4 * GRID_SIZE, speed: -2, obsType: 'turtle', width: 3 },
            { type: 'water', y: 5 * GRID_SIZE, speed: 1.8, obsType: 'log', width: 2 },
            { type: 'grass', y: 6 * GRID_SIZE },
            { type: 'road', y: 7 * GRID_SIZE, speed: -2, obsType: 'car', width: 1 },
            { type: 'road', y: 8 * GRID_SIZE, speed: 2.5, obsType: 'car', width: 1 },
            { type: 'road', y: 9 * GRID_SIZE, speed: -3, obsType: 'car', width: 1 },
            { type: 'road', y: 10 * GRID_SIZE, speed: 1.5, obsType: 'car', width: 2 }, // Truck
            { type: 'road', y: 11 * GRID_SIZE, speed: -2.2, obsType: 'car', width: 1 },
            { type: 'grass', y: 12 * GRID_SIZE },
            { type: 'grass', y: 13 * GRID_SIZE },
            { type: 'grass', y: 14 * GRID_SIZE },
            { type: 'grass', y: 15 * GRID_SIZE }, // Start area
        ];

        this.initInput();
        this.setupLevel();

        // Start loop
        requestAnimationFrame((t) => this.loop(t));
    }

    initInput() {
        document.addEventListener('keydown', (e) => {
            if (this.state === GAME_STATE.PLAYING) {
                switch (e.key) {
                    case 'ArrowUp':
                    case 'w':
                    case 'W':
                        this.frog.move('up'); break;
                    case 'ArrowDown':
                    case 's':
                    case 'S':
                        this.frog.move('down'); break;
                    case 'ArrowLeft':
                    case 'a':
                    case 'A':
                        this.frog.move('left'); break;
                    case 'ArrowRight':
                    case 'd':
                    case 'D':
                        this.frog.move('right'); break;
                    case 'p':
                    case 'P':
                        this.togglePause(); break;
                }
            }
        });

        document.getElementById('start-btn').addEventListener('click', () => { soundManager.play('click'); this.startGame(); });
        document.getElementById('restart-btn').addEventListener('click', () => { soundManager.play('click'); this.restartGame(); });
        document.getElementById('pause-btn').addEventListener('click', () => { soundManager.play('click'); this.togglePause(); });
        document.getElementById('resume-btn').addEventListener('click', () => { soundManager.play('click'); this.togglePause(); });
    }

    setupLevel() {
        this.obstacles = [];
        this.lanes.forEach(lane => {
            if (lane.type === 'road' || lane.type === 'water') {
                let count = Math.floor(Math.random() * 2) + 2; // 2-3 obstacles per lane
                let spacing = canvas.width / count;
                for (let i = 0; i < count; i++) {
                    let offset = Math.random() * 100;
                    this.obstacles.push(new Obstacle(
                        i * spacing + offset,
                        lane.y,
                        lane.width * GRID_SIZE,
                        lane.speed * (this.level * 0.2 + 0.8), // Speed increases with level
                        lane.obsType
                    ));
                }
            }
        });
    }

    startGame() {
        this.state = GAME_STATE.PLAYING;
        this.score = 0;
        this.lives = 3;
        this.level = 1;
        this.updateUI();
        document.getElementById('start-screen').classList.add('hidden');
        document.getElementById('game-over-screen').classList.add('hidden');
        this.resetLevel();
    }

    restartGame() {
        this.startGame();
    }

    resetLevel() {
        this.frog.reset();
        this.setupLevel();
    }

    togglePause() {
        if (this.state === GAME_STATE.PLAYING) {
            this.state = GAME_STATE.PAUSED;
            document.getElementById('pause-screen').classList.remove('hidden');
        } else if (this.state === GAME_STATE.PAUSED) {
            this.state = GAME_STATE.PLAYING;
            document.getElementById('pause-screen').classList.add('hidden');
        }
    }

    updateUI() {
        this.scoreEl.innerText = this.score;
        this.levelEl.innerText = this.level;
        this.livesEl.innerText = '❤️'.repeat(Math.max(0, this.lives));
    }

    checkCollisions() {
        // 1. Water Logic
        let onLog = false;
        let frogRect = {
            x: this.frog.x + 10, // Small buffer
            y: this.frog.y + 10,
            w: this.frog.width - 20,
            h: this.frog.height - 20
        };

        let inWaterLane = false;

        for (let obs of this.obstacles) {
            // AABB Collision
            let obsRect = { x: obs.x, y: obs.y, w: obs.width, h: obs.height };

            if (frogRect.x < obsRect.x + obsRect.w &&
                frogRect.x + frogRect.w > obsRect.x &&
                frogRect.y < obsRect.y + obsRect.h &&
                frogRect.y + frogRect.h > obsRect.y) {

                if (obs.type === 'car') {
                    this.handleDeath();
                    return;
                } else if (obs.type === 'log' || obs.type === 'turtle') {
                    onLog = true;
                    this.frog.x += obs.speed; // Move frog with log
                }
            }
        }

        // Check if frog is in water area
        if (this.frog.y >= GRID_SIZE && this.frog.y < 6 * GRID_SIZE) {
            inWaterLane = true;
        }

        if (inWaterLane && !onLog) {
            this.handleDeath();
        }

        // Check Walls
        if (this.frog.x < 0 || this.frog.x + this.frog.width > canvas.width) {
            this.handleDeath(); // Fell off screen (while on log mainly)
        }

        // Check Win
        if (this.frog.y < GRID_SIZE) {
            this.handleWin();
        }
    }

    handleDeath() {
        soundManager.play('collision');
        this.createParticles(this.frog.x + GRID_SIZE / 2, this.frog.y + GRID_SIZE / 2, '#ef5350');
        this.lives--;
        this.updateUI();
        if (this.lives <= 0) {
            this.gameOver();
        } else {
            this.frog.reset();
        }
    }

    handleWin() {
        soundManager.play('win');
        this.score += 100 + (this.lives * 10);
        this.level++;
        this.createParticles(this.frog.x + GRID_SIZE / 2, this.frog.y + GRID_SIZE / 2, '#ffd54f');
        this.updateUI();

        // Show Level Complete briefly
        let levelScreen = document.getElementById('level-complete-screen');
        levelScreen.classList.remove('hidden');
        this.state = GAME_STATE.LEVEL_COMPLETE;

        setTimeout(() => {
            levelScreen.classList.add('hidden');
            this.resetLevel();
            this.state = GAME_STATE.PLAYING;
        }, 1500);
    }

    gameOver() {
        soundManager.play('gameover');
        this.state = GAME_STATE.GAME_OVER;
        document.getElementById('final-score').innerText = this.score;
        document.getElementById('game-over-screen').classList.remove('hidden');
    }

    createParticles(x, y, color) {
        for (let i = 0; i < 10; i++) {
            this.particles.push(new Particle(x, y, color));
        }
    }

    drawBackground() {
        // Clear
        ctx.fillStyle = COLOR_GRASS;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Water
        ctx.fillStyle = COLOR_WATER;
        ctx.fillRect(0, GRID_SIZE, canvas.width, 5 * GRID_SIZE);

        // Road
        ctx.fillStyle = COLOR_ROAD;
        ctx.fillRect(0, 7 * GRID_SIZE, canvas.width, 5 * GRID_SIZE);

        // Road Markers
        ctx.strokeStyle = '#90a4ae';
        ctx.setLineDash([20, 20]);
        for (let i = 1; i < 5; i++) {
            ctx.beginPath();
            ctx.moveTo(0, (7 + i) * GRID_SIZE);
            ctx.lineTo(canvas.width, (7 + i) * GRID_SIZE);
            ctx.stroke();
        }
        ctx.setLineDash([]);

        // Goal zones
        for (let i = 0; i < COLS; i += 2) {
            ctx.fillStyle = COLOR_GOAL;
            ctx.fillRect(i * GRID_SIZE, 0, GRID_SIZE, GRID_SIZE);

            ctx.fillStyle = '#2e7d32'; // Bush separators
            ctx.fillRect((i + 1) * GRID_SIZE, 0, GRID_SIZE, GRID_SIZE);
        }
    }

    loop(timestamp) {
        if (this.state === GAME_STATE.PLAYING || this.state === GAME_STATE.LEVEL_COMPLETE) {
            // Update
            if (this.state === GAME_STATE.PLAYING) {
                this.obstacles.forEach(obs => obs.update());
                // Particles
                this.particles.forEach((p, index) => {
                    p.update();
                    if (p.life <= 0) this.particles.splice(index, 1);
                });

                this.checkCollisions();
            }

            // Draw
            this.drawBackground();
            this.obstacles.forEach(obs => obs.draw());
            this.frog.draw();
            this.particles.forEach(p => p.draw());
        }

        requestAnimationFrame((t) => this.loop(t));
    }
}

// Initialize Game
const game = new Game();
