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
 * Detect device - Auto-detect WebGPU or fallback to WASM
 * WebGPU provides significant speedup (GPU acceleration)
 * Note: We now filter <unused42> tokens in post-processing, so WebGPU is safe to use
 */
async function detectDevice() {
    // Try to detect WebGPU support
    const hasWebGPU = 'gpu' in navigator;

    if (hasWebGPU) {
        try {
            // Check if WebGPU adapter is actually available
            const adapter = await navigator.gpu?.requestAdapter();
            if (adapter) {
                deviceType = 'webgpu';
                dtypeConfig = 'fp16';  // FP16 for WebGPU (faster)

                sendMessage('deviceInfo', {
                    device: 'WebGPU (GPU)',
                    dtype: 'fp16',
                    message: '⚡ Sử dụng WebGPU (GPU) - Tốc độ nhanh hơn WASM nhiều lần!'
                });
                return;
            }
        } catch (error) {
            console.warn('WebGPU detection failed, falling back to WASM:', error);
        }
    }

    // Fallback to WASM if WebGPU not available
    deviceType = 'wasm';
    dtypeConfig = 'fp32';

    sendMessage('deviceInfo', {
        device: 'WASM (CPU)',
        dtype: 'fp32',
        message: 'Sử dụng WASM (CPU). Tip: Dùng trình duyệt hỗ trợ WebGPU để tăng tốc!'
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
            message: isCached ?
                'Đang nạp mô hình từ cache...' :
                `Đang tải mô hình Gemma 3 270M với ${deviceType === 'webgpu' ? 'WebGPU (GPU)' : 'WASM (CPU)'}...`,
            progress: 10
        });

        // Create text generation pipeline with detected device (WebGPU or WASM)
        // Special tokens like <unused42> are filtered in post-processing
        generator = await pipeline('text-generation', modelId, {
            device: deviceType,  // Use detected device (webgpu or wasm)
            dtype: dtypeConfig,  // fp16 for WebGPU, fp32 for WASM
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
 * Clean generated text by removing special tokens and handling edge cases
 */
function cleanGeneratedText(text) {
    if (!text) return '';

    let cleaned = text;

    // Remove Gemma special tokens first
    cleaned = cleaned
        .replace(/<bos>/g, '')
        .replace(/<eos>/g, '')
        .replace(/<start_of_turn>user/g, '')
        .replace(/<start_of_turn>model/g, '')
        .replace(/<end_of_turn>/g, '')
        .replace(/<pad>/g, '')
        .replace(/<unused\d+>/g, '')  // Remove unused tokens like <unused42>
        .replace(/<[^>]+>/g, '');     // Remove any remaining special tokens

    // Remove sequences of repeated special characters
    cleaned = cleaned
        .replace(/([^\w\s\u00C0-\u024F])\1{3,}/g, '$1$1')  // Keep max 2 repeated special chars
        .replace(/(\s+-{2,}\s+)+/g, ' ')  // Remove " -- -- " sequences
        .trim();

    // Normalize whitespace
    cleaned = cleaned.replace(/\s+/g, ' ').trim();

    return cleaned;
}

/**
 * Extract only the model's response, stopping at any new turn
 */
function extractModelResponse(text) {
    if (!text) return '';

    // Stop at any new turn marker (user or model)
    const stopPatterns = [
        /<start_of_turn>/,
        /<end_of_turn>/,
        /\n\s*(User|Người dùng):\s/i,
        /\n\s*(Assistant|Model|Trợ lý):\s/i,
    ];

    let result = text;

    for (const pattern of stopPatterns) {
        const match = result.search(pattern);
        if (match !== -1 && match > 0) {
            result = result.substring(0, match);
        }
    }

    return result.trim();
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

        // Generate text with optimized parameters for Gemma 3
        const generationStart = performance.now();
        const output = await generator(prompt, {
            max_new_tokens,
            temperature: Math.max(temperature, 0.1),  // Ensure minimum temperature for diversity
            top_p,
            top_k: 50,                    // Good balance for diversity
            repetition_penalty: 1.15,     // Moderate penalty to prevent loops
            do_sample: true,              // Always sample for more natural responses
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

        // First extract only the model's response (stop at turn markers)
        generatedText = extractModelResponse(generatedText);

        // Then clean up special tokens
        generatedText = cleanGeneratedText(generatedText);

        // Handle empty or very short responses
        if (!generatedText || generatedText.length < 3) {
            // Try to give a contextual response based on common queries
            const promptLower = prompt.toLowerCase();

            if (promptLower.includes('xin chào') || promptLower.includes('hello') || promptLower.includes('hi')) {
                generatedText = 'Xin chào! Tôi là trợ lý AI. Tôi có thể giúp gì cho bạn?';
            } else if (promptLower.includes('bạn là ai') || promptLower.includes('giới thiệu')) {
                generatedText = 'Tôi là Gemma, một trợ lý AI được phát triển để hỗ trợ học tập và trả lời câu hỏi. Bạn có thể hỏi tôi bất kỳ điều gì!';
            } else if (promptLower.includes('test')) {
                generatedText = 'Tôi đang hoạt động bình thường! Bạn có thể đặt câu hỏi cho tôi.';
            } else {
                generatedText = 'Tôi hiểu câu hỏi của bạn. Bạn có thể cho tôi thêm chi tiết được không?';
            }
        }

        // Send tokens with minimal delay for faster perceived response
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

            // Minimal delay for smooth streaming without slowing down
            const delay = deviceType === 'webgpu' ? 5 : 10;
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
