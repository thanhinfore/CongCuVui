// ================================
// CỜ CARO 10.0 - THREAT SEARCH
// Version: 10.0.0
// VCT/VCF and Renju threat space search
// ================================

import { PATTERNS_V9 } from '../config/patterns.js';
import { BOARD_SIZE } from '../config/constants.js';
import { evaluatePosition } from './pattern-matching.js';

/**
 * Threat Space Search (V9.0 - Renju Algorithm)
 * Searches in threat space instead of board space
 */
export function threatSpaceSearch(board, player, maxDepth = 10) {
    const threats = [];
    const opponent = player === 'O' ? 'X' : 'O';

    for (let row = 0; row < BOARD_SIZE; row++) {
        for (let col = 0; col < BOARD_SIZE; col++) {
            if (board[row][col] === null) {
                board[row][col] = player;
                const score = evaluatePosition(board, row, col, player);

                if (score >= PATTERNS_V9.OPEN_THREE.score) {
                    const defenseCount = countDefenseMoves(board, row, col, opponent);
                    threats.push({
                        row, col, score, defenseCount,
                        type: score >= PATTERNS_V9.FOUR.score ? 'four' : 'three'
                    });
                }

                board[row][col] = null;
            }
        }
    }

    // Sort by defense count (fewer defenses = stronger threat)
    threats.sort((a, b) => {
        if (a.defenseCount !== b.defenseCount) {
            return a.defenseCount - b.defenseCount;
        }
        return b.score - a.score;
    });

    return threats;
}

/**
 * Count how many moves opponent needs to defend against a threat
 */
function countDefenseMoves(board, row, col, opponent) {
    let count = 0;

    for (let r = 0; r < BOARD_SIZE; r++) {
        for (let c = 0; c < BOARD_SIZE; c++) {
            if (board[r][c] === null) {
                board[r][c] = opponent;
                const blockScore = evaluatePosition(board, r, c, opponent);
                if (blockScore >= PATTERNS_V9.BLOCK_OPEN_THREE.score) {
                    count++;
                }
                board[r][c] = null;
            }
        }
    }

    return count;
}

/**
 * Detect Renju combinations (3-3, 4-4, 4-3)
 */
export function detectRenjuCombinations(board, row, col, player) {
    board[row][col] = player;
    let threeCount = 0;
    let fourCount = 0;

    const directions = [[0,1], [1,0], [1,1], [1,-1]];
    for (const [dr, dc] of directions) {
        const lineScore = evaluateLineDirection(board, row, col, dr, dc, player);
        if (lineScore >= PATTERNS_V9.FOUR.score) {
            fourCount++;
        } else if (lineScore >= PATTERNS_V9.OPEN_THREE.score) {
            threeCount++;
        }
    }

    board[row][col] = null;

    return {
        isDoubleThree: threeCount >= 2,
        isDoubleFour: fourCount >= 2,
        isFourThree: fourCount >= 1 && threeCount >= 1
    };
}

/**
 * Evaluate score in a single direction
 */
function evaluateLineDirection(board, row, col, dr, dc, player) {
    let count = 1;
    let openEnds = 0;

    // Count forward
    let r = row + dr, c = col + dc;
    while (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE) {
        if (board[r][c] === player) count++;
        else if (board[r][c] === null) { openEnds++; break; }
        else break;
        r += dr; c += dc;
    }

    // Count backward
    r = row - dr; c = col - dc;
    while (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE) {
        if (board[r][c] === player) count++;
        else if (board[r][c] === null) { openEnds++; break; }
        else break;
        r -= dr; c -= dc;
    }

    // Score based on count and open ends
    if (count >= 5) return PATTERNS_V9.FIVE.score;
    if (count === 4 && openEnds === 2) return PATTERNS_V9.OPEN_FOUR.score;
    if (count === 4) return PATTERNS_V9.FOUR.score;
    if (count === 3 && openEnds === 2) return PATTERNS_V9.OPEN_THREE.score;
    if (count === 3) return PATTERNS_V9.SEMI_OPEN_THREE.score;

    return 0;
}
