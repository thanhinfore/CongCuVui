// ================================
// CỜ CARO 10.0 - PATTERN MATCHING
// Version: 10.0.0
// Pattern detection and evaluation
// ================================

import { PATTERNS_V9 } from '../config/patterns.js';
import { BOARD_SIZE, DIRECTIONS } from '../config/constants.js';
import { getLine, isValidPosition } from '../utils/helpers.js';

/**
 * Evaluate position score using pattern matching
 */
export function evaluatePosition(board, row, col, player) {
    let totalScore = 0;

    // Check all 4 directions
    for (const [dx, dy] of DIRECTIONS) {
        const score = evaluateLine(board, row, col, dx, dy, player);
        totalScore += score;
    }

    return totalScore;
}

/**
 * Evaluate line in a direction
 */
export function evaluateLine(board, row, col, dx, dy, player) {
    const line = getLine(board, row - dx * 4, col - dy * 4, dx, dy, 9);
    const patterns = detectPatternsInLine(line, player);

    let maxScore = 0;
    for (const pattern of patterns) {
        if (pattern.score > maxScore) {
            maxScore = pattern.score;
        }
    }

    return maxScore;
}

/**
 * Detect patterns in a line
 */
export function detectPatternsInLine(line, player) {
    const patterns = [];
    const len = line.length;

    const numLine = line.map(cell => {
        if (cell === player) return 1;
        if (cell === null) return 0;
        return -1;
    });

    // Check for FIVE
    for (let i = 0; i <= len - 5; i++) {
        if (numLine.slice(i, i + 5).every(c => c === 1)) {
            patterns.push({ type: 'FIVE', score: PATTERNS_V9.FIVE.score, pos: i });
        }
    }

    // Check for OPEN_FOUR: _XXXX_
    for (let i = 0; i <= len - 6; i++) {
        if (numLine[i] === 0 &&
            numLine.slice(i + 1, i + 5).every(c => c === 1) &&
            numLine[i + 5] === 0) {
            patterns.push({ type: 'OPEN_FOUR', score: PATTERNS_V9.OPEN_FOUR.score, pos: i });
        }
    }

    // Check for FOUR: XXXX
    for (let i = 0; i <= len - 4; i++) {
        if (numLine.slice(i, i + 4).every(c => c === 1)) {
            if (!patterns.some(p => p.type === 'OPEN_FOUR')) {
                patterns.push({ type: 'FOUR', score: PATTERNS_V9.FOUR.score, pos: i });
            }
        }
    }

    // Check for OPEN_THREE: _XXX_
    for (let i = 0; i <= len - 5; i++) {
        if (numLine[i] === 0 &&
            numLine.slice(i + 1, i + 4).every(c => c === 1) &&
            numLine[i + 4] === 0) {
            patterns.push({ type: 'OPEN_THREE', score: PATTERNS_V9.OPEN_THREE.score, pos: i });
        }
    }

    // Check for BROKEN_THREE patterns
    for (let i = 0; i <= len - 6; i++) {
        if (numLine[i] === 0 && numLine[i + 1] === 1 && numLine[i + 2] === 1 &&
            numLine[i + 3] === 0 && numLine[i + 4] === 1 && numLine[i + 5] === 0) {
            patterns.push({ type: 'BROKEN_THREE_A', score: PATTERNS_V9.BROKEN_THREE_A.score, pos: i });
        }
    }

    // Check for OPEN_TWO: _XX_
    for (let i = 0; i <= len - 4; i++) {
        if (numLine[i] === 0 && numLine[i + 1] === 1 &&
            numLine[i + 2] === 1 && numLine[i + 3] === 0) {
            patterns.push({ type: 'OPEN_TWO', score: PATTERNS_V9.OPEN_TWO.score, pos: i });
        }
    }

    // Check for BROKEN_TWO: _X_X_
    for (let i = 0; i <= len - 5; i++) {
        if (numLine[i] === 0 && numLine[i + 1] === 1 &&
            numLine[i + 2] === 0 && numLine[i + 3] === 1 &&
            numLine[i + 4] === 0) {
            patterns.push({ type: 'BROKEN_TWO_A', score: PATTERNS_V9.BROKEN_TWO_A.score, pos: i });
        }
    }

    return patterns;
}

/**
 * Detect multiple threats (v8.0 feature)
 */
export function detectMultipleThreats(board, player) {
    const threats = [];

    for (let row = 0; row < BOARD_SIZE; row++) {
        for (let col = 0; col < BOARD_SIZE; col++) {
            if (board[row][col] === null) {
                const score = evaluatePosition(board, row, col, player);
                if (score >= PATTERNS_V9.OPEN_THREE.score) {
                    threats.push({
                        row, col, score,
                        type: score >= PATTERNS_V9.FOUR.score ? 'four' :
                              score >= PATTERNS_V9.OPEN_THREE.score ? 'open-three' : 'threat'
                    });
                }
            }
        }
    }

    return threats.sort((a, b) => b.score - a.score);
}
