// ================================
// CỜ CARO 12.0 - MAIN ENTRY POINT
// Version: 12.0.0
// Cờ Caro Nổ 5 Khóa Edition
// Modern Modular Architecture with Explosion Mechanics
// ================================

// Config imports
import { BOARD_SIZE } from './config/constants.js';

// Utils imports
import { initZobrist } from './utils/zobrist.js';
import { initGPU } from './utils/gpu.js';

// Core imports
import { gameState, resetGame, loadStats } from './core/game-state.js';

// AI imports
import { initNeuralNetwork } from './ai/neural-network.js';

// UI imports
import { renderBoard, updateStatus, updateStatsDisplay, updateExplosionScores } from './ui/renderer.js';
import { initEventListeners } from './ui/event-handlers.js';
import { initAnimations } from './ui/animations.js';
import { initSettingsHandlers, loadSavedSettings } from './ui/settings-handlers.js';
import { soundManager } from './ui/sound-manager.js';

/**
 * Initialize Application
 */
async function initApp() {
    console.log('🚀 Initializing CoCaro 12.0 - Cờ Caro Nổ 5 Khóa...');
    console.log('📐 Modern Modular Architecture + Explosion Mechanics');

    try {
        // Initialize utilities
        console.log('⚙️ Initializing utilities...');
        initZobrist();

        // Initialize GPU (optional)
        const gpuStatus = initGPU();
        console.log(`✅ GPU Status: ${gpuStatus ? 'ENABLED' : 'DISABLED'}`);

        // Initialize Neural Network (async)
        console.log('🧠 Initializing Neural Network...');
        const nnStatus = await initNeuralNetwork();
        console.log(`✅ Neural Network Status: ${nnStatus ? 'READY' : 'NOT READY'}`);

        // Initialize sound and animations
        console.log('🎵 Initializing Sound & Animations...');
        initAnimations();
        console.log('✅ Sound Manager: READY (with Explosion Sounds!)');
        console.log('✨ Animations: READY (with Explosion Effects!)');

        // Load saved settings
        loadSavedSettings();

        // Load saved data
        loadStats();

        // Initialize game state
        resetGame();

        // Render initial UI
        renderBoard(gameState.board);
        updateStatus('💥 Welcome to CoCaro 12.0 - Cờ Caro Nổ 5 Khóa! 💥');
        updateStatsDisplay(gameState.stats);
        updateExplosionScores(gameState.explosionScores);

        // Initialize event listeners
        initEventListeners();

        // Initialize settings handlers
        initSettingsHandlers();
        console.log('✅ Settings Handlers: READY');

        console.log('✅ CoCaro 12.0 ready!');
        console.log(`📊 Architecture: ${getModuleCount()} modules loaded`);
        console.log('💥 New in v12.0: Cờ Caro Nổ 5 Khóa - 5 Mở Thắng, 5 Khóa Nổ!');

    } catch (error) {
        console.error('❌ Initialization error:', error);
        updateStatus('Error initializing game');
    }
}

/**
 * Get module count for stats
 */
function getModuleCount() {
    return 25; // Modules in v12.0 (added explosion-detector.js)
}

/**
 * Display architecture info
 */
function displayArchitectureInfo() {
    console.log(`
╔════════════════════════════════════════════════╗
║      CỜ CARO 12.0 - NỔ 5 KHÓA EDITION         ║
╠════════════════════════════════════════════════╣
║ 📁 Config:    constants, patterns, ai-configs ║
║ 🛠️ Utils:     helpers, zobrist, gpu            ║
║ 🎮 Core:      game-state, board, rules         ║
║ 💥 Logic:     explosion-detector (NEW!)        ║
║ 🤖 AI:        9 modules (SUPERIOR!)            ║
║ 🎨 UI:        renderer, event, anim, settings  ║
║ 🎵 Effects:   sound-manager + explosion        ║
╠════════════════════════════════════════════════╣
║ 💥 v12.0 - CỜ CARO NỔ 5 KHÓA:                  ║
║   • 5 Mở (Open Five) → THẮNG! 🏆              ║
║   • 5 Khóa (Locked Five) → NỔ! 💥            ║
║   • Explosion Score Tracking                   ║
║   • Combo Bonus (2+ explosions = 3 pts)        ║
║   • Superior AI + Explosion Mechanics          ║
║   • Dramatic Visual & Sound Effects            ║
║   • Toggle Classic/Explosion Mode              ║
╚════════════════════════════════════════════════╝
    `);
}

// Start application when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}

// Display architecture info in console
displayArchitectureInfo();

// Export for debugging
window.CoCaroGame = {
    version: '12.0.0',
    edition: 'Cờ Caro Nổ 5 Khóa',
    architecture: 'modular',
    gameState,
    soundManager,
    modules: {
        config: 3,
        utils: 3,
        core: 3,
        logic: 1, // explosion-detector.js (NEW!)
        ai: 9,
        ui: 5,
        effects: 1
    },
    features: {
        explosionMode: true,
        openFive: 'WINS',
        lockedFive: 'EXPLODES',
        comboBonus: true,
        explosionScoreTracking: true
    }
};
