// Game canvas and context
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Game state
let gameState = {
    score: 0,
    level: 1,
    isGameOver: false,
    bases: [],
    cities: [],
    enemyMissiles: [],
    playerMissiles: [],
    explosions: []
};

// Add sound element reference at the top with other constants
const explosionSound = document.getElementById('explosionSound');

// Add sound loading verification
explosionSound.addEventListener('error', (e) => {
    console.error('Error loading explosion sound:', e);
});

// Ensure audio can play
function playExplosionSound() {
    try {
        // Create and play a new audio instance each time
        const soundClone = explosionSound.cloneNode();
        soundClone.volume = 0.3;  // Reduced volume to 30%
        
        // Reset the sound to the beginning
        soundClone.currentTime = 0;
        
        // Play the sound with a promise to handle autoplay restrictions
        const playPromise = soundClone.play();
        
        if (playPromise !== undefined) {
            playPromise.catch(error => {
                console.error('Error playing explosion sound:', error);
            });
        }
    } catch (e) {
        console.error('Error with explosion sound:', e);
    }
}

// Initialize game
function initGame() {
    // Initialize bases (3 bases at the bottom: left, center, right)
    const basePositions = [
        { x: 80, y: canvas.height - 15 },  // Left base
        { x: canvas.width / 2, y: canvas.height - 15 },  // Center base
        { x: canvas.width - 80, y: canvas.height - 15 }  // Right base
    ];

    basePositions.forEach(pos => {
        gameState.bases.push({
            x: pos.x,
            y: pos.y,
            width: 30,
            height: 25,
            isDestroyed: false
        });
    });

    // Initialize cities (6 cities between the bases)
    const cityPositions = [
        canvas.width * 0.2,
        canvas.width * 0.3,
        canvas.width * 0.4,
        canvas.width * 0.6,
        canvas.width * 0.7,
        canvas.width * 0.8
    ];

    cityPositions.forEach(x => {
        gameState.cities.push({
            x: x,
            y: canvas.height - 20,
            width: 20,
            height: 25,
            isDestroyed: false
        });
    });
}

// Game loop
function gameLoop() {
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Update game state
    updateGame();

    // Draw game elements
    drawGame();

    // Continue game loop if not game over
    if (!gameState.isGameOver) {
        requestAnimationFrame(gameLoop);
    }
}

// Update game state
function updateGame() {
    // Update enemy missiles
    updateEnemyMissiles();

    // Update player missiles
    updatePlayerMissiles();

    // Update explosions
    updateExplosions();

    // Check collisions
    checkCollisions();
}

// Draw game elements
function drawGame() {
    // Draw bases
    drawBases();

    // Draw cities
    drawCities();

    // Draw enemy missiles
    drawEnemyMissiles();

    // Draw player missiles
    drawPlayerMissiles();

    // Draw explosions
    drawExplosions();

    // Draw score
    drawScore();
}

// Event listeners
canvas.addEventListener('click', handleClick);

// Handle click events
function handleClick(event) {
    if (gameState.isGameOver) return;

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    // Find nearest base and launch missile
    const nearestBase = findNearestBase(x, y);
    if (nearestBase && !nearestBase.isDestroyed) {
        launchPlayerMissile(nearestBase, x, y);
    }
}

// Drawing functions
function drawBases() {
    // Draw ground line first
    ctx.strokeStyle = '#0066FF';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, canvas.height - 10);
    ctx.lineTo(canvas.width, canvas.height - 10);
    ctx.stroke();

    gameState.bases.forEach(base => {
        if (!base.isDestroyed) {
            // Draw base (triangular structure)
            ctx.fillStyle = '#0066FF';
            ctx.beginPath();
            ctx.moveTo(base.x, base.y - base.height);  // Top point
            ctx.lineTo(base.x - base.width/2, base.y);  // Bottom left
            ctx.lineTo(base.x + base.width/2, base.y);  // Bottom right
            ctx.closePath();
            ctx.fill();

            // Draw base platform
            ctx.fillRect(
                base.x - base.width/1.5, 
                base.y, 
                base.width * 1.3, 
                base.height/3
            );
        }
    });
}

function drawCities() {
    gameState.cities.forEach(city => {
        if (!city.isDestroyed) {
            ctx.fillStyle = '#ffffff';
            const x = city.x;
            const y = city.y;
            const baseWidth = city.width * 2;  // Make the city wider
            
            // Draw multiple buildings for each city
            // Tall center building (like Empire State)
            ctx.fillRect(x - 4, y - 35, 8, 35);  // Main body
            ctx.beginPath();  // Spire
            ctx.moveTo(x - 2, y - 35);
            ctx.lineTo(x, y - 45);
            ctx.lineTo(x + 2, y - 35);
            ctx.fill();
            
            // Windows for center building
            ctx.fillStyle = '#000000';
            for(let i = 0; i < 5; i++) {
                ctx.fillRect(x - 3, y - 32 + (i * 7), 2, 2);
                ctx.fillRect(x + 1, y - 32 + (i * 7), 2, 2);
            }
            ctx.fillStyle = '#ffffff';

            // Left buildings
            ctx.fillRect(x - baseWidth/2, y - 15, 10, 15);  // Small building
            ctx.fillRect(x - baseWidth/2 + 12, y - 25, 10, 25);  // Medium building
            
            // Right buildings
            ctx.fillRect(x + baseWidth/2 - 10, y - 20, 10, 20);  // Medium building
            ctx.fillRect(x + baseWidth/2 - 22, y - 30, 10, 30);  // Tall building

            // Windows for side buildings
            ctx.fillStyle = '#000000';
            // Left buildings windows
            for(let i = 0; i < 2; i++) {
                ctx.fillRect(x - baseWidth/2 + 2, y - 12 + (i * 5), 2, 2);
                ctx.fillRect(x - baseWidth/2 + 6, y - 12 + (i * 5), 2, 2);
            }
            for(let i = 0; i < 3; i++) {
                ctx.fillRect(x - baseWidth/2 + 14, y - 22 + (i * 7), 2, 2);
                ctx.fillRect(x - baseWidth/2 + 18, y - 22 + (i * 7), 2, 2);
            }
            
            // Right buildings windows
            for(let i = 0; i < 3; i++) {
                ctx.fillRect(x + baseWidth/2 - 8, y - 17 + (i * 5), 2, 2);
                ctx.fillRect(x + baseWidth/2 - 4, y - 17 + (i * 5), 2, 2);
            }
            for(let i = 0; i < 4; i++) {
                ctx.fillRect(x + baseWidth/2 - 20, y - 27 + (i * 7), 2, 2);
                ctx.fillRect(x + baseWidth/2 - 16, y - 27 + (i * 7), 2, 2);
            }
        }
    });
}

function drawEnemyMissiles() {
    gameState.enemyMissiles.forEach(missile => {
        // Draw the trail (behind the missile)
        const gradient = ctx.createLinearGradient(missile.x, missile.y - 160, missile.x, missile.y);
        gradient.addColorStop(0, 'rgba(255, 0, 0, 0)');
        gradient.addColorStop(1, 'rgba(255, 0, 0, 0.8)');
        
        ctx.strokeStyle = gradient;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(missile.x, missile.y - 160);
        ctx.lineTo(missile.x, missile.y);
        ctx.stroke();

        // Draw the missile shape (pointing downward)
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.moveTo(missile.x, missile.y + 8);
        ctx.lineTo(missile.x - 3, missile.y);
        ctx.lineTo(missile.x + 3, missile.y);
        ctx.closePath();
        ctx.fill();
    });
}

function drawPlayerMissiles() {
    gameState.playerMissiles.forEach(missile => {
        // Calculate missile angle based on velocity
        const angle = Math.atan2(missile.dy, missile.dx);
        
        // Draw the trail
        const trailLength = 160;
        const gradient = ctx.createLinearGradient(
            missile.x - Math.cos(angle) * trailLength,
            missile.y - Math.sin(angle) * trailLength,
            missile.x,
            missile.y
        );
        gradient.addColorStop(0, 'rgba(255, 255, 255, 0)');
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0.8)');
        
        ctx.strokeStyle = gradient;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(
            missile.x - Math.cos(angle) * trailLength,
            missile.y - Math.sin(angle) * trailLength
        );
        ctx.lineTo(missile.x, missile.y);
        ctx.stroke();

        // Save the current context state
        ctx.save();
        
        // Move to missile position and rotate
        ctx.translate(missile.x, missile.y);
        ctx.rotate(angle);
        
        // Draw the missile body (white)
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        // Main body (pointed)
        ctx.moveTo(8, 0);  // Nose
        ctx.lineTo(-8, -4);  // Bottom left
        ctx.lineTo(-8, 4);  // Bottom right
        ctx.closePath();
        ctx.fill();
        
        // Draw fins
        ctx.beginPath();
        // Left fin
        ctx.moveTo(-8, -4);
        ctx.lineTo(-12, -6);
        ctx.lineTo(-8, -2);
        // Right fin
        ctx.moveTo(-8, 4);
        ctx.lineTo(-12, 6);
        ctx.lineTo(-8, 2);
        ctx.fill();
        
        // Restore the context state
        ctx.restore();
    });
}

function drawExplosions() {
    gameState.explosions.forEach(explosion => {
        ctx.beginPath();
        ctx.arc(explosion.x, explosion.y, explosion.radius, 0, Math.PI * 2);
        if (explosion.color === 'white') {
            // White explosion with fade out
            ctx.fillStyle = `rgba(255, 255, 255, ${0.8 * (explosion.life/50)})`;
        } else {
            // Regular yellow explosion
            ctx.fillStyle = `rgba(255, 255, 0, ${1 - explosion.life/100})`;
        }
        ctx.fill();
    });
}

function drawScore() {
    ctx.fillStyle = '#ffffff';
    ctx.font = '20px Arial';
    ctx.fillText(`Score: ${gameState.score}`, 10, 30);
    ctx.fillText(`Level: ${gameState.level}`, 10, 60);
}

// Game mechanics functions
function updateEnemyMissiles() {
    // Spawn new enemy missiles
    if (Math.random() < 0.02) {
        spawnEnemyMissile();
    }

    // Update existing missiles
    gameState.enemyMissiles.forEach(missile => {
        missile.y += missile.speed;
    });

    // Remove missiles that have gone off screen
    gameState.enemyMissiles = gameState.enemyMissiles.filter(missile => missile.y < canvas.height);
}

function spawnEnemyMissile() {
    const target = Math.random() < 0.5 ? 
        gameState.cities[Math.floor(Math.random() * gameState.cities.length)] :
        gameState.bases[Math.floor(Math.random() * gameState.bases.length)];

    if (target && !target.isDestroyed) {
        gameState.enemyMissiles.push({
            x: Math.random() * canvas.width,
            y: 0,
            speed: 0.5 + gameState.level * 0.125,
            target: target
        });
    }
}

function updatePlayerMissiles() {
    gameState.playerMissiles.forEach(missile => {
        missile.x += missile.dx;
        missile.y += missile.dy;
    });

    // Remove missiles that have gone off screen
    gameState.playerMissiles = gameState.playerMissiles.filter(missile => 
        missile.x >= 0 && missile.x <= canvas.width &&
        missile.y >= 0 && missile.y <= canvas.height
    );
}

function updateExplosions() {
    gameState.explosions.forEach(explosion => {
        if (explosion.maxRadius) {
            // For player missile explosions
            explosion.radius += (explosion.maxRadius - explosion.radius) * 0.1;
        } else {
            // For regular explosions
            explosion.radius += 0.5;
        }
        explosion.life--;
    });

    // Remove dead explosions
    gameState.explosions = gameState.explosions.filter(explosion => explosion.life > 0);
}

function checkCollisions() {
    const MISSILE_LENGTH = 20;  // Length of a missile for distance calculations
    const EXPLOSION_SIZE = MISSILE_LENGTH * 5;  // Explosion size is 5x missile length

    // Check player missiles against enemy missiles
    gameState.playerMissiles.forEach((playerMissile, playerIndex) => {
        gameState.enemyMissiles.forEach((enemyMissile, enemyIndex) => {
            const dx = playerMissile.x - enemyMissile.x;
            const dy = playerMissile.y - enemyMissile.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < MISSILE_LENGTH * 2) { // Within 2 missile lengths
                // Create large white explosion
                gameState.explosions.push({
                    x: playerMissile.x,
                    y: playerMissile.y,
                    radius: 5,
                    maxRadius: EXPLOSION_SIZE,
                    life: 50,
                    color: 'white'
                });
                
                // Play explosion sound with new function
                playExplosionSound();
                
                // Remove the player missile
                gameState.playerMissiles.splice(playerIndex, 1);

                // Check if this explosion catches any other enemy missiles
                const explosionX = playerMissile.x;
                const explosionY = playerMissile.y;
                
                // Filter out enemy missiles caught in the explosion
                gameState.enemyMissiles = gameState.enemyMissiles.filter((otherMissile, idx) => {
                    const dxOther = otherMissile.x - explosionX;
                    const dyOther = otherMissile.y - explosionY;
                    const distanceOther = Math.sqrt(dxOther * dxOther + dyOther * dyOther);
                    
                    if (distanceOther <= EXPLOSION_SIZE) {
                        gameState.score += 100;
                        return false;  // Remove this missile
                    }
                    return true;  // Keep this missile
                });
            }
        });
    });

    // Check enemy missiles against explosions
    gameState.enemyMissiles.forEach((missile, missileIndex) => {
        gameState.explosions.forEach(explosion => {
            const dx = missile.x - explosion.x;
            const dy = missile.y - explosion.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < explosion.radius) {
                gameState.enemyMissiles.splice(missileIndex, 1);
                gameState.score += 100;
            }
        });
    });

    // Check enemy missiles against cities and bases
    gameState.enemyMissiles.forEach((missile, missileIndex) => {
        // Check cities
        gameState.cities.forEach(city => {
            if (!city.isDestroyed && checkCollision(missile, city)) {
                city.isDestroyed = true;
                gameState.enemyMissiles.splice(missileIndex, 1);
            }
        });

        // Check bases
        gameState.bases.forEach(base => {
            if (!base.isDestroyed && checkCollision(missile, base)) {
                base.isDestroyed = true;
                gameState.enemyMissiles.splice(missileIndex, 1);
            }
        });
    });
}

function checkCollision(missile, target) {
    return missile.x >= target.x - target.width/2 &&
           missile.x <= target.x + target.width/2 &&
           missile.y >= target.y - target.height/2 &&
           missile.y <= target.y + target.height/2;
}

function findNearestBase(x, y) {
    let nearest = null;
    let minDistance = Infinity;

    gameState.bases.forEach(base => {
        if (!base.isDestroyed) {
            const dx = x - base.x;
            const dy = y - base.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            if (distance < minDistance) {
                minDistance = distance;
                nearest = base;
            }
        }
    });

    return nearest;
}

function launchPlayerMissile(base, targetX, targetY) {
    const dx = targetX - base.x;
    const dy = targetY - base.y;
    const length = Math.sqrt(dx * dx + dy * dy);
    
    gameState.playerMissiles.push({
        x: base.x,
        y: base.y,
        dx: (dx / length) * 3.5,  // Reduced speed by 50% (from 7 to 3.5)
        dy: (dy / length) * 3.5
    });

    // Create explosion at launch point
    gameState.explosions.push({
        x: base.x,
        y: base.y,
        radius: 5,
        life: 20
    });
}

// Start the game
initGame();
gameLoop(); 