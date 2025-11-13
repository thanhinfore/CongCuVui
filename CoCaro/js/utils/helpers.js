// ================================
// CỜ CARO 10.0 - HELPER UTILITIES
// Version: 10.0.0
// Common utility functions
// ================================

import { BOARD_SIZE } from '../config/constants.js';

/**
 * Check if coordinates are within board bounds
 */
export function isValidPosition(row, col) {
    return row >= 0 && row < BOARD_SIZE && col >= 0 && col < BOARD_SIZE;
}

/**
 * Check if board is full
 */
export function isBoardFull(board) {
    for (let i = 0; i < BOARD_SIZE; i++) {
        for (let j = 0; j < BOARD_SIZE; j++) {
            if (board[i][j] === null) return false;
        }
    }
    return true;
}

/**
 * Get opponent player
 */
export function getOpponent(player) {
    return player === 'X' ? 'O' : 'X';
}

/**
 * Deep copy board
 */
export function copyBoard(board) {
    return board.map(row => [...row]);
}

/**
 * Create empty board
 */
export function createEmptyBoard(size = BOARD_SIZE) {
    return Array(size).fill(null).map(() => Array(size).fill(null));
}

/**
 * Count pieces on board
 */
export function countPieces(board) {
    let count = 0;
    for (let i = 0; i < BOARD_SIZE; i++) {
        for (let j = 0; j < BOARD_SIZE; j++) {
            if (board[i][j] !== null) count++;
        }
    }
    return count;
}

/**
 * Get all valid moves
 */
export function getValidMoves(board) {
    const moves = [];
    for (let row = 0; row < BOARD_SIZE; row++) {
        for (let col = 0; col < BOARD_SIZE; col++) {
            if (board[row][col] === null) {
                moves.push({ row, col });
            }
        }
    }
    return moves;
}

/**
 * Get neighbors of a position (within radius)
 */
export function getNeighbors(row, col, radius = 2) {
    const neighbors = [];
    for (let dr = -radius; dr <= radius; dr++) {
        for (let dc = -radius; dc <= radius; dc++) {
            if (dr === 0 && dc === 0) continue;
            const newRow = row + dr;
            const newCol = col + dc;
            if (isValidPosition(newRow, newCol)) {
                neighbors.push({ row: newRow, col: newCol });
            }
        }
    }
    return neighbors;
}

/**
 * Check if position has adjacent pieces
 */
export function hasAdjacentPieces(board, row, col, radius = 2) {
    for (let dr = -radius; dr <= radius; dr++) {
        for (let dc = -radius; dc <= radius; dc++) {
            if (dr === 0 && dc === 0) continue;
            const newRow = row + dr;
            const newCol = col + dc;
            if (isValidPosition(newRow, newCol) && board[newRow][newCol] !== null) {
                return true;
            }
        }
    }
    return false;
}

/**
 * Get line of cells in a direction
 */
export function getLine(board, row, col, dx, dy, length) {
    const line = [];
    let r = row;
    let c = col;

    for (let i = 0; i < length; i++) {
        if (!isValidPosition(r, c)) break;
        line.push(board[r][c]);
        r += dx;
        c += dy;
    }

    return line;
}

/**
 * Generate random number in range
 */
export function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Shuffle array (Fisher-Yates)
 */
export function shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

/**
 * Clamp value between min and max
 */
export function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}

/**
 * Format time (milliseconds to seconds)
 */
export function formatTime(ms) {
    return (ms / 1000).toFixed(2) + 's';
}

/**
 * Generate board hash for position caching
 */
export function generateBoardHash(board, size = BOARD_SIZE) {
    let hash = '';
    for (let i = 0; i < size; i++) {
        for (let j = 0; j < size; j++) {
            hash += board[i][j] ? board[i][j] : '_';
        }
    }
    return hash;
}

/**
 * Sleep/delay function
 */
export function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
