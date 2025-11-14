// ================================
// CỜ CARO 10.0 - GAME STATE
// Version: 10.0.0
// Centralized game state management
// ================================

import { BOARD_SIZE, GAME_MODES, AI_DIFFICULTY, AI_PERSONALITY, THEMES } from '../config/constants.js';
import { createEmptyBoard } from '../utils/helpers.js';

/**
 * Game State Object
 */
export const gameState = {
    // Board & gameplay
    board: createEmptyBoard(),
    currentPlayer: 'X',
    gameActive: true,
    gameMode: GAME_MODES.PVC,

    // AI settings
    aiDifficulty: AI_DIFFICULTY.SUPREME,
    aiPersonality: AI_PERSONALITY.BALANCED,

    // Move history
    moveHistory: [],
    currentMoveIndex: -1,

    // UI settings
    soundEnabled: true,
    timerEnabled: false,
    analysisMode: false,
    tutorialMode: false,
    currentTheme: THEMES.DEFAULT,

    // Statistics
    stats: {
        xWins: 0,
        oWins: 0,
        draws: 0
    },

    // Timer
    timerSeconds: 0,
    timerInterval: null,

    // AI state
    aiThinking: false,
    aiInterrupted: false,

    // Performance stats
    performanceStats: {
        avgThinkTime: 0,
        maxThinkTime: 0,
        movesCalculated: 0,
        gpuUsageCount: 0,
        cpuUsageCount: 0
    },

    // Caches
    nnCache: new Map(),
    evaluationCache: new Map(),

    // Learning data
    experienceDB: {
        patterns: new Map(),
        moveQuality: new Map(),
        openingBook: new Map(),
        gamesPlayed: 0,
        totalLearnings: 0
    },

    // Current game data
    currentGameData: {
        positions: [],
        evaluations: [],
        moves: [],
        result: null,
        startTime: null,
        endTime: null
    }
};

/**
 * Reset game state
 */
export function resetGame() {
    gameState.board = createEmptyBoard();
    gameState.currentPlayer = 'X';
    gameState.gameActive = true;
    gameState.moveHistory = [];
    gameState.currentMoveIndex = -1;
    gameState.aiThinking = false;
    gameState.aiInterrupted = false;
    gameState.timerSeconds = 0;

    if (gameState.timerInterval) {
        clearInterval(gameState.timerInterval);
        gameState.timerInterval = null;
    }

    // Clear caches
    gameState.nnCache.clear();
    gameState.evaluationCache.clear();

    // Reset current game data
    gameState.currentGameData = {
        positions: [],
        evaluations: [],
        moves: [],
        result: null,
        startTime: Date.now(),
        endTime: null
    };
}

/**
 * Add move to history
 */
export function addMoveToHistory(row, col, player) {
    // Remove any moves after current index (for redo functionality)
    gameState.moveHistory.splice(gameState.currentMoveIndex + 1);

    gameState.moveHistory.push({ row, col, player, timestamp: Date.now() });
    gameState.currentMoveIndex = gameState.moveHistory.length - 1;
}

/**
 * Update statistics
 */
export function updateStats(winner) {
    if (winner === 'X') {
        gameState.stats.xWins++;
    } else if (winner === 'O') {
        gameState.stats.oWins++;
    } else {
        gameState.stats.draws++;
    }
    saveStats();
}

/**
 * Save stats to localStorage
 */
export function saveStats() {
    try {
        localStorage.setItem('cocaroStats', JSON.stringify(gameState.stats));
    } catch (e) {
        console.warn('Failed to save stats:', e);
    }
}

/**
 * Load stats from localStorage
 */
export function loadStats() {
    try {
        const saved = localStorage.getItem('cocaroStats');
        if (saved) {
            Object.assign(gameState.stats, JSON.parse(saved));
        }
    } catch (e) {
        console.warn('Failed to load stats:', e);
    }
}

/**
 * Toggle player
 */
export function togglePlayer() {
    gameState.currentPlayer = gameState.currentPlayer === 'X' ? 'O' : 'X';
}

/**
 * Get game state (read-only snapshot)
 */
export function getGameState() {
    return { ...gameState };
}
