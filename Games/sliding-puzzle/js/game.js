/**
 * OpenClaw Sliding Puzzle Game
 * A classic n-puzzle with multiple difficulty levels
 */

// ── State ──────────────────────────────────────────────
let size = 4;
let tiles = [];
let emptyIdx;
let moves = 0;
let seconds = 0;
let timerInterval = null;
let started = false;
let bestTimes = JSON.parse(localStorage.getItem('puzzleBest') || '{}');

// ── DOM Elements ───────────────────────────────────────
const board = document.getElementById('board');
const movesEl = document.getElementById('moves');
const timerEl = document.getElementById('timer');
const bestEl = document.getElementById('best');
const diffSelect = document.getElementById('difficulty');
const winOverlay = document.getElementById('winOverlay');
const winMsg = document.getElementById('winMsg');

// ── Core Game Logic ────────────────────────────────────

function init() {
  size = parseInt(diffSelect.value);
  const total = size * size;
  tiles = Array.from({ length: total - 1 }, (_, i) => i + 1);
  tiles.push(0);
  emptyIdx = total - 1;
  moves = 0;
  seconds = 0;
  started = false;
  clearInterval(timerInterval);
  timerInterval = null;
  render();
  updateStats();
  updateBest();
}

function getNeighbors(idx) {
  const row = Math.floor(idx / size);
  const col = idx % size;
  const n = [];
  if (row > 0) n.push(idx - size);
  if (row < size - 1) n.push(idx + size);
  if (col > 0) n.push(idx - 1);
  if (col < size - 1) n.push(idx + 1);
  return n;
}

function moveTile(idx) {
  const neighbors = getNeighbors(idx);
  if (!neighbors.includes(emptyIdx)) return;

  if (!started) {
    started = true;
    timerInterval = setInterval(() => {
      seconds++;
      updateStats();
    }, 1000);
  }

  tiles[emptyIdx] = tiles[idx];
  tiles[idx] = 0;
  emptyIdx = idx;
  moves++;
  render();
  updateStats();

  if (checkWin()) {
    clearInterval(timerInterval);
    setTimeout(() => showWin(), 300);
  }
}

function checkWin() {
  const total = size * size;
  for (let i = 0; i < total - 1; i++) {
    if (tiles[i] !== i + 1) return false;
  }
  return true;
}

// ── Shuffle (guaranteed solvable) ──────────────────────

function shuffle() {
  init();
  const numMoves = size * size * 40;
  for (let i = 0; i < numMoves; i++) {
    const neighbors = getNeighbors(emptyIdx);
    const pick = neighbors[Math.floor(Math.random() * neighbors.length)];
    tiles[emptyIdx] = tiles[pick];
    tiles[pick] = 0;
    emptyIdx = pick;
  }
  render();
}

function resetGame() {
  init();
}

// ── Rendering ──────────────────────────────────────────

function render() {
  const tileSize = Math.min(
    Math.floor((Math.min(window.innerWidth, 500) - 40) / size),
    90
  );
  board.style.gridTemplateColumns = `repeat(${size}, ${tileSize}px)`;
  board.style.gridTemplateRows = `repeat(${size}, ${tileSize}px)`;
  board.innerHTML = '';

  tiles.forEach((val, idx) => {
    const div = document.createElement('div');
    div.className =
      'tile' +
      (val === 0 ? ' empty' : '') +
      (val === idx + 1 ? ' correct' : '');
    div.style.fontSize = tileSize > 50 ? '1.4rem' : '1rem';
    if (val !== 0) {
      div.textContent = val;
      div.addEventListener('click', () => moveTile(idx));
    }
    board.appendChild(div);
  });
}

// ── Stats & Best Times ─────────────────────────────────

function updateStats() {
  movesEl.textContent = moves;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  timerEl.textContent = `${m}:${s.toString().padStart(2, '0')}`;
}

function updateBest() {
  const key = `${size}x${size}`;
  bestEl.textContent = bestTimes[key] ? `${bestTimes[key]}s` : '—';
}

// ── Win Screen ─────────────────────────────────────────

function showWin() {
  const key = `${size}x${size}`;
  if (!bestTimes[key] || seconds < bestTimes[key]) {
    bestTimes[key] = seconds;
    localStorage.setItem('puzzleBest', JSON.stringify(bestTimes));
    updateBest();
  }
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  winMsg.textContent = `Solved in ${moves} moves and ${m}:${s.toString().padStart(2, '0')}`;
  winOverlay.classList.add('show');
  spawnConfetti();
}

function closeWin() {
  winOverlay.classList.remove('show');
  shuffle();
}

// ── Confetti Animation ─────────────────────────────────

function spawnConfetti() {
  const colors = ['#e94560', '#ff6b6b', '#ffd93d', '#6bcb77', '#4d96ff', '#ff6b9d'];
  for (let i = 0; i < 80; i++) {
    const c = document.createElement('div');
    c.className = 'confetti';
    c.style.left = Math.random() * 100 + 'vw';
    c.style.top = -10 + 'px';
    c.style.background = colors[Math.floor(Math.random() * colors.length)];
    c.style.animationDelay = Math.random() * 2 + 's';
    c.style.animationDuration = 2 + Math.random() * 2 + 's';
    c.style.width = 6 + Math.random() * 8 + 'px';
    c.style.height = 6 + Math.random() * 8 + 'px';
    document.body.appendChild(c);
    setTimeout(() => c.remove(), 5000);
  }
}

// ── Event Listeners ────────────────────────────────────

diffSelect.addEventListener('change', shuffle);
window.addEventListener('resize', render);

// ── Start ──────────────────────────────────────────────

shuffle();
