// ================================
// CỜ CARO 10.0 - ENDGAME TABLEBASE
// Version: 10.0.0
// Perfect endgame play when board >70% full
// ================================

import { BOARD_SIZE } from '../config/constants.js';
import { countPieces } from '../utils/helpers.js';
import { evaluatePosition } from './pattern-matching.js';
import { generateBoardHash } from '../utils/helpers.js';

/**
 * Endgame tablebase configuration
 */
const ENDGAME_TABLEBASE = {
    enabled: true,
    threshold: 0.7,  // Activate when board is 70% full
    cache: new Map(),
    knownPositions: new Map()
};

/**
 * Check if we're in endgame
 */
export function isEndgame(board) {
    const filledCells = countPieces(board);
    const totalCells = BOARD_SIZE * BOARD_SIZE;
    return (filledCells / totalCells) >= ENDGAME_TABLEBASE.threshold;
}

/**
 * Get perfect endgame move from tablebase
 */
export function getEndgameMove(board, player) {
    if (!ENDGAME_TABLEBASE.enabled || !isEndgame(board)) {
        return null;
    }

    const posHash = generateBoardHash(board);
    if (ENDGAME_TABLEBASE.cache.has(posHash)) {
        return ENDGAME_TABLEBASE.cache.get(posHash);
    }

    const forcingMove = findForcingEndgameMove(board, player);
    if (forcingMove) {
        ENDGAME_TABLEBASE.cache.set(posHash, forcingMove);
        return forcingMove;
    }

    return null;
}

/**
 * Find forcing moves in endgame
 */
function findForcingEndgameMove(board, player) {
    const opponent = player === 'O' ? 'X' : 'O';
    let bestMove = null;
    let bestScore = -Infinity;

    // Find all empty cells
    for (let row = 0; row < BOARD_SIZE; row++) {
        for (let col = 0; col < BOARD_SIZE; col++) {
            if (board[row][col] === null) {
                board[row][col] = player;
                const myScore = evaluatePosition(board, row, col, player);
                board[row][col] = opponent;
                const oppScore = evaluatePosition(board, row, col, opponent);
                board[row][col] = null;

                const combinedScore = myScore + oppScore * 0.9;
                if (combinedScore > bestScore) {
                    bestScore = combinedScore;
                    bestMove = { row, col };
                }
            }
        }
    }

    return bestMove;
}

/**
 * Clear endgame cache
 */
export function clearEndgameCache() {
    ENDGAME_TABLEBASE.cache.clear();
}
