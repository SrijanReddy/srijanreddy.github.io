const EMOJIS = ['🐶', '🐱', '🦊', '🐸', '🦋', '🌺', '🍄', '🌈'];

// --- Pure logic functions (no DOM access) ---

/** Fisher-Yates in-place shuffle */
const shuffle = (array) => {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
};

/** Create a shuffled deck of 16 card objects (8 pairs) */
const createDeck = () => {
  const paired = [...EMOJIS, ...EMOJIS];
  shuffle(paired);
  return paired.map((emoji, i) => ({
    id: i,
    emoji,
    isFlipped: false,
    isMatched: false,
  }));
};

/** Star rating based on move count */
const getStarRating = (moves) => {
  if (moves < 10) return 3;
  if (moves < 16) return 2;
  return 1;
};

/** Returns 'match', 'mismatch', or 'pending' */
const checkForMatch = (indices, cards) => {
  if (indices.length < 2) return 'pending';
  return cards[indices[0]].emoji === cards[indices[1]].emoji
    ? 'match'
    : 'mismatch';
};

/** Format seconds as M:SS */
const formatTime = (seconds) => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
};

// --- Game state ---

let gameState;

const freshState = () => ({
  cards: createDeck(),
  flippedIndices: [],
  moves: 0,
  matchedPairs: 0,
  totalPairs: 8,
  timerStarted: false,
  startTime: null,
  elapsedSeconds: 0,
  timerInterval: null,
  isLocked: false,
});

// --- DOM references ---

const grid = document.getElementById('card-grid');
const movesDisplay = document.getElementById('moves-count');
const starsContainer = document.getElementById('stars');
const timerDisplay = document.getElementById('timer');
const newGameBtn = document.getElementById('new-game-btn');
const modalOverlay = document.getElementById('modal-overlay');
const modalStats = document.getElementById('modal-stats');
const playAgainBtn = document.getElementById('play-again-btn');

// --- DOM rendering ---

const renderGrid = (cards) => {
  grid.innerHTML = '';
  cards.forEach((card, index) => {
    const el = document.createElement('div');
    el.className = 'card';
    el.dataset.index = index;
    el.innerHTML = `
      <div class="card-inner">
        <div class="card-face card-back"></div>
        <div class="card-face card-front">${card.emoji}</div>
      </div>`;
    grid.appendChild(el);
  });
};

const updateCardDOM = (index) => {
  const el = grid.children[index];
  const card = gameState.cards[index];
  el.classList.toggle('flipped', card.isFlipped || card.isMatched);
  el.classList.toggle('matched', card.isMatched);
};

const updateStats = () => {
  movesDisplay.textContent = gameState.moves;
  timerDisplay.textContent = formatTime(gameState.elapsedSeconds);

  const rating = getStarRating(gameState.moves);
  const stars = starsContainer.querySelectorAll('.star');
  stars.forEach((star, i) => {
    star.classList.toggle('empty', i >= rating);
  });
};

const showModal = (moves, time, stars) => {
  const starStr = '★'.repeat(stars) + '☆'.repeat(3 - stars);
  modalStats.innerHTML = `
    <p>Moves: <strong>${moves}</strong></p>
    <p>Time: <strong>${time}</strong></p>
    <p>Rating: <strong>${starStr}</strong></p>`;
  modalOverlay.hidden = false;
};

const hideModal = () => {
  modalOverlay.hidden = true;
};

// --- Timer ---

const startTimer = () => {
  if (gameState.timerStarted) return;
  gameState.timerStarted = true;
  gameState.startTime = Date.now();
  gameState.timerInterval = setInterval(() => {
    // Use wall clock to avoid drift
    gameState.elapsedSeconds = Math.floor(
      (Date.now() - gameState.startTime) / 1000
    );
    updateStats();
  }, 1000);
};

const stopTimer = () => {
  if (gameState) clearInterval(gameState.timerInterval);
};

// --- Event handling ---

const handleCardClick = (e) => {
  const cardEl = e.target.closest('.card');
  if (!cardEl) return;

  const index = Number(cardEl.dataset.index);
  const card = gameState.cards[index];

  // Guards: locked board, already flipped, already matched
  if (gameState.isLocked || card.isFlipped || card.isMatched) return;

  // Start timer on first click
  startTimer();

  // Flip the card
  card.isFlipped = true;
  gameState.flippedIndices.push(index);
  updateCardDOM(index);

  // Check when two cards are flipped
  if (gameState.flippedIndices.length === 2) {
    gameState.moves++;
    updateStats();

    const result = checkForMatch(gameState.flippedIndices, gameState.cards);

    if (result === 'match') {
      const [i, j] = gameState.flippedIndices;
      gameState.cards[i].isMatched = true;
      gameState.cards[j].isMatched = true;
      updateCardDOM(i);
      updateCardDOM(j);
      gameState.flippedIndices = [];
      gameState.matchedPairs++;

      // Win condition
      if (gameState.matchedPairs === gameState.totalPairs) {
        stopTimer();
        setTimeout(() => {
          showModal(
            gameState.moves,
            formatTime(gameState.elapsedSeconds),
            getStarRating(gameState.moves)
          );
        }, 500);
      }
    } else {
      // Mismatch: lock board, flip back after delay
      gameState.isLocked = true;
      const [i, j] = gameState.flippedIndices;
      setTimeout(() => {
        gameState.cards[i].isFlipped = false;
        gameState.cards[j].isFlipped = false;
        updateCardDOM(i);
        updateCardDOM(j);
        gameState.flippedIndices = [];
        gameState.isLocked = false;
      }, 1000);
    }
  }
};

// --- Settings ---

const settingsBtn = document.getElementById('settings-btn');
const settingsPanel = document.getElementById('settings-panel');
const colorBoardInput = document.getElementById('color-board');
const colorCardBackInput = document.getElementById('color-card-back-input');

settingsBtn.addEventListener('click', () => {
  const isOpen = !settingsPanel.hidden;
  settingsPanel.hidden = isOpen;
  settingsBtn.setAttribute('aria-expanded', String(!isOpen));
});

// Update CSS variables live as the user picks a color
colorBoardInput.addEventListener('input', (e) => {
  document.documentElement.style.setProperty('--color-bg', e.target.value);
});

colorCardBackInput.addEventListener('input', (e) => {
  document.documentElement.style.setProperty('--color-card-back', e.target.value);
});

// --- Init ---

const initGame = () => {
  stopTimer();
  hideModal();
  gameState = freshState();
  renderGrid(gameState.cards);
  updateStats();
};

grid.addEventListener('click', handleCardClick);
newGameBtn.addEventListener('click', initGame);
playAgainBtn.addEventListener('click', initGame);

initGame();
