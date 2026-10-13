class TerrainGen {
  // Returns terrain data for a run.
  // seed: integer
  // difficultyScale: 0.0–1.0 (increases per run)
  // Returns: { points: [{x,y}], pads: [{x,y,width,multiplier,startIdx,endIdx}], obstacles: [...] }
  static generate(seed, difficultyScale = 0) {
    const rng = TerrainGen._rng(seed);
    const cols = CONFIG.TERRAIN_COLS;
    const heights = TerrainGen._midpointDisplace(cols, rng, 0.55);

    // Scale heights to canvas y range
    const range = CONFIG.TERRAIN_BOT - CONFIG.TERRAIN_TOP;
    const points = Array.from(heights).map((h, i) => ({
      x: Math.round((i / cols) * CONFIG.W),
      y: Math.round(CONFIG.TERRAIN_TOP + h * range * 0.65 + range * 0.1),
    }));

    // Insert flat landing pads
    const padCount = CONFIG.PAD_COUNT_MIN +
      Math.floor(rng() * (CONFIG.PAD_COUNT_MAX - CONFIG.PAD_COUNT_MIN + 1));
    const pads = TerrainGen._insertPads(points, padCount, rng, difficultyScale);

    // Place obstacles after pads are settled
    const obstacles = TerrainGen._placeObstacles(points, pads, rng, difficultyScale);

    return { points, pads, obstacles };
  }

  // Seeded mulberry32 PRNG — returns function () => [0,1)
  static _rng(seed) {
    let s = seed >>> 0;
    return () => {
      s = (s + 0x9e3779b9) >>> 0;
      let t = s ^ (s >>> 16);
      t = Math.imul(t, 0x21f0aaad) >>> 0;
      t = t ^ (t >>> 15);
      t = Math.imul(t, 0x735a2d97) >>> 0;
      return ((t ^ (t >>> 15)) >>> 0) / 4294967296;
    };
  }

  // Midpoint displacement on cols+1 points, returns normalized heights [0,1]
  static _midpointDisplace(cols, rng, roughness) {
    const n = cols + 1;
    const h = new Float32Array(n);
    h[0] = 0.4 + rng() * 0.2;
    h[cols] = 0.4 + rng() * 0.2;

    function displace(lo, hi, scale) {
      if (hi - lo <= 1) return;
      const mid = (lo + hi) >> 1;
      h[mid] = (h[lo] + h[hi]) / 2 + (rng() - 0.5) * scale;
      h[mid] = Math.max(0.05, Math.min(0.95, h[mid]));
      displace(lo, mid, scale * roughness);
      displace(mid, hi, scale * roughness);
    }

    displace(0, cols, 1.0);
    return h;
  }

  // Inserts flat pads into points array; returns pad descriptors
  static _insertPads(points, count, rng, difficultyScale) {
    const pads = [];
    const cols = points.length - 1;
    // Shuffle pad definitions and pick `count` of them
    const defs = [...CONFIG.PAD_DEFS].sort(() => rng() - 0.5).slice(0, count);

    // Divide terrain into zones, place one pad per zone
    const zoneWidth = Math.floor(cols / count);

    defs.forEach((def, i) => {
      const zoneStart = i * zoneWidth + 2;
      const zoneEnd   = (i + 1) * zoneWidth - 2;
      const startIdx  = zoneStart + Math.floor(rng() * (zoneEnd - zoneStart));
      const pixelWidth = def.width;
      const segWidth  = CONFIG.W / cols;
      const segCount  = Math.max(1, Math.round(pixelWidth / segWidth));
      const endIdx    = Math.min(startIdx + segCount, cols);

      // Average the y at this zone for a flat surface
      const avgY = (points[startIdx].y + points[endIdx].y) / 2;
      // Clamp pad y so it's not too high or too low
      const padY = Math.max(CONFIG.TERRAIN_TOP + 80, Math.min(CONFIG.TERRAIN_BOT - 60, avgY));

      for (let j = startIdx; j <= endIdx; j++) {
        points[j].y = padY;
      }

      pads.push({
        x: points[startIdx].x,
        y: padY,
        width: points[endIdx].x - points[startIdx].x,
        multiplier: def.multiplier,
        startIdx,
        endIdx,
      });
    });

    return pads;
  }

  // Places rocks (static) and satellites (moving) avoiding pad zones
  static _placeObstacles(points, pads, rng, difficultyScale) {
    const obstacles = [];
    const rockCount = 2 + Math.floor(difficultyScale * 4);
    const satCount  = 1 + Math.floor(difficultyScale * 2);

    // Build set of x ranges occupied by pads
    const padRanges = pads.map(p => [p.x - 20, p.x + p.width + 20]);
    const isNearPad = x => padRanges.some(([lo, hi]) => x >= lo && x <= hi);

    for (let i = 0; i < rockCount; i++) {
      let x, attempts = 0;
      do { x = 40 + rng() * (CONFIG.W - 80); attempts++; } while (isNearPad(x) && attempts < 20);
      const col = Math.floor((x / CONFIG.W) * CONFIG.TERRAIN_COLS);
      const terrainY = points[Math.min(col, points.length - 1)].y;
      obstacles.push({ type: 'rock', x, y: terrainY - 8 - rng() * 10, r: 6 + rng() * 8 });
    }

    for (let i = 0; i < satCount; i++) {
      obstacles.push({
        type: 'satellite',
        x: rng() * CONFIG.W,
        y: CONFIG.TERRAIN_TOP + 20 + rng() * (CONFIG.TERRAIN_BOT - CONFIG.TERRAIN_TOP - 100),
        vx: (rng() - 0.5) * 1.2,
        w: 20, h: 8,
      });
    }

    return obstacles;
  }
}
