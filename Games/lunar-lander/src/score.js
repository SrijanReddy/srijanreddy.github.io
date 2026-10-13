class ScoreSystem {
  constructor() {
    this.score     = 0;
    this.highScore = parseInt(localStorage.getItem('ll_highscore') || '0', 10);
  }

  reset() {
    this.score = 0;
  }

  // Called on successful landing. Returns points earned this landing.
  addLanding(pad, vy, fuelRemaining) {
    const points = ScoreSystem.calcLanding(pad, vy, fuelRemaining);
    this.score  += points;
    return points;
  }

  saveHighScore() {
    if (this.score > this.highScore) {
      this.highScore = this.score;
      localStorage.setItem('ll_highscore', String(this.highScore));
    }
  }

  // Pure calculation — used by both addLanding and tests
  static calcLanding(pad, vy, fuelRemaining) {
    let points = 1000 * pad.multiplier;
    if (Math.abs(vy) < CONFIG.SPEED_BONUS_THRESHOLD) {
      points += CONFIG.SPEED_BONUS;
    }
    points += Math.floor(fuelRemaining * CONFIG.FUEL_BONUS_RATE);
    return points;
  }
}
