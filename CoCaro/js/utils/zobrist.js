// ================================
// CỜ CARO 10.0 - ZOBRIST HASHING
// Version: 10.0.0
// Zobrist hashing for position caching & transposition table
// ================================

import { BOARD_SIZE } from '../config/constants.js';

/**
 * Zobrist Hashing State
 */
let zobristTable = [];
let zobristBlackTurn = 0;

/**
 * Initialize Zobrist Hashing
 * Generates random numbers for each board position and player
 */
export function initZobrist() {
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

/**
 * Get Zobrist hash for current board state
 * @param {Array} board - Game board
 * @param {boolean} isMaximizing - Whether current player is maximizing
 * @returns {number} Hash value
 */
export function getZobristHash(board, isMaximizing) {
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

/**
 * Update Zobrist hash incrementally (faster than full recalculation)
 * @param {number} oldHash - Previous hash value
 * @param {number} row - Row of changed cell
 * @param {number} col - Column of changed cell
 * @param {string} player - Player who made the move ('X' or 'O')
 * @param {boolean} isRemove - Whether piece was removed (for undo)
 * @returns {number} Updated hash value
 */
export function updateZobristHash(oldHash, row, col, player, isRemove = false) {
    // XOR is reversible, so same operation for add/remove
    return oldHash ^ zobristTable[row][col][player];
}

/**
 * Get zobrist table (for testing/debugging)
 */
export function getZobristTable() {
    return zobristTable;
}
