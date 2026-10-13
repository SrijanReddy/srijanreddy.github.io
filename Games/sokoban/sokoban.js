import { encode, decode } from "@toon-format/toon";
import { generateLevels } from "./levelgen.js";

// --- Board geometry -------------------------------------------------
const COLS = 18;
const ROWS = 14;
const SRC_TILE = 80; // sprite size inside images.gif
const TILE = 48; // on-screen tile size
const ORIGIN_X = 20;
const ORIGIN_Y = 20;

// --- Tile codes (also the sprite indices) ---------------------------
const EMPTY = 0;
const FLOOR = 1;
const HOLE = 2;
const PLAYER = 4;
const PLAYER_ON_HOLE = 5;
const BALL = 6;
const BALL_ON_HOLE = 7;
const HIGHEST_TILE = 8;
// Move limit per level (index 0 = level 1).
const MAX_MOVES = [200, 200, 1000, 230, 260, 470];

// A level character maps to a tile code via CHAR_CODES.indexOf(ch) % 10.
// A comma yields 9, which exceeds HIGHEST_TILE and so marks a row break.
const CHAR_CODES = " 01234567, :o#@XHB";

// The six built-in levels (originally the applets Sok1-Sok6).
const LEVELS = [
  " ,    #######, ####:::::#, #:::o###:#, #:#:#::::##, #:#:H:H#o:#, #:#::B::#:#, #:o#H:H:#:#, ##::::#:#:###,  #:###o::::@#,  #:::::##:::#,  ############",
  " , ,       ######,   #####o:::#,   #::#oo##:#,   #::Hoo:::#,   #::#:o#:##,  ###:##H#::#,  #:H::::HH:#,  #:#H#::#::#,  #@::#######,  #####",
  " ,   ##########,  ##::##::::#####, ##:::H::#:H::H:#, #:::H##::HH#:::#, #::::H:::#:::::#, #H####:#####:::#, #:#:ooooooo:@:##,##:::oBoBoBo:#:##,#:::######:###::#,#:#H:::::H::::H:#,#:::#############,#####, ",
  " ,   ####  ######,   #::####::::#,  ##B:::B:BB::#,  #:H:B::::B#:#,  #:o:::###:::#,  ######:::#@##,  #:B:o:B::BB:#,  #:::#:::#:::#,  ##B:::B:#H#:#,   #::#####:::#,   ####   #####, , ",
  " ##############, #:@:B:B:B:#::##, #H#::B:B::#:::#, #:#:B:B:B:::::#, #:#::B:B::##:##, #:#:B:B:B:##:#, #:#::B:B::##:#, #:#:B:B:B:##:#, #:#::B:B::##:#, #:#:B:o:B:##:##,##:##########::#,#::::::::::::::#,#:::#########::#,#####       ####",
  " ,  ############,  #::::o:#:::#,  #:::HB:#:H:#,  #:::#o:#:###,  #::##o#:::#, ##::##o#:H:##, #:::#:o#H#::#, #:@:#:o:::H:#, #::##:BHH#::#, #:::#:o::::##, #:::########, #####, ",
];

// --- Runtime state --------------------------------------------------
const canvas = document.getElementById("board");
canvas.width = ORIGIN_X * 2 + COLS * TILE;
canvas.height = ORIGIN_Y * 2 + ROWS * TILE;
const ctx = canvas.getContext("2d");
const statusEl = document.getElementById("status");
const levelSelect = document.getElementById("level");
const generatedSelect = document.getElementById("generated-level");
const modeSelect = document.getElementById("mode");
const seedInput = document.getElementById("seed");
const builtinControls = document.getElementById("builtin-controls");
const generatedControls = document.getElementById("generated-controls");
const movesList = document.getElementById("moves-list");
const sheet = new Image();

// Human-readable name for a [dx, dy] move, used in the panel and JSON export.
const moveName = (dx, dy) =>
  dy < 0 ? "Up" : dy > 0 ? "Down" : dx < 0 ? "Left" : "Right";

let board = [];
let playerCol = 0;
let playerRow = 0;
let levelIndex = 0;
let moveCount = 0;
let solved = false; // set by the move that finishes the level: fires the confetti once, then locks the keys

// --- Level source ----------------------------------------------------
// The game plays either the built-in levels or the current generated set;
// goToLevel() and afterMove() read these instead of LEVELS/MAX_MOVES directly.
const randomSeed = () => (Math.random() * 0x100000000) >>> 0;

let mode = "builtin";
let generated = []; // levels from the generator, easiest first
let seed = randomSeed();
let activeLevels = LEVELS;
let activeMaxMoves = MAX_MOVES;
const activeSelect = () => (mode === "generated" ? generatedSelect : levelSelect);

// --- Move recording / replay ---------------------------------------
let recordedMoves = []; // sequence of [dx, dy] for the current level
let isReplaying = false; // true while a replay is animating
let replayTimer = null; // setTimeout handle for the running replay
const REPLAY_DELAY = 250; // ms between replayed moves

// --- Level loading --------------------------------------------------
function decodeLevel(description) {
  board = Array.from({ length: ROWS }, () => new Array(COLS).fill(EMPTY));
  let col = 0;
  let row = 0;
  for (const ch of description) {
    const tile = CHAR_CODES.indexOf(ch) % 10;
    if (tile > HIGHEST_TILE || col >= COLS) {
      col = 0;
      if (++row >= ROWS) break;
    } else {
      if (tile === PLAYER || tile === PLAYER_ON_HOLE) {
        playerCol = col;
        playerRow = row;
      }
      board[row][col++] = Math.max(tile, EMPTY);
    }
  }
}

function goToLevel(index) {
  levelIndex = Math.min(Math.max(0, index), activeLevels.length - 1);
  activeSelect().selectedIndex = levelIndex;
  decodeLevel(activeLevels[levelIndex]);
  moveCount = 0;
  solved = false;
  if (!isReplaying) recordedMoves = [];
  setStatus(`Level ${levelIndex + 1} — use the arrow keys to move.`);
  render();
  renderMoves();

}

// --- Game logic -----------------------------------------------------
const isWalkable = (tile) => tile === FLOOR || tile === HOLE;

// Tile transitions (derived from the tile-code values above).
const addPlayer = (tile) => tile + 3; // FLOOR→PLAYER, HOLE→PLAYER_ON_HOLE
const removePlayer = (tile) => tile - 3; // reverse
const ballToPlayer = (tile) => tile - 2; // BALL→PLAYER, BALL_ON_HOLE→PLAYER_ON_HOLE
const addBall = (tile) => tile + 5; // FLOOR→BALL, HOLE→BALL_ON_HOLE

function canPushBall(tile, col, row, dx, dy) {
  if (tile !== BALL && tile !== BALL_ON_HOLE) return false;
  const beyond = board[row + dy][col + dx];
  return beyond === FLOOR || beyond === HOLE;
}

function tryMove(dx, dy) {
  const targetCol = playerCol + dx;
  const targetRow = playerRow + dy;
  const hereTile = board[playerRow][playerCol];
  const targetTile = board[targetRow][targetCol];

  if (isWalkable(targetTile)) {
    board[playerRow][playerCol] = removePlayer(hereTile);
    board[targetRow][targetCol] = addPlayer(targetTile);
  } else if (canPushBall(targetTile, targetCol, targetRow, dx, dy)) {
    board[playerRow][playerCol] = removePlayer(hereTile);
    board[targetRow][targetCol] = ballToPlayer(targetTile);
    board[targetRow + dy][targetCol + dx] = addBall(board[targetRow + dy][targetCol + dx]);
  } else {
    return;
  }
  playerCol = targetCol;
  playerRow = targetRow;
  moveCount++;
  if (!isReplaying) {
    recordedMoves.push([dx, dy]);
    renderMoves();
  }
  afterMove();
}

function afterMove() {
  const ballsLeft = board.flat().filter((t) => t === BALL).length;
  const maxMoves = activeMaxMoves[levelIndex];
  const completed = ballsLeft === 0;
  if (completed) {
    setStatus(`Completed in ${moveCount} moves!`);
  } else {
    setStatus(`Moves: ${moveCount},  Moves Left: ${maxMoves - moveCount}`);
  }
  render();
  if (completed && !solved) {
    solved = true;
    celebrate();
  }
  if (moveCount === maxMoves) goToLevel(levelIndex);
}

// --- Rendering ------------------------------------------------------
function render() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      const tile = board[row][col];
      const sprite = tile > HIGHEST_TILE ? EMPTY : tile;
      const sx = (sprite % 3) * SRC_TILE;
      const sy = Math.floor(sprite / 3) * SRC_TILE;
      const dx = ORIGIN_X + col * TILE;
      const dy = ORIGIN_Y + row * TILE;
      ctx.drawImage(sheet, sx, sy, SRC_TILE, SRC_TILE, dx, dy, TILE, TILE);
    }
  }
}

const setStatus = (text) => (statusEl.textContent = text);

// Burst of confetti from the player's square. confetti() wants the origin as a
// fraction of the viewport, so walk board -> canvas pixels -> page -> fraction.
// rect vs canvas.width covers the case where CSS scales the canvas down.
function celebrate() {
  const rect = canvas.getBoundingClientRect();
  const x = rect.left + ((ORIGIN_X + playerCol * TILE + TILE / 2) * rect.width) / canvas.width;
  const y = rect.top + ((ORIGIN_Y + playerRow * TILE + TILE / 2) * rect.height) / canvas.height;
  // Everything scaled 1.5x from the stock 100 / 70 / 45 / 1 burst: wider cone,
  // further throw and bigger pieces, with the count raised to match so the
  // larger burst does not read as thinner.
  confetti({
    particleCount: 150,
    spread: 105,
    startVelocity: 68,
    scalar: 1.5,
    origin: { x: x / window.innerWidth, y: y / window.innerHeight },
  });
}

// --- Generated levels -------------------------------------------------
const GENERATED_COUNT = 40;

const readSeed = () => {
  const value = Number.parseInt(seedInput.value.trim(), 10);
  return Number.isFinite(value) ? value >>> 0 : randomSeed();
};

async function buildGenerated(nextSeed) {
  seed = nextSeed;
  seedInput.value = String(seed);
  generatedSelect.disabled = true;
  generated = await generateLevels(seed, GENERATED_COUNT, { cols: COLS, rows: ROWS }, (done, total) =>
    setStatus(`Generating levels… ${done} / ${total}`)
  );
  generatedSelect.innerHTML = "";
  generated.forEach((level, i) => {
    const option = document.createElement("option");
    option.textContent = `Level ${i + 1} — ${level.boxes} balls, ${level.moves} moves`;
    generatedSelect.appendChild(option);
  });
  generatedSelect.disabled = false;
}

function setMode(next, index = 0) {
  stopReplay();
  mode = next;
  modeSelect.value = next;
  const isGenerated = next === "generated";
  builtinControls.hidden = isGenerated;
  generatedControls.hidden = !isGenerated;
  activeLevels = isGenerated ? generated.map((level) => level.description) : LEVELS;
  activeMaxMoves = isGenerated ? generated.map((level) => level.maxMoves) : MAX_MOVES;
  goToLevel(index);
}

// Rebuilds only when the seed actually changed, so the same seed always yields
// the same twenty levels.
let generating = false;

async function showGenerated(nextSeed, index = 0) {
  if (generating) return; // generation takes a moment; ignore impatient clicks
  if (nextSeed !== seed || generated.length === 0) {
    generating = true;
    try {
      await buildGenerated(nextSeed);
    } finally {
      generating = false;
    }
  }
  if (generated.length === 0) {
    modeSelect.value = mode;
    setStatus("Could not generate levels from that seed — try another one.");
    return;
  }
  setMode("generated", index);
}

// --- Moves panel / export -------------------------------------------
function renderMoves() {
  movesList.innerHTML = "";
  for (const [dx, dy] of recordedMoves) {
    const item = document.createElement("li");
    item.textContent = moveName(dx, dy);
    movesList.appendChild(item);
  }
  movesList.scrollTop = movesList.scrollHeight;
}

function downloadMoves() {
  if (recordedMoves.length === 0) {
    setStatus("Nothing to download yet — make some moves first.");
    return;
  }
  // encode() produces TOON (Token-Oriented Object Notation): a compact, tabular
  // format that lists the columns once and one row per move.
  const text = encode({
    mode,
    seed,
    level: levelIndex + 1,
    moves: recordedMoves.map(([dx, dy]) => ({ dx, dy })),
  });
  const blob = new Blob([text], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `sokoban-level${levelIndex + 1}-moves.toon`;
  link.click();
  URL.revokeObjectURL(url);
}

async function loadMoves(text) {
  const saved = decode(text);
  const { level, moves } = saved;
  if (!moves || moves.length === 0) {
    setStatus("No moves found in that file.");
    return;
  }
  stopReplay();
  // Files saved before generated levels existed carry no mode and are built-in.
  // Either branch resets the board and clears recordedMoves.
  if (saved.mode === "generated") await showGenerated(Number(saved.seed) >>> 0, level - 1);
  else setMode("builtin", level - 1);
  recordedMoves = moves.map(({ dx, dy }) => [dx, dy]);
  renderMoves();
  startReplay();
}

// --- Replay ---------------------------------------------------------
function stopReplay() {
  if (replayTimer !== null) {
    clearTimeout(replayTimer);
    replayTimer = null;
  }
  isReplaying = false;
}

function startReplay() {
  if (recordedMoves.length === 0) {
    setStatus("Nothing to replay yet — make some moves first.");
    return;
  }
  stopReplay();
  // Keep a copy: goToLevel only clears recordedMoves when not replaying.
  const moves = recordedMoves.slice();
  isReplaying = true;
  goToLevel(levelIndex); // reset the board to the level's start
  let i = 0;
  const step = () => {
    if (i >= moves.length) {
      stopReplay();
      setStatus(`Replay finished — ${moves.length} moves.`);
      return;
    }
    const [dx, dy] = moves[i++];
    tryMove(dx, dy);
    setStatus(`Replaying move ${i} / ${moves.length}`);
    replayTimer = setTimeout(step, REPLAY_DELAY);
  };
  step();
}

// --- Wiring ---------------------------------------------------------
const KEY_MOVES = {
  ArrowUp: [0, -1],
  ArrowDown: [0, 1],
  ArrowLeft: [-1, 0],
  ArrowRight: [1, 0],
};

document.addEventListener("keydown", (event) => {
  const move = KEY_MOVES[event.key];
  if (move) {
    event.preventDefault();
    if (isReplaying || solved) return; // ignore manual input during a replay, or once the level is finished
    tryMove(move[0], move[1]);
  }
});

LEVELS.forEach((_, i) => {
  const option = document.createElement("option");
  option.textContent = `Level ${i + 1}`;
  levelSelect.appendChild(option);
});
levelSelect.addEventListener("change", () => {
  stopReplay();
  goToLevel(levelSelect.selectedIndex);
});
generatedSelect.addEventListener("change", () => {
  stopReplay();
  goToLevel(generatedSelect.selectedIndex);
});

seedInput.value = String(seed);
modeSelect.addEventListener("change", () => {
  if (modeSelect.value === "generated") showGenerated(readSeed());
  else setMode("builtin");
});
document.getElementById("generate").addEventListener("click", () => showGenerated(readSeed()));
document.getElementById("new-seed").addEventListener("click", () => {
  seedInput.value = String(randomSeed());
  showGenerated(readSeed());
});
document.getElementById("restart").addEventListener("click", () => {
  stopReplay();
  goToLevel(levelIndex);
});
document.getElementById("replay").addEventListener("click", startReplay);
document.getElementById("download").addEventListener("click", downloadMoves);

const uploadInput = document.getElementById("upload-file");
document.getElementById("upload").addEventListener("click", () => uploadInput.click());
uploadInput.addEventListener("change", () => {
  const file = uploadInput.files[0];
  if (!file) return;
  file.text().then(loadMoves);
  uploadInput.value = ""; // allow re-loading the same file
});

sheet.onload = () => goToLevel(0);
sheet.onerror = () => setStatus("Could not load images.gif (serve over http, not file://).");
sheet.src = "data:image/gif;base64,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";