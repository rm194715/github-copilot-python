// Client-side rendering and interaction for Flask Sudoku
const SIZE = 9;
let puzzle = [];
let timerIntervalId = null;
let startTime = null;
let elapsedSeconds = 0;

function applyTheme(isDarkMode) {
  document.body.classList.toggle('dark-mode', isDarkMode);
  const button = document.getElementById('theme-toggle');
  if (button) {
    button.textContent = isDarkMode ? 'Light Mode' : 'Dark Mode';
  }
}

function initializeTheme() {
  const storedTheme = localStorage.getItem('sudoku-theme');
  const prefersDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const isDarkMode = storedTheme ? storedTheme === 'dark' : prefersDarkMode;
  applyTheme(isDarkMode);
}

function toggleTheme() {
  const isDarkMode = document.body.classList.contains('dark-mode');
  const nextMode = !isDarkMode;
  applyTheme(nextMode);
  localStorage.setItem('sudoku-theme', nextMode ? 'dark' : 'light');
}

function formatTime(totalSeconds) {
  const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, '0');
  const seconds = String(totalSeconds % 60).padStart(2, '0');
  return `${minutes}:${seconds}`;
}

function updateTimerDisplay() {
  const timerElement = document.getElementById('timer');
  if (timerElement) {
    timerElement.textContent = formatTime(elapsedSeconds);
  }
}

function stopTimer() {
  if (timerIntervalId !== null) {
    clearInterval(timerIntervalId);
    timerIntervalId = null;
  }
}

function startTimer() {
  stopTimer();
  elapsedSeconds = 0;
  startTime = Date.now();
  updateTimerDisplay();
  timerIntervalId = setInterval(() => {
    elapsedSeconds = Math.floor((Date.now() - startTime) / 1000);
    updateTimerDisplay();
  }, 1000);
}

function isValidPlacement(board, row, col, value) {
  if (value === '') return true;

  for (let i = 0; i < SIZE; i++) {
    if (i !== col && board[row][i] === value) return false;
    if (i !== row && board[i][col] === value) return false;
  }

  const boxStartRow = Math.floor(row / 3) * 3;
  const boxStartCol = Math.floor(col / 3) * 3;
  for (let i = boxStartRow; i < boxStartRow + 3; i++) {
    for (let j = boxStartCol; j < boxStartCol + 3; j++) {
      if ((i !== row || j !== col) && board[i][j] === value) {
        return false;
      }
    }
  }
  return true;
}

function updateCellStyles() {
  const boardDiv = document.getElementById('sudoku-board');
  const inputs = boardDiv.getElementsByTagName('input');
  const board = getBoardFromInputs();

  for (let idx = 0; idx < inputs.length; idx++) {
    const inp = inputs[idx];
    if (inp.disabled) continue;

    const row = parseInt(inp.dataset.row, 10);
    const col = parseInt(inp.dataset.col, 10);
    const value = inp.value ? parseInt(inp.value, 10) : '';

    const boxRow = Math.floor(row / 3);
    const boxCol = Math.floor(col / 3);
    const isOddBox = (boxRow + boxCol) % 2 !== 0;

    inp.className = `sudoku-cell ${isOddBox ? 'box-odd' : 'box-even'}`;

    if (value !== '' && !isValidPlacement(board, row, col, value)) {
      inp.classList.add('invalid');
    }
  }
}

function createBoardElement() {
  const boardDiv = document.getElementById('sudoku-board');
  boardDiv.innerHTML = '';
  
  for (let i = 0; i < SIZE; i++) {
    for (let j = 0; j < SIZE; j++) {
      const input = document.createElement('input');
      input.type = 'text';
      input.inputMode = 'numeric';
      input.maxLength = 1;
      
      // Calculate alternating 3x3 block background
      const boxRow = Math.floor(i / 3);
      const boxCol = Math.floor(j / 3);
      const isOddBox = (boxRow + boxCol) % 2 !== 0;
      
      input.className = `sudoku-cell ${isOddBox ? 'box-odd' : 'box-even'}`;
      input.dataset.row = i;
      input.dataset.col = j;

      input.addEventListener('input', (e) => {
        const val = e.target.value.replace(/[^1-9]/g, '');
        e.target.value = val;
        updateCellStyles();
      });

      boardDiv.appendChild(input);
    }
  }
}

function renderPuzzle(puz) {
  puzzle = puz;
  createBoardElement();
  const boardDiv = document.getElementById('sudoku-board');
  const inputs = boardDiv.getElementsByTagName('input');
  
  for (let i = 0; i < SIZE; i++) {
    for (let j = 0; j < SIZE; j++) {
      const idx = i * SIZE + j;
      const val = puzzle[i][j];
      const inp = inputs[idx];
      if (val !== 0) {
        inp.value = val;
        inp.disabled = true;
        inp.classList.add('prefilled');
      } else {
        inp.value = '';
        inp.disabled = false;
      }
    }
  }
}

function getBoardFromInputs() {
  const boardDiv = document.getElementById('sudoku-board');
  const inputs = boardDiv.getElementsByTagName('input');
  const board = [];
  for (let i = 0; i < SIZE; i++) {
    board[i] = [];
    for (let j = 0; j < SIZE; j++) {
      const idx = i * SIZE + j;
      const val = inputs[idx].value;
      board[i][j] = val ? parseInt(val, 10) : 0;
    }
  }
  return board;
}

async function newGame() {
  const difficulty = document.getElementById('difficulty-select').value;
  const res = await fetch(`/new?difficulty=${encodeURIComponent(difficulty)}`);
  const data = await res.json();
  renderPuzzle(data.puzzle);
  document.getElementById('message').innerText = '';
  startTimer();
}

// LocalStorage Scoreboard Handler
function saveScore(name, timeInSeconds, difficulty) {
  const scores = JSON.parse(localStorage.getItem('sudoku-scores') || '[]');
  scores.push({ name, time: timeInSeconds, difficulty, date: new Date().toLocaleDateString() });
  scores.sort((a, b) => a.time - b.time);
  const top10 = scores.slice(0, 10);
  localStorage.setItem('sudoku-scores', JSON.stringify(top10));
  renderScoreboard();
}

function renderScoreboard() {
  const tbody = document.getElementById('scoreboard-body');
  if (!tbody) return;
  const scores = JSON.parse(localStorage.getItem('sudoku-scores') || '[]');
  
  if (scores.length === 0) {
    tbody.innerHTML = '<tr><td colspan="4">No scores yet!</td></tr>';
    return;
  }

  tbody.innerHTML = scores.map((score, idx) => `
    <tr>
      <td>${idx + 1}</td>
      <td>${score.name}</td>
      <td>${formatTime(score.time)}</td>
      <td>${score.difficulty}</td>
    </tr>
  `).join('');
}

async function checkSolution() {
  const board = getBoardFromInputs();
  const boardDiv = document.getElementById('sudoku-board');
  const inputs = boardDiv.getElementsByTagName('input');
  
  const res = await fetch('/check', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({board})
  });
  const data = await res.json();
  const msg = document.getElementById('message');
  
  if (data.error) {
    msg.style.color = '#dc2626';
    msg.innerText = data.error;
    return;
  }

  const incorrect = new Set(data.incorrect.map(x => x[0] * SIZE + x[1]));
  
  for (let idx = 0; idx < inputs.length; idx++) {
    const inp = inputs[idx];
    if (inp.disabled) continue;

    const row = parseInt(inp.dataset.row, 10);
    const col = parseInt(inp.dataset.col, 10);
    const boxRow = Math.floor(row / 3);
    const boxCol = Math.floor(col / 3);
    const isOddBox = (boxRow + boxCol) % 2 !== 0;

    inp.className = `sudoku-cell ${isOddBox ? 'box-odd' : 'box-even'}`;

    if (incorrect.has(idx)) {
      inp.classList.add('incorrect');
    }
  }

  if (incorrect.size === 0) {
    stopTimer();
    const difficulty = document.getElementById('difficulty-select').value;
    const difficultyLabel = difficulty.charAt(0).toUpperCase() + difficulty.slice(1);
    
    for (let idx = 0; idx < inputs.length; idx++) {
      inputs[idx].disabled = true;
    }

    msg.style.color = '#16a34a';
    msg.innerText = `Congratulations! You solved the ${difficultyLabel} puzzle in ${formatTime(elapsedSeconds)}.`;

    const playerName = prompt("Great job! Enter your name for the Leaderboard:", "Player") || "Anonymous";
    saveScore(playerName, elapsedSeconds, difficultyLabel);
  } else {
    msg.style.color = '#dc2626';
    msg.innerText = 'Some cells are incorrect.';
  }
}

async function showHint() {
  const board = getBoardFromInputs();
  const res = await fetch('/hint', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({board})
  });
  const data = await res.json();
  const msg = document.getElementById('message');
  
  if (data.error) {
    msg.style.color = '#dc2626';
    msg.innerText = data.error;
    return;
  }

  const index = data.row * SIZE + data.col;
  const boardDiv = document.getElementById('sudoku-board');
  const inputs = boardDiv.getElementsByTagName('input');
  const input = inputs[index];
  
  input.value = data.value;
  input.disabled = true;
  input.classList.add('prefilled');
  msg.style.color = '#2563eb';
  msg.innerText = 'Hint used.';
}

window.addEventListener('load', () => {
  initializeTheme();
  renderScoreboard();
  
  document.getElementById('new-game').addEventListener('click', newGame);
  document.getElementById('check-solution').addEventListener('click', checkSolution);
  document.getElementById('hint').addEventListener('click', showHint);
  document.getElementById('theme-toggle').addEventListener('click', toggleTheme);
  
  newGame();
});