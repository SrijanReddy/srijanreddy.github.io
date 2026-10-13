heading('ScoreSystem');

{
  const pad1  = { multiplier: 1,  x: 0, y: 0, width: 80 };
  const pad2  = { multiplier: 2,  x: 0, y: 0, width: 60 };
  const pad5  = { multiplier: 5,  x: 0, y: 0, width: 40 };
  const pad10 = { multiplier: 10, x: 0, y: 0, width: 24 };

  assert('\xD71 pad base score is 1000',
    ScoreSystem.calcLanding(pad1, 5, 0) === 1000);

  assert('\xD72 pad base score is 2000',
    ScoreSystem.calcLanding(pad2, 5, 0) === 2000);

  assert('\xD75 pad base score is 5000',
    ScoreSystem.calcLanding(pad5, 5, 0) === 5000);

  assert('\xD710 pad base score is 10000',
    ScoreSystem.calcLanding(pad10, 5, 0) === 10000);

  assert('speed bonus awarded when vy < threshold',
    ScoreSystem.calcLanding(pad1, CONFIG.SPEED_BONUS_THRESHOLD - 0.01, 0) ===
      1000 + CONFIG.SPEED_BONUS);

  assert('no speed bonus when vy >= threshold',
    ScoreSystem.calcLanding(pad1, CONFIG.SPEED_BONUS_THRESHOLD, 0) === 1000);

  assert('fuel bonus adds correct points',
    ScoreSystem.calcLanding(pad1, 5, 200) === 1000 + Math.floor(200 * CONFIG.FUEL_BONUS_RATE));

  assert('speed bonus + fuel bonus stack',
    ScoreSystem.calcLanding(pad1, 0.1, 100) ===
      1000 + CONFIG.SPEED_BONUS + Math.floor(100 * CONFIG.FUEL_BONUS_RATE));

  // ScoreSystem instance addLanding accumulates
  {
    const sc = new ScoreSystem();
    sc.score = 0;
    sc.addLanding(pad1, 5, 0);
    sc.addLanding(pad2, 5, 0);
    assert('addLanding accumulates score correctly', sc.score === 3000);
  }
}
