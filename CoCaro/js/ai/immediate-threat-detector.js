// ================================
// CỜ CARO 11.5 - IMMEDIATE THREAT DETECTOR
// Version: 11.5.0
// Critical move detection for instant win/block
// ================================

import { BOARD_SIZE, WIN_CONDITION, DIRECTIONS } from '../config/constants.js';
import { isValidPosition } from '../utils/helpers.js';
import { countLine } from '../core/board.js';

/**
 * Find immediate winning move (4 in a row, can win immediately)
 * This is HIGHEST PRIORITY - if we can win, we should win!
 */
export function findImmediateWin(board, player) {
    for (let row = 0; row < BOARD_SIZE; row++) {
        for (let col = 0; col < BOARD_SIZE; col++) {
            if (board[row][col] === null) {
                // Temporarily place piece
                board[row][col] = player;

                // Check if this creates 5 in a row
                const isWin = checkWinningMove(board, row, col, player);

                // Restore board
                board[row][col] = null;

                if (isWin) {
                    return { row, col, priority: 10000, type: 'IMMEDIATE_WIN' };
                }
            }
        }
    }
    return null;
}

/**
 * Find immediate blocking move (opponent has 4 in a row, must block!)
 * This is SECOND HIGHEST PRIORITY - if opponent can win next turn, BLOCK!
 */
export function findImmediateBlock(board, player) {
    const opponent = player === 'X' ? 'O' : 'X';

    for (let row = 0; row < BOARD_SIZE; row++) {
        for (let col = 0; col < BOARD_SIZE; col++) {
            if (board[row][col] === null) {
                // Temporarily place opponent's piece
                board[row][col] = opponent;

                // Check if opponent would win
                const wouldWin = checkWinningMove(board, row, col, opponent);

                // Restore board
                board[row][col] = null;

                if (wouldWin) {
                    return { row, col, priority: 9000, type: 'IMMEDIATE_BLOCK' };
                }
            }
        }
    }
    return null;
}

/**
 * Find critical threats - positions with 3 or 4 in a row
 */
export function findCriticalThreats(board, player) {
    const threats = [];

    for (let row = 0; row < BOARD_SIZE; row++) {
        for (let col = 0; col < BOARD_SIZE; col++) {
            if (board[row][col] === null) {
                const threat = analyzeThreatLevel(board, row, col, player);
                if (threat && threat.priority > 0) {
                    threats.push({ row, col, ...threat });
                }
            }
        }
    }

    return threats.sort((a, b) => b.priority - a.priority);
}

/**
 * Analyze threat level at position
 */
function analyzeThreatLevel(board, row, col, player) {
    let maxConsecutive = 0;
    let openEnds = 0;
    let threatInfo = null;

    // Check all directions
    for (const [dx, dy] of DIRECTIONS) {
        const analysis = analyzeDirection(board, row, col, dx, dy, player);

        if (analysis.consecutive > maxConsecutive) {
            maxConsecutive = analysis.consecutive;
            openEnds = analysis.openEnds;
            threatInfo = analysis;
        }
    }

    // Calculate priority based on consecutive count and open ends
    let priority = 0;
    let type = null;

    if (maxConsecutive === 4) {
        // 4 in a row - very dangerous!
        priority = 8000;
        type = 'FOUR_IN_ROW';
    } else if (maxConsecutive === 3 && openEnds === 2) {
        // Open three with both ends open - dangerous!
        priority = 5000;
        type = 'OPEN_THREE';
    } else if (maxConsecutive === 3 && openEnds === 1) {
        // Three with one end open
        priority = 2000;
        type = 'CLOSED_THREE';
    } else if (maxConsecutive === 2 && openEnds === 2) {
        // Open two
        priority = 500;
        type = 'OPEN_TWO';
    } else if (maxConsecutive === 2) {
        priority = 100;
        type = 'TWO';
    } else if (maxConsecutive === 1) {
        priority = 10;
        type = 'ONE';
    }

    if (priority > 0) {
        return { priority, type, consecutive: maxConsecutive, openEnds };
    }

    return null;
}

/**
 * Analyze direction for consecutive pieces
 */
function analyzeDirection(board, row, col, dx, dy, player) {
    let consecutive = 1; // Count the piece we're placing
    let openEnds = 0;

    // Count forward
    let r = row + dx;
    let c = col + dy;
    while (isValidPosition(r, c) && board[r][c] === player) {
        consecutive++;
        r += dx;
        c += dy;
    }
    // Check if forward end is open
    if (isValidPosition(r, c) && board[r][c] === null) {
        openEnds++;
    }

    // Count backward
    r = row - dx;
    c = col - dy;
    while (isValidPosition(r, c) && board[r][c] === player) {
        consecutive++;
        r -= dx;
        c -= dy;
    }
    // Check if backward end is open
    if (isValidPosition(r, c) && board[r][c] === null) {
        openEnds++;
    }

    return { consecutive, openEnds };
}

/**
 * Check if a move at (row, col) creates a winning condition
 */
function checkWinningMove(board, row, col, player) {
    // Check all 4 directions
    for (const [dx, dy] of DIRECTIONS) {
        const count1 = countLine(board, row, col, dx, dy, player);
        const count2 = countLine(board, row, col, -dx, -dy, player);
        const total = count1 + count2 - 1;

        if (total >= WIN_CONDITION) {
            return true;
        }
    }
    return false;
}

/**
 * Find ALL critical positions (both offensive and defensive)
 * Returns sorted by priority
 */
export function findAllCriticalMoves(board, player) {
    const opponent = player === 'X' ? 'O' : 'X';
    const moves = [];

    // 1. Check for immediate win
    const winMove = findImmediateWin(board, player);
    if (winMove) {
        moves.push(winMove);
    }

    // 2. Check for immediate block
    const blockMove = findImmediateBlock(board, player);
    if (blockMove) {
        moves.push(blockMove);
    }

    // 3. Find offensive threats
    const offensiveThreats = findCriticalThreats(board, player);
    moves.push(...offensiveThreats.slice(0, 5)); // Top 5 offensive moves

    // 4. Find defensive threats (opponent's threats we need to block)
    const defensiveThreats = findCriticalThreats(board, opponent);
    // Boost priority for defensive moves
    const boostedDefensive = defensiveThreats.slice(0, 5).map(move => ({
        ...move,
        priority: move.priority * 1.5, // Defense is important!
        type: 'DEFENSIVE_' + move.type
    }));
    moves.push(...boostedDefensive);

    // Sort by priority
    return moves.sort((a, b) => b.priority - a.priority);
}

/**
 * Get best defensive move
 */
export function getBestDefensiveMove(board, player) {
    const opponent = player === 'X' ? 'O' : 'X';

    // First check if opponent can win next turn
    const blockMove = findImmediateBlock(board, player);
    if (blockMove) {
        return blockMove;
    }

    // Then check opponent's strongest threats
    const threats = findCriticalThreats(board, opponent);
    if (threats.length > 0) {
        return threats[0];
    }

    return null;
}

/**
 * Get best offensive move
 */
export function getBestOffensiveMove(board, player) {
    // First check if we can win immediately
    const winMove = findImmediateWin(board, player);
    if (winMove) {
        return winMove;
    }

    // Then check our strongest threats
    const threats = findCriticalThreats(board, player);
    if (threats.length > 0) {
        return threats[0];
    }

    return null;
}
