/**
 * Inference Worker
 * Handles model loading and inference in a Web Worker to prevent blocking the main thread
 */

// Import Transformers.js using ES modules (requires worker to be loaded with type: 'module')
import { pipeline, env } from 'https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.7.0';

// Import model cache for persistent caching
import { ModelCache } from '../modules/model-cache.js';

// Configure transformers.js
env.allowLocalModels = false;
env.useBrowserCache = true;

// Initialize model cache
const cache = new ModelCache();
let cacheInitialized = false;

let generator = null;
let isLoading = false;
let isGenerating = false;
let shouldStop = false;
let deviceType = 'wasm'; // Will be auto-detected
let dtypeConfig = 'fp32';

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
 * Detect device - Using WASM for Gemma 3 270M stability
 * (WebGPU causes <unused42> token issues with this model)
 */
async function detectDevice() {
    // Force WASM for Gemma 3 270M following GemmaLabelling approach
    deviceType = 'wasm';
    dtypeConfig = 'fp32';

    sendMessage('deviceInfo', {
        device: 'WASM (CPU)',
        dtype: 'fp32',
        message: 'Sử dụng WASM cho Gemma 3 270M (tối ưu cho trình duyệt).'
    });
}

/**
 * Initialize cache system
 */
async function initializeCache() {
    if (cacheInitialized) return;

    try {
        await cache.initialize();
        cacheInitialized = true;

        // Override global fetch to use cache
        const originalFetch = self.fetch;
        self.fetch = async (url, options) => {
            // Only cache model files from Hugging Face
            if (typeof url === 'string' && url.includes('huggingface.co')) {
                return await cache.fetchWithCache(url, options);
            }
            return originalFetch(url, options);
        };

        console.log('✓ Model caching enabled');
    } catch (error) {
        console.error('Error initializing cache:', error);
        // Continue without cache if it fails
    }
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

        // Initialize cache first
        await initializeCache();

        // Check if model is already cached
        const isCached = await cache.isModelCached(modelId);
        if (isCached) {
            sendMessage('loading', {
                message: 'Đang tải mô hình từ cache local...',
                progress: 5
            });
        }

        // Detect best device first (WebGPU or WASM)
        await detectDevice();

        sendMessage('loading', {
            message: isCached ? 'Đang nạp mô hình từ cache...' : 'Đang tải mô hình Gemma 3 270M với WASM...',
            progress: 10
        });

        // Create text generation pipeline with WASM (following GemmaLabelling approach)
        // WebGPU has issues with Gemma 3 270M, use WASM for stability
        generator = await pipeline('text-generation', modelId, {
            device: 'wasm',      // Force WASM (WebGPU causes <unused42> tokens)
            dtype: 'fp32',       // FP32 for WASM
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

        // Track performance
        const startTime = performance.now();

        const {
            temperature = 0.7,
            top_p = 0.9,
            max_new_tokens = 512
        } = options;

        // Generate text with parameters matching GemmaLabelling (proven to work)
        const generationStart = performance.now();
        const output = await generator(prompt, {
            max_new_tokens,
            temperature,
            top_p,
            top_k: 10,                    // Lower top_k like GemmaLabelling (was 50)
            repetition_penalty: 1.1,      // Match GemmaLabelling's value
            do_sample: temperature > 0,
            return_full_text: false,
            pad_token_id: generator.tokenizer?.pad_token_id,
            eos_token_id: generator.tokenizer?.eos_token_id,
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

        // Remove all special tokens (including <unused42>, <start_of_turn>, etc.)
        // Pattern matches any token in angle brackets like <token_name> or <unused42>
        generatedText = generatedText
            .replace(/<[^>]+>/g, '')  // Remove all <...> tokens
            .replace(/\s+/g, ' ')      // Normalize whitespace
            .trim();

        // CRITICAL FIX: Stop at first occurrence of "User:" or repeated "Assistant:" to prevent self-dialogue loops
        // The model sometimes continues generating "User: ... Assistant: ..." patterns
        // We need to truncate at the first sign of a new conversation turn
        const stopPatterns = [
            /\n\s*User:/i,        // Newline followed by "User:"
            /\s{2,}User:/i,       // Multiple spaces followed by "User:"
            /\n\s*Assistant:/i,   // Newline followed by "Assistant:" (repeated assistant turn)
        ];

        for (const pattern of stopPatterns) {
            const match = generatedText.search(pattern);
            if (match !== -1) {
                generatedText = generatedText.substring(0, match).trim();
                break;  // Stop at first match
            }
        }

        // Send token by token (optimized streaming for better UX and performance)
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

            // WASM delay for smooth streaming
            const baseDelay = 15; // WASM (CPU) timing
            const wordLengthDelay = Math.min(word.length * 0.5, 5); // Max 5ms extra
            const delay = baseDelay + wordLengthDelay;

            await new Promise(resolve => setTimeout(resolve, delay));
        }

        if (!shouldStop) {
            const totalTime = performance.now() - startTime;
            const generationTime = performance.now() - generationStart;
            const tokenCount = generatedText.split(/\s+/).length;
            const tokensPerSecond = tokenCount / (generationTime / 1000);

            sendMessage('complete', {
                text: generatedText,
                performance: {
                    totalTime: Math.round(totalTime),
                    generationTime: Math.round(generationTime),
                    tokenCount,
                    tokensPerSecond: tokensPerSecond.toFixed(2),
                    device: deviceType,
                    dtype: dtypeConfig
                }
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
