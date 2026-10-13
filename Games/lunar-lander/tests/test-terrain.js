heading('TerrainGen');

{
  const t = TerrainGen.generate(42, 0);

  assert('terrain has CONFIG.TERRAIN_COLS+1 points',
    t.points.length === CONFIG.TERRAIN_COLS + 1);

  assert('all point x values are within canvas width',
    t.points.every(p => p.x >= 0 && p.x <= CONFIG.W));

  assert('all point y values are within terrain bounds',
    t.points.every(p => p.y >= CONFIG.TERRAIN_TOP && p.y <= CONFIG.TERRAIN_BOT));

  assert('pad count is between PAD_COUNT_MIN and PAD_COUNT_MAX',
    t.pads.length >= CONFIG.PAD_COUNT_MIN && t.pads.length <= CONFIG.PAD_COUNT_MAX);

  assert('each pad has a valid multiplier',
    t.pads.every(p => [1, 2, 5, 10].includes(p.multiplier)));

  assert('each pad has positive width',
    t.pads.every(p => p.width > 0));

  assert('pad segments are flat (all y equal within pad)',
    t.pads.every(p => {
      for (let i = p.startIdx; i <= p.endIdx; i++) {
        if (Math.abs(t.points[i].y - p.y) > 1) return false;
      }
      return true;
    }));

  // Same seed produces same terrain
  const t2 = TerrainGen.generate(42, 0);
  assert('same seed produces identical point[10].y',
    t.points[10].y === t2.points[10].y);

  // Different seed produces different terrain
  const t3 = TerrainGen.generate(99, 0);
  assert('different seed produces different terrain',
    t.points[10].y !== t3.points[10].y ||
    t.points[20].y !== t3.points[20].y);

  assert('obstacles array exists', Array.isArray(t.obstacles));
  assert('obstacles have type property',
    t.obstacles.every(o => o.type === 'rock' || o.type === 'satellite'));

  // Difficulty 0 = min rocks (2) + min sats (1)
  assert('at difficulty 0 there are at least 2 obstacles', t.obstacles.length >= 2);
}
