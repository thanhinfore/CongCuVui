/**
 * Inference Worker
 * Handles model loading and inference in a Web Worker to prevent blocking the main thread
 */

// Import Transformers.js using ES modules (requires worker to be loaded with type: 'module')
import { pipeline, env } from 'https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.7.0';

// Configure transformers.js
env.allowLocalModels = false;
env.useBrowserCache = true;

let generator = null;
let isLoading = false;
let isGenerating = false;
let shouldStop = false;

/**
 * Send message to main thread
 */
function sendMessage(type, data, id = null) {
    const message = { type, data };
    if (id !== null) {
        message.id = id;
    }
    self.postMessage(message);
}

/**
 * Initialize and load the model
 */
async function initialize(modelId) {
    if (isLoading || generator) {
        return;
    }

    try {
        isLoading = true;

        sendMessage('loading', {
            message: 'Đang tải mô hình Gemma...',
            progress: 10
        });

        // Create text generation pipeline
        generator = await pipeline('text-generation', modelId, {
            progress_callback: (progress) => {
                if (progress.status === 'downloading') {
                    const percent = progress.progress ? Math.round(progress.progress) : 0;
                    sendMessage('loading', {
                        message: `Đang tải: ${progress.file || 'model'}...`,
                        progress: 10 + (percent * 0.8)
                    });
                } else if (progress.status === 'loading') {
                    sendMessage('loading', {
                        message: 'Đang nạp mô hình vào bộ nhớ...',
                        progress: 90
                    });
                } else if (progress.status === 'ready') {
                    sendMessage('loading', {
                        message: 'Mô hình đã sẵn sàng!',
                        progress: 100
                    });
                }
            }
        });

        isLoading = false;

        sendMessage('ready', {
            message: 'Mô hình đã sẵn sàng!',
            modelId
        });

    } catch (error) {
        isLoading = false;
        console.error('Error loading model:', error);
        sendMessage('error', {
            message: error.message || 'Không thể tải mô hình. Vui lòng thử lại.'
        });
    }
}

/**
 * Generate text response
 */
async function generate(id, prompt, options) {
    if (!generator) {
        sendMessage('error', { message: 'Mô hình chưa được tải' }, id);
        return;
    }

    if (isGenerating) {
        sendMessage('error', { message: 'Đang tạo phản hồi khác' }, id);
        return;
    }

    try {
        isGenerating = true;
        shouldStop = false;

        const {
            temperature = 0.7,
            top_p = 0.9,
            max_new_tokens = 512
        } = options;

        // Generate text with streaming
        const output = await generator(prompt, {
            max_new_tokens,
            temperature,
            top_p,
            do_sample: temperature > 0,
            return_full_text: false,
            // Stream tokens (note: actual streaming depends on model support)
        });

        if (shouldStop) {
            sendMessage('error', { message: 'Đã dừng tạo phản hồi' }, id);
            isGenerating = false;
            return;
        }

        // Extract generated text
        let generatedText = '';
        if (Array.isArray(output)) {
            generatedText = output[0]?.generated_text || '';
        } else {
            generatedText = output.generated_text || '';
        }

        // Clean up the response (remove prompt if included)
        generatedText = generatedText.replace(prompt, '').trim();

        // Remove any special tokens
        generatedText = generatedText
            .replace(/<start_of_turn>/g, '')
            .replace(/<end_of_turn>/g, '')
            .replace(/<start_of_text>/g, '')
            .replace(/<end_of_text>/g, '')
            .trim();

        // Send token by token (simulated streaming for better UX)
        const words = generatedText.split(' ');
        let accumulated = '';

        for (let i = 0; i < words.length; i++) {
            if (shouldStop) {
                break;
            }

            const word = words[i] + (i < words.length - 1 ? ' ' : '');
            accumulated += word;

            sendMessage('generating', {
                token: word,
                accumulated
            }, id);

            // Small delay to simulate streaming
            await new Promise(resolve => setTimeout(resolve, 30));
        }

        if (!shouldStop) {
            sendMessage('complete', {
                text: generatedText
            }, id);
        }

        isGenerating = false;

    } catch (error) {
        isGenerating = false;
        console.error('Error generating text:', error);
        sendMessage('error', {
            message: error.message || 'Lỗi khi tạo phản hồi'
        }, id);
    }
}

/**
 * Stop current generation
 */
function stopGeneration() {
    shouldStop = true;
    isGenerating = false;
}

/**
 * Handle messages from main thread
 */
self.onmessage = async (e) => {
    const { type, id, modelId, prompt, options } = e.data;

    switch (type) {
        case 'initialize':
            await initialize(modelId);
            break;

        case 'generate':
            await generate(id, prompt, options);
            break;

        case 'stop':
            stopGeneration();
            break;

        default:
            console.warn('Unknown message type:', type);
    }
};

// Handle errors
self.onerror = (error) => {
    console.error('Worker error:', error);
    sendMessage('error', {
        message: 'Lỗi Web Worker: ' + error.message
    });
};

console.log('Inference Worker initialized');
