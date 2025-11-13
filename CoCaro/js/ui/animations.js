// ================================
// CỜ CARO 10.0 - ANIMATIONS
// Version: 10.0.0
// UI animations and effects
// ================================

/**
 * Show AI thinking animation
 */
export function showAIThinking() {
    const status = document.querySelector('#status');
    if (status) {
        status.classList.add('thinking');
    }
}

/**
 * Hide AI thinking animation
 */
export function hideAIThinking() {
    const status = document.querySelector('#status');
    if (status) {
        status.classList.remove('thinking');
    }
}

/**
 * Animate cell placement
 */
export function animateCellPlacement(row, col) {
    const cell = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
    if (cell) {
        cell.classList.add('pop-in');
        setTimeout(() => cell.classList.remove('pop-in'), 300);
    }
}

/**
 * Animate winning line
 */
export function animateWinningLine(line) {
    line.forEach(({ row, col }, index) => {
        setTimeout(() => {
            const cell = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
            if (cell) {
                cell.classList.add('win-pulse');
            }
        }, index * 100);
    });
}
