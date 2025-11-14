// ================================
// CỜ CARO 10.0 - NEURAL NETWORK
// Version: 10.0.0
// TensorFlow.js integration (V9.1)
// ================================

import { BOARD_SIZE, LEARNING } from '../config/constants.js';

let neuralModel = null;
let tfReady = false;

/**
 * Initialize TensorFlow.js Neural Network
 */
export async function initNeuralNetwork() {
    try {
        if (typeof tf === 'undefined') {
            console.warn('TensorFlow.js not loaded');
            return false;
        }

        console.log('🧠 TensorFlow.js ready');
        console.log('Backend:', tf.getBackend());

        // Try to use WebGL backend
        if (tf.getBackend() === 'webgl') {
            console.log('✅ Using WebGL backend for GPU acceleration');
        }

        neuralModel = await createNeuralNetworkModel();
        tfReady = true;

        console.log('✅ Neural network model created');
        return true;

    } catch (error) {
        console.error('Failed to initialize neural network:', error);
        tfReady = false;
        return false;
    }
}

/**
 * Create Neural Network Model
 */
async function createNeuralNetworkModel() {
    if (typeof tf === 'undefined') return null;

    const model = tf.sequential();

    // Input layer: 15x15 board = 225 inputs
    model.add(tf.layers.dense({
        inputShape: [BOARD_SIZE * BOARD_SIZE],
        units: 128,
        activation: 'relu',
        kernelInitializer: 'heNormal'
    }));
    model.add(tf.layers.dropout({ rate: 0.2 }));

    model.add(tf.layers.dense({
        units: 64,
        activation: 'relu',
        kernelInitializer: 'heNormal'
    }));
    model.add(tf.layers.dropout({ rate: 0.2 }));

    model.add(tf.layers.dense({ units: 32, activation: 'relu' }));
    model.add(tf.layers.dense({ units: 1, activation: 'tanh' })); // Output: -1 to 1

    model.compile({
        optimizer: tf.train.adam(LEARNING.LEARNING_RATE),
        loss: 'meanSquaredError',
        metrics: ['mse', 'mae']
    });

    return model;
}

/**
 * Convert board to tensor
 */
export function boardToTensor(board) {
    const flat = [];
    for (let i = 0; i < BOARD_SIZE; i++) {
        for (let j = 0; j < BOARD_SIZE; j++) {
            if (board[i][j] === 'X') flat.push(1);
            else if (board[i][j] === 'O') flat.push(-1);
            else flat.push(0);
        }
    }
    return tf.tensor2d([flat]);
}

/**
 * Evaluate position using neural network
 */
export async function evaluateWithNN(board) {
    if (!tfReady || !neuralModel) return 0;

    try {
        const inputTensor = boardToTensor(board);
        const prediction = neuralModel.predict(inputTensor);
        const score = (await prediction.data())[0];

        // Cleanup tensors
        inputTensor.dispose();
        prediction.dispose();

        return score * 1000000; // Scale to match pattern scores
    } catch (error) {
        console.error('NN evaluation error:', error);
        return 0;
    }
}

/**
 * Check if NN is ready
 */
export function isNNReady() {
    return tfReady && neuralModel !== null;
}

/**
 * Get model for training
 */
export function getNeuralModel() {
    return neuralModel;
}
