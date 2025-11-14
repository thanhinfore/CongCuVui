// ================================
// CỜ CARO 10.0 - AI ENGINE
// Version: 10.0.0
// Main AI orchestrator
// ================================

import { AI_CONFIGS } from '../config/ai-configs.js';
import { findBestMove } from './minimax.js';
import { mctsSearch } from './mcts.js';
import { getOpeningBookMove } from './opening-book.js';
import { getEndgameMove, isEndgame } from './endgame-tablebase.js';
import { threatSpaceSearch, detectRenjuCombinations } from './threat-search.js';
import { detectMultipleThreats } from './pattern-matching.js';
import { evaluateWithNN, isNNReady } from './neural-network.js';

/**
 * Get AI Move - Main entry point
 * @param {Array} board - Current board state
 * @param {string} player - AI player ('O')
 * @param {string} difficulty - AI difficulty level
 * @param {string} personality - AI personality
 * @param {Array} moveHistory - Move history
 * @returns {Object} Best move {row, col}
 */
export async function getAIMove(board, player, difficulty, personality, moveHistory) {
    const config = AI_CONFIGS[difficulty];
    const opponent = player === 'X' ? 'O' : 'X';

    console.log(`🤖 AI thinking... (${difficulty} mode)`);

    try {
        // Phase 1: Opening Book (V9.0)
        if (config.useOpeningBook && moveHistory.length < 7) {
            const openingMove = getOpeningBookMove(board, moveHistory, personality);
            if (openingMove) {
                console.log('📖 Using opening book');
                return openingMove;
            }
        }

        // Phase 2: Endgame Tablebase (V9.0)
        if (config.useEndgameTablebase && isEndgame(board)) {
            const endgameMove = getEndgameMove(board, player);
            if (endgameMove) {
                console.log('🎯 Using endgame tablebase');
                return endgameMove;
            }
        }

        // Phase 3: Renju Combinations (V9.0)
        if (config.useRenjuCombinations) {
            // Check for double-four (instant win)
            for (let row = 0; row < board.length; row++) {
                for (let col = 0; col < board[row].length; col++) {
                    if (board[row][col] === null) {
                        const combo = detectRenjuCombinations(board, row, col, player);
                        if (combo.isDoubleFour) {
                            console.log('💥 Double-Four combination found!');
                            return { row, col };
                        }
                    }
                }
            }

            // Check for four-three combination
            for (let row = 0; row < board.length; row++) {
                for (let col = 0; col < board[row].length; col++) {
                    if (board[row][col] === null) {
                        const combo = detectRenjuCombinations(board, row, col, player);
                        if (combo.isFourThree) {
                            console.log('⚡ Four-Three combination found!');
                            return { row, col };
                        }

                        // Block opponent's combinations
                        const oppCombo = detectRenjuCombinations(board, row, col, opponent);
                        if (oppCombo.isDoubleFour || oppCombo.isFourThree) {
                            console.log('🛡️ Blocking opponent Renju combination!');
                            return { row, col };
                        }
                    }
                }
            }
        }

        // Phase 4: Critical Move Detection (V8.0)
        if (config.criticalMoveDetection) {
            const myThreats = detectMultipleThreats(board, player);
            const oppThreats = detectMultipleThreats(board, opponent);

            // If we have multiple threats, play the best one
            if (myThreats.length >= 2) {
                console.log('🎯 Multiple AI threats detected!');
                return { row: myThreats[0].row, col: myThreats[0].col };
            }

            // If opponent has multiple threats, block the strongest
            if (oppThreats.length >= 2) {
                console.log('🛡️ Blocking opponent multiple threats!');
                return { row: oppThreats[0].row, col: oppThreats[0].col };
            }
        }

        // Phase 5: Threat Space Search (V9.0)
        if (config.useThreatSpaceSearch) {
            const threats = threatSpaceSearch(board, player, config.vctDepth);
            if (threats.length > 0 && threats[0].defenseCount === 1) {
                console.log('🗡️ Threat space search - unstoppable threat!');
                return { row: threats[0].row, col: threats[0].col };
            }
        }

        // Phase 6: MCTS (V9.1) - for complex positions
        if (config.useMCTS && moveHistory.length > 10 && moveHistory.length < 100) {
            const mctsMove = mctsSearch(board, player, config.mctsSimulations);
            if (mctsMove) {
                console.log('🌳 Using MCTS');
                return mctsMove;
            }
        }

        // Phase 7: Minimax Search (Core algorithm)
        console.log('🧠 Using Minimax search...');
        const bestMove = findBestMove(board, player, config);

        if (bestMove) {
            return bestMove;
        }

        // Fallback: Find any valid move
        console.warn('⚠️ No move found by AI, using fallback');
        for (let row = 0; row < board.length; row++) {
            for (let col = 0; col < board[row].length; col++) {
                if (board[row][col] === null) {
                    return { row, col };
                }
            }
        }

        return null;

    } catch (error) {
        console.error('AI Error:', error);
        // Emergency fallback
        for (let row = 0; row < board.length; row++) {
            for (let col = 0; col < board[row].length; col++) {
                if (board[row][col] === null) {
                    return { row, col };
                }
            }
        }
        return null;
    }
}

/**
 * Get AI move with timeout
 */
export async function getAIMoveWithTimeout(board, player, difficulty, personality, moveHistory, timeout = 5000) {
    return Promise.race([
        getAIMove(board, player, difficulty, personality, moveHistory),
        new Promise((_, reject) =>
            setTimeout(() => reject(new Error('AI timeout')), timeout)
        )
    ]);
}
