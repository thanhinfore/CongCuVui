// ================================
// CỜ CARO 10.0 - MINIMAX ALGORITHM
// Version: 10.0.0
// Minimax with Alpha-Beta Pruning
// ================================

import { checkWinCondition, isTerminalState } from '../core/rules.js';
import { getSmartMoves, makeMove, undoMove } from '../core/board.js';
import { evaluatePosition } from './pattern-matching.js';
import { getZobristHash } from '../utils/zobrist.js';

// Transposition table
const transpositionTable = new Map();

/**
 * Minimax with Alpha-Beta Pruning
 */
export function minimax(board, depth, alpha, beta, isMaximizing, player, config) {
    const opponent = player === 'X' ? 'O' : 'X';

    // Check terminal state
    const winResult = checkWinCondition(board);
    if (winResult) {
        return winResult.winner === player ? 100000000 : -100000000;
    }

    if (depth === 0 || isTerminalState(board)) {
        return evaluateBoard(board, player);
    }

    // Transposition table lookup
    const hash = getZobristHash(board, isMaximizing);
    if (transpositionTable.has(hash)) {
        const cached = transpositionTable.get(hash);
        if (cached.depth >= depth) {
            return cached.score;
        }
    }

    const moves = getOrderedMoves(board, isMaximizing ? player : opponent, config);

    if (isMaximizing) {
        let maxEval = -Infinity;

        for (const move of moves) {
            makeMove(board, move.row, move.col, player);
            const evalScore = minimax(board, depth - 1, alpha, beta, false, player, config);
            undoMove(board, move.row, move.col);

            maxEval = Math.max(maxEval, evalScore);
            alpha = Math.max(alpha, evalScore);

            if (beta <= alpha) break; // Alpha-Beta pruning
        }

        transpositionTable.set(hash, { score: maxEval, depth });
        return maxEval;

    } else {
        let minEval = Infinity;

        for (const move of moves) {
            makeMove(board, move.row, move.col, opponent);
            const evalScore = minimax(board, depth - 1, alpha, beta, true, player, config);
            undoMove(board, move.row, move.col);

            minEval = Math.min(minEval, evalScore);
            beta = Math.min(beta, evalScore);

            if (beta <= alpha) break; // Alpha-Beta pruning
        }

        transpositionTable.set(hash, { score: minEval, depth });
        return minEval;
    }
}

/**
 * Find best move using minimax
 */
export function findBestMove(board, player, config) {
    let bestScore = -Infinity;
    let bestMove = null;

    const moves = getOrderedMoves(board, player, config);

    for (const move of moves) {
        makeMove(board, move.row, move.col, player);
        const score = minimax(board, config.depth - 1, -Infinity, Infinity, false, player, config);
        undoMove(board, move.row, move.col);

        if (score > bestScore) {
            bestScore = score;
            bestMove = move;
        }
    }

    return bestMove;
}

/**
 * Get ordered moves (for move ordering optimization)
 */
function getOrderedMoves(board, player, config) {
    const moves = getSmartMoves(board);
    const opponent = player === 'X' ? 'O' : 'X';

    // Score each move
    const scoredMoves = moves.map(move => {
        makeMove(board, move.row, move.col, player);
        const myScore = evaluatePosition(board, move.row, move.col, player);
        undoMove(board, move.row, move.col);

        makeMove(board, move.row, move.col, opponent);
        const oppScore = evaluatePosition(board, move.row, move.col, opponent);
        undoMove(board, move.row, move.col);

        return {
            ...move,
            score: myScore + oppScore * 0.8 // Prioritize attack slightly
        };
    });

    // Sort by score descending
    scoredMoves.sort((a, b) => b.score - a.score);

    // Return top N moves based on search width
    return scoredMoves.slice(0, config.searchWidth || 25);
}

/**
 * Evaluate entire board
 */
function evaluateBoard(board, player) {
    const opponent = player === 'X' ? 'O' : 'X';
    let score = 0;

    for (let row = 0; row < board.length; row++) {
        for (let col = 0; col < board[row].length; col++) {
            if (board[row][col] === player) {
                score += evaluatePosition(board, row, col, player);
            } else if (board[row][col] === opponent) {
                score -= evaluatePosition(board, row, col, opponent);
            }
        }
    }

    return score;
}

/**
 * Clear transposition table
 */
export function clearTranspositionTable() {
    transpositionTable.clear();
}
