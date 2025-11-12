// ================================
// CỜ CARO 4.0 - ULTRA ADVANCED GAME LOGIC
// Version: 4.0.0
// Enhanced with AI Personalities, Difficulty Levels, Analysis Mode & More
// ================================

// ================================
// GAME CONFIGURATION
// ================================
let BOARD_SIZE = 15;
const WIN_CONDITION = 5;

// ================================
// GAME STATE
// ================================
let board = [];
let currentPlayer = 'X';
let gameActive = true;
let gameMode = 'pvc'; // 'pvc' = Player vs Computer, 'pvp' = Player vs Player
let aiDifficulty = 'grandmaster'; // 'easy', 'medium', 'hard', 'grandmaster'
let aiPersonality = 'balanced'; // 'aggressive', 'defensive', 'balanced'
let soundEnabled = true;
let timerEnabled = false;
let analysisMode = false;
let tutorialMode = false;
let currentTheme = 'default'; // 'default', 'ocean', 'forest', 'sunset', 'neon'

// Move History for Undo/Redo
let moveHistory = [];
let currentMoveIndex = -1;
let savedGames = [];

// Statistics
let stats = {
    xWins: 0,
    oWins: 0,
    draws: 0
};

// Timer
let timerInterval = null;
let timerSeconds = 0;

// AI Thinking State
let aiThinking = false;
let aiThinkingAnimation = null;

// ================================
// AI LEARNING & EXPERIENCE SYSTEM
// ================================
let experienceDB = {
    patterns: new Map(),
    moveQuality: new Map(),
    openingBook: new Map(),
    adaptiveWeights: {
        openFour: 100000,
        openThree: 50000,
        semiOpenThree: 5000,
        openTwo: 1000,
        centerControl: 5
    },
    gamesPlayed: 0,
    totalLearnings: 0
};

let currentGameData = {
    positions: [],
    evaluations: [],
    moves: [],
    result: null,
    startTime: null,
    endTime: null
};

// ================================
// AI DIFFICULTY CONFIGURATIONS
// ================================
const AI_CONFIGS = {
    easy: {
        depth: 1,
        searchWidth: 5,
        randomness: 0.3,
        evaluationMultiplier: 0.3,
        thinkTime: 500
    },
    medium: {
        depth: 2,
        searchWidth: 10,
        randomness: 0.15,
        evaluationMultiplier: 0.6,
        thinkTime: 800
    },
    hard: {
        depth: 3,
        searchWidth: 15,
        randomness: 0.05,
        evaluationMultiplier: 0.85,
        thinkTime: 1200
    },
    grandmaster: {
        depth: 4,
        vctDepth: 24,
        vcfDepth: 20,
        searchWidth: 25,
        randomness: 0,
        evaluationMultiplier: 1.0,
        thinkTime: 1500
    }
};

// ================================
// AI PERSONALITY CONFIGURATIONS
// ================================
const AI_PERSONALITIES = {
    aggressive: {
        name: 'Tấn công',
        attackMultiplier: 1.5,
        defenseMultiplier: 0.7,
        riskTaking: 0.8,
        preferOpenings: true
    },
    defensive: {
        name: 'Phòng thủ',
        attackMultiplier: 0.7,
        defenseMultiplier: 1.8,
        riskTaking: 0.2,
        preferOpenings: false
    },
    balanced: {
        name: 'Cân bằng',
        attackMultiplier: 1.0,
        defenseMultiplier: 1.0,
        riskTaking: 0.5,
        preferOpenings: true
    }
};

// ================================
// BOARD THEMES
// ================================
const THEMES = {
    default: {
        name: 'Mặc định',
        cellBg: 'var(--color-bg)',
        cellHover: 'var(--color-surface)',
        playerX: '#ff3b30',
        playerO: '#007aff',
        gridColor: 'rgba(0, 0, 0, 0.08)'
    },
    ocean: {
        name: 'Đại dương',
        cellBg: '#e0f7ff',
        cellHover: '#b3e5ff',
        playerX: '#ff6b6b',
        playerO: '#0077be',
        gridColor: 'rgba(0, 119, 190, 0.2)'
    },
    forest: {
        name: 'Rừng xanh',
        cellBg: '#f0f8e8',
        cellHover: '#d4edda',
        playerX: '#d63031',
        playerO: '#27ae60',
        gridColor: 'rgba(39, 174, 96, 0.2)'
    },
    sunset: {
        name: 'Hoàng hôn',
        cellBg: '#fff3e0',
        cellHover: '#ffe0b2',
        playerX: '#e74c3c',
        playerO: '#f39c12',
        gridColor: 'rgba(243, 156, 18, 0.2)'
    },
    neon: {
        name: 'Neon',
        cellBg: '#1a1a2e',
        cellHover: '#16213e',
        playerX: '#ff0080',
        playerO: '#00ffff',
        gridColor: 'rgba(0, 255, 255, 0.3)'
    }
};

// ================================
// DOM ELEMENTS
// ================================
const boardElement = document.getElementById('board');
const statusElement = document.getElementById('status');
const resetBtn = document.getElementById('resetBtn');
const startGameBtn = document.getElementById('startGameBtn');
const boardSizeSelect = document.getElementById('boardSize');
const soundToggle = document.getElementById('soundToggle');
const timerToggle = document.getElementById('timerToggle');
const darkModeToggle = document.getElementById('darkModeToggle');
const settingsToggle = document.getElementById('settingsToggle');
const settingsPanel = document.getElementById('settingsPanel');
const historyToggle = document.getElementById('historyToggle');
const sidePanel = document.getElementById('sidePanel');
const undoBtn = document.getElementById('undoBtn');
const redoBtn = document.getElementById('redoBtn');
const hintBtn = document.getElementById('hintBtn');
const moveHistoryElement = document.getElementById('moveHistory');
const timerDisplay = document.getElementById('timerDisplay');
const timerElement = document.getElementById('timer');
const xWinsElement = document.getElementById('xWins');
const oWinsElement = document.getElementById('oWins');
const drawsElement = document.getElementById('draws');
const particlesCanvas = document.getElementById('particles');
const particlesCtx = particlesCanvas.getContext('2d');

// New V4.0 Elements
const gameModeSelect = document.getElementById('gameMode');
const aiDifficultySelect = document.getElementById('aiDifficulty');
const aiPersonalitySelect = document.getElementById('aiPersonality');
const analysisModeToggle = document.getElementById('analysisMode');
const tutorialModeToggle = document.getElementById('tutorialMode');
const themeSelect = document.getElementById('theme');
const saveGameBtn = document.getElementById('saveGameBtn');
const loadGameBtn = document.getElementById('loadGameBtn');
const exportGameBtn = document.getElementById('exportGameBtn');
const importGameBtn = document.getElementById('importGameBtn');
const analysisPanel = document.getElementById('analysisPanel');
const evaluationBar = document.getElementById('evaluationBar');
const moveQualityElement = document.getElementById('moveQuality');
const threatLevelElement = document.getElementById('threatLevel');
const aiThinkingElement = document.getElementById('aiThinking');

let particles = [];

// ================================
// INITIALIZATION
// ================================

function initGame() {
    board = Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill(null));
    currentPlayer = 'X';
    gameActive = true;
    moveHistory = [];
    currentMoveIndex = -1;
    boardElement.innerHTML = '';
    particles = [];
    aiThinking = false;

    // Reset learning data for new game
    currentGameData = {
        positions: [],
        evaluations: [],
        moves: [],
        result: null,
        startTime: Date.now(),
        endTime: null
    };

    updateStatus();
    createBoard();
    updateHistoryUI();
    updateUndoRedoButtons();
    stopTimer();

    if (timerEnabled) {
        startTimer();
    }

    if (analysisMode) {
        updateAnalysisPanel();
    }

    saveGame();

    // Show tutorial if enabled
    if (tutorialMode && moveHistory.length === 0) {
        showTutorialMessage('Chào mừng đến với Cờ Caro! Đặt 5 quân liên tiếp để thắng.');
    }
}

function createBoard() {
    boardElement.style.gridTemplateColumns = `repeat(${BOARD_SIZE}, ${getCellSize()}px)`;
    boardElement.style.gridTemplateRows = `repeat(${BOARD_SIZE}, ${getCellSize()}px)`;

    for (let row = 0; row < BOARD_SIZE; row++) {
        for (let col = 0; col < BOARD_SIZE; col++) {
            const cell = document.createElement('button');
            cell.classList.add('cell');
            cell.dataset.row = row;
            cell.dataset.col = col;
            cell.style.width = `${getCellSize()}px`;
            cell.style.height = `${getCellSize()}px`;
            cell.addEventListener('click', handleCellClick);

            // Apply theme
            applyThemeToCell(cell);

            boardElement.appendChild(cell);
        }
    }
}

function getCellSize() {
    if (BOARD_SIZE <= 10) return 40;
    if (BOARD_SIZE <= 15) return 35;
    return 30;
}

function applyThemeToCell(cell) {
    const theme = THEMES[currentTheme];
    cell.style.setProperty('--theme-cell-bg', theme.cellBg);
    cell.style.setProperty('--theme-cell-hover', theme.cellHover);
    cell.style.setProperty('--theme-player-x', theme.playerX);
    cell.style.setProperty('--theme-player-o', theme.playerO);
}

// ================================
// GAME LOGIC
// ================================

function handleCellClick(event) {
    if (!gameActive) return;
    if (gameMode === 'pvc' && currentPlayer === 'O') return; // AI turn
    if (aiThinking) return; // Wait for AI

    const row = parseInt(event.target.dataset.row);
    const col = parseInt(event.target.dataset.col);

    if (board[row][col] !== null) return;

    makeMove(row, col);
}

function makeMove(row, col, skipHistory = false) {
    // Place the piece
    board[row][col] = currentPlayer;
    const index = row * BOARD_SIZE + col;
    const cell = boardElement.children[index];
    cell.textContent = currentPlayer;
    cell.classList.add(currentPlayer.toLowerCase());
    cell.disabled = true;

    // Track position for learning (AI moves only)
    if (currentPlayer === 'O' && !skipHistory && gameMode === 'pvc') {
        const posHash = getBoardHash();
        const evaluation = evaluateBoard();
        currentGameData.positions.push(posHash);
        currentGameData.evaluations.push(evaluation);
        currentGameData.moves.push({ row, col, player: currentPlayer });
    }

    // Add to history
    if (!skipHistory) {
        moveHistory = moveHistory.slice(0, currentMoveIndex + 1);
        moveHistory.push({ row, col, player: currentPlayer });
        currentMoveIndex++;
        updateHistoryUI();
    }

    // Play sound
    playSound('move');

    // Animation
    cell.style.animation = 'placepiece 0.3s ease';

    // Update analysis if enabled
    if (analysisMode) {
        setTimeout(() => updateAnalysisPanel(), 100);
    }

    // Check for win
    const winningCells = checkWin(row, col);
    if (winningCells) {
        gameActive = false;
        highlightWinningCells(winningCells);
        const winner = currentPlayer;
        const winnerName = (gameMode === 'pvc' && winner === 'O') ? 'AI' : winner;
        statusElement.innerHTML = `<span class="player-${currentPlayer.toLowerCase()}">${winnerName} thắng! 🎉</span>`;
        updateStats(winner);
        playSound('win');
        stopTimer();
        createParticles();

        // Learn from game result
        if (gameMode === 'pvc') {
            learnFromGame(winner);
        }

        currentGameData.endTime = Date.now();
        currentGameData.result = winner;
        saveGame();

        if (tutorialMode) {
            showTutorialMessage(`${winnerName} đã chiến thắng! Tuyệt vời!`);
        }

        return;
    }

    // Check for draw
    if (isBoardFull()) {
        gameActive = false;
        statusElement.textContent = 'Hòa! 🤝';
        updateStats('draw');
        playSound('draw');
        stopTimer();

        if (gameMode === 'pvc') {
            learnFromGame('draw');
        }

        currentGameData.endTime = Date.now();
        currentGameData.result = 'draw';
        saveGame();

        if (tutorialMode) {
            showTutorialMessage('Ván đấu hòa! Không còn nước đi nào.');
        }

        return;
    }

    // Switch player
    currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
    updateStatus();
    updateUndoRedoButtons();
    saveGame();

    // AI move
    if (gameActive && gameMode === 'pvc' && currentPlayer === 'O') {
        aiThinking = true;
        showAIThinking();

        // Calculate AI move first to determine if it's forced
        const aiMove = getAIMove();

        // Then calculate dynamic think time based on the situation
        const thinkTime = calculateThinkTime();

        setTimeout(() => {
            if (aiMove) {
                makeMove(aiMove.row, aiMove.col);
            }
            aiThinking = false;
            hideAIThinking();
        }, thinkTime);
    }
}

function checkWin(row, col) {
    const directions = [
        [[0, 1], [0, -1]],   // Horizontal
        [[1, 0], [-1, 0]],   // Vertical
        [[1, 1], [-1, -1]],  // Diagonal \
        [[1, -1], [-1, 1]]   // Diagonal /
    ];

    const player = board[row][col];

    for (const direction of directions) {
        const cells = [[row, col]];

        // Check both directions
        for (const [dx, dy] of direction) {
            let r = row + dx;
            let c = col + dy;

            while (
                r >= 0 && r < BOARD_SIZE &&
                c >= 0 && c < BOARD_SIZE &&
                board[r][c] === player
            ) {
                cells.push([r, c]);
                r += dx;
                c += dy;
            }
        }

        if (cells.length >= WIN_CONDITION) {
            return cells;
        }
    }

    return null;
}

function highlightWinningCells(cells) {
    cells.forEach(([row, col]) => {
        const index = row * BOARD_SIZE + col;
        const cell = boardElement.children[index];
        cell.classList.add('winning');
    });
}

function isBoardFull() {
    return board.every(row => row.every(cell => cell !== null));
}

function updateStatus() {
    if (!gameActive) return;
    const playerClass = currentPlayer === 'X' ? 'player-x' : 'player-o';
    let playerName;

    if (gameMode === 'pvp') {
        playerName = `Người chơi ${currentPlayer}`;
    } else {
        playerName = currentPlayer === 'O' ? 'AI' : currentPlayer;
    }

    statusElement.innerHTML = `Lượt <span class="${playerClass}">${playerName}</span>`;
}

// ================================
// AI CORE LOGIC - GRAND MASTER LEVEL
// ================================

// Transposition Table với Zobrist Hashing
let transpositionTable = new Map();
let zobristTable = [];
let zobristBlackTurn = 0;

// Killer moves for move ordering
let killerMoves = [];

// History heuristic for move ordering
let historyTable = [];

// Evaluation cache
let evaluationCache = new Map();

// Pattern database - ULTRA ADVANCED Gomoku patterns
const PATTERNS = {
    // Winning patterns
    FIVE: { score: 10000000, pattern: [1,1,1,1,1] },

    // Critical threats (must respond immediately)
    OPEN_FOUR: { score: 5000000, pattern: [0,1,1,1,1,0] },
    FOUR: { score: 2500000, pattern: [1,1,1,1] },

    // Very strong attacks
    DOUBLE_OPEN_THREE: { score: 1000000 },
    OPEN_THREE: { score: 500000, pattern: [0,1,1,1,0] },
    BROKEN_THREE_A: { score: 250000, pattern: [0,1,1,0,1,0] },
    BROKEN_THREE_B: { score: 250000, pattern: [0,1,0,1,1,0] },
    BROKEN_THREE_C: { score: 200000, pattern: [0,1,1,0,1,1,0] },

    // Medium-strong threats
    DOUBLE_THREE: { score: 800000 },
    SEMI_OPEN_THREE: { score: 100000, pattern: [1,1,1,0] },
    OPEN_TWO_PLUS_THREE: { score: 300000 },

    // Building attacks
    OPEN_TWO: { score: 50000, pattern: [0,1,1,0] },
    BROKEN_TWO: { score: 25000, pattern: [0,1,0,1,0] },
    SEMI_OPEN_TWO: { score: 15000, pattern: [1,1,0] },
    OPEN_ONE: { score: 1000, pattern: [0,1,0] },

    // Defensive patterns
    BLOCK_OPEN_FOUR: { score: 6000000 },
    BLOCK_DOUBLE_THREE: { score: 1500000 },
    BLOCK_OPEN_THREE: { score: 600000 },
};

// Initialize history table
function initHistoryTable() {
    historyTable = Array(BOARD_SIZE).fill(null).map(() =>
        Array(BOARD_SIZE).fill(0)
    );
}

// Initialize Zobrist hashing
function initZobrist() {
    zobristTable = [];
    for (let i = 0; i < BOARD_SIZE; i++) {
        zobristTable[i] = [];
        for (let j = 0; j < BOARD_SIZE; j++) {
            zobristTable[i][j] = {
                'X': Math.floor(Math.random() * 0xFFFFFFFFFFFF),
                'O': Math.floor(Math.random() * 0xFFFFFFFFFFFF)
            };
        }
    }
    zobristBlackTurn = Math.floor(Math.random() * 0xFFFFFFFFFFFF);
}

function getZobristHash(isMaximizing) {
    let hash = 0;
    for (let i = 0; i < BOARD_SIZE; i++) {
        for (let j = 0; j < BOARD_SIZE; j++) {
            if (board[i][j]) {
                hash ^= zobristTable[i][j][board[i][j]];
            }
        }
    }
    if (!isMaximizing) hash ^= zobristBlackTurn;
    return hash;
}

// ================================
// ADVANCED PATTERN RECOGNITION
// ================================

function detectPatternsInLine(line, player) {
    const patterns = [];
    const len = line.length;

    const numLine = line.map(cell => {
        if (cell === player) return 1;
        if (cell === null) return 0;
        return -1;
    });

    // Check for FIVE
    for (let i = 0; i <= len - 5; i++) {
        if (numLine.slice(i, i + 5).every(c => c === 1)) {
            patterns.push({ type: 'FIVE', score: PATTERNS.FIVE.score, pos: i });
        }
    }

    // Check for OPEN_FOUR: _XXXX_
    for (let i = 0; i <= len - 6; i++) {
        if (numLine[i] === 0 &&
            numLine.slice(i + 1, i + 5).every(c => c === 1) &&
            numLine[i + 5] === 0) {
            patterns.push({ type: 'OPEN_FOUR', score: PATTERNS.OPEN_FOUR.score, pos: i });
        }
    }

    // Check for FOUR with one end open
    for (let i = 0; i <= len - 4; i++) {
        if (numLine.slice(i, i + 4).every(c => c === 1)) {
            const leftOpen = (i === 0 || numLine[i - 1] === 0);
            const rightOpen = (i + 4 >= len || numLine[i + 4] === 0);
            if (leftOpen || rightOpen) {
                patterns.push({ type: 'FOUR', score: PATTERNS.FOUR.score, pos: i });
            }
        }
    }

    // Check for OPEN_THREE: _XXX_
    for (let i = 0; i <= len - 5; i++) {
        if (numLine[i] === 0 &&
            numLine.slice(i + 1, i + 4).every(c => c === 1) &&
            numLine[i + 4] === 0) {
            patterns.push({ type: 'OPEN_THREE', score: PATTERNS.OPEN_THREE.score, pos: i });
        }
    }

    // Check for BROKEN_THREE patterns
    for (let i = 0; i <= len - 6; i++) {
        const slice = numLine.slice(i, i + 6);
        // _XX_X_
        if (slice[0] === 0 && slice[1] === 1 && slice[2] === 1 &&
            slice[3] === 0 && slice[4] === 1 && slice[5] === 0) {
            patterns.push({ type: 'BROKEN_THREE_A', score: PATTERNS.BROKEN_THREE_A.score, pos: i });
        }
        // _X_XX_
        if (slice[0] === 0 && slice[1] === 1 && slice[2] === 0 &&
            slice[3] === 1 && slice[4] === 1 && slice[5] === 0) {
            patterns.push({ type: 'BROKEN_THREE_B', score: PATTERNS.BROKEN_THREE_B.score, pos: i });
        }
    }

    // Check for SEMI_OPEN_THREE
    for (let i = 0; i <= len - 4; i++) {
        if (numLine.slice(i, i + 3).every(c => c === 1)) {
            const leftOpen = (i === 0 || numLine[i - 1] === 0);
            const rightOpen = (i + 3 >= len || numLine[i + 3] === 0);
            if ((leftOpen && !rightOpen) || (!leftOpen && rightOpen)) {
                patterns.push({ type: 'SEMI_OPEN_THREE', score: PATTERNS.SEMI_OPEN_THREE.score, pos: i });
            }
        }
    }

    // Check for OPEN_TWO: _XX_
    for (let i = 0; i <= len - 4; i++) {
        if (numLine[i] === 0 && numLine[i + 1] === 1 &&
            numLine[i + 2] === 1 && numLine[i + 3] === 0) {
            patterns.push({ type: 'OPEN_TWO', score: PATTERNS.OPEN_TWO.score, pos: i });
        }
    }

    // Check for BROKEN_TWO: _X_X_
    for (let i = 0; i <= len - 5; i++) {
        if (numLine[i] === 0 && numLine[i + 1] === 1 &&
            numLine[i + 2] === 0 && numLine[i + 3] === 1 &&
            numLine[i + 4] === 0) {
            patterns.push({ type: 'BROKEN_TWO', score: PATTERNS.BROKEN_TWO.score, pos: i });
        }
    }

    return patterns;
}

function getLine(row, col, dx, dy, length) {
    const line = [];
    let r = row;
    let c = col;

    for (let i = 0; i < length; i++) {
        if (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE) {
            line.push(board[r][c]);
        }
        r += dx;
        c += dy;
    }

    return line;
}

function evaluateLine(row, col, dx, dy, player) {
    const line = getLine(row - dx * 4, col - dy * 4, dx, dy, 9);
    const patterns = detectPatternsInLine(line, player);
    return patterns.reduce((sum, p) => sum + p.score, 0);
}

function evaluatePosition(row, col, player) {
    let score = 0;

    // Evaluate all directions
    score += evaluateLine(row, col, 1, 0, player);   // Vertical
    score += evaluateLine(row, col, 0, 1, player);   // Horizontal
    score += evaluateLine(row, col, 1, 1, player);   // Diagonal \
    score += evaluateLine(row, col, 1, -1, player);  // Diagonal /

    return score;
}

function evaluateBoard() {
    let aiScore = 0;
    let playerScore = 0;

    for (let row = 0; row < BOARD_SIZE; row++) {
        for (let col = 0; col < BOARD_SIZE; col++) {
            if (board[row][col] === 'O') {
                aiScore += evaluatePosition(row, col, 'O');
            } else if (board[row][col] === 'X') {
                playerScore += evaluatePosition(row, col, 'X');
            }
        }
    }

    // Apply personality modifiers
    const personality = AI_PERSONALITIES[aiPersonality];
    aiScore *= personality.attackMultiplier;
    playerScore *= personality.defenseMultiplier;

    // Defense-first approach with multiplier
    return aiScore - (playerScore * 4.5);
}

// ================================
// AI MOVE GENERATION - MULTI-LEVEL
// ================================

// Track if current move is forced (for think time optimization)
// Forced moves: winning moves, blocking immediate threats, blocking 4-in-a-row
// These should be executed quickly without long think time
let isForcedMove = false;

function getAIMove() {
    const config = AI_CONFIGS[aiDifficulty];
    isForcedMove = false; // Reset

    // Initialize if needed
    if (zobristTable.length === 0) {
        initZobrist();
        initHistoryTable();
    }

    // Priority-based decision making
    // 1. Check for immediate win - FORCED MOVE
    let move = scanForWinningMove('O');
    if (move) {
        isForcedMove = true;
        return move;
    }

    // 2. Block opponent's immediate win - FORCED MOVE
    move = scanForWinningMove('X');
    if (move) {
        isForcedMove = true;
        return move;
    }

    // 3. Block opponent's 4-in-a-row - FORCED MOVE
    move = scanForFourInRow('X');
    if (move) {
        isForcedMove = true;
        return move;
    }

    // 4. Create own 4-in-a-row - FORCED MOVE
    move = scanForFourInRow('O');
    if (move) {
        isForcedMove = true;
        return move;
    }

    // 5. Block opponent's open three
    move = scanForOpenThree('X');
    if (move) return move;

    // 6. Create own open three
    move = scanForOpenThree('O');
    if (move) return move;

    // 7. Use advanced AI based on difficulty
    if (aiDifficulty === 'grandmaster') {
        // VCT/VCF for grandmaster
        move = vctSearch(config.vctDepth);
        if (move) return move;

        move = vcfSearch(config.vcfDepth);
        if (move) return move;
    }

    // 8. Use minimax with depth based on difficulty
    const candidates = getRelevantMoves(config.searchWidth);
    if (candidates.length === 0) {
        // First move - center of board
        const center = Math.floor(BOARD_SIZE / 2);
        return { row: center, col: center };
    }

    move = minimaxMove(candidates, config.depth);

    // Add randomness for lower difficulties
    if (config.randomness > 0 && Math.random() < config.randomness) {
        const randomIndex = Math.floor(Math.random() * Math.min(3, candidates.length));
        move = candidates[randomIndex];
    }

    return move;
}

// Calculate dynamic think time based on game situation
function calculateThinkTime() {
    const config = AI_CONFIGS[aiDifficulty];

    // If forced move (win/block critical threat), respond immediately
    if (isForcedMove) {
        return 100; // Very fast response for forced moves
    }

    // Count number of moves made
    const moveCount = moveHistory.length;

    // First move - instant (always center)
    if (moveCount === 0) {
        return 150;
    }

    // Early game (first 5 moves) - think faster
    if (moveCount < 5) {
        return Math.min(config.thinkTime * 0.3, 300);
    }

    // Early-mid game (5-10 moves) - moderate speed
    if (moveCount < 10) {
        return Math.min(config.thinkTime * 0.5, 500);
    }

    // Check if board is mostly empty (simple position)
    const emptyCount = board.flat().filter(cell => cell === null).length;
    const totalCells = BOARD_SIZE * BOARD_SIZE;
    const emptyRatio = emptyCount / totalCells;

    // If board is >80% empty, think faster
    if (emptyRatio > 0.8) {
        return Math.min(config.thinkTime * 0.4, 400);
    }

    // For Easy and Medium difficulties, always think faster
    if (aiDifficulty === 'easy') {
        return Math.min(config.thinkTime * 0.5, 350);
    }
    if (aiDifficulty === 'medium') {
        return Math.min(config.thinkTime * 0.7, 600);
    }

    // Complex end game - use full think time only for Hard and Grand Master
    return config.thinkTime;
}

function scanForWinningMove(player) {
    for (let row = 0; row < BOARD_SIZE; row++) {
        for (let col = 0; col < BOARD_SIZE; col++) {
            if (board[row][col] === null) {
                board[row][col] = player;
                if (checkWin(row, col)) {
                    board[row][col] = null;
                    return { row, col };
                }
                board[row][col] = null;
            }
        }
    }
    return null;
}

function scanForFourInRow(player) {
    const directions = [
        [0, 1], [1, 0], [1, 1], [1, -1]
    ];

    for (let row = 0; row < BOARD_SIZE; row++) {
        for (let col = 0; col < BOARD_SIZE; col++) {
            if (board[row][col] !== null) continue;

            for (const [dx, dy] of directions) {
                let count = 0;

                // Count in both directions
                for (let dir = -1; dir <= 1; dir += 2) {
                    let r = row + dx * dir;
                    let c = col + dy * dir;

                    while (
                        r >= 0 && r < BOARD_SIZE &&
                        c >= 0 && c < BOARD_SIZE &&
                        board[r][c] === player
                    ) {
                        count++;
                        r += dx * dir;
                        c += dy * dir;
                    }
                }

                if (count >= 3) {
                    return { row, col };
                }
            }
        }
    }

    return null;
}

function scanForOpenThree(player) {
    for (let row = 0; row < BOARD_SIZE; row++) {
        for (let col = 0; col < BOARD_SIZE; col++) {
            if (board[row][col] === null) {
                const score = evaluatePosition(row, col, player);
                if (score >= PATTERNS.OPEN_THREE.score * 0.8) {
                    return { row, col };
                }
            }
        }
    }
    return null;
}

function getRelevantMoves(maxMoves) {
    const moves = [];
    const evaluated = new Set();

    for (let row = 0; row < BOARD_SIZE; row++) {
        for (let col = 0; col < BOARD_SIZE; col++) {
            if (board[row][col] !== null) {
                // Add adjacent empty cells
                for (let dr = -2; dr <= 2; dr++) {
                    for (let dc = -2; dc <= 2; dc++) {
                        const r = row + dr;
                        const c = col + dc;
                        const key = `${r},${c}`;

                        if (r >= 0 && r < BOARD_SIZE &&
                            c >= 0 && c < BOARD_SIZE &&
                            board[r][c] === null &&
                            !evaluated.has(key)) {

                            evaluated.add(key);
                            const score = evaluatePosition(r, c, 'O') - evaluatePosition(r, c, 'X');
                            moves.push({ row: r, col: c, score });
                        }
                    }
                }
            }
        }
    }

    // Sort by score and return top candidates
    moves.sort((a, b) => b.score - a.score);
    return moves.slice(0, maxMoves);
}

function minimaxMove(candidates, depth) {
    let bestMove = candidates[0];
    let bestScore = -Infinity;

    for (const move of candidates) {
        board[move.row][move.col] = 'O';
        const score = minimax(depth - 1, -Infinity, Infinity, false);
        board[move.row][move.col] = null;

        if (score > bestScore) {
            bestScore = score;
            bestMove = move;
        }
    }

    return bestMove;
}

function minimax(depth, alpha, beta, isMaximizing) {
    // Check for terminal state
    const evaluation = evaluateBoard();

    if (depth === 0 || Math.abs(evaluation) > 1000000) {
        return evaluation;
    }

    const config = AI_CONFIGS[aiDifficulty];
    const moves = getRelevantMoves(config.searchWidth);

    if (moves.length === 0) {
        return evaluation;
    }

    if (isMaximizing) {
        let maxEval = -Infinity;

        for (const move of moves) {
            board[move.row][move.col] = 'O';
            const eval = minimax(depth - 1, alpha, beta, false);
            board[move.row][move.col] = null;

            maxEval = Math.max(maxEval, eval);
            alpha = Math.max(alpha, eval);

            if (beta <= alpha) break; // Pruning
        }

        return maxEval;
    } else {
        let minEval = Infinity;

        for (const move of moves) {
            board[move.row][move.col] = 'X';
            const eval = minimax(depth - 1, alpha, beta, true);
            board[move.row][move.col] = null;

            minEval = Math.min(minEval, eval);
            beta = Math.min(beta, eval);

            if (beta <= alpha) break; // Pruning
        }

        return minEval;
    }
}

// VCT (Victory by Continuous Threats) Search
function vctSearch(depth) {
    if (depth <= 0) return null;

    const threats = [];

    // Find all threat moves
    for (let row = 0; row < BOARD_SIZE; row++) {
        for (let col = 0; col < BOARD_SIZE; col++) {
            if (board[row][col] === null) {
                board[row][col] = 'O';
                const score = evaluatePosition(row, col, 'O');

                if (score >= PATTERNS.OPEN_THREE.score) {
                    threats.push({ row, col, score });
                }

                board[row][col] = null;
            }
        }
    }

    // Try best threats recursively
    threats.sort((a, b) => b.score - a.score);

    for (const threat of threats.slice(0, 5)) {
        board[threat.row][threat.col] = 'O';

        const defense = scanForWinningMove('X');
        if (!defense) {
            board[threat.row][threat.col] = null;
            return threat;
        }

        board[defense.row][defense.col] = 'X';
        const nextThreat = vctSearch(depth - 1);
        board[defense.row][defense.col] = null;
        board[threat.row][threat.col] = null;

        if (nextThreat) {
            return threat;
        }
    }

    return null;
}

// VCF (Victory by Continuous Fours) Search
function vcfSearch(depth) {
    if (depth <= 0) return null;

    // Find moves that create four-in-a-row
    for (let row = 0; row < BOARD_SIZE; row++) {
        for (let col = 0; col < BOARD_SIZE; col++) {
            if (board[row][col] === null) {
                board[row][col] = 'O';
                const score = evaluatePosition(row, col, 'O');

                if (score >= PATTERNS.FOUR.score) {
                    board[row][col] = null;
                    return { row, col };
                }

                board[row][col] = null;
            }
        }
    }

    return null;
}

// ================================
// AI LEARNING SYSTEM
// ================================

function getBoardHash() {
    let hash = '';
    for (let row = 0; row < BOARD_SIZE; row++) {
        for (let col = 0; col < BOARD_SIZE; col++) {
            hash += board[row][col] || '-';
        }
    }
    return hash;
}

function learnFromGame(result) {
    experienceDB.gamesPlayed++;

    // Update pattern knowledge
    currentGameData.positions.forEach((posHash, index) => {
        const eval = currentGameData.evaluations[index];

        if (!experienceDB.patterns.has(posHash)) {
            experienceDB.patterns.set(posHash, {
                wins: 0,
                losses: 0,
                draws: 0,
                avgScore: eval
            });
        }

        const pattern = experienceDB.patterns.get(posHash);

        if (result === 'O') {
            pattern.wins++;
        } else if (result === 'X') {
            pattern.losses++;
        } else {
            pattern.draws++;
        }

        // Update average score
        const total = pattern.wins + pattern.losses + pattern.draws;
        pattern.avgScore = (pattern.avgScore * (total - 1) + eval) / total;
    });

    experienceDB.totalLearnings++;

    // Save to localStorage
    try {
        localStorage.setItem('cocaro_experience', JSON.stringify({
            gamesPlayed: experienceDB.gamesPlayed,
            totalLearnings: experienceDB.totalLearnings
        }));
    } catch (e) {
        console.error('Failed to save experience:', e);
    }
}

// ================================
// GAME ANALYSIS MODE
// ================================

function updateAnalysisPanel() {
    if (!analysisMode || !analysisPanel) return;

    const evaluation = evaluateBoard();
    const normalizedEval = Math.max(-100, Math.min(100, evaluation / 10000));

    // Update evaluation bar
    if (evaluationBar) {
        const percentage = ((normalizedEval + 100) / 2);
        evaluationBar.style.width = `${percentage}%`;

        if (normalizedEval > 20) {
            evaluationBar.style.backgroundColor = '#007aff';
        } else if (normalizedEval < -20) {
            evaluationBar.style.backgroundColor = '#ff3b30';
        } else {
            evaluationBar.style.backgroundColor = '#ffcc00';
        }
    }

    // Calculate move quality
    if (moveQualityElement && moveHistory.length > 0) {
        const lastMove = moveHistory[moveHistory.length - 1];
        const quality = evaluatePosition(lastMove.row, lastMove.col, lastMove.player);

        let qualityText = '';
        if (quality > 500000) qualityText = 'Xuất sắc! ⭐⭐⭐';
        else if (quality > 100000) qualityText = 'Tốt ✓';
        else if (quality > 10000) qualityText = 'Bình thường';
        else qualityText = 'Yếu';

        moveQualityElement.textContent = qualityText;
    }

    // Calculate threat level
    if (threatLevelElement) {
        const playerThreats = scanForOpenThree('X') ? 'Cao' : (scanForFourInRow('X') ? 'Rất cao!' : 'Thấp');
        const aiThreats = scanForOpenThree('O') ? 'Cao' : (scanForFourInRow('O') ? 'Rất cao!' : 'Thấp');

        threatLevelElement.innerHTML = `
            <div>Người chơi: <span style="color: var(--color-player-x)">${playerThreats}</span></div>
            <div>AI: <span style="color: var(--color-player-o)">${aiThreats}</span></div>
        `;
    }
}

// ================================
// SAVE/LOAD GAME SYSTEM
// ================================

function saveGameToSlot() {
    const gameData = {
        board: board.map(row => [...row]),
        moveHistory: [...moveHistory],
        currentMoveIndex,
        currentPlayer,
        gameMode,
        aiDifficulty,
        aiPersonality,
        timestamp: Date.now(),
        boardSize: BOARD_SIZE
    };

    savedGames.push(gameData);

    try {
        localStorage.setItem('cocaro_saved_games', JSON.stringify(savedGames));
        alert('Game đã được lưu!');
    } catch (e) {
        alert('Không thể lưu game: ' + e.message);
    }
}

function loadGameFromSlot(index) {
    if (index < 0 || index >= savedGames.length) return;

    const gameData = savedGames[index];

    BOARD_SIZE = gameData.boardSize;
    board = gameData.board.map(row => [...row]);
    moveHistory = [...gameData.moveHistory];
    currentMoveIndex = gameData.currentMoveIndex;
    currentPlayer = gameData.currentPlayer;
    gameMode = gameData.gameMode;
    aiDifficulty = gameData.aiDifficulty || 'grandmaster';
    aiPersonality = gameData.aiPersonality || 'balanced';
    gameActive = true;

    // Recreate board
    boardElement.innerHTML = '';
    createBoard();

    // Replay moves
    for (let i = 0; i <= currentMoveIndex; i++) {
        const move = moveHistory[i];
        const index = move.row * BOARD_SIZE + move.col;
        const cell = boardElement.children[index];
        cell.textContent = move.player;
        cell.classList.add(move.player.toLowerCase());
        cell.disabled = true;
    }

    updateStatus();
    updateHistoryUI();
    updateUndoRedoButtons();

    if (analysisMode) {
        updateAnalysisPanel();
    }
}

function exportGameToJSON() {
    const gameData = {
        version: '4.0.0',
        board: board,
        moveHistory: moveHistory,
        boardSize: BOARD_SIZE,
        gameMode: gameMode,
        aiDifficulty: aiDifficulty,
        aiPersonality: aiPersonality,
        result: currentGameData.result,
        timestamp: Date.now()
    };

    const json = JSON.stringify(gameData, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cocaro-game-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
}

function importGameFromJSON(file) {
    const reader = new FileReader();

    reader.onload = function(e) {
        try {
            const gameData = JSON.parse(e.target.result);

            BOARD_SIZE = gameData.boardSize || 15;
            board = gameData.board;
            moveHistory = gameData.moveHistory;
            currentMoveIndex = moveHistory.length - 1;
            gameMode = gameData.gameMode || 'pvc';
            aiDifficulty = gameData.aiDifficulty || 'grandmaster';
            aiPersonality = gameData.aiPersonality || 'balanced';
            gameActive = true;

            // Recreate board
            boardElement.innerHTML = '';
            createBoard();

            // Replay moves
            for (let i = 0; i < moveHistory.length; i++) {
                const move = moveHistory[i];
                const index = move.row * BOARD_SIZE + move.col;
                const cell = boardElement.children[index];
                cell.textContent = move.player;
                cell.classList.add(move.player.toLowerCase());
                cell.disabled = true;
            }

            currentPlayer = moveHistory.length > 0 ?
                (moveHistory[moveHistory.length - 1].player === 'X' ? 'O' : 'X') : 'X';

            updateStatus();
            updateHistoryUI();
            updateUndoRedoButtons();

            alert('Game đã được nhập thành công!');
        } catch (err) {
            alert('Lỗi khi nhập game: ' + err.message);
        }
    };

    reader.readAsText(file);
}

// ================================
// TUTORIAL MODE
// ================================

function showTutorialMessage(message) {
    if (!tutorialMode) return;

    const tutorialDiv = document.createElement('div');
    tutorialDiv.className = 'tutorial-message';
    tutorialDiv.textContent = message;
    tutorialDiv.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: var(--color-primary);
        color: white;
        padding: 12px 24px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
        z-index: 1000;
        animation: slideDown 0.3s ease;
    `;

    document.body.appendChild(tutorialDiv);

    setTimeout(() => {
        tutorialDiv.style.animation = 'slideUp 0.3s ease';
        setTimeout(() => tutorialDiv.remove(), 300);
    }, 3000);
}

// ================================
// AI THINKING VISUALIZATION
// ================================

function showAIThinking() {
    if (!aiThinkingElement) return;

    aiThinkingElement.style.display = 'block';
    aiThinkingElement.innerHTML = `
        <div class="thinking-animation">
            <span class="dot"></span>
            <span class="dot"></span>
            <span class="dot"></span>
        </div>
        <div>AI đang suy nghĩ...</div>
    `;
}

function hideAIThinking() {
    if (!aiThinkingElement) {
        return;
    }
    aiThinkingElement.style.display = 'none';
}

// ================================
// UNDO/REDO SYSTEM
// ================================

function undo() {
    if (currentMoveIndex < 0) return;

    const move = moveHistory[currentMoveIndex];
    board[move.row][move.col] = null;

    const index = move.row * BOARD_SIZE + move.col;
    const cell = boardElement.children[index];
    cell.textContent = '';
    cell.classList.remove('x', 'o', 'winning');
    cell.disabled = false;

    currentMoveIndex--;
    currentPlayer = move.player;
    gameActive = true;

    // If in PvC mode, undo AI move too
    if (gameMode === 'pvc' && currentMoveIndex >= 0 && moveHistory[currentMoveIndex].player === 'O') {
        undo();
        return;
    }

    updateStatus();
    updateHistoryUI();
    updateUndoRedoButtons();

    if (analysisMode) {
        updateAnalysisPanel();
    }

    saveGame();
}

function redo() {
    if (currentMoveIndex >= moveHistory.length - 1) return;

    currentMoveIndex++;
    const move = moveHistory[currentMoveIndex];

    board[move.row][move.col] = move.player;
    const index = move.row * BOARD_SIZE + move.col;
    const cell = boardElement.children[index];
    cell.textContent = move.player;
    cell.classList.add(move.player.toLowerCase());
    cell.disabled = true;

    // Check if this was the winning move
    const winningCells = checkWin(move.row, move.col);
    if (winningCells) {
        gameActive = false;
        highlightWinningCells(winningCells);
    }

    currentPlayer = move.player === 'X' ? 'O' : 'X';

    // If in PvC mode, redo AI move too
    if (gameMode === 'pvc' && currentMoveIndex < moveHistory.length - 1 && moveHistory[currentMoveIndex + 1].player === 'O') {
        redo();
        return;
    }

    updateStatus();
    updateHistoryUI();
    updateUndoRedoButtons();

    if (analysisMode) {
        updateAnalysisPanel();
    }

    saveGame();
}

function updateUndoRedoButtons() {
    if (undoBtn) {
        undoBtn.disabled = currentMoveIndex < 0;
    }
    if (redoBtn) {
        redoBtn.disabled = currentMoveIndex >= moveHistory.length - 1;
    }
}

// ================================
// HINT SYSTEM
// ================================

function showHint() {
    if (!gameActive) return;
    if (gameMode === 'pvc' && currentPlayer === 'O') return;

    // Clear previous hints
    Array.from(boardElement.children).forEach(cell => {
        cell.classList.remove('hint');
    });

    // Get AI suggestion
    const hint = getAIMove();
    if (hint) {
        const index = hint.row * BOARD_SIZE + hint.col;
        const cell = boardElement.children[index];
        cell.classList.add('hint');

        playSound('hint');

        if (tutorialMode) {
            showTutorialMessage(`Gợi ý: Đặt quân tại hàng ${hint.row + 1}, cột ${hint.col + 1}`);
        }

        // Remove hint after 3 seconds
        setTimeout(() => {
            cell.classList.remove('hint');
        }, 3000);
    }
}

// ================================
// MOVE HISTORY UI
// ================================

function updateHistoryUI() {
    if (!moveHistoryElement) return;

    moveHistoryElement.innerHTML = '';

    moveHistory.forEach((move, index) => {
        const historyItem = document.createElement('div');
        historyItem.className = 'history-item';

        if (index === currentMoveIndex) {
            historyItem.classList.add('current');
        } else if (index > currentMoveIndex) {
            historyItem.classList.add('future');
        }

        const playerClass = move.player === 'X' ? 'player-x' : 'player-o';
        const position = `${String.fromCharCode(65 + move.col)}${move.row + 1}`;

        historyItem.innerHTML = `
            <span class="move-number">${index + 1}.</span>
            <span class="${playerClass}">${move.player}</span>
            <span class="move-position">${position}</span>
        `;

        historyItem.onclick = () => {
            jumpToMove(index);
        };

        moveHistoryElement.appendChild(historyItem);
    });

    // Scroll to current move
    if (moveHistory.length > 0) {
        const currentItem = moveHistoryElement.children[currentMoveIndex];
        if (currentItem) {
            currentItem.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    }
}

function jumpToMove(targetIndex) {
    while (currentMoveIndex > targetIndex) {
        undo();
    }
    while (currentMoveIndex < targetIndex) {
        redo();
    }
}

// ================================
// STATISTICS
// ================================

function updateStats(winner) {
    if (winner === 'X') {
        stats.xWins++;
    } else if (winner === 'O') {
        stats.oWins++;
    } else {
        stats.draws++;
    }

    if (xWinsElement) xWinsElement.textContent = stats.xWins;
    if (oWinsElement) oWinsElement.textContent = stats.oWins;
    if (drawsElement) drawsElement.textContent = stats.draws;

    saveStats();
}

function saveStats() {
    try {
        localStorage.setItem('cocaro_stats', JSON.stringify(stats));
    } catch (e) {
        console.error('Failed to save stats:', e);
    }
}

function loadStats() {
    try {
        const saved = localStorage.getItem('cocaro_stats');
        if (saved) {
            stats = JSON.parse(saved);
            if (xWinsElement) xWinsElement.textContent = stats.xWins;
            if (oWinsElement) oWinsElement.textContent = stats.oWins;
            if (drawsElement) drawsElement.textContent = stats.draws;
        }
    } catch (e) {
        console.error('Failed to load stats:', e);
    }
}

// ================================
// TIMER
// ================================

function startTimer() {
    timerSeconds = 0;
    if (timerDisplay) {
        timerDisplay.textContent = '00:00';
    }
    if (timerElement) {
        timerElement.style.display = 'block';
    }

    timerInterval = setInterval(() => {
        timerSeconds++;
        const minutes = Math.floor(timerSeconds / 60);
        const seconds = timerSeconds % 60;
        if (timerDisplay) {
            timerDisplay.textContent =
                `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
        }
    }, 1000);
}

function stopTimer() {
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
}

// ================================
// SOUND EFFECTS
// ================================

function playSound(type) {
    if (!soundEnabled) return;

    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    gainNode.gain.value = 0.1;

    if (type === 'move') {
        oscillator.frequency.value = 600;
        oscillator.start();
        oscillator.stop(audioContext.currentTime + 0.1);
    } else if (type === 'win') {
        // Play victory chord
        const frequencies = [523.25, 659.25, 783.99]; // C, E, G
        frequencies.forEach((freq, i) => {
            setTimeout(() => {
                const osc = audioContext.createOscillator();
                const gain = audioContext.createGain();
                osc.connect(gain);
                gain.connect(audioContext.destination);
                gain.gain.value = 0.1;
                osc.frequency.value = freq;
                osc.start();
                osc.stop(audioContext.currentTime + 0.3);
            }, i * 100);
        });
    } else if (type === 'draw') {
        oscillator.frequency.value = 400;
        oscillator.start();
        oscillator.stop(audioContext.currentTime + 0.2);
    } else if (type === 'hint') {
        oscillator.frequency.value = 800;
        oscillator.start();
        oscillator.stop(audioContext.currentTime + 0.15);
    }
}

// ================================
// PARTICLE EFFECTS
// ================================

function createParticles() {
    particlesCanvas.width = boardElement.offsetWidth;
    particlesCanvas.height = boardElement.offsetHeight;

    for (let i = 0; i < 50; i++) {
        particles.push({
            x: particlesCanvas.width / 2,
            y: particlesCanvas.height / 2,
            vx: (Math.random() - 0.5) * 10,
            vy: (Math.random() - 0.5) * 10,
            life: 1,
            color: `hsl(${Math.random() * 360}, 70%, 60%)`
        });
    }

    animateParticles();
}

function animateParticles() {
    particlesCtx.clearRect(0, 0, particlesCanvas.width, particlesCanvas.height);

    particles = particles.filter(p => p.life > 0);

    particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.2; // Gravity
        p.life -= 0.02;

        particlesCtx.globalAlpha = p.life;
        particlesCtx.fillStyle = p.color;
        particlesCtx.beginPath();
        particlesCtx.arc(p.x, p.y, 4, 0, Math.PI * 2);
        particlesCtx.fill();
    });

    if (particles.length > 0) {
        requestAnimationFrame(animateParticles);
    }
}

// ================================
// PERSISTENCE
// ================================

function saveGame() {
    try {
        const gameState = {
            board,
            moveHistory,
            currentMoveIndex,
            currentPlayer,
            gameActive,
            gameMode,
            aiDifficulty,
            aiPersonality,
            currentTheme,
            soundEnabled,
            timerEnabled,
            analysisMode,
            tutorialMode,
            boardSize: BOARD_SIZE
        };
        localStorage.setItem('cocaro_game', JSON.stringify(gameState));
    } catch (e) {
        console.error('Failed to save game:', e);
    }
}

function loadGame() {
    try {
        const saved = localStorage.getItem('cocaro_game');
        if (saved) {
            const gameState = JSON.parse(saved);

            // Don't auto-load if it's an empty game
            if (gameState.moveHistory && gameState.moveHistory.length > 0) {
                const response = confirm('Tiếp tục game trước đó?');
                if (response) {
                    BOARD_SIZE = gameState.boardSize || 15;
                    board = gameState.board;
                    moveHistory = gameState.moveHistory;
                    currentMoveIndex = gameState.currentMoveIndex;
                    currentPlayer = gameState.currentPlayer;
                    gameActive = gameState.gameActive;
                    gameMode = gameState.gameMode || 'pvc';
                    aiDifficulty = gameState.aiDifficulty || 'grandmaster';
                    aiPersonality = gameState.aiPersonality || 'balanced';
                    currentTheme = gameState.currentTheme || 'default';
                    soundEnabled = gameState.soundEnabled !== false;
                    timerEnabled = gameState.timerEnabled || false;
                    analysisMode = gameState.analysisMode || false;
                    tutorialMode = gameState.tutorialMode || false;

                    // Recreate board
                    boardElement.innerHTML = '';
                    createBoard();

                    // Replay moves
                    for (let i = 0; i <= currentMoveIndex; i++) {
                        const move = moveHistory[i];
                        const index = move.row * BOARD_SIZE + move.col;
                        const cell = boardElement.children[index];
                        cell.textContent = move.player;
                        cell.classList.add(move.player.toLowerCase());
                        cell.disabled = true;
                    }

                    updateStatus();
                    updateHistoryUI();
                    updateUndoRedoButtons();

                    if (analysisMode) {
                        updateAnalysisPanel();
                    }
                }
            }
        }
    } catch (e) {
        console.error('Failed to load game:', e);
    }
}

function loadSavedGames() {
    try {
        const saved = localStorage.getItem('cocaro_saved_games');
        if (saved) {
            savedGames = JSON.parse(saved);
        }
    } catch (e) {
        console.error('Failed to load saved games:', e);
    }
}

// ================================
// THEME SYSTEM
// ================================

function applyTheme(themeName) {
    currentTheme = themeName;
    const theme = THEMES[themeName];

    // Apply theme to all cells
    Array.from(boardElement.children).forEach(cell => {
        applyThemeToCell(cell);
    });

    // Apply to CSS variables if needed
    document.documentElement.style.setProperty('--theme-player-x', theme.playerX);
    document.documentElement.style.setProperty('--theme-player-o', theme.playerO);

    saveGame();
}

// ================================
// DARK MODE
// ================================

function toggleDarkMode() {
    document.body.classList.toggle('dark-mode');
    const isDark = document.body.classList.contains('dark-mode');

    try {
        localStorage.setItem('cocaro_darkmode', isDark);
    } catch (e) {
        console.error('Failed to save dark mode preference:', e);
    }

    // Update dark mode icon
    if (darkModeToggle) {
        if (isDark) {
            darkModeToggle.innerHTML = `
                <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                    <circle cx="10" cy="10" r="4"/>
                    <path d="M10 0v2M10 18v2M20 10h-2M2 10H0M17.07 2.93l-1.41 1.41M4.34 15.66l-1.41 1.41M17.07 17.07l-1.41-1.41M4.34 4.34L2.93 2.93"/>
                </svg>
            `;
        } else {
            darkModeToggle.innerHTML = `
                <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z"/>
                </svg>
            `;
        }
    }
}

function loadDarkMode() {
    try {
        const darkMode = localStorage.getItem('cocaro_darkmode');
        if (darkMode === 'true') {
            document.body.classList.add('dark-mode');
            toggleDarkMode(); // To update icon
        }
    } catch (e) {
        console.error('Failed to load dark mode:', e);
    }
}

// ================================
// EVENT LISTENERS
// ================================

if (resetBtn) {
    resetBtn.addEventListener('click', () => {
        if (gameActive && moveHistory.length > 0) {
            if (!confirm('Bắt đầu game mới?')) return;
        }
        initGame();
    });
}

if (startGameBtn) {
    startGameBtn.addEventListener('click', () => {
        // Update settings
        if (boardSizeSelect) {
            BOARD_SIZE = parseInt(boardSizeSelect.value);
        }
        if (soundToggle) {
            soundEnabled = soundToggle.checked;
        }
        if (timerToggle) {
            timerEnabled = timerToggle.checked;
        }
        if (gameModeSelect) {
            gameMode = gameModeSelect.value;
        }
        if (aiDifficultySelect) {
            aiDifficulty = aiDifficultySelect.value;
        }
        if (aiPersonalitySelect) {
            aiPersonality = aiPersonalitySelect.value;
        }
        if (analysisModeToggle) {
            analysisMode = analysisModeToggle.checked;
        }
        if (tutorialModeToggle) {
            tutorialMode = tutorialModeToggle.checked;
        }
        if (themeSelect) {
            applyTheme(themeSelect.value);
        }

        // Hide settings panel
        if (settingsPanel) {
            settingsPanel.classList.add('collapsed');
        }

        initGame();
    });
}

if (settingsToggle) {
    settingsToggle.addEventListener('click', () => {
        if (settingsPanel) {
            settingsPanel.classList.toggle('collapsed');
        }
    });
}

if (darkModeToggle) {
    darkModeToggle.addEventListener('click', toggleDarkMode);
}

if (historyToggle) {
    historyToggle.addEventListener('click', () => {
        if (sidePanel) {
            sidePanel.classList.toggle('collapsed');
        }
    });
}

// Show/hide AI settings based on game mode
if (gameModeSelect) {
    gameModeSelect.addEventListener('change', (e) => {
        const isPvC = e.target.value === 'pvc';
        const aiDifficultyContainer = document.getElementById('aiDifficultyContainer');
        const aiPersonalityContainer = document.getElementById('aiPersonalityContainer');

        if (aiDifficultyContainer) aiDifficultyContainer.style.display = isPvC ? 'flex' : 'none';
        if (aiPersonalityContainer) aiPersonalityContainer.style.display = isPvC ? 'flex' : 'none';
    });
}

// Show/hide analysis panel based on toggle
if (analysisModeToggle) {
    analysisModeToggle.addEventListener('change', (e) => {
        if (analysisPanel) {
            analysisPanel.classList.toggle('collapsed', !e.target.checked);
        }
    });
}

if (undoBtn) {
    undoBtn.addEventListener('click', undo);
}

if (redoBtn) {
    redoBtn.addEventListener('click', redo);
}

if (hintBtn) {
    hintBtn.addEventListener('click', showHint);
}

if (saveGameBtn) {
    saveGameBtn.addEventListener('click', saveGameToSlot);
}

if (loadGameBtn) {
    loadGameBtn.addEventListener('click', () => {
        if (savedGames.length === 0) {
            alert('Không có game nào được lưu!');
            return;
        }

        const index = prompt(`Nhập số thứ tự game (1-${savedGames.length}):`);
        if (index) {
            const i = parseInt(index) - 1;
            if (i >= 0 && i < savedGames.length) {
                loadGameFromSlot(i);
            } else {
                alert('Số thứ tự không hợp lệ!');
            }
        }
    });
}

if (exportGameBtn) {
    exportGameBtn.addEventListener('click', exportGameToJSON);
}

if (importGameBtn) {
    importGameBtn.addEventListener('click', () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                importGameFromJSON(file);
            }
        };
        input.click();
    });
}

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    if (e.ctrlKey || e.metaKey) {
        if (e.key === 'z') {
            e.preventDefault();
            undo();
        } else if (e.key === 'y') {
            e.preventDefault();
            redo();
        }
    } else if (e.key === 'h' || e.key === 'H') {
        e.preventDefault();
        showHint();
    }
});

// ================================
// INITIALIZATION ON LOAD
// ================================

window.addEventListener('DOMContentLoaded', () => {
    loadDarkMode();
    loadStats();
    loadSavedGames();
    loadGame();

    // If no saved game, start new
    if (moveHistory.length === 0) {
        initGame();
    }
});
