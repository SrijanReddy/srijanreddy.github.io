// Procedural level generation, after Murase, Matsubara & Hiraga,
// "Automatic Making of Sokoban Problems" (1996).
//
// The paper's pipeline is generate -> check -> evaluate: stamp templates onto a
// prototype warehouse, throw away unsolvable candidates with a solver, then score
// what is left. We keep the template stamping (stage 1) and the scoring criteria
// (stage 3), but lay out the boxes by searching backwards from the solved
// position using PULL moves instead of placing them forward. Every position
// reached that way is solvable by construction, and its BFS depth is exactly the
// optimal number of pushes -- which makes the paper's checking stage unnecessary.

const WALL = 0;
const FLOOR = 1;

// --- Seeded RNG -----------------------------------------------------
// mulberry32: same seed -> same level set, forever.
export function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const pick = (rng, list) => list[(rng() * list.length) | 0];

function shuffle(rng, list) {
  const out = list.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = (rng() * (i + 1)) | 0;
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

// --- Stage 1: outline generation -------------------------------------
// The paper's templates are all larger than 2x2 -- 1x3 strips produce boring
// corridors. '.' carves passway, '#' leaves a wall core inside the patch.
const TEMPLATES = [
  ["...", "...", "..."],
  ["....", "....", "...."],
  ["...", "...", "...", "..."],
  ["...", ".#.", "..."],
  ["....", ".##.", "...."],
  ["..", ".."],
  [".....", ".....", "....."],
  ["....", "....", "....", "...."],
  ["....", ".#..", "..#.", "...."],
];

function rotate(tpl) {
  const h = tpl.length;
  const w = tpl[0].length;
  const out = [];
  for (let x = 0; x < w; x++) {
    let row = "";
    for (let y = h - 1; y >= 0; y--) row += tpl[y][x];
    out.push(row);
  }
  return out;
}

const countFloor = (cells) => cells.reduce((n, v) => n + v, 0);

// Size of the single largest connected passway.
function largestRegionSize(cells, W) {
  const start = cells.indexOf(FLOOR);
  if (start < 0) return 0;
  const seen = new Uint8Array(cells.length);
  const stack = [start];
  const steps = [-W, W, -1, 1];
  seen[start] = 1;
  let n = 0;
  while (stack.length) {
    const c = stack.pop();
    n++;
    for (const d of steps) {
      const nb = c + d;
      if (cells[nb] === FLOOR && !seen[nb]) {
        seen[nb] = 1;
        stack.push(nb);
      }
    }
  }
  return n;
}

// Stamp templates at random until the warehouse is grown. A stamp is only kept
// if the passway stays a single connected area -- that is the paper's "position
// the templates to overlap existing passways" rule, enforced rather than assumed.
function buildRoom(rng, w, h, stamps) {
  const W = w + 2;
  const H = h + 2;
  const cells = new Uint8Array(W * H); // starts as solid wall

  const stampInto = (target, tpl, ox, oy) => {
    for (let y = 0; y < tpl.length; y++) {
      for (let x = 0; x < tpl[y].length; x++) {
        target[(oy + y) * W + ox + x] = tpl[y][x] === "." ? FLOOR : WALL;
      }
    }
  };

  const randomStamp = () => {
    let tpl = pick(rng, TEMPLATES);
    for (let r = (rng() * 4) | 0; r > 0; r--) tpl = rotate(tpl);
    const tw = tpl[0].length;
    const th = tpl.length;
    if (tw > w || th > h) return null;
    return {
      tpl,
      ox: 1 + ((rng() * (w - tw + 1)) | 0),
      oy: 1 + ((rng() * (h - th + 1)) | 0),
    };
  };

  for (let tries = 0; tries < 60 && countFloor(cells) === 0; tries++) {
    const s = randomStamp();
    if (s) stampInto(cells, s.tpl, s.ox, s.oy);
  }
  if (countFloor(cells) === 0) return null;

  for (let n = 1; n < stamps; n++) {
    for (let tries = 0; tries < 40; tries++) {
      const s = randomStamp();
      if (!s) continue;
      const next = cells.slice();
      stampInto(next, s.tpl, s.ox, s.oy);
      const floors = countFloor(next);
      if (floors >= 6 && largestRegionSize(next, W) === floors) {
        cells.set(next);
        break;
      }
    }
  }
  return { W, H, cells };
}

// Shrink-wrap the warehouse to its passway plus a one-cell wall ring.
function cropRoom(room) {
  const { W, H, cells } = room;
  let x0 = W;
  let y0 = H;
  let x1 = -1;
  let y1 = -1;
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      if (!cells[y * W + x]) continue;
      if (x < x0) x0 = x;
      if (x > x1) x1 = x;
      if (y < y0) y0 = y;
      if (y > y1) y1 = y;
    }
  }
  if (x1 < 0) return null;
  x0--;
  y0--;
  x1++;
  y1++;
  const nW = x1 - x0 + 1;
  const nH = y1 - y0 + 1;
  const nCells = new Uint8Array(nW * nH);
  const floors = [];
  for (let y = 0; y < nH; y++) {
    for (let x = 0; x < nW; x++) {
      const v = cells[(y + y0) * W + (x + x0)];
      nCells[y * nW + x] = v;
      if (v) floors.push(y * nW + x);
    }
  }
  return { W: nW, H: nH, cells: nCells, floors };
}

// --- Stage 2: backwards search from the solved position --------------
// A forward push has the keeper at p step onto p+d, driving the box from p+d to
// p+2d. Inverted, that is a PULL: given a box at b whose neighbour b-d the
// keeper can reach, the box comes back to b-d and the keeper ends up at b-2d.
// Breadth-first over pulls, so a position found at depth k needs exactly k
// pushes to solve.
function reverseSearch(room, goals, targetDepth, stateCap) {
  const { W, cells, floors } = room;
  const size = cells.length;
  const DIRS = [-W, W, -1, 1];
  const boxAt = new Uint8Array(size);
  const buf = new Int32Array(size);

  // Two stamped flood fills: A holds the keeper's area in the position being
  // expanded, B is scratch for canonicalising each child.
  const seenA = new Int32Array(size);
  const seenB = new Int32Array(size);
  let stampA = 0;
  let stampB = 0;

  function floodA(start) {
    stampA++;
    let sp = 0;
    buf[sp++] = start;
    seenA[start] = stampA;
    while (sp) {
      const c = buf[--sp];
      for (let k = 0; k < 4; k++) {
        const n = c + DIRS[k];
        if (seenA[n] !== stampA && cells[n] === FLOOR && !boxAt[n]) {
          seenA[n] = stampA;
          buf[sp++] = n;
        }
      }
    }
  }

  // Returns the lowest cell index in the area -- two positions that differ only
  // in where the keeper stands inside one area are the same position.
  function floodB(start) {
    stampB++;
    let sp = 0;
    let min = start;
    buf[sp++] = start;
    seenB[start] = stampB;
    while (sp) {
      const c = buf[--sp];
      if (c < min) min = c;
      for (let k = 0; k < 4; k++) {
        const n = c + DIRS[k];
        if (seenB[n] !== stampB && cells[n] === FLOOR && !boxAt[n]) {
          seenB[n] = stampB;
          buf[sp++] = n;
        }
      }
    }
    return min;
  }

  const sortedGoals = goals.slice().sort((a, b) => a - b);
  const nodes = new Map();
  const queue = [];

  // Solved position: every box on a goal, keeper anywhere. Boxes may split the
  // passway, so seed one root per keeper area.
  for (const g of sortedGoals) boxAt[g] = 1;
  const covered = new Uint8Array(size);
  for (const f of floors) {
    if (boxAt[f] || covered[f]) continue;
    const min = floodB(f);
    for (const c of floors) if (seenB[c] === stampB) covered[c] = 1;
    const key = `${sortedGoals.join(",")}|${min}`;
    const root = { key, boxes: sortedGoals, player: min, depth: 0, parent: null, push: null };
    nodes.set(key, root);
    queue.push(root);
  }
  for (const g of sortedGoals) boxAt[g] = 0;

  let head = 0;
  while (head < queue.length && nodes.size < stateCap) {
    const node = queue[head++];
    if (node.depth >= targetDepth) break; // breadth-first: everything after is deeper

    for (const b of node.boxes) boxAt[b] = 1;
    floodA(node.player);

    for (let bi = 0; bi < node.boxes.length; bi++) {
      const b = node.boxes[bi];
      for (let k = 0; k < 4; k++) {
        const d = DIRS[k];
        const behind = b - d; // where the box is pulled back to
        const away = b - 2 * d; // where the keeper ends up
        if (cells[behind] !== FLOOR || boxAt[behind] || seenA[behind] !== stampA) continue;
        if (cells[away] !== FLOOR || boxAt[away]) continue;

        const boxes = node.boxes.slice();
        boxes[bi] = behind;
        boxes.sort((x, y) => x - y);

        boxAt[b] = 0;
        boxAt[behind] = 1;
        const min = floodB(away);
        boxAt[behind] = 0;
        boxAt[b] = 1;

        const key = `${boxes.join(",")}|${min}`;
        if (nodes.has(key)) continue;
        const child = {
          key,
          boxes,
          player: min,
          depth: node.depth + 1,
          parent: node,
          // Read forwards: keeper stands on `from`, pushes along `dir`, and the
          // box travels `boxFrom` -> `boxTo`.
          push: { from: away, dir: d, boxFrom: behind, boxTo: b },
        };
        nodes.set(key, child);
        queue.push(child);
      }
    }
    for (const b of node.boxes) boxAt[b] = 0;
  }

  return queue;
}

// --- Stage 3: evaluation ---------------------------------------------
// Steps the keeper needs to walk between two cells, boxes blocking the way.
// Returns -1 if there is no route.
function walkDistance(room, boxes, from, to) {
  if (from === to) return 0;
  const { W, cells } = room;
  const DIRS = [-W, W, -1, 1];
  const dist = new Int32Array(cells.length).fill(-1);
  const queue = [from];
  dist[from] = 0;
  for (let head = 0; head < queue.length; head++) {
    const c = queue[head];
    for (const d of DIRS) {
      const n = c + d;
      if (dist[n] !== -1 || cells[n] !== FLOOR || boxes.has(n)) continue;
      dist[n] = dist[c] + 1;
      if (n === to) return dist[n];
      queue.push(n);
    }
  }
  return -1;
}

// Replays the optimal solution and measures the paper's three criteria:
// solution length, changes of push direction, and detours (switching box).
function evaluate(room, node) {
  const steps = [];
  for (let cur = node; cur.parent; cur = cur.parent) steps.push(cur.push);
  if (steps.length === 0) return null;

  const boxes = new Set(node.boxes);
  let player = steps[0].from;
  let moves = 0;
  let dirChanges = 0;
  let detours = 0;
  let lastDir = null;
  let lastBoxTo = null;

  for (const step of steps) {
    const walk = walkDistance(room, boxes, player, step.from);
    if (walk < 0) return null; // unreachable: should not happen, but never ship it
    moves += walk + 1; // walk to the box, then the push itself
    boxes.delete(step.boxFrom);
    boxes.add(step.boxTo);
    player = step.boxFrom;
    if (lastDir !== null && step.dir !== lastDir) dirChanges++;
    if (lastBoxTo !== null && lastBoxTo !== step.boxFrom) detours++;
    lastDir = step.dir;
    lastBoxTo = step.boxTo;
  }

  return { pushes: steps.length, moves, dirChanges, detours, start: steps[0].from };
}

// --- Level assembly ---------------------------------------------------
// Tile characters understood by decodeLevel() in sokoban.js.
const CH_EMPTY = " ";
const CH_WALL = "#";
const CH_FLOOR = ":";
const CH_GOAL = "o";
const CH_BOX = "H";
const CH_BOX_ON_GOAL = "B";
const CH_PLAYER = "@";
const CH_PLAYER_ON_GOAL = "X";

function describe(room, boxes, goals, player, cols, rows) {
  const { W, H, cells } = room;
  const grid = Array.from({ length: rows }, () => new Array(cols).fill(CH_EMPTY));
  const offX = Math.floor((cols - W) / 2);
  const offY = Math.floor((rows - H) / 2);

  const touchesFloor = (x, y) => {
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        const nx = x + dx;
        const ny = y + dy;
        if (nx >= 0 && nx < W && ny >= 0 && ny < H && cells[ny * W + nx] === FLOOR) return true;
      }
    }
    return false;
  };

  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const i = y * W + x;
      let ch;
      if (cells[i] !== FLOOR) {
        // Only draw walls that hug the play area; the rest stays background.
        ch = touchesFloor(x, y) ? CH_WALL : CH_EMPTY;
      } else if (i === player) {
        ch = goals.has(i) ? CH_PLAYER_ON_GOAL : CH_PLAYER;
      } else if (boxes.has(i)) {
        ch = goals.has(i) ? CH_BOX_ON_GOAL : CH_BOX;
      } else {
        ch = goals.has(i) ? CH_GOAL : CH_FLOOR;
      }
      grid[offY + y][offX + x] = ch;
    }
  }
  return grid.map((row) => row.join("")).join(",");
}

// One generation attempt: outline, goals, backwards search, evaluation.
function makeCandidate(rng, params, cols, rows) {
  const outline = buildRoom(rng, params.width, params.height, params.stamps);
  if (!outline) return null;
  const room = cropRoom(outline);
  if (!room || room.W > cols || room.H > rows) return null;
  if (room.floors.length < params.minFloor || room.floors.length <= params.boxes * 3) return null;

  const goals = shuffle(rng, room.floors).slice(0, params.boxes);
  const reached = reverseSearch(room, goals, params.targetDepth, params.stateCap);
  if (reached.length === 0) return null;

  // Prefer the deepest position in which no box already sits on a goal --
  // a level that starts half-solved reads as trivial however long its solution.
  const goalSet = new Set(goals);
  let best = [];
  let bestDepth = -1;
  for (const node of reached) {
    if (node.depth < bestDepth) continue;
    if (node.boxes.some((b) => goalSet.has(b))) continue;
    if (node.depth > bestDepth) {
      bestDepth = node.depth;
      best = [];
    }
    best.push(node);
  }
  if (best.length === 0) return null;

  const chosen = pick(rng, best);
  const metrics = evaluate(room, chosen);
  if (!metrics) return null;
  // The paper's floor for a non-trivial problem, relaxed a little so the early
  // levels of the ramp still have somewhere to sit.
  if (metrics.pushes < 5 || metrics.dirChanges < 2) return null;

  const difficulty =
    metrics.pushes +
    2 * metrics.dirChanges +
    3 * metrics.detours +
    6 * params.boxes +
    Math.round(room.floors.length / 6);

  return {
    description: describe(room, new Set(chosen.boxes), goalSet, metrics.start, cols, rows),
    maxMoves: Math.ceil(metrics.moves * 2.5) + 20,
    boxes: params.boxes,
    pushes: metrics.pushes,
    moves: metrics.moves,
    dirChanges: metrics.dirChanges,
    detours: metrics.detours,
    difficulty,
  };
}

// Warehouse size, box count and search depth all ramp with t in [0, 1], so the
// candidate pool spans easy to hard before it is sorted.
function tierParams(t) {
  return {
    width: 6 + Math.round(t * 8),
    height: 5 + Math.round(t * 6),
    stamps: 3 + Math.round(t * 4),
    boxes: 2 + Math.round(t * 3),
    targetDepth: 6 + Math.round(t * 40),
    stateCap: 4000 + Math.round(t * 66000),
    minFloor: 12 + Math.round(t * 38),
  };
}

const POOL = 40;
const MAX_ATTEMPTS = 400;

/**
 * Builds `count` levels of strictly increasing difficulty from `seed`.
 * Yields to the event loop between attempts so the page stays responsive.
 */
export async function generateLevels(seed, count, { cols, rows }, onProgress) {
  const rng = mulberry32(seed);
  const pool = [];

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const candidate = makeCandidate(rng, tierParams((attempt % POOL) / (POOL - 1)), cols, rows);
    if (candidate) pool.push(candidate);
    if (attempt % 4 === 3) {
      onProgress?.(Math.min(pool.length, count), count);
      await new Promise((resolve) => setTimeout(resolve, 0));
    }
    if (attempt >= POOL && distinctDifficulties(pool) >= count) break;
  }

  const ranked = [];
  for (const candidate of pool.sort((a, b) => a.difficulty - b.difficulty)) {
    if (!ranked.length || candidate.difficulty > ranked[ranked.length - 1].difficulty) {
      ranked.push(candidate);
    }
  }
  if (ranked.length === 0) return [];

  // Spread the picks evenly across the ranked pool: strictly increasing
  // difficulty, with the full range represented rather than the easy end.
  const wanted = Math.min(count, ranked.length);
  const levels = [];
  for (let i = 0; i < wanted; i++) {
    const spread = wanted > 1 ? Math.round((i * (ranked.length - 1)) / (wanted - 1)) : 0;
    levels.push(ranked[spread]);
  }
  onProgress?.(levels.length, count);
  return levels;
}

function distinctDifficulties(pool) {
  return new Set(pool.map((c) => c.difficulty)).size;
}
