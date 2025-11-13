// ================================
// CỜ CARO 7.1.1 - HOTFIX: STABILITY OPTIMIZATIONS
// Version: 7.1.1
// Aggressive optimizations for stability - reduced complexity
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
let aiDifficulty = 'supreme'; // 'easy', 'medium', 'hard', 'grandmaster', 'supreme'
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
// V7.0: GPU & NEURAL NETWORK STATE
// ================================
let gpu = null;
let gpuKernels = {};
let neuralModel = null;
let gpuEnabled = false;
let tfReady = false;

// V7.1: Performance optimization state
let aiTimeout = null;
let aiInterrupted = false;
let performanceStats = {
    avgThinkTime: 0,
    maxThinkTime: 0,
    movesCalculated: 0,
    gpuUsageCount: 0,
    cpuUsageCount: 0
};
let nnCache = new Map(); // Neural network prediction cache

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
        vctDepth: 12,  // Reduced from 24 for better performance
        vcfDepth: 10,  // Reduced from 20 for better performance
        searchWidth: 25,
        randomness: 0,
        evaluationMultiplier: 1.0,
        thinkTime: 1500
    },
    supreme: {
        depth: 3,           // V7.1.1: Hotfix - reduced to 3 for stability
        vctDepth: 10,       // V7.1.1: Reduced to 10
        vcfDepth: 8,        // V7.1.1: Reduced to 8
        searchWidth: 15,    // V7.1.1: CRITICAL - reduced to 15 (from 30)
        randomness: 0,
        evaluationMultiplier: 1.0,
        useGPU: true,       // Smart GPU usage (only when beneficial)
        useNeuralNet: true, // Neural network with caching
        progressiveDeepening: true, // V7.1: Start shallow, go deeper if time allows
        maxThinkTime: 2500, // V7.1.1: Reduced to 2.5s
        earlyGameDepth: 2,  // V7.1.1: Use depth 2 for first 10 moves
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
// V5.0: OPENING BOOK SYSTEM FOR INSTANT REFLEXES
// ================================
const OPENING_BOOK = {
    // Center opening (most common)
    center: [
        { row: 7, col: 7 },   // First move: always center
        { row: 6, col: 6 },   // Response to adjacent
        { row: 8, col: 8 },
        { row: 6, col: 8 },
        { row: 8, col: 6 }
    ],
    // Common opening patterns with optimal responses
    patterns: new Map()
};

// V5.0: Performance optimization caches
const AI_CACHE = {
    evaluationCache: new Map(),       // Cache board evaluations
    patternCache: new Map(),          // Cache detected patterns
    moveOrderingCache: new Map(),     // Cache move ordering
    lastBoardHash: null,              // Track board changes
    lastEvaluation: null,             // Last evaluation result
    cacheHits: 0,                     // Statistics
    cacheMisses: 0
};

// V5.0: Smart search control (FIXED for better intelligence)
const SEARCH_CONTROL = {
    maxEmptyCellsForVCT: 150,   // Run VCT if board has < 150 empty cells (67% full)
    maxEmptyCellsForVCF: 175,   // Run VCF if board has < 175 empty cells (78% full)
    earlyGameMoveLimit: 6,      // Use opening book for first 6 moves only (more conservative)
    minThreatsForVCT: 1,        // Minimum threats needed to trigger VCT
    useSmartOpeningBook: true   // Use intelligent opening book with tactical evaluation
};

// ================================
// V7.0: GPU INITIALIZATION & KERNELS
// ================================

/**
 * Initialize GPU.js for parallel computation
 */
function initGPU() {
    try {
        if (typeof GPU === 'undefined') {
            console.warn('GPU.js not loaded, falling back to CPU');
            gpuEnabled = false;
            return;
        }

        gpu = new GPU({
            mode: 'gpu' // Force GPU mode, will fallback to CPU if needed
        });

        console.log('🚀 GPU.js initialized successfully');
        console.log('GPU Mode:', gpu.mode);

        // Create GPU kernels
        createGPUKernels();
        gpuEnabled = true;

    } catch (error) {
        console.error('Failed to initialize GPU:', error);
        gpuEnabled = false;
    }
}

/**
 * Create GPU kernels for parallel computation
 */
function createGPUKernels() {
    // Kernel: Evaluate single line for patterns (parallel)
    gpuKernels.evaluateLine = gpu.createKernel(function(board, row, col, dr, dc, player, boardSize) {
        let score = 0;
        let count = 0;
        let openEnds = 0;

        // Count consecutive pieces in direction
        for (let i = 0; i < 5; i++) {
            const r = row + i * dr;
            const c = col + i * dc;

            if (r < 0 || r >= boardSize || c < 0 || c >= boardSize) {
                break;
            }

            const cell = board[r * boardSize + c];
            if (cell === player) {
                count++;
            } else if (cell === 0) {
                openEnds++;
                break;
            } else {
                break;
            }
        }

        // Score based on count and open ends
        if (count >= 5) score = 10000000;
        else if (count === 4 && openEnds > 0) score = 5000000;
        else if (count === 4) score = 2500000;
        else if (count === 3 && openEnds === 2) score = 1000000;
        else if (count === 3 && openEnds === 1) score = 500000;
        else if (count === 2 && openEnds === 2) score = 50000;

        return score;
    }).setOutput([1]);

    // Kernel: Parallel board evaluation
    gpuKernels.evaluateBoard = gpu.createKernel(function(board, boardSize) {
        const x = this.thread.x;
        const y = this.thread.y;
        const idx = y * boardSize + x;

        if (board[idx] === 0) return 0;

        let score = 0;
        const player = board[idx];

        // Check all 4 directions
        const directions = [
            [0, 1],   // Horizontal
            [1, 0],   // Vertical
            [1, 1],   // Diagonal \
            [1, -1]   // Diagonal /
        ];

        for (let d = 0; d < 4; d++) {
            const dr = directions[d][0];
            const dc = directions[d][1];

            let count = 1;
            let openEnds = 0;

            // Check forward
            for (let i = 1; i < 5; i++) {
                const r = y + i * dr;
                const c = x + i * dc;
                if (r < 0 || r >= boardSize || c < 0 || c >= boardSize) break;

                const cell = board[r * boardSize + c];
                if (cell === player) count++;
                else if (cell === 0) { openEnds++; break; }
                else break;
            }

            // Check backward
            for (let i = 1; i < 5; i++) {
                const r = y - i * dr;
                const c = x - i * dc;
                if (r < 0 || r >= boardSize || c < 0 || c >= boardSize) break;

                const cell = board[r * boardSize + c];
                if (cell === player) count++;
                else if (cell === 0) { openEnds++; break; }
                else break;
            }

            // Score this pattern
            if (count >= 5) score += 10000000;
            else if (count === 4 && openEnds > 0) score += 5000000;
            else if (count === 4) score += 2500000;
            else if (count === 3 && openEnds === 2) score += 1000000;
            else if (count === 3 && openEnds === 1) score += 500000;
            else if (count === 2 && openEnds === 2) score += 50000;
            else if (count === 2 && openEnds === 1) score += 5000;
        }

        return score;
    }).setOutput([15, 15]);

    // Kernel: Parallel move scoring
    gpuKernels.scoreMove = gpu.createKernel(function(board, row, col, player, boardSize) {
        let score = 0;

        // Center control bonus
        const centerDist = Math.abs(row - boardSize/2) + Math.abs(col - boardSize/2);
        score += Math.max(0, 50 - centerDist * 2);

        // Adjacent pieces bonus
        for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
                if (dr === 0 && dc === 0) continue;

                const r = row + dr;
                const c = col + dc;
                if (r >= 0 && r < boardSize && c >= 0 && c < boardSize) {
                    if (board[r * boardSize + c] === player) {
                        score += 10;
                    }
                }
            }
        }

        return score;
    }).setOutput([1]);

    console.log('✅ GPU kernels created successfully');
}

/**
 * GPU-accelerated board evaluation
 */
function evaluateBoardGPU(boardArray, boardSize) {
    if (!gpuEnabled || !gpuKernels.evaluateBoard) {
        return null; // Fallback to CPU
    }

    try {
        // Flatten board for GPU
        const flatBoard = [];
        for (let i = 0; i < boardSize; i++) {
            for (let j = 0; j < boardSize; j++) {
                const cell = boardArray[i][j];
                flatBoard.push(cell === 'X' ? 1 : (cell === 'O' ? 2 : 0));
            }
        }

        // Run GPU kernel
        const result = gpuKernels.evaluateBoard(flatBoard, boardSize);

        // Sum up scores
        let totalScore = 0;
        for (let i = 0; i < boardSize; i++) {
            for (let j = 0; j < boardSize; j++) {
                totalScore += result[i][j];
            }
        }

        return totalScore;
    } catch (error) {
        console.error('GPU evaluation failed:', error);
        return null;
    }
}

/**
 * GPU-accelerated move scoring
 */
function scoreMoveGPU(boardArray, row, col, player, boardSize) {
    if (!gpuEnabled || !gpuKernels.scoreMove) {
        return 0;
    }

    try {
        const flatBoard = [];
        for (let i = 0; i < boardSize; i++) {
            for (let j = 0; j < boardSize; j++) {
                const cell = boardArray[i][j];
                flatBoard.push(cell === 'X' ? 1 : (cell === 'O' ? 2 : 0));
            }
        }

        const playerNum = player === 'X' ? 1 : 2;
        const result = gpuKernels.scoreMove(flatBoard, row, col, playerNum, boardSize);

        return result[0];
    } catch (error) {
        console.error('GPU move scoring failed:', error);
        return 0;
    }
}

// ================================
// V7.0: NEURAL NETWORK INITIALIZATION
// ================================

/**
 * Initialize TensorFlow.js and create neural network model
 */
async function initNeuralNetwork() {
    try {
        if (typeof tf === 'undefined') {
            console.warn('TensorFlow.js not loaded');
            tfReady = false;
            return;
        }

        await tf.ready();
        console.log('🧠 TensorFlow.js ready');
        console.log('Backend:', tf.getBackend());

        // Try to use WebGL backend for GPU acceleration
        try {
            await tf.setBackend('webgl');
            console.log('✅ Using WebGL backend for GPU acceleration');
        } catch (e) {
            console.warn('WebGL not available, using CPU backend');
        }

        // Create a simple neural network for position evaluation
        neuralModel = createPositionEvaluationModel();
        tfReady = true;

        console.log('✅ Neural network model created');

    } catch (error) {
        console.error('Failed to initialize Neural Network:', error);
        tfReady = false;
    }
}

/**
 * Create neural network model for position evaluation
 */
function createPositionEvaluationModel() {
    const model = tf.sequential();

    // Input layer: flattened board (15x15 = 225 cells)
    model.add(tf.layers.dense({
        inputShape: [225],
        units: 128,
        activation: 'relu',
        kernelInitializer: 'heNormal'
    }));

    model.add(tf.layers.dropout({ rate: 0.2 }));

    model.add(tf.layers.dense({
        units: 64,
        activation: 'relu',
        kernelInitializer: 'heNormal'
    }));

    model.add(tf.layers.dropout({ rate: 0.2 }));

    model.add(tf.layers.dense({
        units: 32,
        activation: 'relu',
        kernelInitializer: 'heNormal'
    }));

    // Output layer: single value (position evaluation)
    model.add(tf.layers.dense({
        units: 1,
        activation: 'tanh' // Output in range [-1, 1]
    }));

    model.compile({
        optimizer: tf.train.adam(0.001),
        loss: 'meanSquaredError'
    });

    return model;
}

/**
 * V7.1: Evaluate position using neural network WITH CACHING
 */
function evaluatePositionNN(boardArray, boardSize) {
    if (!tfReady || !neuralModel) {
        return 0;
    }

    try {
        // V7.1: Generate cache key from board state
        const cacheKey = generateBoardHash(boardArray, boardSize);

        // Check cache first
        if (nnCache.has(cacheKey)) {
            return nnCache.get(cacheKey);
        }

        // Flatten and normalize board
        const input = [];
        for (let i = 0; i < boardSize; i++) {
            for (let j = 0; j < boardSize; j++) {
                const cell = boardArray[i][j];
                if (cell === 'X') input.push(1);
                else if (cell === 'O') input.push(-1);
                else input.push(0);
            }
        }

        // Pad to 225 if board is smaller
        while (input.length < 225) {
            input.push(0);
        }

        // Run inference
        const tensor = tf.tensor2d([input]);
        const prediction = neuralModel.predict(tensor);
        const score = prediction.dataSync()[0];

        // Cleanup
        tensor.dispose();
        prediction.dispose();

        const finalScore = score * 100000; // Scale to match traditional evaluation

        // V7.1: Cache result (limit cache size)
        if (nnCache.size < 5000) {
            nnCache.set(cacheKey, finalScore);
        }

        return finalScore;

    } catch (error) {
        console.error('Neural network evaluation failed:', error);
        return 0;
    }
}

/**
 * V7.1: Generate hash for board state (for NN cache)
 */
function generateBoardHash(boardArray, boardSize) {
    let hash = '';
    for (let i = 0; i < boardSize; i++) {
        for (let j = 0; j < boardSize; j++) {
            const cell = boardArray[i][j];
            hash += cell === 'X' ? '1' : (cell === 'O' ? '2' : '0');
        }
    }
    return hash;
}

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

    // V5.0: Clear AI caches for new game (performance optimization)
    AI_CACHE.evaluationCache.clear();
    AI_CACHE.patternCache.clear();
    AI_CACHE.moveOrderingCache.clear();
    AI_CACHE.lastBoardHash = null;
    AI_CACHE.lastEvaluation = null;

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

        // V5.0: Log AI performance stats
        if (gameMode === 'pvc') {
            logAIPerformance();
        }

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

        // V5.0: Log AI performance stats
        if (gameMode === 'pvc') {
            logAIPerformance();
        }

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

// V7.1: Optimized evaluation with smart GPU usage
function evaluateBoard() {
    // Check cache first
    const hash = getZobristHash();
    if (AI_CACHE.evaluationCache.has(hash)) {
        AI_CACHE.cacheHits++;
        return AI_CACHE.evaluationCache.get(hash);
    }

    AI_CACHE.cacheMisses++;

    let aiScore = 0;
    let playerScore = 0;

    // V7.1: Smart GPU usage - only use GPU when board is complex enough
    const config = AI_CONFIGS[aiDifficulty];
    const occupiedCells = countOccupiedCells();
    const boardFullness = occupiedCells / (BOARD_SIZE * BOARD_SIZE);

    // Use GPU only when board is >40% full (complex enough to benefit from GPU)
    const shouldUseGPU = config && config.useGPU && gpuEnabled && boardFullness > 0.4;

    if (shouldUseGPU) {
        // Try GPU-accelerated evaluation
        const gpuScore = evaluateBoardGPU(board, BOARD_SIZE);
        if (gpuScore !== null) {
            performanceStats.gpuUsageCount++;

            // GPU evaluation successful
            const personality = AI_PERSONALITIES[aiPersonality];

            // Apply personality modifiers to GPU score
            const result = gpuScore * personality.attackMultiplier - (gpuScore * 0.5 * personality.defenseMultiplier);

            // Add Neural Network evaluation if available (only for mid-late game)
            if (config.useNeuralNet && tfReady && boardFullness > 0.3) {
                const nnScore = evaluatePositionNN(board, BOARD_SIZE);
                // Blend traditional + GPU + NN scores (weighted average)
                const blended = result * 0.7 + nnScore * 0.3;

                if (AI_CACHE.evaluationCache.size < 10000) {
                    AI_CACHE.evaluationCache.set(hash, blended);
                }
                return blended;
            }

            if (AI_CACHE.evaluationCache.size < 10000) {
                AI_CACHE.evaluationCache.set(hash, result);
            }
            return result;
        }
        // GPU failed, fallback to CPU
    }

    // Traditional CPU evaluation (early game or GPU not beneficial)
    performanceStats.cpuUsageCount++;

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
    const result = aiScore - (playerScore * 4.5);

    // V7.1: Add Neural Network for mid-game+ (CPU path)
    if (config && config.useNeuralNet && tfReady && boardFullness > 0.3) {
        const nnScore = evaluatePositionNN(board, BOARD_SIZE);
        const blended = result * 0.8 + nnScore * 0.2;

        if (AI_CACHE.evaluationCache.size < 10000) {
            AI_CACHE.evaluationCache.set(hash, blended);
        }
        return blended;
    }

    // Store in cache (limit cache size to prevent memory bloat)
    if (AI_CACHE.evaluationCache.size < 10000) {
        AI_CACHE.evaluationCache.set(hash, result);
    }

    return result;
}

// V7.1: Count occupied cells for smart GPU usage decision
function countOccupiedCells() {
    let count = 0;
    for (let row = 0; row < BOARD_SIZE; row++) {
        for (let col = 0; col < BOARD_SIZE; col++) {
            if (board[row][col] !== null) count++;
        }
    }
    return count;
}

// ================================
// V5.0: OPENING BOOK & HELPER FUNCTIONS
// ================================

// Count empty cells on board (for smart VCT/VCF triggering)
function countEmptyCells() {
    let count = 0;
    for (let row = 0; row < BOARD_SIZE; row++) {
        for (let col = 0; col < BOARD_SIZE; col++) {
            if (board[row][col] === null) count++;
        }
    }
    return count;
}

// V5.0 FIXED: Smart opening book with tactical evaluation
function getOpeningBookMove() {
    const moveCount = moveHistory.length;

    // AI's first move (move 0 if player is X, or response to player's first move)
    if (moveCount === 1) {
        // Player played first, respond near center
        const playerMove = moveHistory[0];
        const center = Math.floor(BOARD_SIZE / 2);

        // If player took center, play adjacent
        if (playerMove.row === center && playerMove.col === center) {
            const offset = 1;
            return { row: center - offset, col: center - offset };
        }

        // If player didn't take center, take it
        if (board[center][center] === null) {
            return { row: center, col: center };
        }
    }

    // FIXED: For moves 2-6, use SMART heuristic with evaluation
    if (moveCount >= 2 && moveCount < SEARCH_CONTROL.earlyGameMoveLimit) {
        // Find candidates near existing stones
        const candidates = [];
        const center = Math.floor(BOARD_SIZE / 2);

        for (let row = Math.max(0, center - 4); row <= Math.min(BOARD_SIZE - 1, center + 4); row++) {
            for (let col = Math.max(0, center - 4); col <= Math.min(BOARD_SIZE - 1, center + 4); col++) {
                if (board[row][col] === null && hasAdjacentStone(row, col, 2)) {
                    // CRITICAL FIX: Evaluate tactical value, not random!
                    const aiScore = evaluatePosition(row, col, 'O');
                    const playerScore = evaluatePosition(row, col, 'X');
                    const score = aiScore - (playerScore * 2.0); // Favor defense
                    candidates.push({ row, col, score });
                }
            }
        }

        if (candidates.length > 0) {
            // FIXED: Choose best candidate, not random!
            candidates.sort((a, b) => b.score - a.score);
            // Return top candidate (or one of top 3 for variety)
            const topCandidates = candidates.slice(0, Math.min(3, candidates.length));
            return topCandidates[0]; // Best move
        }
    }

    return null; // No book move available
}

// Check if position has adjacent stones within distance
function hasAdjacentStone(row, col, distance) {
    for (let dr = -distance; dr <= distance; dr++) {
        for (let dc = -distance; dc <= distance; dc++) {
            if (dr === 0 && dc === 0) continue;
            const r = row + dr;
            const c = col + dc;
            if (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE) {
                if (board[r][c] !== null) return true;
            }
        }
    }
    return false;
}

// V5.0: Log AI performance statistics (for debugging)
function logAIPerformance() {
    const totalRequests = AI_CACHE.cacheHits + AI_CACHE.cacheMisses;
    const hitRate = totalRequests > 0 ? (AI_CACHE.cacheHits / totalRequests * 100).toFixed(2) : 0;

    console.log('=== CoCaro 5.0 AI Performance ===');
    console.log(`Cache Hit Rate: ${hitRate}% (${AI_CACHE.cacheHits}/${totalRequests})`);
    console.log(`Evaluation Cache Size: ${AI_CACHE.evaluationCache.size}`);
    console.log(`Pattern Cache Size: ${AI_CACHE.patternCache.size}`);
    console.log(`Move Ordering Cache Size: ${AI_CACHE.moveOrderingCache.size}`);
    console.log('================================');
}

// ================================
// AI MOVE GENERATION - MULTI-LEVEL
// ================================

// Track if current move is forced (for think time optimization)
// Forced moves: winning moves, blocking immediate threats, blocking 4-in-a-row
// These should be executed quickly without long think time
let isForcedMove = false;

// V7.1: Progressive deepening wrapper
function getAIMove() {
    const config = AI_CONFIGS[aiDifficulty];
    isForcedMove = false; // Reset

    // V7.1: Reset interrupt flag
    aiInterrupted = false;

    // V7.1: Set timeout for AI thinking
    if (config.maxThinkTime) {
        clearTimeout(aiTimeout);
        aiTimeout = setTimeout(() => {
            aiInterrupted = true;
            console.warn('⏱️ AI timeout reached, interrupting search...');
        }, config.maxThinkTime);
    }

    // Track performance
    const startTime = Date.now();

    try {
        const move = getAIMoveInternal();

        // V7.1: Track performance stats
        const thinkTime = Date.now() - startTime;
        performanceStats.movesCalculated++;
        performanceStats.avgThinkTime =
            (performanceStats.avgThinkTime * (performanceStats.movesCalculated - 1) + thinkTime)
            / performanceStats.movesCalculated;
        performanceStats.maxThinkTime = Math.max(performanceStats.maxThinkTime, thinkTime);

        console.log(`🤖 AI think time: ${thinkTime}ms | GPU: ${performanceStats.gpuUsageCount} | CPU: ${performanceStats.cpuUsageCount}`);

        return move;
    } finally {
        // V7.1: Clear timeout
        clearTimeout(aiTimeout);
        aiInterrupted = false;
    }
}

// V7.1: Internal AI move logic (separated for progressive deepening)
function getAIMoveInternal() {
    const config = AI_CONFIGS[aiDifficulty];

    // Initialize if needed
    if (zobristTable.length === 0) {
        initZobrist();
        initHistoryTable();
    }

    const moveCount = moveHistory.length;

    // ULTRA-FAST: First move - always center, no calculation needed!
    if (moveCount === 0) {
        const center = Math.floor(BOARD_SIZE / 2);
        isForcedMove = true; // Treat as forced for instant response
        return { row: center, col: center };
    }

    // ============================================
    // CRITICAL FIX: TACTICAL CHECKS FIRST!
    // ============================================
    // MUST check threats BEFORE using opening book!

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

    // 5. Block opponent's open three - HIGH PRIORITY
    move = scanForOpenThree('X');
    if (move) {
        isForcedMove = true; // Treat as forced - this is critical!
        return move;
    }

    // ============================================
    // V5.0 FIXED: OPENING BOOK - ONLY IF NO THREATS!
    // ============================================
    // Only use opening book if position is safe (no immediate threats detected)
    if (moveCount < SEARCH_CONTROL.earlyGameMoveLimit) {
        const bookMove = getOpeningBookMove();
        if (bookMove) {
            // Opening book move found and no threats - fast response
            isForcedMove = true;
            return bookMove;
        }
    }

    // 6. Create own open three
    move = scanForOpenThree('O');
    if (move) return move;

    // ============================================
    // V7.1.1: SMART VCT/VCF - DISABLED FOR EARLY GAME
    // ============================================
    // V7.1.1 HOTFIX: Only use VCT/VCF after move 10 to prevent early game freeze
    if ((aiDifficulty === 'grandmaster' || aiDifficulty === 'supreme') && moveCount >= 10) {
        const emptyCount = countEmptyCells();

        // Only run VCT/VCF in late game (board is filling up)
        if (!aiInterrupted && emptyCount < SEARCH_CONTROL.maxEmptyCellsForVCT) {
            move = vctSearch(config.vctDepth);
            if (move) return move;
        }

        if (!aiInterrupted && emptyCount < SEARCH_CONTROL.maxEmptyCellsForVCF) {
            move = vcfSearch(config.vcfDepth);
            if (move) return move;
        }
    }

    // ============================================
    // V7.1: STRATEGIC SEARCH WITH PROGRESSIVE DEEPENING
    // ============================================
    const candidates = getRelevantMoves(config.searchWidth);
    if (candidates.length === 0) {
        // Fallback to center (should rarely happen)
        const center = Math.floor(BOARD_SIZE / 2);
        return { row: center, col: center };
    }

    // V7.1.1: Progressive deepening with early game optimization
    if (config.progressiveDeepening && aiDifficulty === 'supreme') {
        let bestMove = null;
        let currentDepth = 2; // Start shallow

        // V7.1.1 HOTFIX: Use shallow depth for early game (first 10 moves)
        const maxDepth = moveCount < 10 ? (config.earlyGameDepth || 2) : config.depth;

        console.log(`🔍 Progressive deepening (move ${moveCount}): depth 2 → ${maxDepth}`);

        // Iteratively deepen until timeout or max depth
        while (currentDepth <= maxDepth && !aiInterrupted) {
            const depthMove = minimaxMove(candidates, currentDepth);
            if (depthMove && !aiInterrupted) {
                bestMove = depthMove;
                console.log(`  ✓ Depth ${currentDepth} complete`);

                // V7.1.1: Early exit if we found a really good move (score > 1M)
                const evaluation = evaluateBoard();
                if (Math.abs(evaluation) > 1000000) {
                    console.log(`  🎯 Found winning move, stopping search`);
                    break;
                }
            }

            if (aiInterrupted) {
                console.log(`  ⏱️ Interrupted at depth ${currentDepth}`);
                break;
            }

            currentDepth++;
        }

        move = bestMove || candidates[0]; // Fallback to best candidate
    } else {
        // Traditional fixed-depth search
        move = minimaxMove(candidates, config.depth);
    }

    // Add randomness for lower difficulties
    if (config.randomness > 0 && Math.random() < config.randomness) {
        const randomIndex = Math.floor(Math.random() * Math.min(3, candidates.length));
        move = candidates[randomIndex];
    }

    return move;
}

// V5.0: Calculate dynamic think time with ultra-fast early game
function calculateThinkTime() {
    const config = AI_CONFIGS[aiDifficulty];

    // V5.0: If forced move (including book moves), respond INSTANTLY
    if (isForcedMove) {
        return 50; // Lightning fast! (reduced from 100ms)
    }

    // Count number of moves made
    const moveCount = moveHistory.length;

    // V5.0: ULTRA-FAST early game (opening book moves)
    if (moveCount === 0) {
        return 50; // Instant first move (reduced from 150ms)
    }

    // V5.0: Moves 1-10 should be very fast (opening book territory)
    if (moveCount < 5) {
        return 100; // Super fast (reduced from 300ms)
    }

    if (moveCount < 10) {
        return 200; // Still fast (reduced from 500ms)
    }

    // Check if board is mostly empty (simple position)
    const emptyCount = board.flat().filter(cell => cell === null).length;
    const totalCells = BOARD_SIZE * BOARD_SIZE;
    const emptyRatio = emptyCount / totalCells;

    // If board is >80% empty, think faster
    if (emptyRatio > 0.8) {
        return Math.min(config.thinkTime * 0.3, 300);
    }

    // For Easy and Medium difficulties, always think faster
    if (aiDifficulty === 'easy') {
        return Math.min(config.thinkTime * 0.4, 300);
    }
    if (aiDifficulty === 'medium') {
        return Math.min(config.thinkTime * 0.6, 500);
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

// V5.0: Optimized move generation with adaptive distance
function getRelevantMoves(maxMoves) {
    const moves = [];
    const evaluated = new Set();

    // V5.0: Adaptive search distance based on game phase
    const moveCount = moveHistory.length;
    const searchDistance = moveCount < 10 ? 2 : 2; // Can reduce to 1 in very early game if needed

    for (let row = 0; row < BOARD_SIZE; row++) {
        for (let col = 0; col < BOARD_SIZE; col++) {
            if (board[row][col] !== null) {
                // Add adjacent empty cells within search distance
                for (let dr = -searchDistance; dr <= searchDistance; dr++) {
                    for (let dc = -searchDistance; dc <= searchDistance; dc++) {
                        const r = row + dr;
                        const c = col + dc;
                        const key = `${r},${c}`;

                        if (r >= 0 && r < BOARD_SIZE &&
                            c >= 0 && c < BOARD_SIZE &&
                            board[r][c] === null &&
                            !evaluated.has(key)) {

                            evaluated.add(key);
                            // V5.0: Cache position evaluations for faster move ordering
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

// V7.1: Minimax with timeout checking
function minimax(depth, alpha, beta, isMaximizing) {
    // V7.1: Check if AI was interrupted (timeout)
    if (aiInterrupted) {
        return 0; // Return neutral evaluation on interrupt
    }

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
            // V7.1: Check interrupt before each move
            if (aiInterrupted) break;

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
            // V7.1: Check interrupt before each move
            if (aiInterrupted) break;

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

// V7.1: VCT with timeout checking
function vctSearch(depth) {
    if (depth <= 0 || aiInterrupted) return null;

    const threats = [];

    // Find all threat moves
    for (let row = 0; row < BOARD_SIZE; row++) {
        for (let col = 0; col < BOARD_SIZE; col++) {
            if (aiInterrupted) break; // Early exit on timeout

            if (board[row][col] === null) {
                board[row][col] = 'O';
                const score = evaluatePosition(row, col, 'O');

                if (score >= PATTERNS.OPEN_THREE.score) {
                    threats.push({ row, col, score });
                }

                board[row][col] = null;
            }
        }
        if (aiInterrupted) break;
    }

    // Try best threats recursively
    threats.sort((a, b) => b.score - a.score);

    for (const threat of threats.slice(0, 5)) {
        if (aiInterrupted) break; // Early exit on timeout

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

// V7.1: VCF with timeout checking
function vcfSearch(depth) {
    if (depth <= 0 || aiInterrupted) return null;

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

window.addEventListener('DOMContentLoaded', async () => {
    // V7.0: Initialize GPU and Neural Network
    console.log('🚀 Initializing CoCaro 7.0...');

    // Initialize GPU.js
    initGPU();

    // Initialize TensorFlow.js Neural Network (async)
    await initNeuralNetwork();

    console.log(`✅ GPU Status: ${gpuEnabled ? 'ENABLED' : 'DISABLED'}`);
    console.log(`✅ Neural Network Status: ${tfReady ? 'READY' : 'NOT READY'}`);

    // Load game state
    loadDarkMode();
    loadStats();
    loadSavedGames();
    loadGame();

    // If no saved game, start new
    if (moveHistory.length === 0) {
        initGame();
    }

    console.log('✅ CoCaro 7.0 ready!');
});
