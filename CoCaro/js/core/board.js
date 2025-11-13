// ================================
// CỜ CARO 10.0 - BOARD OPERATIONS
// Version: 10.0.0
// Board state and move management
// ================================

import { BOARD_SIZE, WIN_CONDITION, DIRECTIONS } from '../config/constants.js';
import { isValidPosition, copyBoard, createEmptyBoard } from '../utils/helpers.js';

/**
 * Make a move on the board
 */
export function makeMove(board, row, col, player) {
    if (!isValidPosition(row, col) || board[row][col] !== null) {
        return false;
    }
    board[row][col] = player;
    return true;
}

/**
 * Undo a move
 */
export function undoMove(board, row, col) {
    if (!isValidPosition(row, col)) {
        return false;
    }
    board[row][col] = null;
    return true;
}

/**
 * Get valid moves around existing pieces
 */
export function getSmartMoves(board, radius = 2) {
    const moves = new Set();

    for (let row = 0; row < BOARD_SIZE; row++) {
        for (let col = 0; col < BOARD_SIZE; col++) {
            if (board[row][col] !== null) {
                // Add neighbors of existing pieces
                for (let dr = -radius; dr <= radius; dr++) {
                    for (let dc = -radius; dc <= radius; dc++) {
                        const newRow = row + dr;
                        const newCol = col + dc;
                        if (isValidPosition(newRow, newCol) && board[newRow][newCol] === null) {
                            moves.add(`${newRow},${newCol}`);
                        }
                    }
                }
            }
        }
    }

    // If no pieces on board, return center
    if (moves.size === 0) {
        const center = Math.floor(BOARD_SIZE / 2);
        return [{ row: center, col: center }];
    }

    return Array.from(moves).map(key => {
        const [row, col] = key.split(',').map(Number);
        return { row, col };
    });
}

/**
 * Count consecutive pieces in a direction
 */
export function countLine(board, row, col, dx, dy, player) {
    let count = 0;
    let r = row;
    let c = col;

    while (isValidPosition(r, c) && board[r][c] === player) {
        count++;
        r += dx;
        c += dy;
    }

    return count;
}

/**
 * Board to flat array (for GPU/NN processing)
 */
export function boardToFlatArray(board) {
    const flat = [];
    for (let i = 0; i < BOARD_SIZE; i++) {
        for (let j = 0; j < BOARD_SIZE; j++) {
            if (board[i][j] === 'X') flat.push(1);
            else if (board[i][j] === 'O') flat.push(-1);
            else flat.push(0);
        }
    }
    return flat;
}

/**
 * Flat array to board
 */
export function flatArrayToBoard(flat) {
    const board = createEmptyBoard();
    let idx = 0;
    for (let i = 0; i < BOARD_SIZE; i++) {
        for (let j = 0; j < BOARD_SIZE; j++) {
            if (flat[idx] === 1) board[i][j] = 'X';
            else if (flat[idx] === -1) board[i][j] = 'O';
            idx++;
        }
    }
    return board;
}

export { createEmptyBoard, copyBoard };
