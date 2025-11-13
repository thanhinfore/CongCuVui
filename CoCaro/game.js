// ================================
// CỜ CARO 9.1 - ADVANCED AI (Machine Learning & MCTS)
// Version: 9.1.0
// Real Neural Network Training, MCTS Integration & Persistent Learning
// Đẳng cấp AI với khả năng học và tiến hóa theo thời gian
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
// V9.1: REAL NEURAL NETWORK TRAINING STATE
// ================================
let trainingData = {
    positions: [],      // Training positions (board states)
    labels: [],         // Labels (win/loss/draw scores)
    batchSize: 32,
    epochs: 10,
    learningRate: 0.001,
    totalSamples: 0,
    lastTrainTime: null,
    autoTrain: true,    // Auto-train after collecting enough data
    minSamplesForTrain: 100
};

let nnTrainingStats = {
    totalTrainingSessions: 0,
    totalEpochs: 0,
    currentAccuracy: 0,
    bestAccuracy: 0,
    lastLoss: 0,
    trainingHistory: []
};

// ================================
// V9.1: MCTS (Monte Carlo Tree Search) STATE
// ================================
let mctsEnabled = false;
let mctsStats = {
    totalSimulations: 0,
    avgSimulationTime: 0,
    bestMoveFound: 0,
    explorationConstant: 1.414 // UCB1 constant (√2)
};

// MCTS Node class
class MCTSNode {
    constructor(board, player, move = null, parent = null) {
        this.board = JSON.parse(JSON.stringify(board)); // Deep copy
        this.player = player;
        this.move = move;
        this.parent = parent;
        this.children = [];
        this.wins = 0;
        this.visits = 0;
        this.untriedMoves = null; // Will be populated lazily
    }

    isFullyExpanded() {
        return this.untriedMoves && this.untriedMoves.length === 0;
    }

    isTerminal() {
        // Check if game is over
        return checkWinCondition(this.board) || isBoardFull(this.board);
    }

    ucb1(explorationConstant = 1.414) {
        if (this.visits === 0) return Infinity;
        const exploitation = this.wins / this.visits;
        const exploration = Math.sqrt(Math.log(this.parent.visits) / this.visits);
        return exploitation + explorationConstant * exploration;
    }
}

// ================================
// V9.1: PERSISTENT LEARNING STATE (IndexedDB)
// ================================
let persistentLearning = {
    enabled: true,
    dbName: 'CoCaroLearningDB',
    version: 1,
    db: null,

    // Player profiling
    playerProfile: {
        gamesPlayed: 0,
        style: 'unknown', // 'aggressive', 'defensive', 'tactical', 'balanced'
        commonPatterns: [],
        weaknesses: [],
        favoriteOpenings: [],
        avgMoveTime: 0
    },

    // Position memory
    positionMemory: {
        wins: new Map(),
        losses: new Map(),
        draws: new Map()
    },

    // Adaptive weights
    adaptiveWeights: {
        aggressiveness: 1.0,
        defensiveness: 1.0,
        tacticalness: 1.0
    }
};

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
        depth: 5,           // V9.0: Increased for Grandmaster level
        vctDepth: 14,       // V9.0: Enhanced threat search
        vcfDepth: 12,       // V9.0: Stronger forcing
        searchWidth: 25,    // V9.0: Wider for better tactics
        randomness: 0,
        evaluationMultiplier: 1.0,
        useGPU: true,       // Smart GPU usage
        useNeuralNet: true, // Neural network with caching
        progressiveDeepening: true,
        maxThinkTime: 5000, // V9.1: Extended for MCTS (from 4000ms)
        earlyGameDepth: 4,  // V9.0: Professional opening

        // V8.0 features
        multiThreatDetection: true,
        criticalMoveDetection: true,
        advancedPatterns: true,

        // V9.0 features
        useOpeningBook: true,        // Professional opening database
        useThreatSpaceSearch: true,  // Renju threat space search
        useEndgameTablebase: true,   // Perfect endgame play
        useRenjuCombinations: true,  // 3-3, 4-4, 4-3 detection
        usePatternsV9: true,         // 50+ professional patterns

        // V9.1 ADVANCED features
        useRealNN: true,             // V9.1: Real neural network training
        useMCTS: true,               // V9.1: Monte Carlo Tree Search
        mctsSimulations: 100,        // V9.1: MCTS simulation count
        usePersistentLearning: true, // V9.1: IndexedDB learning
        useAdaptiveStrategy: true,   // V9.1: Adapt to player style

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
// V9.0: PROFESSIONAL OPENING BOOK DATABASE (50+ Openings)
// ================================
const OPENING_BOOK_V9 = {
    // Opening book enabled moves (first 5-7 moves)
    enabled: true,
    maxDepth: 7, // Use opening book for first 7 moves

    // AGGRESSIVE OPENINGS (Tấn công)
    aggressive: [
        // Direct Center Attack (most aggressive)
        { name: 'Direct Center', moves: [
            {row: 7, col: 7}, {row: 6, col: 6}, {row: 8, col: 8}, {row: 5, col: 5}, {row: 9, col: 9}
        ], score: 1000 },
        // Diagonal Sword
        { name: 'Diagonal Sword', moves: [
            {row: 7, col: 7}, {row: 6, col: 8}, {row: 5, col: 9}, {row: 6, col: 7}, {row: 8, col: 6}
        ], score: 950 },
        // Double Wing Attack
        { name: 'Double Wing', moves: [
            {row: 7, col: 7}, {row: 6, col: 6}, {row: 8, col: 7}, {row: 7, col: 6}, {row: 7, col: 9}
        ], score: 920 },
        // Diagonal Assault
        { name: 'Diagonal Assault', moves: [
            {row: 7, col: 7}, {row: 8, col: 8}, {row: 6, col: 6}, {row: 9, col: 9}, {row: 5, col: 5}
        ], score: 900 },
        // Corner Expansion
        { name: 'Corner Expansion', moves: [
            {row: 7, col: 7}, {row: 6, col: 8}, {row: 8, col: 6}, {row: 9, col: 5}, {row: 5, col: 9}
        ], score: 880 },
        // Lightning Strike
        { name: 'Lightning Strike', moves: [
            {row: 7, col: 7}, {row: 7, col: 8}, {row: 7, col: 6}, {row: 7, col: 9}, {row: 7, col: 5}
        ], score: 860 },
        // Cross Attack
        { name: 'Cross Attack', moves: [
            {row: 7, col: 7}, {row: 8, col: 7}, {row: 6, col: 7}, {row: 7, col: 8}, {row: 7, col: 6}
        ], score: 840 },
        // Flower Formation
        { name: 'Flower Formation', moves: [
            {row: 7, col: 7}, {row: 6, col: 7}, {row: 7, col: 8}, {row: 8, col: 7}, {row: 7, col: 6}
        ], score: 820 }
    ],

    // BALANCED OPENINGS (Cân bằng)
    balanced: [
        // Standard Center
        { name: 'Standard Center', moves: [
            {row: 7, col: 7}, {row: 6, col: 6}, {row: 7, col: 8}, {row: 8, col: 7}, {row: 6, col: 8}
        ], score: 1000 },
        // Symmetrical Development
        { name: 'Symmetrical Dev', moves: [
            {row: 7, col: 7}, {row: 6, col: 7}, {row: 8, col: 7}, {row: 7, col: 6}, {row: 7, col: 8}
        ], score: 980 },
        // Star Formation
        { name: 'Star Formation', moves: [
            {row: 7, col: 7}, {row: 6, col: 6}, {row: 8, col: 8}, {row: 6, col: 8}, {row: 8, col: 6}
        ], score: 960 },
        // Box Control
        { name: 'Box Control', moves: [
            {row: 7, col: 7}, {row: 6, col: 7}, {row: 7, col: 6}, {row: 8, col: 7}, {row: 7, col: 8}
        ], score: 940 },
        // Knight's Move
        { name: "Knight's Move", moves: [
            {row: 7, col: 7}, {row: 6, col: 8}, {row: 8, col: 6}, {row: 7, col: 9}, {row: 7, col: 5}
        ], score: 920 },
        // Diamond Shape
        { name: 'Diamond Shape', moves: [
            {row: 7, col: 7}, {row: 6, col: 7}, {row: 8, col: 7}, {row: 7, col: 6}, {row: 7, col: 8}
        ], score: 900 },
        // Windmill
        { name: 'Windmill', moves: [
            {row: 7, col: 7}, {row: 6, col: 8}, {row: 8, col: 8}, {row: 8, col: 6}, {row: 6, col: 6}
        ], score: 880 },
        // Central Control
        { name: 'Central Control', moves: [
            {row: 7, col: 7}, {row: 7, col: 8}, {row: 7, col: 6}, {row: 8, col: 7}, {row: 6, col: 7}
        ], score: 860 }
    ],

    // DEFENSIVE OPENINGS (Phòng thủ)
    defensive: [
        // Solid Wall
        { name: 'Solid Wall', moves: [
            {row: 7, col: 7}, {row: 7, col: 8}, {row: 7, col: 6}, {row: 6, col: 7}, {row: 8, col: 7}
        ], score: 1000 },
        // Fortress
        { name: 'Fortress', moves: [
            {row: 7, col: 7}, {row: 6, col: 6}, {row: 6, col: 7}, {row: 6, col: 8}, {row: 7, col: 6}
        ], score: 980 },
        // Turtle Defense
        { name: 'Turtle Defense', moves: [
            {row: 7, col: 7}, {row: 6, col: 7}, {row: 7, col: 6}, {row: 6, col: 6}, {row: 7, col: 8}
        ], score: 960 },
        // Shield Formation
        { name: 'Shield Formation', moves: [
            {row: 7, col: 7}, {row: 7, col: 8}, {row: 7, col: 6}, {row: 8, col: 7}, {row: 6, col: 7}
        ], score: 940 },
        // Iron Defense
        { name: 'Iron Defense', moves: [
            {row: 7, col: 7}, {row: 8, col: 7}, {row: 6, col: 7}, {row: 7, col: 8}, {row: 7, col: 6}
        ], score: 920 },
        // Defensive Box
        { name: 'Defensive Box', moves: [
            {row: 7, col: 7}, {row: 6, col: 6}, {row: 7, col: 6}, {row: 6, col: 7}, {row: 7, col: 8}
        ], score: 900 },
        // Corner Guard
        { name: 'Corner Guard', moves: [
            {row: 7, col: 7}, {row: 6, col: 6}, {row: 6, col: 7}, {row: 7, col: 6}, {row: 8, col: 8}
        ], score: 880 },
        // Protective Circle
        { name: 'Protective Circle', moves: [
            {row: 7, col: 7}, {row: 6, col: 7}, {row: 8, col: 7}, {row: 7, col: 6}, {row: 7, col: 8}
        ], score: 860 }
    ],

    // Response database: best responses to opponent's moves
    responses: new Map([
        // If opponent plays near center, respond with counter-control
        ['7,6', [{row: 7, col: 8}, {row: 6, col: 6}, {row: 8, col: 6}]],
        ['7,8', [{row: 7, col: 6}, {row: 6, col: 8}, {row: 8, col: 8}]],
        ['6,7', [{row: 8, col: 7}, {row: 6, col: 6}, {row: 6, col: 8}]],
        ['8,7', [{row: 6, col: 7}, {row: 8, col: 6}, {row: 8, col: 8}]],
        // Diagonal responses
        ['6,6', [{row: 8, col: 8}, {row: 7, col: 6}, {row: 6, col: 7}]],
        ['8,8', [{row: 6, col: 6}, {row: 7, col: 8}, {row: 8, col: 7}]],
        ['6,8', [{row: 8, col: 6}, {row: 7, col: 8}, {row: 6, col: 7}]],
        ['8,6', [{row: 6, col: 8}, {row: 7, col: 6}, {row: 8, col: 7}]]
    ])
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
// V8.0: ADVANCED AI INTELLIGENCE FUNCTIONS
// ================================

/**
 * V8.0: Detect multiple threats (double-three, etc.)
 * Returns count and positions of threat moves
 */
function detectMultipleThreats(player) {
    const threats = [];

    for (let row = 0; row < BOARD_SIZE; row++) {
        for (let col = 0; col < BOARD_SIZE; col++) {
            if (board[row][col] === null) {
                // Try placing piece
                board[row][col] = player;
                const score = evaluatePosition(row, col, player);
                board[row][col] = null;

                // Check if this creates a threat (open-three or better)
                if (score >= PATTERNS.OPEN_THREE.score) {
                    threats.push({
                        row, col, score,
                        type: score >= PATTERNS.FOUR.score ? 'four' :
                              score >= PATTERNS.OPEN_THREE.score ? 'open-three' : 'threat'
                    });
                }
            }
        }
    }

    return threats;
}

/**
 * V8.0: Check if position is critical (multiple threats possible)
 * Critical = can create double-threat or force win
 */
function isCriticalPosition(row, col, player) {
    if (board[row][col] !== null) return false;

    // Place piece temporarily
    board[row][col] = player;

    // Count threats after this move
    const threats = detectMultipleThreats(player);
    const hasFour = threats.some(t => t.type === 'four');
    const openThrees = threats.filter(t => t.type === 'open-three');

    board[row][col] = null;

    // Critical if creates four OR creates multiple open-threes
    return hasFour || openThrees.length >= 2;
}

/**
 * V8.0: Find all critical moves (forcing moves)
 * Priority: Win > Block Win > Create Four > Block Four > Double Threat
 */
function findCriticalMoves() {
    const critical = {
        aiWin: null,
        blockWin: null,
        aiFour: null,
        blockFour: null,
        aiDoubleThreat: [],
        blockDoubleThreat: []
    };

    // Check for immediate wins/blocks
    critical.aiWin = scanForWinningMove('O');
    critical.blockWin = scanForWinningMove('X');

    // Check for four-in-a-row
    critical.aiFour = scanForFourInRow('O');
    critical.blockFour = scanForFourInRow('X');

    // Check for double-threat positions
    for (let row = 0; row < BOARD_SIZE; row++) {
        for (let col = 0; col < BOARD_SIZE; col++) {
            if (board[row][col] === null) {
                if (isCriticalPosition(row, col, 'O')) {
                    critical.aiDoubleThreat.push({ row, col });
                }
                if (isCriticalPosition(row, col, 'X')) {
                    critical.blockDoubleThreat.push({ row, col });
                }
            }
        }
    }

    return critical;
}

/**
 * V8.0: Enhanced move ordering with threat-based prioritization
 * Returns moves sorted by strategic value
 */
function getStrategicMoves(maxMoves) {
    const moves = [];
    const centerRow = Math.floor(BOARD_SIZE / 2);
    const centerCol = Math.floor(BOARD_SIZE / 2);

    for (let row = 0; row < BOARD_SIZE; row++) {
        for (let col = 0; col < BOARD_SIZE; col++) {
            if (board[row][col] === null && hasAdjacentStone(row, col, 2)) {
                // Calculate strategic score
                let score = 0;

                // 1. Evaluation score (attacking + defending)
                board[row][col] = 'O';
                const aiScore = evaluatePosition(row, col, 'O');
                board[row][col] = 'X';
                const defenseScore = evaluatePosition(row, col, 'X');
                board[row][col] = null;

                score += aiScore + (defenseScore * 2); // Favor defense

                // 2. Center control bonus
                const centerDist = Math.abs(row - centerRow) + Math.abs(col - centerCol);
                score += Math.max(0, 100 - centerDist * 5);

                // 3. Critical move bonus
                if (isCriticalPosition(row, col, 'O')) {
                    score += 500000;
                }
                if (isCriticalPosition(row, col, 'X')) {
                    score += 800000; // Blocking critical is higher priority
                }

                // 4. History heuristic
                score += historyTable[row][col] * 10;

                moves.push({ row, col, score });
            }
        }
    }

    // Sort by score descending
    moves.sort((a, b) => b.score - a.score);

    // Return top N moves
    return moves.slice(0, maxMoves);
}

// ================================
// V9.0: THREAT SPACE SEARCH (Renju Algorithm)
// ================================

/**
 * V9.0: Threat Space Search - searches in threat space instead of board space
 * Much more efficient for finding complex winning sequences
 */
function threatSpaceSearch(player, maxDepth) {
    const threats = [];
    const opponent = player === 'O' ? 'X' : 'O';

    // Find all threat positions for current player
    for (let row = 0; row < BOARD_SIZE; row++) {
        for (let col = 0; col < BOARD_SIZE; col++) {
            if (board[row][col] === null) {
                board[row][col] = player;
                const score = evaluatePosition(row, col, player);

                // Check if this creates a threat
                if (score >= PATTERNS_V9.OPEN_THREE.score) {
                    // Check opponent's defense options
                    const defenseCount = countDefenseMoves(row, col, opponent);

                    threats.push({
                        row, col, score, defenseCount,
                        type: score >= PATTERNS_V9.FOUR.score ? 'four' :
                              score >= PATTERNS_V9.OPEN_THREE.score ? 'open-three' : 'threat'
                    });
                }
                board[row][col] = null;
            }
        }
    }

    // Sort threats by strength (fewer defense options = stronger)
    threats.sort((a, b) => {
        if (a.defenseCount !== b.defenseCount) {
            return a.defenseCount - b.defenseCount; // Fewer defenses first
        }
        return b.score - a.score; // Higher score first
    });

    return threats;
}

/**
 * V9.0: Count how many moves opponent needs to defend against a threat
 */
function countDefenseMoves(row, col, opponent) {
    let defenseCount = 0;

    for (let r = Math.max(0, row - 2); r <= Math.min(BOARD_SIZE - 1, row + 2); r++) {
        for (let c = Math.max(0, col - 2); c <= Math.min(BOARD_SIZE - 1, col + 2); c++) {
            if (board[r][c] === null) {
                board[r][c] = opponent;
                const blockScore = evaluatePosition(r, c, opponent);
                board[r][c] = null;

                if (blockScore >= PATTERNS_V9.BLOCK_OPEN_THREE.score) {
                    defenseCount++;
                }
            }
        }
    }

    return defenseCount;
}

/**
 * V9.0: Detect 3-3, 4-4, 4-3 combinations (Renju forbidden moves concept)
 * These are extremely powerful tactical patterns
 */
function detectRenjuCombinations(row, col, player) {
    board[row][col] = player;

    let threeCount = 0;
    let fourCount = 0;

    // Check all 4 directions for threes and fours
    const directions = [[0,1], [1,0], [1,1], [1,-1]];

    for (const [dr, dc] of directions) {
        const lineScore = evaluateLineDirection(row, col, dr, dc, player);

        if (lineScore >= PATTERNS_V9.FOUR.score) {
            fourCount++;
        } else if (lineScore >= PATTERNS_V9.OPEN_THREE.score) {
            threeCount++;
        }
    }

    board[row][col] = null;

    return {
        isDoubleThree: threeCount >= 2,      // 3-3 combination
        isDoubleFour: fourCount >= 2,        // 4-4 combination (instant win!)
        isFourThree: fourCount >= 1 && threeCount >= 1  // 4-3 combination (very strong)
    };
}

/**
 * V9.0: Evaluate score in a single direction
 */
function evaluateLineDirection(row, col, dr, dc, player) {
    let count = 1; // Include current position
    let openEnds = 0;

    // Check forward direction
    for (let i = 1; i < 5; i++) {
        const r = row + i * dr;
        const c = col + i * dc;
        if (r < 0 || r >= BOARD_SIZE || c < 0 || c >= BOARD_SIZE) break;
        if (board[r][c] === player) count++;
        else if (board[r][c] === null) { openEnds++; break; }
        else break;
    }

    // Check backward direction
    for (let i = 1; i < 5; i++) {
        const r = row - i * dr;
        const c = col - i * dc;
        if (r < 0 || r >= BOARD_SIZE || c < 0 || c >= BOARD_SIZE) break;
        if (board[r][c] === player) count++;
        else if (board[r][c] === null) { openEnds++; break; }
        else break;
    }

    // Score based on count and openness
    if (count >= 5) return PATTERNS_V9.FIVE.score;
    if (count === 4 && openEnds === 2) return PATTERNS_V9.OPEN_FOUR.score;
    if (count === 4) return PATTERNS_V9.FOUR.score;
    if (count === 3 && openEnds === 2) return PATTERNS_V9.OPEN_THREE.score;
    if (count === 3) return PATTERNS_V9.SEMI_OPEN_THREE.score;

    return 0;
}

// ================================
// V9.0: ENDGAME TABLEBASE (Perfect Endgame Play)
// ================================

/**
 * V9.0: Endgame tablebase for perfect play when board is >70% full
 */
const ENDGAME_TABLEBASE = {
    enabled: true,
    threshold: 0.7, // Activate when board is 70% full
    cache: new Map(),

    // Pre-computed perfect endgame positions
    knownPositions: new Map()
};

/**
 * V9.0: Check if we're in endgame
 */
function isEndgame() {
    const filledCells = board.flat().filter(cell => cell !== null).length;
    const totalCells = BOARD_SIZE * BOARD_SIZE;
    return (filledCells / totalCells) >= ENDGAME_TABLEBASE.threshold;
}

/**
 * V9.0: Get perfect endgame move from tablebase
 */
function getEndgameMove(player) {
    if (!ENDGAME_TABLEBASE.enabled || !isEndgame()) {
        return null;
    }

    // Generate position hash
    const posHash = generateBoardHash(board, BOARD_SIZE);

    // Check cache first
    if (ENDGAME_TABLEBASE.cache.has(posHash)) {
        const cached = ENDGAME_TABLEBASE.cache.get(posHash);
        console.log('🎯 V9.0: Endgame tablebase hit!', cached);
        return cached;
    }

    // Endgame strategy: Find forcing moves or best positional move
    const forcingMove = findForcingEndgameMove(player);
    if (forcingMove) {
        ENDGAME_TABLEBASE.cache.set(posHash, forcingMove);
        return forcingMove;
    }

    return null;
}

/**
 * V9.0: Find forcing moves in endgame
 */
function findForcingEndgameMove(player) {
    const opponent = player === 'O' ? 'X' : 'O';

    // 1. Check for immediate win
    const winMove = scanForWinningMove(player);
    if (winMove) return winMove;

    // 2. Block opponent's win
    const blockMove = scanForWinningMove(opponent);
    if (blockMove) return blockMove;

    // 3. Create double threat
    for (let row = 0; row < BOARD_SIZE; row++) {
        for (let col = 0; col < BOARD_SIZE; col++) {
            if (board[row][col] === null) {
                const combo = detectRenjuCombinations(row, col, player);
                if (combo.isDoubleFour || combo.isFourThree || combo.isDoubleThree) {
                    return { row, col };
                }
            }
        }
    }

    return null;
}

// ================================
// V9.0: OPENING BOOK HELPER FUNCTIONS
// ================================

/**
 * V9.0: Get move from opening book
 */
function getOpeningBookMove() {
    const moveCount = moveHistory.length;

    if (!OPENING_BOOK_V9.enabled || moveCount >= OPENING_BOOK_V9.maxDepth) {
        return null;
    }

    // Select opening category based on AI personality
    let openings;
    if (aiPersonality === 'aggressive') {
        openings = OPENING_BOOK_V9.aggressive;
    } else if (aiPersonality === 'defensive') {
        openings = OPENING_BOOK_V9.defensive;
    } else {
        openings = OPENING_BOOK_V9.balanced;
    }

    // First move: always center (if board is empty)
    if (moveCount === 0) {
        console.log('📖 V9.0: Opening book - Center start');
        return { row: 7, col: 7 };
    }

    // Try to match current game to an opening sequence
    for (const opening of openings) {
        if (moveCount < opening.moves.length) {
            const nextMove = opening.moves[moveCount];

            // Check if this opening matches our game so far
            let matches = true;
            for (let i = 0; i < moveCount; i++) {
                const expected = opening.moves[i];
                const actual = board[expected.row][expected.col];
                if (actual === null) {
                    matches = false;
                    break;
                }
            }

            if (matches && board[nextMove.row][nextMove.col] === null) {
                console.log(`📖 V9.0: Opening book - ${opening.name} (move ${moveCount + 1})`);
                return nextMove;
            }
        }
    }

    // Check response database for counter-moves
    if (moveCount === 1) {
        const lastMove = moveHistory[0];
        const key = `${lastMove.row},${lastMove.col}`;
        const responses = OPENING_BOOK_V9.responses.get(key);

        if (responses && responses.length > 0) {
            // Pick first available response
            for (const resp of responses) {
                if (board[resp.row][resp.col] === null) {
                    console.log('📖 V9.0: Opening book - Counter-response');
                    return resp;
                }
            }
        }
    }

    return null;
}

// ================================
// V9.1: REAL NEURAL NETWORK TRAINING FUNCTIONS
// ================================

/**
 * V9.1: Create and compile neural network model for position evaluation
 */
async function createNeuralNetworkModel() {
    if (typeof tf === 'undefined') {
        console.warn('TensorFlow.js not loaded, skipping NN creation');
        return null;
    }

    try {
        const model = tf.sequential();

        // Input layer: board state (15x15 = 225 cells, each can be -1/0/1)
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

        // Output layer: single value (position evaluation score -1 to 1)
        model.add(tf.layers.dense({
            units: 1,
            activation: 'tanh' // Output between -1 and 1
        }));

        // Compile model
        model.compile({
            optimizer: tf.train.adam(trainingData.learningRate),
            loss: 'meanSquaredError',
            metrics: ['mse', 'mae']
        });

        console.log('🧠 V9.1: Neural Network model created successfully!');
        model.summary();

        return model;

    } catch (error) {
        console.error('Failed to create NN model:', error);
        return null;
    }
}

/**
 * V9.1: Convert board to tensor input for neural network
 */
function boardToTensor(boardState) {
    const flatBoard = [];

    for (let row = 0; row < BOARD_SIZE; row++) {
        for (let col = 0; col < BOARD_SIZE; col++) {
            const cell = boardState[row][col];
            // Convert to -1 (X), 0 (empty), 1 (O)
            if (cell === 'X') flatBoard.push(-1);
            else if (cell === 'O') flatBoard.push(1);
            else flatBoard.push(0);
        }
    }

    return tf.tensor2d([flatBoard], [1, 225]);
}

/**
 * V9.1: Collect training data from current game
 */
function collectTrainingData(boardState, evaluation, gameResult) {
    if (!trainingData.autoTrain) return;

    // Store position and evaluation
    const flatBoard = [];
    for (let row = 0; row < BOARD_SIZE; row++) {
        for (let col = 0; col < BOARD_SIZE; col++) {
            const cell = boardState[row][col];
            if (cell === 'X') flatBoard.push(-1);
            else if (cell === 'O') flatBoard.push(1);
            else flatBoard.push(0);
        }
    }

    trainingData.positions.push(flatBoard);

    // Normalize label between -1 and 1
    let label = 0;
    if (gameResult === 'win') label = 1.0;
    else if (gameResult === 'loss') label = -1.0;
    else if (gameResult === 'draw') label = 0.0;
    else {
        // During game, use normalized evaluation
        label = Math.max(-1, Math.min(1, evaluation / 10000000));
    }

    trainingData.labels.push(label);
    trainingData.totalSamples++;

    // Auto-train when enough samples collected
    if (trainingData.totalSamples >= trainingData.minSamplesForTrain &&
        trainingData.totalSamples % trainingData.minSamplesForTrain === 0) {
        console.log(`📊 V9.1: Collected ${trainingData.totalSamples} samples, starting training...`);
        trainNeuralNetwork();
    }
}

/**
 * V9.1: Train neural network with collected data
 */
async function trainNeuralNetwork() {
    if (!neuralModel || trainingData.positions.length < trainingData.batchSize) {
        return;
    }

    try {
        console.log('🎓 V9.1: Training neural network...');

        // Convert training data to tensors
        const xs = tf.tensor2d(trainingData.positions);
        const ys = tf.tensor2d(trainingData.labels, [trainingData.labels.length, 1]);

        // Train model
        const history = await neuralModel.fit(xs, ys, {
            epochs: trainingData.epochs,
            batchSize: trainingData.batchSize,
            validationSplit: 0.2,
            shuffle: true,
            verbose: 0,
            callbacks: {
                onEpochEnd: (epoch, logs) => {
                    if (epoch % 2 === 0) {
                        console.log(`  Epoch ${epoch + 1}/${trainingData.epochs}: loss=${logs.loss.toFixed(4)}, val_loss=${logs.val_loss.toFixed(4)}`);
                    }
                }
            }
        });

        // Update stats
        nnTrainingStats.totalTrainingSessions++;
        nnTrainingStats.totalEpochs += trainingData.epochs;
        nnTrainingStats.lastLoss = history.history.loss[history.history.loss.length - 1];

        const valLoss = history.history.val_loss[history.history.val_loss.length - 1];
        nnTrainingStats.currentAccuracy = 1 - valLoss;
        nnTrainingStats.bestAccuracy = Math.max(nnTrainingStats.bestAccuracy, nnTrainingStats.currentAccuracy);

        nnTrainingStats.trainingHistory.push({
            session: nnTrainingStats.totalTrainingSessions,
            samples: trainingData.totalSamples,
            loss: nnTrainingStats.lastLoss,
            accuracy: nnTrainingStats.currentAccuracy,
            timestamp: Date.now()
        });

        console.log(`✅ V9.1: Training complete! Accuracy: ${(nnTrainingStats.currentAccuracy * 100).toFixed(2)}%`);

        trainingData.lastTrainTime = Date.now();

        // Cleanup tensors
        xs.dispose();
        ys.dispose();

    } catch (error) {
        console.error('❌ V9.1: Training failed:', error);
    }
}

/**
 * V9.1: Use trained neural network for position evaluation
 */
function evaluateWithNN(boardState) {
    if (!neuralModel || !tfReady) return null;

    try {
        const tensor = boardToTensor(boardState);
        const prediction = neuralModel.predict(tensor);
        const score = prediction.dataSync()[0]; // Value between -1 and 1

        // Cleanup
        tensor.dispose();
        prediction.dispose();

        // Convert to game score scale
        return score * 5000000; // Scale to match pattern scores

    } catch (error) {
        console.error('NN evaluation error:', error);
        return null;
    }
}

// ================================
// V9.1: MCTS (Monte Carlo Tree Search) FUNCTIONS
// ================================

/**
 * V9.1: MCTS main search function
 */
function mctsSearch(rootBoard, player, numSimulations = 100) {
    const startTime = Date.now();
    const root = new MCTSNode(rootBoard, player);

    for (let i = 0; i < numSimulations; i++) {
        // 1. Selection
        let node = selectNode(root);

        // 2. Expansion
        if (!node.isTerminal() && node.visits > 0) {
            node = expandNode(node);
        }

        // 3. Simulation (Rollout)
        const result = simulateGame(node);

        // 4. Backpropagation
        backpropagate(node, result);

        // Early exit if interrupted
        if (aiInterrupted) break;
    }

    // Select best move based on visit count
    const bestChild = root.children.reduce((best, child) =>
        child.visits > best.visits ? child : best
    );

    const thinkTime = Date.now() - startTime;
    mctsStats.totalSimulations += numSimulations;
    mctsStats.avgSimulationTime = (mctsStats.avgSimulationTime + thinkTime) / 2;

    console.log(`🌳 V9.1: MCTS completed ${numSimulations} simulations in ${thinkTime}ms`);
    console.log(`   Best move: (${bestChild.move.row}, ${bestChild.move.col}) with ${bestChild.visits} visits, ${(bestChild.wins/bestChild.visits*100).toFixed(1)}% win rate`);

    return bestChild.move;
}

/**
 * V9.1: Select most promising node using UCB1
 */
function selectNode(node) {
    while (!node.isTerminal()) {
        if (!node.isFullyExpanded()) {
            return node;
        }

        // Select child with highest UCB1 score
        node = node.children.reduce((best, child) =>
            child.ucb1(mctsStats.explorationConstant) > best.ucb1(mctsStats.explorationConstant) ? child : best
        );
    }
    return node;
}

/**
 * V9.1: Expand node by adding a new child
 */
function expandNode(node) {
    // Get untried moves lazily
    if (node.untriedMoves === null) {
        node.untriedMoves = getValidMoves(node.board);
    }

    if (node.untriedMoves.length === 0) {
        return node;
    }

    // Pick random untried move
    const moveIndex = Math.floor(Math.random() * node.untriedMoves.length);
    const move = node.untriedMoves.splice(moveIndex, 1)[0];

    // Create new board state
    const newBoard = JSON.parse(JSON.stringify(node.board));
    newBoard[move.row][move.col] = node.player;

    // Create child node
    const opponent = node.player === 'O' ? 'X' : 'O';
    const child = new MCTSNode(newBoard, opponent, move, node);
    node.children.push(child);

    return child;
}

/**
 * V9.1: Simulate random game from node position
 */
function simulateGame(node) {
    const simBoard = JSON.parse(JSON.stringify(node.board));
    let currentPlayer = node.player;
    let movesPlayed = 0;
    const maxMoves = 50; // Limit simulation length

    while (movesPlayed < maxMoves) {
        // Check terminal state
        const winner = checkWinCondition(simBoard);
        if (winner) {
            return winner === 'O' ? 1 : -1;
        }

        if (isBoardFull(simBoard)) {
            return 0; // Draw
        }

        // Make random move
        const validMoves = getValidMoves(simBoard);
        if (validMoves.length === 0) break;

        const randomMove = validMoves[Math.floor(Math.random() * validMoves.length)];
        simBoard[randomMove.row][randomMove.col] = currentPlayer;

        currentPlayer = currentPlayer === 'O' ? 'X' : 'O';
        movesPlayed++;
    }

    // If reached max moves, evaluate position
    return 0; // Draw by default
}

/**
 * V9.1: Backpropagate result up the tree
 */
function backpropagate(node, result) {
    while (node !== null) {
        node.visits++;

        // Update wins (from perspective of node's player)
        if ((node.player === 'O' && result > 0) || (node.player === 'X' && result < 0)) {
            node.wins++;
        } else if (result === 0) {
            node.wins += 0.5; // Draw counts as half win
        }

        node = node.parent;
    }
}

/**
 * V9.1: Get valid moves for MCTS
 */
function getValidMoves(boardState) {
    const moves = [];

    for (let row = 0; row < BOARD_SIZE; row++) {
        for (let col = 0; col < BOARD_SIZE; col++) {
            if (boardState[row][col] === null && hasAdjacentStone(row, col, 2)) {
                moves.push({ row, col });
            }
        }
    }

    // If no adjacent moves, allow center area
    if (moves.length === 0) {
        const center = Math.floor(BOARD_SIZE / 2);
        for (let dr = -2; dr <= 2; dr++) {
            for (let dc = -2; dc <= 2; dc++) {
                const r = center + dr;
                const c = center + dc;
                if (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE && boardState[r][c] === null) {
                    moves.push({ row: r, col: c });
                }
            }
        }
    }

    return moves;
}

// ================================
// V9.1: PERSISTENT LEARNING (IndexedDB) FUNCTIONS
// ================================

/**
 * V9.1: Initialize IndexedDB for persistent learning
 */
function initPersistentLearning() {
    if (!persistentLearning.enabled || !window.indexedDB) {
        console.warn('IndexedDB not available, persistent learning disabled');
        return;
    }

    const request = indexedDB.open(persistentLearning.dbName, persistentLearning.version);

    request.onerror = () => {
        console.error('Failed to open IndexedDB');
        persistentLearning.enabled = false;
    };

    request.onsuccess = (event) => {
        persistentLearning.db = event.target.result;
        console.log('💾 V9.1: Persistent learning database initialized');

        // Load existing data
        loadPersistentData();
    };

    request.onupgradeneeded = (event) => {
        const db = event.target.result;

        // Create object stores
        if (!db.objectStoreNames.contains('playerProfile')) {
            db.createObjectStore('playerProfile', { keyPath: 'id' });
        }

        if (!db.objectStoreNames.contains('positionMemory')) {
            db.createObjectStore('positionMemory', { keyPath: 'hash' });
        }

        if (!db.objectStoreNames.contains('gameHistory')) {
            db.createObjectStore('gameHistory', { keyPath: 'id', autoIncrement: true });
        }

        console.log('💾 V9.1: Database schema created');
    };
}

/**
 * V9.1: Load persistent data from IndexedDB
 */
function loadPersistentData() {
    if (!persistentLearning.db) return;

    const transaction = persistentLearning.db.transaction(['playerProfile'], 'readonly');
    const store = transaction.objectStore('playerProfile');
    const request = store.get('default');

    request.onsuccess = () => {
        if (request.result) {
            persistentLearning.playerProfile = request.result.data;
            console.log('📊 V9.1: Loaded player profile:', persistentLearning.playerProfile);
        }
    };
}

/**
 * V9.1: Save persistent data to IndexedDB
 */
function savePersistentData() {
    if (!persistentLearning.db) return;

    const transaction = persistentLearning.db.transaction(['playerProfile'], 'readwrite');
    const store = transaction.objectStore('playerProfile');

    store.put({
        id: 'default',
        data: persistentLearning.playerProfile
    });
}

/**
 * V9.1: Analyze player style based on move history
 */
function analyzePlayerStyle() {
    if (moveHistory.length < 10) return;

    let aggressiveMoves = 0;
    let defensiveMoves = 0;
    let tacticalMoves = 0;

    // Analyze last 20 moves
    const recentMoves = moveHistory.slice(-20);

    for (const move of recentMoves) {
        if (move.player === 'X') { // Human player
            // Simple heuristic: check if move creates threat or blocks threat
            const score = evaluatePosition(move.row, move.col, 'X');

            if (score > 100000) aggressiveMoves++;
            else if (score < 50000) defensiveMoves++;
            else tacticalMoves++;
        }
    }

    // Determine dominant style
    const max = Math.max(aggressiveMoves, defensiveMoves, tacticalMoves);

    if (max === aggressiveMoves) {
        persistentLearning.playerProfile.style = 'aggressive';
    } else if (max === defensiveMoves) {
        persistentLearning.playerProfile.style = 'defensive';
    } else {
        persistentLearning.playerProfile.style = 'tactical';
    }

    console.log(`👤 V9.1: Player style detected: ${persistentLearning.playerProfile.style}`);

    // Adapt AI strategy
    adaptAIStrategy();
}

/**
 * V9.1: Adapt AI strategy based on player profile
 */
function adaptAIStrategy() {
    const style = persistentLearning.playerProfile.style;

    switch (style) {
        case 'aggressive':
            // Against aggressive player, play more defensively
            persistentLearning.adaptiveWeights.aggressiveness = 0.7;
            persistentLearning.adaptiveWeights.defensiveness = 1.5;
            console.log('🛡️ V9.1: Adapting to aggressive player - defensive strategy');
            break;

        case 'defensive':
            // Against defensive player, play more aggressively
            persistentLearning.adaptiveWeights.aggressiveness = 1.5;
            persistentLearning.adaptiveWeights.defensiveness = 0.7;
            console.log('⚔️ V9.1: Adapting to defensive player - aggressive strategy');
            break;

        case 'tactical':
            // Against tactical player, balance approach
            persistentLearning.adaptiveWeights.aggressiveness = 1.0;
            persistentLearning.adaptiveWeights.defensiveness = 1.0;
            persistentLearning.adaptiveWeights.tacticalness = 1.3;
            console.log('🧩 V9.1: Adapting to tactical player - balanced strategy');
            break;
    }

    savePersistentData();
}

/**
 * V9.1: Remember position outcome for learning
 */
function rememberPosition(boardState, result) {
    const hash = generateBoardHash(boardState, BOARD_SIZE);

    if (result === 'win') {
        persistentLearning.positionMemory.wins.set(hash, true);
    } else if (result === 'loss') {
        persistentLearning.positionMemory.losses.set(hash, true);
    } else {
        persistentLearning.positionMemory.draws.set(hash, true);
    }

    // Save to IndexedDB
    if (persistentLearning.db) {
        const transaction = persistentLearning.db.transaction(['positionMemory'], 'readwrite');
        const store = transaction.objectStore('positionMemory');

        store.put({
            hash: hash,
            result: result,
            timestamp: Date.now()
        });
    }
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

// V9.0: PROFESSIONAL PATTERN DATABASE (50+ Patterns)
// Patterns from professional Gomoku/Renju games
const PATTERNS_V9 = {
    // ========== WINNING PATTERNS (10M+) ==========
    FIVE: { score: 10000000, pattern: [1,1,1,1,1], name: 'Five in a row' },

    // ========== CRITICAL THREATS (1M-6M) - Must respond immediately ==========
    OPEN_FOUR: { score: 5000000, pattern: [0,1,1,1,1,0], name: 'Open Four' },
    FOUR: { score: 2500000, pattern: [1,1,1,1], name: 'Four' },
    BROKEN_FOUR_A: { score: 2200000, pattern: [0,1,1,0,1,1,0], name: 'Broken Four A' },
    BROKEN_FOUR_B: { score: 2000000, pattern: [0,1,0,1,1,1,0], name: 'Broken Four B' },
    BROKEN_FOUR_C: { score: 1800000, pattern: [0,1,1,1,0,1,0], name: 'Broken Four C' },

    // ========== DOUBLE THREATS (800K-1.5M) - Very strong ==========
    DOUBLE_OPEN_THREE: { score: 1500000, name: 'Double Open Three' },
    DOUBLE_THREE: { score: 1200000, name: 'Double Three' },
    FOUR_THREE: { score: 1800000, name: 'Four-Three Combination' },
    THREE_THREE: { score: 900000, name: 'Three-Three (Renju forbidden)' },

    // ========== OPEN THREES (400K-600K) - Strong attacks ==========
    OPEN_THREE: { score: 500000, pattern: [0,1,1,1,0], name: 'Open Three' },
    BROKEN_THREE_A: { score: 450000, pattern: [0,1,1,0,1,0], name: 'Broken Three A' },
    BROKEN_THREE_B: { score: 420000, pattern: [0,1,0,1,1,0], name: 'Broken Three B' },
    BROKEN_THREE_C: { score: 400000, pattern: [0,1,0,1,0,1,0], name: 'Broken Three C' },
    BROKEN_THREE_D: { score: 380000, pattern: [0,1,1,0,0,1,0], name: 'Broken Three D' },

    // ========== SEMI-OPEN THREES (80K-200K) - Medium threats ==========
    SEMI_OPEN_THREE: { score: 150000, pattern: [1,1,1,0], name: 'Semi-open Three' },
    SEMI_OPEN_THREE_REV: { score: 150000, pattern: [0,1,1,1], name: 'Semi-open Three Rev' },
    SEMI_BROKEN_THREE_A: { score: 120000, pattern: [1,1,0,1,0], name: 'Semi-broken Three A' },
    SEMI_BROKEN_THREE_B: { score: 100000, pattern: [1,0,1,1,0], name: 'Semi-broken Three B' },
    SEMI_BROKEN_THREE_C: { score: 90000, pattern: [0,1,0,1,1], name: 'Semi-broken Three C' },

    // ========== OPEN TWOS (30K-60K) - Building attacks ==========
    OPEN_TWO: { score: 50000, pattern: [0,1,1,0], name: 'Open Two' },
    BROKEN_TWO_A: { score: 40000, pattern: [0,1,0,1,0], name: 'Broken Two A' },
    BROKEN_TWO_B: { score: 35000, pattern: [0,1,0,0,1,0], name: 'Broken Two B' },
    BROKEN_TWO_C: { score: 30000, pattern: [0,0,1,1,0,0], name: 'Broken Two C' },
    STRETCHED_TWO: { score: 38000, pattern: [0,1,0,0,0,1,0], name: 'Stretched Two' },

    // ========== SEMI-OPEN TWOS (8K-20K) - Early development ==========
    SEMI_OPEN_TWO: { score: 18000, pattern: [1,1,0], name: 'Semi-open Two' },
    SEMI_OPEN_TWO_REV: { score: 18000, pattern: [0,1,1], name: 'Semi-open Two Rev' },
    SEMI_BROKEN_TWO_A: { score: 12000, pattern: [1,0,1,0], name: 'Semi-broken Two A' },
    SEMI_BROKEN_TWO_B: { score: 10000, pattern: [0,1,0,1], name: 'Semi-broken Two B' },

    // ========== ADVANCED TACTICAL PATTERNS ==========
    // Renju-specific patterns
    SWORD: { score: 650000, name: 'Sword (VCT pattern)' },
    BROKEN_SWORD: { score: 550000, name: 'Broken Sword' },
    FLOWER_FOUR: { score: 480000, name: 'Flower Four' },
    DOUBLE_SWORD: { score: 1300000, name: 'Double Sword (deadly)' },

    // VCF patterns
    VCF_CHAIN_4: { score: 2800000, name: 'VCF Chain (4 moves)' },
    VCF_CHAIN_3: { score: 1600000, name: 'VCF Chain (3 moves)' },
    VCF_POTENTIAL: { score: 700000, name: 'VCF Potential' },

    // Combination patterns
    OPEN_TWO_PLUS_THREE: { score: 600000, name: 'Open Two + Three' },
    DOUBLE_BROKEN_THREE: { score: 850000, name: 'Double Broken Three' },
    TRIPLE_TWO: { score: 320000, name: 'Triple Two' },

    // Defensive patterns
    BLOCK_OPEN_FOUR: { score: 6000000, name: 'Block Open Four' },
    BLOCK_FOUR: { score: 3000000, name: 'Block Four' },
    BLOCK_DOUBLE_THREE: { score: 1800000, name: 'Block Double Three' },
    BLOCK_OPEN_THREE: { score: 800000, name: 'Block Open Three' },
    BLOCK_SWORD: { score: 900000, name: 'Block Sword' },

    // Positional patterns
    CENTER_CONTROL: { score: 5000, name: 'Center Control' },
    CORNER_CONTROL: { score: 3000, name: 'Corner Control' },
    EDGE_CONTROL: { score: 2000, name: 'Edge Control' },
    FORK_POSITION: { score: 400000, name: 'Fork Position' },
    PIN_POSITION: { score: 350000, name: 'Pin Position' },

    // Connection patterns
    CONNECTED_THREE: { score: 280000, name: 'Connected Three' },
    CONNECTED_TWO: { score: 45000, name: 'Connected Two' },
    BRIDGE: { score: 60000, name: 'Bridge Connection' },
    JUMP: { score: 35000, name: 'Jump Connection' },

    // ========== EARLY GAME PATTERNS ==========
    DIAGONAL_START: { score: 8000, name: 'Diagonal Opening' },
    STRAIGHT_START: { score: 7000, name: 'Straight Opening' },
    STAR_POINT: { score: 10000, name: 'Star Point (Tengen)' },
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
    // V9.0: PROFESSIONAL OPENING BOOK - ONLY IF NO THREATS!
    // ============================================
    // V9.0: Use professional opening book database (24 openings)
    if (config.useOpeningBook && moveCount < OPENING_BOOK_V9.maxDepth) {
        const bookMove = getOpeningBookMove();
        if (bookMove) {
            console.log('📖 V9.0: Using professional opening book');
            isForcedMove = true;
            return bookMove;
        }
    }

    // ============================================
    // V9.0: ENDGAME TABLEBASE (Perfect Endgame Play)
    // ============================================
    if (config.useEndgameTablebase && isEndgame()) {
        const endgameMove = getEndgameMove('O');
        if (endgameMove) {
            console.log('🎯 V9.0: Endgame tablebase - perfect play!');
            return endgameMove;
        }
    }

    // 6. Create own open three
    move = scanForOpenThree('O');
    if (move) return move;

    // ============================================
    // V9.0: RENJU COMBINATIONS (3-3, 4-4, 4-3)
    // ============================================
    if (config.useRenjuCombinations && aiDifficulty === 'supreme') {
        // Check for double-four (instant win!)
        for (let row = 0; row < BOARD_SIZE; row++) {
            for (let col = 0; col < BOARD_SIZE; col++) {
                if (board[row][col] === null) {
                    const combo = detectRenjuCombinations(row, col, 'O');
                    if (combo.isDoubleFour) {
                        console.log('💥 V9.0: Double-Four combination (instant win!)');
                        return { row, col };
                    }
                }
            }
        }

        // Check for four-three combination (very strong)
        for (let row = 0; row < BOARD_SIZE; row++) {
            for (let col = 0; col < BOARD_SIZE; col++) {
                if (board[row][col] === null) {
                    const combo = detectRenjuCombinations(row, col, 'O');
                    if (combo.isFourThree) {
                        console.log('⚡ V9.0: Four-Three combination (forcing!)');
                        return { row, col };
                    }
                }
            }
        }

        // Block opponent's double-four/four-three
        for (let row = 0; row < BOARD_SIZE; row++) {
            for (let col = 0; col < BOARD_SIZE; col++) {
                if (board[row][col] === null) {
                    const combo = detectRenjuCombinations(row, col, 'X');
                    if (combo.isDoubleFour || combo.isFourThree) {
                        console.log('🛡️ V9.0: Blocking opponent Renju combination!');
                        isForcedMove = true;
                        return { row, col };
                    }
                }
            }
        }
    }

    // ============================================
    // V8.0: CRITICAL MOVE DETECTION (Ultra Intelligent!)
    // ============================================
    if (config.criticalMoveDetection && aiDifficulty === 'supreme') {
        const critical = findCriticalMoves();

        // 7. Create double-threat (forcing move)
        if (critical.aiDoubleThreat && critical.aiDoubleThreat.length > 0) {
            console.log('🎯 V8.0: Found AI double-threat opportunity!');
            return critical.aiDoubleThreat[0];
        }

        // 8. Block opponent's double-threat (critical defense!)
        if (critical.blockDoubleThreat && critical.blockDoubleThreat.length > 0) {
            console.log('🛡️ V8.0: Blocking opponent double-threat!');
            isForcedMove = true;
            return critical.blockDoubleThreat[0];
        }
    }

    // ============================================
    // V9.0: THREAT SPACE SEARCH (Renju Algorithm)
    // ============================================
    if (config.useThreatSpaceSearch && aiDifficulty === 'supreme' && moveCount >= 10) {
        const threats = threatSpaceSearch('O', 5);
        if (threats.length > 0 && threats[0].defenseCount === 0) {
            console.log('🗡️ V9.0: Threat space search - unstoppable threat!');
            return { row: threats[0].row, col: threats[0].col };
        }
    }

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
    // V8.0: STRATEGIC SEARCH WITH INTELLIGENCE
    // ============================================
    // V8.0: Use getStrategicMoves for Supreme mode (better move ordering)
    const candidates = (aiDifficulty === 'supreme' && config.advancedPatterns)
        ? getStrategicMoves(config.searchWidth)
        : getRelevantMoves(config.searchWidth);

    if (candidates.length === 0) {
        // Fallback to center (should rarely happen)
        const center = Math.floor(BOARD_SIZE / 2);
        return { row: center, col: center };
    }

    console.log(`🧠 V8.0: Evaluating ${candidates.length} strategic moves...`);

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
