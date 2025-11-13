// ================================
// CỜ CARO 10.0 - OPENING BOOK
// Version: 10.0.0
// Professional opening database lookup
// ================================

import { OPENING_BOOK_V9 } from '../config/patterns.js';

/**
 * Get move from opening book
 * @param {Array} board - Current board state
 * @param {Array} moveHistory - Move history
 * @param {string} personality - AI personality ('aggressive', 'defensive', 'balanced')
 * @returns {Object|null} Opening book move or null
 */
export function getOpeningBookMove(board, moveHistory, personality) {
    const moveCount = moveHistory.length;

    // Only use opening book for first few moves
    if (!OPENING_BOOK_V9.enabled || moveCount >= OPENING_BOOK_V9.maxDepth) {
        return null;
    }

    // First move: always center
    if (moveCount === 0) {
        console.log('📖 V9.0: Opening book - Center start');
        return { row: 7, col: 7 };
    }

    // Select opening category based on personality
    let openings;
    if (personality === 'aggressive') {
        openings = OPENING_BOOK_V9.aggressive;
    } else if (personality === 'defensive') {
        openings = OPENING_BOOK_V9.defensive;
    } else {
        openings = OPENING_BOOK_V9.balanced;
    }

    // Try to match current game to an opening sequence
    for (const opening of openings) {
        if (matchesOpening(moveHistory, opening.moves)) {
            const nextMove = opening.moves[moveCount];
            if (nextMove && board[nextMove.row][nextMove.col] === null) {
                console.log(`📖 V9.0: Opening book - ${opening.name} (move ${moveCount + 1})`);
                return nextMove;
            }
        }
    }

    // Check response database for opponent's last move
    if (moveCount > 0) {
        const lastMove = moveHistory[moveCount - 1];
        const key = `${lastMove.row},${lastMove.col}`;
        const responses = OPENING_BOOK_V9.responses.get(key);

        if (responses) {
            for (const response of responses) {
                if (board[response.row][response.col] === null) {
                    console.log('📖 V9.0: Opening book - Counter-response');
                    return response;
                }
            }
        }
    }

    return null;
}

/**
 * Check if move history matches an opening sequence
 */
function matchesOpening(moveHistory, openingMoves) {
    if (moveHistory.length > openingMoves.length) return false;

    for (let i = 0; i < moveHistory.length; i++) {
        const move = moveHistory[i];
        const openingMove = openingMoves[i];

        if (move.row !== openingMove.row || move.col !== openingMove.col) {
            return false;
        }
    }

    return true;
}
