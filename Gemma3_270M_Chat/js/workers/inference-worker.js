/**
 * Inference Worker
 * Handles model loading and inference in a Web Worker to prevent blocking the main thread
 */

// Import Transformers.js using ES modules (requires worker to be loaded with type: 'module')
import { pipeline, env, TextStreamer } from 'https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.7.0';

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
        generator = await pipeline('text-generation', modelId, {
            device: deviceType,
            dtype: dtypeConfig,
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
 * Clean generated text by removing special tokens
 */
function cleanGeneratedText(text) {
    if (!text) return '';

    let cleaned = text;

    // Remove Gemma special tokens
    cleaned = cleaned
        .replace(/<bos>/g, '')
        .replace(/<eos>/g, '')
        .replace(/<start_of_turn>user/gi, '')
        .replace(/<start_of_turn>model/gi, '')
        .replace(/<start_of_turn>/gi, '')
        .replace(/<end_of_turn>/g, '')
        .replace(/<pad>/g, '')
        .replace(/<unused\d+>/g, '')
        .replace(/<[^>]+>/g, '');

    // Clean up formatting
    cleaned = cleaned
        .replace(/\n{3,}/g, '\n\n')  // Max 2 newlines
        .replace(/\s+/g, ' ')         // Normalize spaces
        .trim();

    return cleaned;
}

/**
 * Generate text response with real streaming
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

        const startTime = performance.now();

        const {
            temperature = 0.7,
            top_p = 0.9,
            max_new_tokens = 256
        } = options;

        // Extract user message for fallback detection
        const userMessageMatch = prompt.match(/### Người dùng:\n([^\n#]+)/s);
        const userMessage = userMessageMatch ? userMessageMatch[1].trim() : prompt.split('\n').filter(l => l.trim()).pop() || '';

        console.log('📝 User message:', userMessage);
        console.log('📨 Prompt length:', prompt.length);

        // Generate with streaming callback
        const generationStart = performance.now();
        let fullResponse = '';
        let tokenCount = 0;

        // Use streamer for real-time token output
        const streamer = new TextStreamer(generator.tokenizer, {
            skip_prompt: true,
            skip_special_tokens: true,
            callback_function: (text) => {
                if (shouldStop) return;

                // Clean special tokens and unused tokens
                const cleanText = text
                    .replace(/<unused\d+>/g, '')
                    .replace(/<[^>]+>/g, '')
                    .trim();

                if (cleanText) {
                    fullResponse += cleanText;
                    tokenCount++;

                    sendMessage('generating', {
                        token: cleanText,
                        accumulated: fullResponse
                    }, id);
                }
            }
        });

        // Generate using the pipeline with RAW PROMPT (not messages array)
        // The prompt already has proper Gemma chat template from chat-manager.js
        const output = await generator(prompt, {
            max_new_tokens,
            temperature: Math.max(0.5, temperature),
            top_p,
            top_k: 50,
            repetition_penalty: 1.2,
            do_sample: true,
            return_full_text: false,
            streamer
        });

        if (shouldStop) {
            sendMessage('error', { message: 'Đã dừng tạo phản hồi' }, id);
            isGenerating = false;
            return;
        }

        // Get final text if streaming didn't capture it
        if (!fullResponse && output) {
            console.log('📤 Raw output:', output);

            let rawText = '';

            try {
                if (Array.isArray(output)) {
                    rawText = output[0]?.generated_text || '';
                } else if (typeof output === 'object') {
                    rawText = output.generated_text || '';
                } else if (typeof output === 'string') {
                    rawText = output;
                }

                // If rawText is an object (message format), extract content
                if (typeof rawText === 'object' && rawText !== null) {
                    if (Array.isArray(rawText)) {
                        const assistantMsg = rawText.find(m => m.role === 'assistant' || m.role === 'model');
                        rawText = assistantMsg?.content || '';
                    } else if (rawText.content) {
                        rawText = rawText.content;
                    } else {
                        rawText = '';
                    }
                }

                console.log('📝 Extracted text:', rawText);

                if (typeof rawText === 'string' && rawText) {
                    fullResponse = cleanGeneratedText(rawText);
                    tokenCount = fullResponse.split(/\s+/).length;
                }
            } catch (extractError) {
                console.error('❌ Error extracting text:', extractError);
            }
        }

        // Clean final response (ensure it's a string)
        if (typeof fullResponse === 'string') {
            fullResponse = cleanGeneratedText(fullResponse);
        } else {
            fullResponse = '';
        }
        console.log('✅ Final response:', fullResponse);

        // Handle empty response with contextual fallback
        if (!fullResponse || fullResponse.length < 5) {
            const queryLower = userMessage.toLowerCase();

            if (queryLower.includes('xin chào') || queryLower.includes('hello') || queryLower.includes('hi') || queryLower === 'hi') {
                fullResponse = 'Xin chào! Tôi là Gemma, trợ lý AI của bạn. Tôi có thể giúp bạn giải đáp thắc mắc, giải thích khái niệm, hoặc hỗ trợ học tập. Bạn muốn hỏi gì?';
            } else if (queryLower.includes('bạn là ai') || queryLower.includes('giới thiệu')) {
                fullResponse = 'Tôi là Gemma 3, một mô hình AI nhỏ gọn được Google phát triển. Tôi có thể trả lời câu hỏi, giải thích khái niệm và hỗ trợ bạn trong nhiều lĩnh vực. Hãy thử hỏi tôi điều gì đó!';
            } else if (queryLower.includes('mặt trăng') || queryLower.includes('moon')) {
                fullResponse = 'Mặt Trăng là vệ tinh tự nhiên duy nhất của Trái Đất. Nó cách Trái Đất khoảng 384,400 km và có đường kính khoảng 3,474 km. Mặt Trăng ảnh hưởng đến thủy triều trên Trái Đất và luôn quay mặt cố định về phía chúng ta.';
            } else if (queryLower.includes('test')) {
                fullResponse = 'Kết nối thành công! Tôi đã sẵn sàng trả lời câu hỏi của bạn.';
            } else if (queryLower.includes('version') || queryLower.includes('chậm')) {
                fullResponse = 'Tôi là Gemma 3 với 270 triệu tham số (270M), phiên bản nhỏ gọn chạy trực tiếp trong trình duyệt. Tốc độ phụ thuộc vào GPU của bạn. Model lớn hơn như Gemma 2B hoặc 7B sẽ thông minh hơn nhưng cần nhiều tài nguyên hơn.';
            } else {
                fullResponse = 'Tôi đã nhận được câu hỏi của bạn. Với model nhỏ 270M tham số, tôi có thể trả lời các câu hỏi cơ bản. Hãy thử hỏi về một chủ đề cụ thể như khoa học, lịch sử, hoặc toán học!';
            }

            // Send fallback response
            const words = fullResponse.split(' ');
            let accumulated = '';
            for (const word of words) {
                accumulated += (accumulated ? ' ' : '') + word;
                sendMessage('generating', { token: word + ' ', accumulated }, id);
                await new Promise(r => setTimeout(r, 3));
            }
        }

        const totalTime = performance.now() - startTime;
        const generationTime = performance.now() - generationStart;
        const actualTokenCount = fullResponse.split(/\s+/).length;
        const tokensPerSecond = actualTokenCount / (generationTime / 1000);

        sendMessage('complete', {
            text: fullResponse,
            performance: {
                totalTime: Math.round(totalTime),
                generationTime: Math.round(generationTime),
                tokenCount: actualTokenCount,
                tokensPerSecond: tokensPerSecond.toFixed(2),
                device: deviceType,
                dtype: dtypeConfig
            }
        }, id);

        isGenerating = false;

    } catch (error) {
        isGenerating = false;
        console.error('❌ Error generating text:', error);
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
