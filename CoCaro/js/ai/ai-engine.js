// ================================
// CỜ CARO 11.5 - AI ENGINE
// Version: 11.5.0
// Main AI orchestrator with improved threat detection
// ================================

import { AI_CONFIGS } from '../config/ai-configs.js';
import { findBestMove } from './minimax.js';
import { mctsSearch } from './mcts.js';
import { getOpeningBookMove } from './opening-book.js';
import { getEndgameMove, isEndgame } from './endgame-tablebase.js';
import { threatSpaceSearch, detectRenjuCombinations } from './threat-search.js';
import { detectMultipleThreats } from './pattern-matching.js';
import { evaluateWithNN, isNNReady } from './neural-network.js';
import {
    findImmediateWin,
    findImmediateBlock,
    findAllCriticalMoves,
    getBestDefensiveMove,
    getBestOffensiveMove
} from './immediate-threat-detector.js';

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
        // ========================================
        // PHASE 0: CRITICAL IMMEDIATE MOVES (v11.5 NEW!)
        // HIGHEST PRIORITY - Check win/block first!
        // ========================================

        // 0a. Can we win RIGHT NOW? If yes, DO IT!
        const immediateWin = findImmediateWin(board, player);
        if (immediateWin) {
            console.log('🎯 IMMEDIATE WIN FOUND! Taking it!');
            return immediateWin;
        }

        // 0b. Can opponent win next turn? If yes, BLOCK IT!
        const immediateBlock = findImmediateBlock(board, player);
        if (immediateBlock) {
            console.log('🛡️ IMMEDIATE BLOCK REQUIRED! Blocking opponent win!');
            return immediateBlock;
        }

        // 0c. Check all critical moves (4-in-row, open-3, etc.)
        const criticalMoves = findAllCriticalMoves(board, player);
        if (criticalMoves.length > 0 && criticalMoves[0].priority >= 5000) {
            console.log(`⚡ CRITICAL MOVE: ${criticalMoves[0].type} (priority: ${criticalMoves[0].priority})`);
            return criticalMoves[0];
        }

        // ========================================
        // PHASE 1: Opening Book (V9.0)
        // ========================================
        if (config.useOpeningBook && moveHistory.length < 7) {
            const openingMove = getOpeningBookMove(board, moveHistory, personality);
            if (openingMove) {
                console.log('📖 Using opening book');
                return openingMove;
            }
        }

        // ========================================
        // PHASE 2: Endgame Tablebase (V9.0)
        // ========================================
        if (config.useEndgameTablebase && isEndgame(board)) {
            const endgameMove = getEndgameMove(board, player);
            if (endgameMove) {
                console.log('🎯 Using endgame tablebase');
                return endgameMove;
            }
        }

        // ========================================
        // PHASE 3: Advanced Threat Analysis
        // ========================================

        // Check for offensive opportunities
        const offensiveMove = getBestOffensiveMove(board, player);
        if (offensiveMove && offensiveMove.priority >= 2000) {
            console.log(`⚔️ Strong offensive move: ${offensiveMove.type}`);
            return offensiveMove;
        }

        // Check for defensive necessities
        const defensiveMove = getBestDefensiveMove(board, player);
        if (defensiveMove && defensiveMove.priority >= 2000) {
            console.log(`🛡️ Important defensive move: ${defensiveMove.type}`);
            return defensiveMove;
        }

        // ========================================
        // PHASE 4: Renju Combinations (V9.0)
        // ========================================
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

        // ========================================
        // PHASE 5: Threat Space Search (V9.0)
        // ========================================
        if (config.useThreatSpaceSearch) {
            const threats = threatSpaceSearch(board, player, config.vctDepth);
            if (threats.length > 0 && threats[0].defenseCount === 1) {
                console.log('🗡️ Threat space search - unstoppable threat!');
                return { row: threats[0].row, col: threats[0].col };
            }
        }

        // ========================================
        // PHASE 6: MCTS (V9.1) - for complex positions
        // ========================================
        if (config.useMCTS && moveHistory.length > 10 && moveHistory.length < 100) {
            const mctsMove = mctsSearch(board, player, config.mctsSimulations);
            if (mctsMove) {
                console.log('🌳 Using MCTS');
                return mctsMove;
            }
        }

        // ========================================
        // PHASE 7: Minimax Search (Core algorithm)
        // ========================================
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
