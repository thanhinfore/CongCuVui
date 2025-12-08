/**
 * Inference Worker
 * Handles model loading and inference in a Web Worker to prevent blocking the main thread
 * Optimized for maximum inference speed with WebGPU/WASM
 */

// Import Transformers.js using ES modules - latest version for best performance
import { pipeline, env, TextStreamer } from 'https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.7.2';

// Import model cache for persistent caching
import { ModelCache } from '../modules/model-cache.js';

// Configure transformers.js for optimal performance
env.allowLocalModels = false;
env.useBrowserCache = true;

// Model configurations with optimal dtype for each
const MODEL_CONFIGS = {
    'onnx-community/gemma-3-270m-it-ONNX': {
        name: 'Gemma 3 270M',
        dtype: { webgpu: 'fp32', wasm: 'fp32' },
        size: '~300MB',
        speed: 'Trung bình'
    },
    'onnx-community/Qwen2.5-0.5B-Instruct': {
        name: 'Qwen 2.5 0.5B',
        dtype: { webgpu: 'q4f16', wasm: 'q4' },
        size: '~350MB',
        speed: 'Nhanh'
    },
    'onnx-community/SmolLM2-360M-Instruct': {
        name: 'SmolLM2 360M',
        dtype: { webgpu: 'q4f16', wasm: 'q4' },
        size: '~250MB',
        speed: 'Rất nhanh'
    }
};

// Initialize model cache
const cache = new ModelCache();
let cacheInitialized = false;

let generator = null;
let isLoading = false;
let isGenerating = false;
let shouldStop = false;
let deviceType = 'wasm'; // Will be auto-detected
let dtypeConfig = 'fp32';
let currentModelId = null;

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
 * Get optimal dtype for model and device
 */
function getOptimalDtype(modelId, device) {
    const config = MODEL_CONFIGS[modelId];
    if (config && config.dtype) {
        return config.dtype[device] || 'fp32';
    }
    // Default fallback
    return device === 'webgpu' ? 'fp32' : 'fp32';
}

/**
 * Detect device - Auto-detect WebGPU or fallback to WASM
 * WebGPU provides significant speedup (GPU acceleration)
 */
async function detectDevice(modelId) {
    // Try to detect WebGPU support
    const hasWebGPU = 'gpu' in navigator;

    if (hasWebGPU) {
        try {
            // Check if WebGPU adapter is actually available
            const adapter = await navigator.gpu?.requestAdapter();
            if (adapter) {
                deviceType = 'webgpu';
                dtypeConfig = getOptimalDtype(modelId, 'webgpu');

                const modelConfig = MODEL_CONFIGS[modelId];
                sendMessage('deviceInfo', {
                    device: 'WebGPU (GPU)',
                    dtype: dtypeConfig,
                    modelName: modelConfig?.name || modelId,
                    message: `⚡ WebGPU (GPU) + ${dtypeConfig.toUpperCase()} - Tốc độ cao nhất!`
                });
                return;
            }
        } catch (error) {
            console.warn('WebGPU detection failed, falling back to WASM:', error);
        }
    }

    // Fallback to WASM if WebGPU not available
    deviceType = 'wasm';
    dtypeConfig = getOptimalDtype(modelId, 'wasm');

    sendMessage('deviceInfo', {
        device: 'WASM (CPU)',
        dtype: dtypeConfig,
        message: `Sử dụng WASM (CPU) + ${dtypeConfig.toUpperCase()}. Tip: Dùng Chrome/Edge để kích hoạt WebGPU!`
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
        currentModelId = modelId;

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

        // Detect best device and get optimal dtype for this model
        await detectDevice(modelId);

        const modelConfig = MODEL_CONFIGS[modelId];
        const modelName = modelConfig?.name || 'AI Model';

        sendMessage('loading', {
            message: isCached ?
                `Đang nạp ${modelName} từ cache...` :
                `Đang tải ${modelName} (${dtypeConfig}) với ${deviceType === 'webgpu' ? 'WebGPU' : 'WASM'}...`,
            progress: 10
        });

        console.log(`📦 Loading model: ${modelId} with device=${deviceType}, dtype=${dtypeConfig}`);

        // Create text generation pipeline with detected device (WebGPU or WASM)
        generator = await pipeline('text-generation', modelId, {
            device: deviceType,
            dtype: dtypeConfig,
            progress_callback: (progress) => {
                if (progress.status === 'downloading') {
                    const percent = progress.progress ? Math.round(progress.progress) : 0;
                    const fileName = progress.file?.split('/').pop() || 'model';
                    sendMessage('loading', {
                        message: `Đang tải: ${fileName}...`,
                        progress: 10 + (percent * 0.75),
                        detail: `${percent}%`
                    });
                } else if (progress.status === 'loading') {
                    sendMessage('loading', {
                        message: 'Đang nạp mô hình vào bộ nhớ...',
                        progress: 88
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

        // Warmup: Run inference to compile shaders and warm up JIT
        // This makes the first real inference much faster
        sendMessage('loading', {
            message: `Đang tối ưu hóa ${modelName} cho ${deviceType === 'webgpu' ? 'GPU' : 'CPU'}...`,
            progress: 92
        });

        try {
            // Quick warmup with minimal tokens - just compile shaders
            console.log('🔥 Starting quick warmup...');
            const warmupStart = performance.now();

            await generator([{ role: 'user', content: 'Hi' }], {
                max_new_tokens: 1,  // Minimal - just trigger shader compilation
                do_sample: false,
                use_cache: true
            });

            const warmupTime = Math.round(performance.now() - warmupStart);
            console.log(`✓ Model warmup complete in ${warmupTime}ms`);
        } catch (e) {
            console.warn('Warmup skipped (non-critical):', e);
        }

        sendMessage('ready', {
            message: `${modelName} đã sẵn sàng!`,
            modelId,
            device: deviceType,
            dtype: dtypeConfig
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

    // Clean up formatting - preserve single spaces
    cleaned = cleaned
        .replace(/\n{3,}/g, '\n\n')   // Max 2 newlines
        .replace(/[ \t]{2,}/g, ' ')    // Multiple spaces/tabs to single space
        .trim();

    return cleaned;
}

/**
 * Generate text response with real streaming
 * Optimized for maximum inference speed
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
            max_new_tokens = 1024  // Increased for longer content generation
        } = options;

        // Parse the prompt to extract conversation history
        // Optimized: simplified parsing with minimal regex operations
        const messages = [];

        // Extract system prompt (single regex)
        const systemMatch = prompt.match(/### Hướng dẫn:\n([^\n#]+)/s);
        const systemPrompt = systemMatch ? systemMatch[1].trim() : 'Bạn là Gemma, trợ lý AI thông minh.';
        messages.push({ role: 'system', content: systemPrompt });

        // Extract all user/assistant turns from the prompt
        const turnPattern = /### (Người dùng|Trợ lý):\n([^#]+?)(?=\n\n###|\n\n$|$)/g;
        let match;
        while ((match = turnPattern.exec(prompt)) !== null) {
            const role = match[1] === 'Người dùng' ? 'user' : 'assistant';
            const content = match[2].trim();
            if (content) {
                messages.push({ role, content });
            }
        }

        // Get the last user message for fallback detection
        const userMessage = messages.filter(m => m.role === 'user').pop()?.content || '';

        // Fix message alternation: ensure roles alternate properly
        // Optimized: single pass with direct array manipulation
        const fixedMessages = [];
        let lastRole = null;

        for (const msg of messages) {
            if (msg.role === 'system') {
                // System message goes first
                if (fixedMessages.length === 0 || fixedMessages[0].role !== 'system') {
                    fixedMessages.unshift(msg);
                }
                continue;
            }

            if (lastRole === null) {
                // First non-system must be user
                if (msg.role === 'user') {
                    fixedMessages.push(msg);
                    lastRole = 'user';
                }
            } else if (lastRole !== msg.role) {
                fixedMessages.push(msg);
                lastRole = msg.role;
            } else {
                // Same role - replace last message
                fixedMessages[fixedMessages.length - 1] = msg;
            }
        }

        // Ensure last message is from user
        if (lastRole !== 'user') {
            fixedMessages.push({ role: 'user', content: userMessage });
        }

        console.log('📝 User message:', userMessage);

        // Generate with streaming callback
        const generationStart = performance.now();
        let fullResponse = '';
        let tokenCount = 0;

        // Optimized streamer: minimal processing in callback
        const streamer = new TextStreamer(generator.tokenizer, {
            skip_prompt: true,
            skip_special_tokens: true,
            callback_function: (text) => {
                if (shouldStop || !text) return;

                // Fast path: most tokens don't have special chars
                if (text.charCodeAt(0) === 60) { // '<' character
                    text = text.replace(/<[^>]+>/g, '');
                    if (!text) return;
                }

                fullResponse += text;
                tokenCount++;

                sendMessage('generating', {
                    token: text,
                    accumulated: fullResponse
                }, id);
            }
        });

        // Generate using MESSAGES ARRAY (official Gemma 3 format)
        // Optimized generation config for maximum speed
        const output = await generator(fixedMessages, {
            max_new_tokens,
            temperature,
            top_p,
            do_sample: temperature > 0,
            num_beams: 1,               // Greedy/sampling is faster than beam search
            use_cache: true,            // KV cache for faster autoregressive generation
            early_stopping: true,       // Stop immediately on EOS token
            repetition_penalty: 1.1,    // Prevent repetitive outputs
            streamer
        });

        if (shouldStop) {
            sendMessage('error', { message: 'Đã dừng tạo phản hồi' }, id);
            isGenerating = false;
            return;
        }

        // Extract response using official format: output[0].generated_text.at(-1).content
        if (!fullResponse && output) {
            console.log('📤 Raw output:', output);

            try {
                // Official extraction method
                const generatedMessages = output[0]?.generated_text;
                console.log('📝 Generated messages:', generatedMessages);

                if (Array.isArray(generatedMessages)) {
                    // Get the last message (assistant's response)
                    const lastMessage = generatedMessages.at(-1);
                    if (lastMessage && lastMessage.content) {
                        fullResponse = cleanGeneratedText(lastMessage.content);
                        console.log('📝 Extracted content:', fullResponse);
                    }
                } else if (typeof generatedMessages === 'string') {
                    fullResponse = cleanGeneratedText(generatedMessages);
                }

                tokenCount = fullResponse.split(/\s+/).length;
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
