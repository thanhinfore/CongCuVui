// ================================
// CỜ CARO 10.0 - MAIN ENTRY POINT
// Version: 10.0.0
// Modern Modular Architecture
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

/**
 * Initialize Application
 */
async function initApp() {
    console.log('🚀 Initializing CoCaro 10.0...');
    console.log('📐 Modern Modular Architecture');

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

        // Load saved data
        loadStats();

        // Initialize game state
        resetGame();

        // Render initial UI
        renderBoard(gameState.board);
        updateStatus('Welcome to CoCaro 10.0 - Click to start!');
        updateStatsDisplay(gameState.stats);

        // Initialize event listeners
        initEventListeners();

        console.log('✅ CoCaro 10.0 ready!');
        console.log(`📊 Architecture: ${getModuleCount()} modules loaded`);

    } catch (error) {
        console.error('❌ Initialization error:', error);
        updateStatus('Error initializing game');
    }
}

/**
 * Get module count for stats
 */
function getModuleCount() {
    return 20; // Approximate number of modules in v10.0
}

/**
 * Display architecture info
 */
function displayArchitectureInfo() {
    console.log(`
╔════════════════════════════════════════════════╗
║         CỜ CARO 10.0 - ARCHITECTURE           ║
╠════════════════════════════════════════════════╣
║ 📁 Config:    constants, patterns, ai-configs ║
║ 🛠️ Utils:     helpers, zobrist, gpu            ║
║ 🎮 Core:      game-state, board, rules         ║
║ 🤖 AI:        8 modules (minimax, mcts, etc.)  ║
║ 🎨 UI:        renderer, event-handlers, anim   ║
║ 📚 Learning:  (available in full version)      ║
╠════════════════════════════════════════════════╣
║ ✨ Benefits:                                   ║
║   • Separation of Concerns                     ║
║   • Easy Maintenance                           ║
║   • Scalability                                ║
║   • Testability                                ║
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
    version: '10.0.0',
    architecture: 'modular',
    gameState,
    modules: {
        config: 3,
        utils: 3,
        core: 3,
        ai: 8,
        ui: 3
    }
};
