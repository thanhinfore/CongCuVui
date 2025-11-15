// app.js - Datalac Data Labeling System

// =====================================================
// Global Configuration
// =====================================================
const CONFIG = {
    browser: {
        maxTokens: 150,         // Increased for JSON output
        temperature: 0.1,       // Lower for consistency
        contentLength: 1000,    // More context
        timeout: 25000,         // 25 seconds
        modelName: 'onnx-community/gemma-3-270m-it-ONNX',
        maxAnswerLength: 500    // No truncation for JSON
    },
    lmstudio: {
        maxTokens: 300,         // Much higher for complex outputs
        temperature: 0.1,       // Lower for JSON accuracy
        contentLength: 1500,    // Full context
        timeout: 30000,         // 30 seconds
        defaultUrl: 'http://localhost:1234',
        maxAnswerLength: 1000   // Allow long JSON
    },
    mobile: {
        contentLength: 500,     // Increased for mobile too
        maxTokens: 100,
        batchSize: 1,
        maxAnswerLength: 300
    }
};

// =====================================================
// Prompt Templates - Smart & Optimized
// =====================================================
const PromptBuilder = {
    // Detect question type and build appropriate prompt
    analyzeQuestion(question) {
        const q = question.toLowerCase();

        // Check for JSON output requirement
        if (q.includes('json') || q.includes('extract') && (q.includes('brand') || q.includes('company') || q.includes('product'))) {
            return 'json_extraction';
        } else if (q.includes('sentiment') || q.includes('feeling') || q.includes('emotion')) {
            return 'sentiment';
        } else if (q.includes('topic') || q.includes('category') || q.includes('about')) {
            return 'topic';
        } else if (q.includes('priority') || q.includes('level') || q.includes('importance')) {
            return 'priority';
        } else if (q.startsWith('is') || q.startsWith('does') || q.startsWith('are') ||
            q.startsWith('can') || q.startsWith('will') || q.startsWith('should')) {
            return 'yesno';
        } else if (q.includes('type') || q.includes('kind')) {
            return 'classification';
        } else if (q.includes('summary') || q.includes('summarize')) {
            return 'summary';
        } else if (q.includes('list') || q.includes('extract')) {
            return 'extraction';
        }
        return 'general';
    },

    // Browser mode prompts - optimized for small models
    buildBrowserPrompt(question, content) {
        const type = this.analyzeQuestion(question);

        // If the original question already contains detailed instructions, use it directly
        if (question.includes('output as JSON') || question.includes('no other text')) {
            return question.replace('<...>', content);
        }

        switch (type) {
            case 'json_extraction':
                // For brand/company extraction
                return `List all brands, companies, or products in this text.
Text: "${content}"
Output as JSON: {"brandnames": ["name1", "name2"]}`;

            case 'sentiment':
                return `Analyze sentiment of: "${content}"
Output only: positive, negative, or neutral`;

            case 'topic':
                return `Main topic of: "${content}"
Answer in 1-3 words:`;

            case 'priority':
                return `Priority level for: "${content}"
Answer: high, medium, or low`;

            case 'yesno':
                return `"${content}"
${question}
Answer: yes or no`;

            case 'classification':
                return `Classify this text: "${content}"
${question}
Brief answer:`;

            case 'summary':
                return `"${content}"
Brief summary in 5 words:`;

            case 'extraction':
                return `Extract from text: "${content}"
${question}
List items:`;

            default:
                return `Text: "${content}"
${question}
Answer briefly:`;
        }
    },

    // LM Studio prompts - can be more sophisticated
    buildLMStudioMessages(question, content) {
        const type = this.analyzeQuestion(question);
        let systemPrompt, userPrompt;

        // If the original question contains specific format instructions, use it
        if (question.includes('output as JSON') || question.includes('no other text')) {
            systemPrompt = "You are a precise data extractor. Follow the exact output format requested. Output only valid JSON when requested, with no additional text or markdown.";
            userPrompt = question.replace('<...>', content);
            return [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt }
            ];
        }

        switch (type) {
            case 'json_extraction':
                systemPrompt = "You are a brand and company name extractor. Extract all brand names, company names, and product names from the text. Output ONLY valid JSON in the format {\"brandnames\": [\"name1\", \"name2\"]}, with no markdown, no backticks, no additional text.";
                userPrompt = `Extract all brand/company/product names from this text and output as JSON:

"${content}"

Remember: Output ONLY the JSON object, no other text.`;
                break;

            case 'sentiment':
                systemPrompt = "You are a sentiment analyzer. Classify text sentiment as positive, negative, or neutral. Be precise and consistent.";
                userPrompt = `Analyze the sentiment of this text and respond with only one word (positive/negative/neutral):

"${content}"`;
                break;

            case 'topic':
                systemPrompt = "You are a topic classifier. Identify the main topic or theme in 1-3 words maximum.";
                userPrompt = `What is the main topic of this text? Answer in 1-3 words:

"${content}"`;
                break;

            case 'priority':
                systemPrompt = "You are a priority classifier. Classify content as high, medium, or low priority based on urgency and importance.";
                userPrompt = `Classify the priority level of this content (high/medium/low):

"${content}"`;
                break;

            case 'yesno':
                systemPrompt = "You are a fact checker. Answer questions with only 'yes' or 'no' based on the provided text.";
                userPrompt = `Based on this text: "${content}"

${question}

Answer with only yes or no:`;
                break;

            case 'extraction':
                systemPrompt = "You are a data extractor. Extract the requested information clearly and concisely.";
                userPrompt = `From this text: "${content}"

${question}

Extract and list the requested items:`;
                break;

            case 'classification':
                systemPrompt = "You are a text classifier. Provide brief, accurate classifications in 1-5 words.";
                userPrompt = `${question}

Text to classify: "${content}"

Classification:`;
                break;

            default:
                systemPrompt = "You are a helpful assistant for data labeling. Provide brief, accurate answers based on the given text. If JSON output is requested, provide only valid JSON with no additional text.";
                userPrompt = `Based on the following text, ${question}

Text: "${content}"

Answer:`;
        }

        return [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
        ];
    }
};

// =====================================================
// Global State Management
// =====================================================
let transformersModule = null;
let pipeline = null;
let env = null;

window.AppState = {
    currentMode: 'browser',
    browserGenerator: null,
    browserTokenizer: null,
    lmStudioConnected: false,
    excelData: null,
    workbook: null,
    questions: [],
    isProcessing: false,
    pauseProcess: false,
    processedData: [],
    startTime: null,
    errors: [],
    resumeIndex: 0,
    debugMode: false
};

// =====================================================
// System Detection
// =====================================================
const SystemInfo = {
    cpuCores: navigator.hardwareConcurrency || 4,
    isMobile: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent),

    getOptimalConfig() {
        if (this.isMobile) {
            return CONFIG.mobile;
        }
        return window.AppState.currentMode === 'browser' ? CONFIG.browser : CONFIG.lmstudio;
    }
};

// =====================================================
// Transformers.js Integration
// =====================================================
async function initTransformers() {
    if (!transformersModule) {
        console.log('Initializing Transformers.js...');
        transformersModule = await import('https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.7.0');
        pipeline = transformersModule.pipeline;
        env = transformersModule.env;

        // Configure environment
        env.allowLocalModels = false;
        env.useBrowserCache = true;
        env.backends.onnx.wasm.wasmPaths = 'https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.7.0/dist/';
        env.backends.onnx.wasm.numThreads = SystemInfo.cpuCores;
    }
}

// =====================================================
// Mode Management
// =====================================================
window.switchMode = function (mode) {
    window.AppState.currentMode = mode;
    document.querySelectorAll('.mode-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.mode-content').forEach(content => content.classList.remove('active'));

    if (mode === 'browser') {
        document.querySelector('.mode-btn:first-child').classList.add('active');
        document.getElementById('browserMode').classList.add('active');
    } else {
        document.querySelector('.mode-btn:last-child').classList.add('active');
        document.getElementById('lmstudioMode').classList.add('active');
    }

    checkReadyState();
};

function checkReadyState() {
    const isBrowserReady = window.AppState.currentMode === 'browser' && window.AppState.browserGenerator;
    const isLMStudioReady = window.AppState.currentMode === 'lmstudio' && window.AppState.lmStudioConnected;

    if ((isBrowserReady || isLMStudioReady) && window.AppState.excelData) {
        document.getElementById('questionsCard').style.display = 'block';
    }
}

// =====================================================
// Model Loading
// =====================================================
window.loadBrowserModel = async function () {
    await initTransformers();

    const loadBtn = document.getElementById('loadModelBtn');
    const loadBtnText = document.getElementById('loadBtnText');
    const progressBar = document.getElementById('browserProgressBar');
    const progressFill = document.getElementById('browserProgressFill');
    const modelStatus = document.getElementById('browserModelStatus');
    const performance = document.getElementById('browserPerformance');

    if (SystemInfo.isMobile) {
        const proceed = confirm('⚠️ Mobile Device Detected!\n\nLoading AI model on mobile will:\n- Use ~300MB RAM\n- Process slowly\n- May freeze temporarily\n\nRecommend using LM Studio mode instead.\n\nContinue anyway?');
        if (!proceed) return;
    }

    try {
        loadBtn.disabled = true;
        progressBar.style.display = 'block';
        loadBtnText.innerHTML = '<span class="loading-spinner"></span> Loading Model...';
        modelStatus.textContent = 'Loading...';
        modelStatus.style.color = 'var(--warning)';

        const modelConfig = {
            device: 'wasm',
            dtype: SystemInfo.isMobile ? 'q8' : 'fp32',
            progress_callback: (progress) => {
                if (progress?.progress) {
                    const percent = Math.round(progress.progress);
                    progressFill.style.width = `${percent}%`;
                    progressFill.textContent = `${percent}%`;
                }
            }
        };

        window.AppState.browserGenerator = await pipeline(
            'text-generation',
            CONFIG.browser.modelName,
            modelConfig
        );

        window.AppState.browserTokenizer = window.AppState.browserGenerator.tokenizer;

        // Warm up
        console.log('Warming up model...');
        const warmupStart = Date.now();
        await window.AppState.browserGenerator('test', {
            max_new_tokens: 1,
            do_sample: false
        });
        const warmupTime = Date.now() - warmupStart;

        const tokensPerSec = Math.round(1000 / warmupTime);
        performance.textContent = `${tokensPerSec} tok/s`;
        modelStatus.textContent = 'Ready';
        modelStatus.style.color = 'var(--success)';
        loadBtnText.textContent = '✅ Model Loaded';
        progressBar.style.display = 'none';

        checkReadyState();
        console.log(`Model ready! Performance: ${tokensPerSec} tokens/sec`);

    } catch (error) {
        console.error('Model loading failed:', error);
        modelStatus.textContent = 'Failed';
        modelStatus.style.color = 'var(--danger)';
        loadBtnText.textContent = 'Retry Load';
        loadBtn.disabled = false;
        progressBar.style.display = 'none';
        alert(`Failed to load model: ${error.message}`);
    }
};

// =====================================================
// LM Studio Connection
// =====================================================
window.testLMStudioConnection = async function () {
    const apiUrl = document.getElementById('apiUrl').value;
    const connectionStatus = document.getElementById('lmConnectionStatus');
    const modelName = document.getElementById('lmModelName');
    const serverStatus = document.getElementById('lmServerStatus');

    try {
        connectionStatus.textContent = 'Connecting...';
        connectionStatus.style.color = 'var(--warning)';

        const response = await fetch(`${apiUrl}/v1/models`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        });

        if (response.ok) {
            const data = await response.json();
            const model = data.data?.[0]?.id || 'Unknown Model';

            connectionStatus.textContent = 'Connected';
            connectionStatus.style.color = 'var(--success)';
            modelName.textContent = model.split('/').pop();
            serverStatus.textContent = 'Online';
            serverStatus.style.color = 'var(--success)';
            window.AppState.lmStudioConnected = true;

            checkReadyState();
            console.log('LM Studio connected successfully');
        } else {
            throw new Error('Connection failed');
        }
    } catch (error) {
        connectionStatus.textContent = 'Failed';
        connectionStatus.style.color = 'var(--danger)';
        modelName.textContent = '--';
        serverStatus.textContent = 'Offline';
        serverStatus.style.color = 'var(--danger)';
        window.AppState.lmStudioConnected = false;
        alert(`Connection failed: ${error.message}`);
    }
};

// =====================================================
// File Handling
// =====================================================
function setupFileHandling() {
    const uploadArea = document.getElementById('uploadArea');

    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.classList.add('dragover');
    });

    uploadArea.addEventListener('dragleave', () => {
        uploadArea.classList.remove('dragover');
    });

    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('dragover');
        const file = e.dataTransfer.files[0];
        if (file && (file.name.endsWith('.xlsx') || file.name.endsWith('.xls'))) {
            handleFile(file);
        }
    });
}

window.handleFileUpload = function (event) {
    const file = event.target.files[0];
    if (file) handleFile(file);
};

function handleFile(file) {
    const reader = new FileReader();
    reader.onload = function (e) {
        try {
            const data = new Uint8Array(e.target.result);
            window.AppState.workbook = XLSX.read(data, { type: 'array' });

            const sheetName = window.AppState.workbook.SheetNames[0];
            const worksheet = window.AppState.workbook.Sheets[sheetName];
            window.AppState.excelData = XLSX.utils.sheet_to_json(worksheet);

            if (!window.AppState.excelData.some(row => row['Publish Content'])) {
                alert('Error: Excel file must contain "Publish Content" column!');
                clearFile();
                return;
            }

            document.getElementById('fileName').textContent = file.name;
            document.getElementById('fileInfo').style.display = 'block';
            document.getElementById('totalRows').textContent = window.AppState.excelData.length;

            displayPreview();
            checkReadyState();
            document.getElementById('previewCard').style.display = 'block';
            document.getElementById('processCard').style.display = 'block';

        } catch (error) {
            console.error('File reading error:', error);
            alert('Error reading Excel file!');
        }
    };
    reader.readAsArrayBuffer(file);
}

window.clearFile = function () {
    document.getElementById('fileInput').value = '';
    document.getElementById('fileInfo').style.display = 'none';
    document.getElementById('previewCard').style.display = 'none';
    document.getElementById('processCard').style.display = 'none';
    document.getElementById('resultsCard').style.display = 'none';

    window.AppState.excelData = null;
    window.AppState.workbook = null;
    window.AppState.processedData = [];
    window.AppState.resumeIndex = 0;
    window.AppState.pauseProcess = false;
    window.AppState.isProcessing = false;
};

// =====================================================
// Question Management
// =====================================================
window.addQuestion = function () {
    const container = document.getElementById('questionsContainer');
    const div = document.createElement('div');
    div.className = 'question-item';
    div.innerHTML = `
        <input type="text" class="question-input" placeholder="Enter your labeling question...">
        <button class="btn-remove" onclick="removeQuestion(this)">×</button>
    `;
    container.appendChild(div);
};

window.removeQuestion = function (btn) {
    if (document.querySelectorAll('.question-item').length > 1) {
        btn.parentElement.remove();
    }
};

window.useSampleQuestion = function (li) {
    const inputs = document.querySelectorAll('.question-input');
    const lastInput = inputs[inputs.length - 1];
    if (lastInput.value === '') {
        lastInput.value = li.textContent;
    } else {
        addQuestion();
        const newInputs = document.querySelectorAll('.question-input');
        newInputs[newInputs.length - 1].value = li.textContent;
    }
};

// =====================================================
// Data Preview
// =====================================================
function displayPreview() {
    const header = document.getElementById('previewHeader');
    const body = document.getElementById('previewBody');

    header.innerHTML = '';
    body.innerHTML = '';

    if (!window.AppState.excelData || window.AppState.excelData.length === 0) return;

    const columns = Object.keys(window.AppState.excelData[0]);
    const headerRow = document.createElement('tr');
    columns.forEach(col => {
        const th = document.createElement('th');
        th.textContent = col;
        headerRow.appendChild(th);
    });
    header.appendChild(headerRow);

    const previewRows = Math.min(5, window.AppState.excelData.length);
    for (let i = 0; i < previewRows; i++) {
        const tr = document.createElement('tr');
        columns.forEach(col => {
            const td = document.createElement('td');
            const value = window.AppState.excelData[i][col] || '';
            td.textContent = value.toString().substring(0, 100);
            td.title = value.toString();
            tr.appendChild(td);
        });
        body.appendChild(tr);
    }
}

// =====================================================
// Core Processing Function with Smart Prompts
// =====================================================
async function processRow(row, questions) {
    const content = row['Publish Content'] || '';
    if (!content) {
        console.log('Row has no content, skipping');
        return { ...row };
    }

    const rowResult = { ...row };
    if (window.AppState.pauseProcess) return rowResult;

    // Get optimal config based on device and mode
    const config = SystemInfo.getOptimalConfig();
    const truncatedContent = content.substring(0, config.contentLength).replace(/[\n\r]+/g, ' ').trim();

    console.log(`🔄 Processing ${questions.length} questions...`);

    for (let qIndex = 0; qIndex < questions.length; qIndex++) {
        const question = questions[qIndex];

        if (window.AppState.pauseProcess) break;

        let answer = 'Unknown';

        if (window.AppState.currentMode === 'browser' && window.AppState.browserGenerator) {
            // Use smart prompt builder for browser mode
            const prompt = PromptBuilder.buildBrowserPrompt(question, truncatedContent);

            if (window.AppState.debugMode) {
                console.log(`📝 Browser Prompt:\n${prompt}`);
            }

            try {
                const result = await Promise.race([
                    window.AppState.browserGenerator(prompt, {
                        max_new_tokens: config.maxTokens,
                        temperature: config.temperature,
                        do_sample: config.temperature > 0,
                        top_k: 10,
                        repetition_penalty: 1.1,
                        pad_token_id: window.AppState.browserTokenizer?.pad_token_id || 0,
                        eos_token_id: window.AppState.browserTokenizer?.eos_token_id || 1,
                        return_full_text: false
                    }),
                    new Promise((_, reject) =>
                        setTimeout(() => reject(new Error('Timeout')), config.timeout)
                    )
                ]);

                if (result?.[0]?.generated_text) {
                    answer = result[0].generated_text.trim();

                    // Clean up JSON if needed, but don't truncate
                    if (question.toLowerCase().includes('json')) {
                        // Remove markdown code blocks if present
                        answer = answer.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();

                        // Try to fix incomplete JSON
                        if (answer.includes('{') && !answer.includes('}')) {
                            answer += '}';
                        }
                        if (answer.includes('[') && !answer.includes(']')) {
                            answer += ']}';
                        }

                        // Validate JSON
                        try {
                            JSON.parse(answer);
                        } catch {
                            // If JSON is invalid, try to extract valid part
                            const match = answer.match(/\{[^}]*\}/);
                            if (match) answer = match[0];
                        }
                    } else {
                        // For non-JSON, apply reasonable limit
                        if (answer.length > config.maxAnswerLength) {
                            answer = answer.substring(0, config.maxAnswerLength).trim();
                        }
                    }

                    answer = answer || 'Unknown';

                    if (window.AppState.debugMode) {
                        console.log(`✅ Answer: ${answer}`);
                    }
                }
            } catch (error) {
                console.error(`Error: ${error.message}`);
                answer = 'Error';
            }

        } else if (window.AppState.currentMode === 'lmstudio') {
            // Use smart prompt builder for LM Studio
            const messages = PromptBuilder.buildLMStudioMessages(question, truncatedContent);
            const apiUrl = document.getElementById('apiUrl').value;
            const temperature = parseFloat(document.getElementById('temperature').value) || config.temperature;

            if (window.AppState.debugMode) {
                console.log(`📝 LM Studio Messages:`, messages);
            }

            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), config.timeout);

                const response = await fetch(`${apiUrl}/v1/chat/completions`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    signal: controller.signal,
                    body: JSON.stringify({
                        messages: messages,
                        temperature: temperature,
                        max_tokens: config.maxTokens,
                        stream: false
                    })
                });

                clearTimeout(timeoutId);

                if (response.ok) {
                    const data = await response.json();
                    answer = data.choices[0].message.content.trim();

                    // Clean up JSON if needed
                    if (question.toLowerCase().includes('json')) {
                        // Remove markdown code blocks
                        answer = answer.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();

                        // Try to fix incomplete JSON
                        if (answer.includes('{') && !answer.includes('}')) {
                            answer += '}';
                        }
                        if (answer.includes('[') && !answer.includes(']')) {
                            answer += ']}';
                        }

                        // Validate JSON
                        try {
                            JSON.parse(answer);
                        } catch {
                            // Try to extract valid JSON part
                            const match = answer.match(/\{[^}]*\}/);
                            if (match) answer = match[0];
                        }
                    } else {
                        // For non-JSON, apply reasonable limit
                        if (answer.length > config.maxAnswerLength) {
                            answer = answer.substring(0, config.maxAnswerLength).trim();
                        }
                    }

                    answer = answer || 'Unknown';

                    if (window.AppState.debugMode) {
                        console.log(`✅ Answer: ${answer}`);
                    }
                }
            } catch (error) {
                answer = error.name === 'AbortError' ? 'Timeout' : 'Error';
            }
        }

        const colName = `Label_${question.substring(0, 30).replace(/[^a-zA-Z0-9]/g, '_')}`;
        rowResult[colName] = answer;
    }

    return rowResult;
}

// =====================================================
// Main Processing Control
// =====================================================
window.processData = async function () {
    const isBrowserReady = window.AppState.currentMode === 'browser' && window.AppState.browserGenerator;
    const isLMStudioReady = window.AppState.currentMode === 'lmstudio' && window.AppState.lmStudioConnected;

    if (!isBrowserReady && !isLMStudioReady) {
        alert(`Please ${window.AppState.currentMode === 'browser' ? 'load the model' : 'connect to LM Studio'} first!`);
        return;
    }

    if (!window.AppState.excelData) {
        alert('Please upload an Excel file!');
        return;
    }

    const questionInputs = document.querySelectorAll('.question-input');
    window.AppState.questions = Array.from(questionInputs)
        .map(input => input.value.trim())
        .filter(q => q.length > 0);

    if (window.AppState.questions.length === 0) {
        alert('Please add at least one labeling question!');
        return;
    }

    // Check if resuming
    const isResuming = document.getElementById('processBtn').textContent === 'Resume';
    if (!isResuming) {
        window.AppState.processedData = [];
        window.AppState.resumeIndex = 0;
        window.AppState.errors = [];
    }

    window.AppState.isProcessing = true;
    window.AppState.pauseProcess = false;
    window.AppState.startTime = Date.now();

    document.getElementById('processBtn').style.display = 'none';
    document.getElementById('pauseBtn').style.display = 'block';
    document.getElementById('pauseBtn').disabled = false;
    document.getElementById('pauseBtn').textContent = 'Pause';
    document.getElementById('progressInfo').style.display = 'block';
    document.getElementById('totalRowsProcess').textContent = window.AppState.excelData.length;

    if (window.AppState.currentMode === 'browser') {
        await processBrowserMode();
    } else {
        await processLMStudioMode();
    }
};

// =====================================================
// Processing Modes
// =====================================================
async function processBrowserMode() {
    let currentIndex = window.AppState.resumeIndex || 0;
    const totalRows = window.AppState.excelData.length;

    console.log(`📊 Starting browser processing from row ${currentIndex + 1}/${totalRows}`);

    const debugInfo = document.getElementById('debugInfo');
    const debugStatus = document.getElementById('debugStatus');
    if (debugInfo && window.AppState.debugMode) {
        debugInfo.style.display = 'block';
    }

    while (currentIndex < totalRows && !window.AppState.pauseProcess && window.AppState.isProcessing) {
        const row = window.AppState.excelData[currentIndex];

        if (debugStatus) {
            debugStatus.textContent = `Processing row ${currentIndex + 1}/${totalRows}`;
        }

        try {
            const result = await Promise.race([
                processRow(row, window.AppState.questions),
                new Promise((_, reject) =>
                    setTimeout(() => reject(new Error('Row timeout')), 30000)
                )
            ]);

            window.AppState.processedData.push(result);
            console.log(`✅ Row ${currentIndex + 1} completed`);

        } catch (error) {
            console.error(`❌ Error at row ${currentIndex + 1}:`, error);
            window.AppState.processedData.push({
                ...row,
                Error: error.message || 'Processing failed'
            });
            window.AppState.errors.push({ row: currentIndex + 1, error: error.message });
        }

        currentIndex++;
        updateProgress(window.AppState.processedData.length);

        // Yield control to browser
        await new Promise(resolve => setTimeout(resolve, 10));
    }

    if (debugInfo) debugInfo.style.display = 'none';

    if (window.AppState.pauseProcess && window.AppState.isProcessing) {
        handlePause(currentIndex, totalRows);
    } else if (currentIndex >= totalRows) {
        finishProcessing();
    }
}

async function processLMStudioMode() {
    const batchSize = parseInt(document.getElementById('batchSize')?.value) || 5;
    let startIndex = window.AppState.resumeIndex || 0;

    for (let i = startIndex; i < window.AppState.excelData.length; i += batchSize) {
        if (window.AppState.pauseProcess) {
            handlePause(i, window.AppState.excelData.length);
            return;
        }

        const batch = window.AppState.excelData.slice(i, Math.min(i + batchSize, window.AppState.excelData.length));
        const promises = batch.map(row => processRow(row, window.AppState.questions));
        const results = await Promise.allSettled(promises);

        results.forEach((result, index) => {
            if (result.status === 'fulfilled') {
                window.AppState.processedData.push(result.value);
            } else {
                window.AppState.processedData.push({ ...batch[index], Error: 'Processing failed' });
            }
        });

        updateProgress(window.AppState.processedData.length);
        await new Promise(resolve => setTimeout(resolve, 50));
    }

    finishProcessing();
}

// =====================================================
// Progress Management
// =====================================================
function updateProgress(current) {
    const total = window.AppState.excelData.length;
    const percent = Math.round((current / total) * 100);

    document.getElementById('processFill').style.width = `${percent}%`;
    document.getElementById('processFill').textContent = `${percent}%`;
    document.getElementById('currentRow').textContent = current;

    const elapsed = (Date.now() - window.AppState.startTime) / 1000;
    document.getElementById('processTime').textContent = formatTime(elapsed);

    const actualProcessed = current - (window.AppState.resumeIndex || 0);
    const speed = actualProcessed / elapsed;
    document.getElementById('processSpeed').textContent = speed > 0 ? `${speed.toFixed(1)} rows/s` : '--';

    const remaining = total - current;
    const eta = speed > 0 ? remaining / speed : 0;
    document.getElementById('eta').textContent = eta > 0 ? formatTime(eta) : '--';
}

function formatTime(seconds) {
    if (seconds < 60) return `${Math.round(seconds)}s`;
    const minutes = Math.floor(seconds / 60);
    const secs = Math.round(seconds % 60);
    return `${minutes}m ${secs}s`;
}

function handlePause(currentIndex, totalRows) {
    window.AppState.isProcessing = false;
    window.AppState.resumeIndex = currentIndex;
    document.getElementById('processBtn').textContent = 'Resume';
    document.getElementById('processBtn').style.display = 'block';
    document.getElementById('pauseBtn').style.display = 'none';
    console.log(`⏸️ Paused at row ${currentIndex}/${totalRows}`);
}

function finishProcessing() {
    window.AppState.isProcessing = false;
    window.AppState.pauseProcess = false;
    window.AppState.resumeIndex = 0;

    const elapsed = (Date.now() - window.AppState.startTime) / 1000;
    const speed = window.AppState.processedData.length / elapsed;

    document.getElementById('processBtn').textContent = 'Start Labeling';
    document.getElementById('processBtn').style.display = 'block';
    document.getElementById('pauseBtn').style.display = 'none';

    document.getElementById('resultsCard').style.display = 'block';
    document.getElementById('rowsProcessed').textContent = window.AppState.processedData.length;
    document.getElementById('labelsAdded').textContent = window.AppState.processedData.length * window.AppState.questions.length;
    document.getElementById('totalTime').textContent = formatTime(elapsed);
    document.getElementById('avgSpeed').textContent = `${speed.toFixed(1)}/s`;

    if (window.AppState.errors.length > 0) {
        console.log(`⚠️ Completed with ${window.AppState.errors.length} errors`, window.AppState.errors);
    }

    console.log(`✅ Processing complete! Speed: ${speed.toFixed(1)} rows/s`);
}

// =====================================================
// Results Export
// =====================================================
window.downloadResults = function () {
    if (!window.AppState.processedData || window.AppState.processedData.length === 0) {
        alert('No results to download!');
        return;
    }

    const ws = XLSX.utils.json_to_sheet(window.AppState.processedData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Labeled Data');

    const date = new Date().toISOString().slice(0, 10);
    const time = new Date().toTimeString().slice(0, 5).replace(':', '-');
    XLSX.writeFile(wb, `labeled_data_${date}_${time}.xlsx`);
};

window.previewResults = function () {
    const modal = document.getElementById('resultsModal');
    const header = document.getElementById('resultsHeader');
    const body = document.getElementById('resultsBody');

    header.innerHTML = '';
    body.innerHTML = '';

    if (!window.AppState.processedData || window.AppState.processedData.length === 0) return;

    const columns = Object.keys(window.AppState.processedData[0]);
    const headerRow = document.createElement('tr');
    columns.forEach(col => {
        const th = document.createElement('th');
        th.textContent = col;
        headerRow.appendChild(th);
    });
    header.appendChild(headerRow);

    const previewRows = Math.min(20, window.AppState.processedData.length);
    for (let i = 0; i < previewRows; i++) {
        const tr = document.createElement('tr');
        columns.forEach(col => {
            const td = document.createElement('td');
            const value = window.AppState.processedData[i][col] || '';
            td.textContent = value.toString().substring(0, 100);
            td.title = value.toString();
            if (col.startsWith('Label_')) {
                td.style.background = 'rgba(102, 126, 234, 0.1)';
                td.style.fontWeight = '600';
            }
            tr.appendChild(td);
        });
        body.appendChild(tr);
    }

    modal.style.display = 'flex';
};

window.closeResultsModal = function () {
    document.getElementById('resultsModal').style.display = 'none';
};

// =====================================================
// Debug Mode Toggle
// =====================================================
window.toggleDebugMode = function () {
    window.AppState.debugMode = !window.AppState.debugMode;
    console.log(`🐛 Debug mode: ${window.AppState.debugMode ? 'ON' : 'OFF'}`);
};

// =====================================================
// Pause Handler
// =====================================================
window.pauseProcessing = function () {
    window.AppState.pauseProcess = true;
    const pauseBtn = document.getElementById('pauseBtn');
    pauseBtn.disabled = true;
    pauseBtn.textContent = 'Pausing...';
    console.log('⏸️ Pause requested');
};

// =====================================================
// Initialize on DOM Ready
// =====================================================
document.addEventListener('DOMContentLoaded', function () {
    // Update device info
    document.getElementById('browserDevice').textContent = SystemInfo.isMobile ?
        `Mobile (${SystemInfo.cpuCores} cores)` : `CPU (${SystemInfo.cpuCores} cores)`;

    // Setup file handling
    setupFileHandling();

    console.log('🚀 Datalac Data Labeling System initialized');
    console.log(`📱 Device: ${SystemInfo.isMobile ? 'Mobile' : 'Desktop'}, Cores: ${SystemInfo.cpuCores}`);
});