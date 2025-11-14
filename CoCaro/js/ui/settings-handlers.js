// ================================
// CỜ CARO 11.1 - SETTINGS HANDLERS
// Version: 11.1.0
// Handle all UI settings and controls
// ================================

import { gameState, resetGame, saveStats } from '../core/game-state.js';
import { renderBoard, updateStatus, updateStatsDisplay } from './renderer.js';
import { soundManager } from './sound-manager.js';

/**
 * Initialize all settings handlers
 */
export function initSettingsHandlers() {
    // Settings panel toggle
    initSettingsPanelToggle();

    // Game controls
    initGameControls();

    // Settings changes
    initSettingsChanges();

    // Dark mode toggle
    initDarkModeToggle();

    // History panel toggle
    initHistoryToggle();

    console.log('✅ Settings handlers initialized');
}

/**
 * Initialize settings panel toggle
 */
function initSettingsPanelToggle() {
    const settingsToggle = document.getElementById('settingsToggle');
    const settingsPanel = document.getElementById('settingsPanel');

    if (settingsToggle && settingsPanel) {
        settingsToggle.addEventListener('click', () => {
            settingsPanel.classList.toggle('collapsed');
            soundManager.playButtonClick();
        });
    }
}

/**
 * Initialize game control buttons
 */
function initGameControls() {
    // Start/New Game button
    const startGameBtn = document.getElementById('startGameBtn');
    if (startGameBtn) {
        startGameBtn.addEventListener('click', handleNewGame);
    }

    // Reset button
    const resetBtn = document.getElementById('resetBtn');
    if (resetBtn) {
        resetBtn.addEventListener('click', handleNewGame);
    }

    // Undo button
    const undoBtn = document.getElementById('undoBtn');
    if (undoBtn) {
        undoBtn.addEventListener('click', handleUndo);
    }

    // Redo button
    const redoBtn = document.getElementById('redoBtn');
    if (redoBtn) {
        redoBtn.addEventListener('click', handleRedo);
    }

    // Hint button
    const hintBtn = document.getElementById('hintBtn');
    if (hintBtn) {
        hintBtn.addEventListener('click', handleHint);
    }

    // Save/Load buttons
    const saveGameBtn = document.getElementById('saveGameBtn');
    if (saveGameBtn) {
        saveGameBtn.addEventListener('click', handleSaveGame);
    }

    const loadGameBtn = document.getElementById('loadGameBtn');
    if (loadGameBtn) {
        loadGameBtn.addEventListener('click', handleLoadGame);
    }

    const exportGameBtn = document.getElementById('exportGameBtn');
    if (exportGameBtn) {
        exportGameBtn.addEventListener('click', handleExportGame);
    }

    const importGameBtn = document.getElementById('importGameBtn');
    if (importGameBtn) {
        importGameBtn.addEventListener('click', handleImportGame);
    }
}

/**
 * Initialize settings change handlers
 */
function initSettingsChanges() {
    // Game mode
    const gameModeSelect = document.getElementById('gameMode');
    if (gameModeSelect) {
        gameModeSelect.addEventListener('change', (e) => {
            gameState.gameMode = e.target.value;
            soundManager.playButtonClick();

            // Show/hide AI settings
            const aiSettings = document.querySelectorAll('#aiDifficultyContainer, #aiPersonalityContainer');
            aiSettings.forEach(setting => {
                setting.style.display = gameState.gameMode === 'pvc' ? 'block' : 'none';
            });

            updateStatus(`Chế độ: ${e.target.value === 'pvc' ? 'Người vs AI' : 'Người vs Người'}`);
        });
    }

    // AI Difficulty
    const aiDifficultySelect = document.getElementById('aiDifficulty');
    if (aiDifficultySelect) {
        aiDifficultySelect.addEventListener('change', (e) => {
            gameState.aiDifficulty = e.target.value;
            soundManager.playButtonClick();
            updateStatus(`Độ khó AI: ${getDifficultyLabel(e.target.value)}`);
        });
    }

    // AI Personality
    const aiPersonalitySelect = document.getElementById('aiPersonality');
    if (aiPersonalitySelect) {
        aiPersonalitySelect.addEventListener('change', (e) => {
            gameState.aiPersonality = e.target.value;
            soundManager.playButtonClick();
            updateStatus(`Tính cách AI: ${getPersonalityLabel(e.target.value)}`);
        });
    }

    // Theme
    const themeSelect = document.getElementById('theme');
    if (themeSelect) {
        themeSelect.addEventListener('change', (e) => {
            applyTheme(e.target.value);
            soundManager.playButtonClick();
        });
    }

    // Analysis mode toggle
    const analysisToggle = document.getElementById('analysisMode');
    if (analysisToggle) {
        analysisToggle.addEventListener('change', (e) => {
            const analysisPanel = document.getElementById('analysisPanel');
            if (analysisPanel) {
                if (e.target.checked) {
                    analysisPanel.classList.remove('collapsed');
                } else {
                    analysisPanel.classList.add('collapsed');
                }
            }
            soundManager.playButtonClick();
        });
    }

    // Timer toggle
    const timerToggle = document.getElementById('timerToggle');
    if (timerToggle) {
        timerToggle.addEventListener('change', (e) => {
            const timer = document.getElementById('timer');
            if (timer) {
                timer.style.display = e.target.checked ? 'block' : 'none';
            }
            soundManager.playButtonClick();
        });
    }

    // Tutorial mode toggle
    const tutorialToggle = document.getElementById('tutorialMode');
    if (tutorialToggle) {
        tutorialToggle.addEventListener('change', (e) => {
            gameState.tutorialMode = e.target.checked;
            soundManager.playButtonClick();
            if (e.target.checked) {
                updateStatus('Chế độ hướng dẫn: BẬT');
            }
        });
    }
}

/**
 * Initialize dark mode toggle
 */
function initDarkModeToggle() {
    const darkModeToggle = document.getElementById('darkModeToggle');
    if (darkModeToggle) {
        darkModeToggle.addEventListener('click', () => {
            document.body.classList.toggle('dark-mode');
            soundManager.playButtonClick();

            // Save preference
            const isDark = document.body.classList.contains('dark-mode');
            localStorage.setItem('darkMode', isDark);
        });

        // Load saved preference
        const savedDarkMode = localStorage.getItem('darkMode');
        if (savedDarkMode === 'true') {
            document.body.classList.add('dark-mode');
        }
    }
}

/**
 * Initialize history panel toggle
 */
function initHistoryToggle() {
    const historyToggle = document.getElementById('historyToggle');
    const sidePanel = document.getElementById('sidePanel');

    if (historyToggle && sidePanel) {
        historyToggle.addEventListener('click', () => {
            sidePanel.classList.toggle('collapsed');
            soundManager.playButtonClick();
        });
    }
}

/**
 * Handle new game
 */
function handleNewGame() {
    soundManager.playButtonClick();

    // Save stats before reset
    saveStats();

    // Reset game
    resetGame();

    // Re-render board
    renderBoard(gameState.board);

    // Update status
    updateStatus('Game mới - X đi trước');

    // Update stats display
    updateStatsDisplay(gameState.stats);

    // Close settings panel
    const settingsPanel = document.getElementById('settingsPanel');
    if (settingsPanel) {
        settingsPanel.classList.add('collapsed');
    }

    console.log('🎮 New game started');
}

/**
 * Handle undo
 */
function handleUndo() {
    soundManager.playButtonClick();

    if (gameState.moveHistory.length === 0) {
        updateStatus('Không có nước đi để hoàn tác');
        soundManager.playInvalidMove();
        return;
    }

    // Remove last move (or last 2 moves if playing vs AI)
    const movesToUndo = gameState.gameMode === 'pvc' ? 2 : 1;

    for (let i = 0; i < movesToUndo && gameState.moveHistory.length > 0; i++) {
        const lastMove = gameState.moveHistory.pop();
        gameState.board[lastMove.row][lastMove.col] = null;
        gameState.currentPlayer = lastMove.player;
    }

    // Re-render
    renderBoard(gameState.board);
    updateStatus(`Đã hoàn tác ${movesToUndo} nước`);

    // Re-enable game if it was finished
    gameState.gameActive = true;
}

/**
 * Handle redo
 */
function handleRedo() {
    soundManager.playButtonClick();
    updateStatus('Redo chưa được implement');
}

/**
 * Handle hint
 */
function handleHint() {
    soundManager.playButtonClick();
    updateStatus('Hint chưa được implement');
}

/**
 * Handle save game
 */
function handleSaveGame() {
    soundManager.playButtonClick();

    try {
        const saveData = {
            board: gameState.board,
            moveHistory: gameState.moveHistory,
            currentPlayer: gameState.currentPlayer,
            gameMode: gameState.gameMode,
            aiDifficulty: gameState.aiDifficulty,
            aiPersonality: gameState.aiPersonality,
            timestamp: Date.now()
        };

        localStorage.setItem('cocaro_saved_game', JSON.stringify(saveData));
        updateStatus('Đã lưu game thành công');
    } catch (error) {
        console.error('Save error:', error);
        updateStatus('Lỗi khi lưu game');
    }
}

/**
 * Handle load game
 */
function handleLoadGame() {
    soundManager.playButtonClick();

    try {
        const saveData = localStorage.getItem('cocaro_saved_game');
        if (!saveData) {
            updateStatus('Không tìm thấy game đã lưu');
            soundManager.playInvalidMove();
            return;
        }

        const data = JSON.parse(saveData);
        gameState.board = data.board;
        gameState.moveHistory = data.moveHistory;
        gameState.currentPlayer = data.currentPlayer;
        gameState.gameMode = data.gameMode;
        gameState.aiDifficulty = data.aiDifficulty;
        gameState.aiPersonality = data.aiPersonality;
        gameState.gameActive = true;

        renderBoard(gameState.board);
        updateStatus('Đã tải game thành công');
    } catch (error) {
        console.error('Load error:', error);
        updateStatus('Lỗi khi tải game');
        soundManager.playInvalidMove();
    }
}

/**
 * Handle export game
 */
function handleExportGame() {
    soundManager.playButtonClick();

    try {
        const exportData = {
            board: gameState.board,
            moveHistory: gameState.moveHistory,
            version: '11.1.0',
            timestamp: Date.now()
        };

        const dataStr = JSON.stringify(exportData, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = `cocaro_game_${Date.now()}.json`;
        a.click();

        URL.revokeObjectURL(url);
        updateStatus('Đã xuất game thành công');
    } catch (error) {
        console.error('Export error:', error);
        updateStatus('Lỗi khi xuất game');
    }
}

/**
 * Handle import game
 */
function handleImportGame() {
    soundManager.playButtonClick();

    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';

    input.onchange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const data = JSON.parse(event.target.result);
                gameState.board = data.board;
                gameState.moveHistory = data.moveHistory;
                gameState.gameActive = true;

                renderBoard(gameState.board);
                updateStatus('Đã nhập game thành công');
            } catch (error) {
                console.error('Import error:', error);
                updateStatus('Lỗi khi nhập game');
                soundManager.playInvalidMove();
            }
        };
        reader.readAsText(file);
    };

    input.click();
}

/**
 * Apply theme
 */
function applyTheme(theme) {
    document.body.className = document.body.className.replace(/theme-\w+/g, '');

    if (theme !== 'default') {
        document.body.classList.add(`theme-${theme}`);
    }

    localStorage.setItem('theme', theme);
}

/**
 * Get difficulty label
 */
function getDifficultyLabel(difficulty) {
    const labels = {
        easy: 'Dễ',
        medium: 'Trung bình',
        hard: 'Khó',
        grandmaster: 'Grand Master',
        supreme: 'Supreme (GPU)'
    };
    return labels[difficulty] || difficulty;
}

/**
 * Get personality label
 */
function getPersonalityLabel(personality) {
    const labels = {
        aggressive: 'Tấn công',
        balanced: 'Cân bằng',
        defensive: 'Phòng thủ'
    };
    return labels[personality] || personality;
}

/**
 * Load saved settings
 */
export function loadSavedSettings() {
    // Load theme
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
        applyTheme(savedTheme);
        const themeSelect = document.getElementById('theme');
        if (themeSelect) {
            themeSelect.value = savedTheme;
        }
    }

    // Load dark mode
    const savedDarkMode = localStorage.getItem('darkMode');
    if (savedDarkMode === 'true') {
        document.body.classList.add('dark-mode');
    }
}
