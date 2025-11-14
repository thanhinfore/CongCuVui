// ================================
// CỜ CARO 10.0 - GAME RULES
// Version: 10.0.0
// Win detection and move validation
// ================================

import { BOARD_SIZE, WIN_CONDITION, DIRECTIONS } from '../config/constants.js';
import { isValidPosition } from '../utils/helpers.js';
import { countLine } from './board.js';

/**
 * Check for win condition at a specific position
 */
export function checkWinAtPosition(board, row, col) {
    const player = board[row][col];
    if (!player) return false;

    // Check all 4 directions
    for (const [dx, dy] of DIRECTIONS) {
        const count1 = countLine(board, row, col, dx, dy, player);
        const count2 = countLine(board, row, col, -dx, -dy, player);
        const total = count1 + count2 - 1; // Subtract 1 because center is counted twice

        if (total >= WIN_CONDITION) {
            return {
                winner: player,
                line: getWinLine(board, row, col, dx, dy, player)
            };
        }
    }

    return false;
}

/**
 * Get winning line coordinates
 */
function getWinLine(board, row, col, dx, dy, player) {
    const line = [];
    let r = row;
    let c = col;

    // Go backwards to find start
    while (isValidPosition(r - dx, c - dy) && board[r - dx][c - dy] === player) {
        r -= dx;
        c -= dy;
    }

    // Collect line
    while (isValidPosition(r, c) && board[r][c] === player && line.length < WIN_CONDITION) {
        line.push({ row: r, col: c });
        r += dx;
        c += dy;
    }

    return line.length >= WIN_CONDITION ? line : [];
}

/**
 * Check if any player has won
 */
export function checkWinCondition(board) {
    for (let row = 0; row < BOARD_SIZE; row++) {
        for (let col = 0; col < BOARD_SIZE; col++) {
            if (board[row][col]) {
                const result = checkWinAtPosition(board, row, col);
                if (result) return result;
            }
        }
    }
    return false;
}

/**
 * Check if move is valid
 */
export function isValidMove(board, row, col) {
    return isValidPosition(row, col) && board[row][col] === null;
}

/**
 * Check if board is in terminal state (win or draw)
 */
export function isTerminalState(board) {
    // Check for win
    if (checkWinCondition(board)) {
        return true;
    }

    // Check for draw (board full)
    for (let i = 0; i < BOARD_SIZE; i++) {
        for (let j = 0; j < BOARD_SIZE; j++) {
            if (board[i][j] === null) return false;
        }
    }

    return true; // Draw
}
