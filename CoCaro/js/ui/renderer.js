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
    if (!boardContainer) return;

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
    const xWinsEl = document.querySelector('#x-wins');
    const oWinsEl = document.querySelector('#o-wins');
    const drawsEl = document.querySelector('#draws');

    if (xWinsEl) xWinsEl.textContent = stats.xWins;
    if (oWinsEl) oWinsEl.textContent = stats.oWins;
    if (drawsEl) drawsEl.textContent = stats.draws;
}
