// ================================
// CỜ CARO 12.0 - EVENT HANDLERS
// Version: 12.0.0
// Cờ Caro Nổ 5 Khóa Edition
// ================================

import { gameState, resetGame, togglePlayer, addMoveToHistory, updateStats, updateExplosionScore } from '../core/game-state.js';
import { makeMove } from '../core/board.js';
import { checkWinAtPosition, checkAfterMoveWithExplosion } from '../core/rules.js';
import { renderBoard, updateCell, highlightWinningLine, updateStatus, updateStatsDisplay, updateExplosionScores, clearCells } from './renderer.js';
import { getAIMoveWithTimeout } from '../ai/ai-engine.js';
import {
    animateCellPlacement,
    animateWinningLine,
    animateExplosion,
    animateOpenFiveWin,
    showAIThinking,
    hideAIThinking,
    shakeCell
} from './animations.js';
import { soundManager } from './sound-manager.js';

/**
 * Initialize event listeners
 */
export function initEventListeners() {
    // Board click handler
    document.querySelector('#board')?.addEventListener('click', handleCellClick);

    console.log('✅ Event listeners initialized');
}

/**
 * Handle cell click
 */
async function handleCellClick(event) {
    const cell = event.target;
    if (!cell.classList.contains('cell')) return;

    const row = parseInt(cell.dataset.row);
    const col = parseInt(cell.dataset.col);

    // Validate move
    if (!gameState.gameActive || gameState.board[row][col] !== null) {
        if (gameState.board[row][col] !== null) {
            shakeCell(row, col);
        }
        return;
    }

    // Player move
    makeMove(gameState.board, row, col, gameState.currentPlayer);
    updateCell(row, col, gameState.currentPlayer);
    addMoveToHistory(row, col, gameState.currentPlayer);

    // Animate placement with effects
    animateCellPlacement(row, col, gameState.currentPlayer);

    // Check win/explosion (v12.0)
    const result = checkAfterMoveWithExplosion(
        gameState.board,
        row,
        col,
        gameState.currentPlayer,
        gameState.explosionModeEnabled
    );

    // Handle win
    if (result.type === 'win') {
        animateOpenFiveWin(result.line, result.winner);
        updateStatus(`💥 ${result.winner} WINS with OPEN FIVE! 💥`);
        gameState.gameActive = false;

        // Update and save stats
        updateStats(result.winner);
        updateStatsDisplay(gameState.stats);

        return;
    }

    // Handle explosion
    if (result.type === 'explosion') {
        console.log(`💥 EXPLOSION! ${result.explosionCount} sequences, ${result.cellsRemoved} cells removed`);

        // Update explosion score
        updateExplosionScore(result.player, result.explosionPoints);
        updateExplosionScores(gameState.explosionScores);

        // Animate explosion
        const allCells = result.explodedCells;
        animateExplosion(allCells, result.player);

        // Clear cells from UI after animation
        setTimeout(() => {
            clearCells(allCells);
        }, 900);

        updateStatus(`${result.player} created ${result.explosionCount} locked five(s)! +${result.explosionPoints} points`);

        // Don't toggle player - same player continues
        return;
    }

    // Switch player (only if no explosion)
    togglePlayer();

    // AI move (if PvC mode)
    if (gameState.gameMode === 'pvc' && gameState.currentPlayer === 'O') {
        gameState.aiThinking = true;
        updateStatus('AI thinking...');
        showAIThinking();

        try {
            const aiMove = await getAIMoveWithTimeout(
                gameState.board,
                'O',
                gameState.aiDifficulty,
                gameState.aiPersonality,
                gameState.moveHistory
            );

            if (aiMove) {
                makeMove(gameState.board, aiMove.row, aiMove.col, 'O');
                updateCell(aiMove.row, aiMove.col, 'O');
                addMoveToHistory(aiMove.row, aiMove.col, 'O');

                // Animate AI placement with effects
                animateCellPlacement(aiMove.row, aiMove.col, 'O');

                // Check AI win/explosion (v12.0)
                const aiResult = checkAfterMoveWithExplosion(
                    gameState.board,
                    aiMove.row,
                    aiMove.col,
                    'O',
                    gameState.explosionModeEnabled
                );

                // Handle AI win
                if (aiResult.type === 'win') {
                    animateOpenFiveWin(aiResult.line, aiResult.winner);
                    updateStatus(`💥 AI WINS with OPEN FIVE! 💥`);
                    gameState.gameActive = false;

                    // Update and save stats
                    updateStats(aiResult.winner);
                    updateStatsDisplay(gameState.stats);

                    return;
                }

                // Handle AI explosion
                if (aiResult.type === 'explosion') {
                    console.log(`💥 AI EXPLOSION! ${aiResult.explosionCount} sequences, ${aiResult.cellsRemoved} cells removed`);

                    // Update explosion score
                    updateExplosionScore(aiResult.player, aiResult.explosionPoints);
                    updateExplosionScores(gameState.explosionScores);

                    // Animate explosion
                    const allCells = aiResult.explodedCells;
                    animateExplosion(allCells, aiResult.player);

                    // Clear cells from UI after animation
                    setTimeout(() => {
                        clearCells(allCells);
                    }, 900);

                    updateStatus(`AI created ${aiResult.explosionCount} locked five(s)! +${aiResult.explosionPoints} points`);

                    // AI continues (don't toggle)
                    // Trigger another AI move
                    setTimeout(() => {
                        handleCellClick({ target: { classList: { contains: () => false } } });
                    }, 1500);

                    return;
                }

                togglePlayer();
                updateStatus('Your turn');
            }
        } catch (error) {
            console.error('AI error:', error);
            updateStatus('AI error - your turn');
        } finally {
            gameState.aiThinking = false;
            hideAIThinking();
        }
    }
}
