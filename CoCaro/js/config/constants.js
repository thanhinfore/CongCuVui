// ================================
// CỜ CARO 10.0 - CONSTANTS
// Version: 10.0.0
// Modern Modular Architecture
// ================================

/**
 * Game Configuration Constants
 */
export const BOARD_SIZE = 15;
export const WIN_CONDITION = 5;

/**
 * Game Modes
 */
export const GAME_MODES = {
    PVC: 'pvc',  // Player vs Computer
    PVP: 'pvp'   // Player vs Player
};

/**
 * AI Difficulty Levels
 */
export const AI_DIFFICULTY = {
    EASY: 'easy',
    MEDIUM: 'medium',
    HARD: 'hard',
    GRANDMASTER: 'grandmaster',
    SUPREME: 'supreme'
};

/**
 * AI Personality Types
 */
export const AI_PERSONALITY = {
    AGGRESSIVE: 'aggressive',
    DEFENSIVE: 'defensive',
    BALANCED: 'balanced'
};

/**
 * Theme Options
 */
export const THEMES = {
    DEFAULT: 'default',
    OCEAN: 'ocean',
    FOREST: 'forest',
    SUNSET: 'sunset',
    NEON: 'neon'
};

/**
 * Player Symbols
 */
export const PLAYERS = {
    X: 'X',
    O: 'O'
};

/**
 * Direction Vectors for Pattern Matching
 */
export const DIRECTIONS = [
    [1, 0],   // Horizontal
    [0, 1],   // Vertical
    [1, 1],   // Diagonal \
    [1, -1]   // Diagonal /
];

/**
 * Performance Thresholds
 */
export const PERFORMANCE = {
    MAX_THINK_TIME: 5000,      // 5 seconds max
    CACHE_SIZE_LIMIT: 10000,   // Max cache entries
    NN_CACHE_SIZE: 5000,       // Neural network cache
    GPU_MIN_BATCH_SIZE: 100    // Minimum batch for GPU
};

/**
 * Learning Configuration
 */
export const LEARNING = {
    MIN_SAMPLES_FOR_TRAIN: 100,
    BATCH_SIZE: 32,
    EPOCHS: 10,
    LEARNING_RATE: 0.001,
    VALIDATION_SPLIT: 0.2
};

/**
 * MCTS Configuration
 */
export const MCTS = {
    DEFAULT_SIMULATIONS: 100,
    EXPLORATION_CONSTANT: 1.414,  // √2
    MAX_DEPTH: 50
};
