// ================================
// CỜ CARO 10.0 - UI RENDERER
// Version: 10.0.0
// Board and UI rendering
// ================================

import { BOARD_SIZE } from '../config/constants.js';

/**
 * Render board to DOM
 */
export function renderBoard(board, containerSelector = '#board') {
    const boardContainer = document.querySelector(containerSelector);

    if (!boardContainer) {
        console.error('❌ Board container not found!');
        return;
    }

    boardContainer.innerHTML = '';
    boardContainer.style.gridTemplateColumns = `repeat(${BOARD_SIZE}, 1fr)`;

    for (let row = 0; row < BOARD_SIZE; row++) {
        for (let col = 0; col < BOARD_SIZE; col++) {
            const cell = document.createElement('div');
            cell.className = 'cell';
            cell.dataset.row = row;
            cell.dataset.col = col;

            if (board[row][col]) {
                cell.textContent = board[row][col];
                cell.classList.add('occupied', board[row][col].toLowerCase());
            }

            boardContainer.appendChild(cell);
        }
    }
}

/**
 * Update single cell
 */
export function updateCell(row, col, player) {
    const cell = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
    if (cell) {
        cell.textContent = player;
        cell.classList.add('occupied', player.toLowerCase());
    }
}

/**
 * Highlight winning line
 */
export function highlightWinningLine(line) {
    line.forEach(({ row, col }) => {
        const cell = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
        if (cell) {
            cell.classList.add('winning');
        }
    });
}

/**
 * Update status display
 */
export function updateStatus(message) {
    const status = document.querySelector('#status');
    if (status) {
        status.textContent = message;
    }
}

/**
 * Update statistics display
 */
export function updateStatsDisplay(stats) {
    const xWinsEl = document.querySelector('#xWins');
    const oWinsEl = document.querySelector('#oWins');
    const drawsEl = document.querySelector('#draws');

    if (xWinsEl) xWinsEl.textContent = stats.xWins;
    if (oWinsEl) oWinsEl.textContent = stats.oWins;
    if (drawsEl) drawsEl.textContent = stats.draws;
}

/**
 * Update explosion scores display (v12.0)
 */
export function updateExplosionScores(explosionScores) {
    const xExpEl = document.querySelector('#xExplosions');
    const oExpEl = document.querySelector('#oExplosions');

    if (xExpEl) xExpEl.textContent = explosionScores.X;
    if (oExpEl) oExpEl.textContent = explosionScores.O;
}

/**
 * Clear cell (for explosions - v12.0)
 */
export function clearCell(row, col) {
    const cell = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
    if (cell) {
        cell.textContent = '';
        cell.classList.remove('occupied', 'x', 'o', 'explosion-warning', 'explosion-fade');
    }
}

/**
 * Clear multiple cells (for explosions - v12.0)
 */
export function clearCells(positions) {
    positions.forEach(({ row, col }) => {
        clearCell(row, col);
    });
}
