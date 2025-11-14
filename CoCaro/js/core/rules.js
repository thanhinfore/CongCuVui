// ================================
// CỜ CARO 12.0 - GAME RULES
// Version: 12.0.0
// Win detection and explosion logic
// Cờ Caro Nổ 5 Khóa Edition
// ================================

import { BOARD_SIZE, WIN_CONDITION, DIRECTIONS } from '../config/constants.js';
import { isValidPosition } from '../utils/helpers.js';
import { countLine } from './board.js';
import {
    checkAfterMove,
    executeExplosions,
    calculateExplosionScore,
    checkExplosionWin,
    checkDrawWithExplosionScore
} from '../game-logic/explosion-detector.js';

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

// ================================
// CỜ CARO NỔ 5 KHÓA - v12.0
// ================================

/**
 * Check win/explosion after move in Explosion Mode
 * Trả về:
 * - Classic mode: Kết quả win cổ điển
 * - Explosion mode: Kết quả bao gồm win/explosion/continue
 */
export function checkAfterMoveWithExplosion(board, row, col, player, explosionModeEnabled) {
    // Nếu không bật explosion mode, dùng logic cũ
    if (!explosionModeEnabled) {
        return {
            type: 'classic',
            result: checkWinAtPosition(board, row, col)
        };
    }

    // Explosion mode logic
    const explosionResult = checkAfterMove(board, row, col, player);

    if (explosionResult.win) {
        // 5 MỞ → THẮNG!
        return {
            type: 'win',
            winType: 'OPEN_FIVE',
            winner: player,
            line: explosionResult.winningSequence.cells,
            sequence: explosionResult.winningSequence
        };
    }

    if (explosionResult.explosionCount > 0) {
        // 5 KHÓA → NỔ!
        const explosionPoints = calculateExplosionScore(explosionResult.explosionCount);
        const explosionData = executeExplosions(board, explosionResult.explosions);

        return {
            type: 'explosion',
            player,
            explosions: explosionResult.explosions,
            explosionCount: explosionResult.explosionCount,
            explosionPoints,
            explodedCells: explosionData.positions,
            cellsRemoved: explosionData.count
        };
    }

    // Không có gì xảy ra → Tiếp tục
    return {
        type: 'continue'
    };
}

/**
 * Check explosion-based win conditions
 * (Tùy chọn: Thắng bằng điểm nổ)
 */
export function checkExplosionScoreWin(xScore, oScore, threshold = 5) {
    return checkExplosionWin(xScore, oScore, threshold);
}

/**
 * Check draw with explosion score tiebreaker
 * Nếu hết chỗ, ai nhiều điểm nổ hơn thắng
 */
export function checkDrawWithExplosion(board, xScore, oScore) {
    return checkDrawWithExplosionScore(board, xScore, oScore);
}
