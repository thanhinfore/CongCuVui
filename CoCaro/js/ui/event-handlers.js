// ================================
// CỜ CARO 11.0 - EVENT HANDLERS
// Version: 11.0.0
// UI event handling with enhanced effects
// ================================

import { gameState, resetGame, togglePlayer, addMoveToHistory } from '../core/game-state.js';
import { makeMove } from '../core/board.js';
import { checkWinAtPosition } from '../core/rules.js';
import { renderBoard, updateCell, highlightWinningLine, updateStatus } from './renderer.js';
import { getAIMoveWithTimeout } from '../ai/ai-engine.js';
import {
    animateCellPlacement,
    animateWinningLine,
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

    // Control buttons
    document.querySelector('#new-game-btn')?.addEventListener('click', handleNewGame);
    document.querySelector('#undo-btn')?.addEventListener('click', handleUndo);

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

    // Check win
    const winResult = checkWinAtPosition(gameState.board, row, col);
    if (winResult) {
        highlightWinningLine(winResult.line);
        animateWinningLine(winResult.line, winResult.winner);
        updateStatus(`${winResult.winner} wins!`);
        gameState.gameActive = false;

        // Update stats
        if (winResult.winner === 'X') {
            gameState.stats.xWins++;
        } else {
            gameState.stats.oWins++;
        }
        return;
    }

    // Switch player
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

                const aiWinResult = checkWinAtPosition(gameState.board, aiMove.row, aiMove.col);
                if (aiWinResult) {
                    highlightWinningLine(aiWinResult.line);
                    animateWinningLine(aiWinResult.line, aiWinResult.winner);
                    updateStatus('AI wins!');
                    gameState.gameActive = false;

                    // Update stats
                    gameState.stats.oWins++;
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

/**
 * Handle new game
 */
function handleNewGame() {
    resetGame();
    renderBoard(gameState.board);
    updateStatus('Game started - X goes first');
}

/**
 * Handle undo
 */
function handleUndo() {
    // Implementation needed
    console.log('Undo not yet implemented in v10.0');
}
