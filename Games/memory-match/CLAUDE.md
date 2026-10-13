# Memory Card Game

A browser-based card-matching memory game built with vanilla web technologies.

## Tech Stack

- HTML5, CSS3, vanilla JavaScript (no frameworks, no build tools)
- Single `index.html`, `style.css`, and `script.js` file structure
- Must work by opening `index.html` directly in a browser (no server required)

## Game Requirements

- 4x4 grid of cards (8 pairs)
- Cards should use emoji as the card face symbols
- Cards start face-down; clicking reveals them
- Two revealed cards that match stay face-up; mismatches flip back after a brief delay
- Track and display: number of moves, elapsed time, and a star rating (3 stars = under 10 moves, 2 stars = under 16 moves, 1 star = 16+ moves)
- "New Game" button that shuffles and resets everything
- Win condition: all pairs matched, show a congratulations modal with final stats and a "Play Again" button
- Subtle animations for card flips (CSS transitions, not JS animation libraries)

## Design Guidelines

- Clean, modern look with rounded card corners and soft drop shadows
- Responsive layout that works on both desktop and mobile viewports
- Use a muted color palette — dark card backs, light background, accent color for matched pairs
- Cards should have a visible "back" design (e.g., a subtle pattern or icon) so they don't just look like blank rectangles

## Code Quality

- Semantic HTML elements where appropriate
- CSS custom properties (variables) for colors and spacing so theming is easy
- JavaScript should use ES6+ features (const/let, arrow functions, template literals)
- Game logic should be clearly separated from DOM manipulation
- Add brief code comments explaining non-obvious logic

## Workflow Preferences

- Always start with a planning phase before writing code — outline the architecture, key data structures, and game state management approach, then get approval before implementing
- Break implementation into parallel sub-tasks where possible (e.g., HTML structure, CSS styling, and JS game logic can be developed concurrently)
- After implementation, open the game in Chrome and play-test it to verify the core mechanics work: flip two cards, confirm match/mismatch behavior, and check that the win condition triggers
