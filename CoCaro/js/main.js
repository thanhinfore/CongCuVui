// ================================
// CỜ CARO 11.1 - MAIN ENTRY POINT
// Version: 11.1.0
// Modern Modular Architecture with Enhanced Effects
// Application initialization and orchestration
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
import { renderBoard, updateStatus, updateStatsDisplay } from './ui/renderer.js';
import { initEventListeners } from './ui/event-handlers.js';
import { initAnimations } from './ui/animations.js';
import { initSettingsHandlers, loadSavedSettings } from './ui/settings-handlers.js';
import { soundManager } from './ui/sound-manager.js';

/**
 * Initialize Application
 */
async function initApp() {
    console.log('🚀 Initializing CoCaro 11.1...');
    console.log('📐 Modern Modular Architecture + Enhanced Effects');

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
        console.log('✅ Sound Manager: READY');
        console.log('✨ Animations: READY');

        // Load saved settings
        loadSavedSettings();

        // Load saved data
        loadStats();

        // Initialize game state
        resetGame();

        // Render initial UI
        renderBoard(gameState.board);
        updateStatus('Welcome to CoCaro 11.1 - Click to start!');
        updateStatsDisplay(gameState.stats);

        // Initialize event listeners
        initEventListeners();

        // Initialize settings handlers
        initSettingsHandlers();
        console.log('✅ Settings Handlers: READY');

        console.log('✅ CoCaro 11.1 ready!');
        console.log(`📊 Architecture: ${getModuleCount()} modules loaded`);
        console.log('🎮 New in v11.1: Full UI Controls + Better AI + Save/Load!');

    } catch (error) {
        console.error('❌ Initialization error:', error);
        updateStatus('Error initializing game');
    }
}

/**
 * Get module count for stats
 */
function getModuleCount() {
    return 23; // Modules in v11.1 (added settings-handlers.js)
}

/**
 * Display architecture info
 */
function displayArchitectureInfo() {
    console.log(`
╔════════════════════════════════════════════════╗
║         CỜ CARO 11.1 - ARCHITECTURE           ║
╠════════════════════════════════════════════════╣
║ 📁 Config:    constants, patterns, ai-configs ║
║ 🛠️ Utils:     helpers, zobrist, gpu            ║
║ 🎮 Core:      game-state, board, rules         ║
║ 🤖 AI:        8 modules (minimax, mcts, etc.)  ║
║ 🎨 UI:        renderer, event, anim, settings  ║
║ 🎵 Effects:   sound-manager                    ║
║ 📚 Learning:  (available in full version)      ║
╠════════════════════════════════════════════════╣
║ ✨ New in v11.1:                               ║
║   • Fixed All UI Controls (Settings, Buttons)  ║
║   • Save/Load Game Functionality               ║
║   • Undo/Redo Support                          ║
║   • Theme Switcher                             ║
║   • Dark Mode                                  ║
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
    version: '11.1.0',
    architecture: 'modular',
    gameState,
    soundManager,
    modules: {
        config: 3,
        utils: 3,
        core: 3,
        ai: 8,
        ui: 5, // renderer, event-handlers, animations, sound-manager, settings-handlers
        effects: 1
    }
};
