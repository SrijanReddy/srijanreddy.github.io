const CONFIG = {
  // Canvas
  W: 800,
  H: 600,

  // Physics (units: pixels/frame at 60fps)
  GRAVITY: 0.05,           // px/frame²
  THRUST_FORCE: 0.14,      // px/frame² (main engine)
  RETRO_FORCE: 0.07,       // px/frame² (W key upward boost)
  ROTATE_SPEED: 0.045,     // radians/frame
  MAX_LAND_V_SPEED: 2.5,   // px/frame max vertical speed for safe landing
  MAX_LAND_ANGLE: 0.26,    // ~15° in radians, max tilt for safe landing
  FUEL_CAPACITY: 1000,
  FUEL_THRUST_RATE: 1.8,   // fuel units per frame (main thrust)
  FUEL_RETRO_RATE: 0.9,    // fuel units per frame (retro boost)
  FUEL_ROTATE_RATE: 0.3,   // fuel units per frame (rotation)

  // Wind
  WIND_BASE: 0.008,        // base horizontal force amplitude
  WIND_PERIOD: 420,        // frames per wind cycle

  // Terrain
  TERRAIN_COLS: 64,        // number of horizontal segments
  TERRAIN_TOP: 180,        // minimum terrain y (top of terrain area)
  TERRAIN_BOT: 560,        // maximum terrain y (floor)
  PAD_DEFS: [
    { width: 80, multiplier: 1 },
    { width: 60, multiplier: 2 },
    { width: 40, multiplier: 5 },
    { width: 24, multiplier: 10 },
  ],
  PAD_COUNT_MIN: 3,
  PAD_COUNT_MAX: 5,

  // Lander
  SPRITE_SCALE: 3,         // pixel art drawn at 3× size
  LANDER_START_X: 400,
  LANDER_START_Y: 60,
  LIVES_START: 3,

  // Scoring
  SPEED_BONUS_THRESHOLD: 1.0, // px/frame — below this gets speed bonus
  SPEED_BONUS: 500,
  FUEL_BONUS_RATE: 1,         // points per fuel unit remaining

  // Colors (hex strings)
  COLOR_BG: '#000000',
  COLOR_TERRAIN: '#00cc00',
  COLOR_TERRAIN_FILL: '#003300',
  COLOR_PAD: '#00ff88',
  COLOR_HUD: '#00ff00',
  COLOR_LANDER: '#00ee00',
  COLOR_WINDOW: '#00ccff',
  COLOR_FLAME: '#ff8800',
  COLOR_FLAME_CORE: '#ffff88',
  COLOR_OBSTACLE: '#888888',
  COLOR_SATELLITE: '#aaaacc',
};
