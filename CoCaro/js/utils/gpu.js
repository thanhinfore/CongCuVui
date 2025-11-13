// ================================
// CỜ CARO 10.0 - GPU ACCELERATION
// Version: 10.0.0
// GPU.js initialization and kernels
// ================================

/**
 * GPU State
 */
let gpu = null;
let gpuKernels = {};
let gpuEnabled = false;

/**
 * Initialize GPU.js for parallel computation
 * @returns {boolean} Whether GPU was successfully initialized
 */
export function initGPU() {
    try {
        if (typeof GPU === 'undefined') {
            console.warn('GPU.js not loaded, falling back to CPU');
            gpuEnabled = false;
            return false;
        }

        // V9.1 FIX: Cross-browser GPU.js constructor
        // v2.4.3+ has regression bug in Chrome/Edge, needs window.GPU.GPU
        // Try standard constructor first, fallback to window.GPU.GPU
        try {
            gpu = new GPU({
                mode: 'gpu' // Force GPU mode, will fallback to CPU if needed
            });
        } catch (e) {
            // Fallback for newer GPU.js versions (v2.4.3+)
            if (typeof window.GPU.GPU !== 'undefined') {
                gpu = new window.GPU.GPU({
                    mode: 'gpu'
                });
                console.log('🔧 Using window.GPU.GPU constructor (v2.4.3+ compatibility)');
            } else {
                throw e;
            }
        }

        console.log('🚀 GPU.js initialized successfully');
        console.log('GPU Mode:', gpu.mode);

        // Create GPU kernels
        createGPUKernels();
        gpuEnabled = true;
        return true;

    } catch (error) {
        console.error('Failed to initialize GPU:', error);
        gpuEnabled = false;
        return false;
    }
}

/**
 * Create GPU kernels for parallel computation
 */
function createGPUKernels() {
    // Kernel: Parallel board evaluation
    gpuKernels.evaluateBoard = gpu.createKernel(function(board, boardSize) {
        const x = this.thread.x;
        const y = this.thread.y;
        const idx = y * boardSize + x;

        if (board[idx] === 0) return 0;

        let score = 0;
        const player = board[idx];

        // Simple position scoring
        const centerX = Math.floor(boardSize / 2);
        const centerY = Math.floor(boardSize / 2);
        const distToCenter = Math.abs(x - centerX) + Math.abs(y - centerY);
        score += (boardSize - distToCenter) * 10;

        return score;
    }).setOutput([15, 15]);

    console.log('✅ GPU kernels created');
}

/**
 * Get GPU instance
 */
export function getGPU() {
    return gpu;
}

/**
 * Get GPU kernels
 */
export function getGPUKernels() {
    return gpuKernels;
}

/**
 * Check if GPU is enabled
 */
export function isGPUEnabled() {
    return gpuEnabled;
}

/**
 * Cleanup GPU resources
 */
export function cleanupGPU() {
    if (gpu) {
        // Destroy kernels
        Object.values(gpuKernels).forEach(kernel => {
            if (kernel && kernel.destroy) {
                kernel.destroy();
            }
        });
        gpuKernels = {};

        // Destroy GPU instance
        if (gpu.destroy) {
            gpu.destroy();
        }
        gpu = null;
        gpuEnabled = false;

        console.log('🔧 GPU resources cleaned up');
    }
}
