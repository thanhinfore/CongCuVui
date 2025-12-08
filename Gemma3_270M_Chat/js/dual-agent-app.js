/**
 * Dual Agent Chat Arena
 * Main application for two AI agents chatting with each other
 */

// Configuration
const MODEL_ID = 'onnx-community/gemma-3-270m-it-ONNX';
const DEFAULT_API_URL = 'http://192.168.11.32:1234';

// State
let worker = null;
let isModelReady = false;
let isApiReady = false;
let modelSource = 'local'; // 'local' or 'lmstudio'
let isConversationRunning = false;
let shouldStopConversation = false;
let currentTurn = 0;
let currentSpeaker = 'A'; // 'A' or 'B'

// Conversation history for each agent
let agentAHistory = [];
let agentBHistory = [];
let currentTopic = ''; // Store the discussion topic

// DOM Elements
const elements = {
    // Status
    modelStatus: null,
    statusText: null,
    progressFill: null,
    progressText: null,
    loadingProgress: null,

    // Controls
    startBtn: null,
    stopBtn: null,
    clearBtn: null,
    discussionTopic: null,
    maxTurns: null,
    turnDelay: null,
    currentTurnDisplay: null,
    totalTurnsDisplay: null,

    // Agent A
    agentAName: null,
    agentAPrompt: null,
    agentAMessages: null,
    agentAStatus: null,

    // Agent B
    agentBName: null,
    agentBPrompt: null,
    agentBMessages: null,
    agentBStatus: null,

    // Direction arrow
    conversationDirection: null,

    // Model Source
    modelSourceRadios: null,
    apiConfig: null,
    apiUrl: null,
    testApiBtn: null,
    apiStatus: null,

    // Settings
    settingsBtn: null,
    settingsPanel: null,
    closeSettingsBtn: null,
    overlay: null,
    temperature: null,
    temperatureValue: null,
    topP: null,
    topPValue: null,
    maxTokens: null,
    maxTokensValue: null,
    deviceInfo: null,
    modelStatusInfo: null,
    darkModeToggle: null
};

/**
 * Initialize the application
 */
function init() {
    // Get DOM elements
    initElements();

    // Setup event listeners
    setupEventListeners();

    // Initialize Web Worker
    initWorker();

    // Load dark mode preference
    loadDarkMode();

    console.log('Dual Agent Chat Arena initialized');
}

/**
 * Initialize DOM element references
 */
function initElements() {
    elements.modelStatus = document.getElementById('modelStatus');
    elements.statusText = document.getElementById('statusText');
    elements.progressFill = document.getElementById('progressFill');
    elements.progressText = document.getElementById('progressText');
    elements.loadingProgress = document.getElementById('loadingProgress');

    elements.startBtn = document.getElementById('startConversationBtn');
    elements.stopBtn = document.getElementById('stopConversationBtn');
    elements.clearBtn = document.getElementById('clearConversationBtn');
    elements.discussionTopic = document.getElementById('discussionTopic');
    elements.maxTurns = document.getElementById('maxTurns');
    elements.turnDelay = document.getElementById('turnDelay');
    elements.currentTurnDisplay = document.getElementById('currentTurn');
    elements.totalTurnsDisplay = document.getElementById('totalTurns');

    elements.agentAName = document.getElementById('agentAName');
    elements.agentAPrompt = document.getElementById('agentAPrompt');
    elements.agentAMessages = document.getElementById('agentAChatMessages');
    elements.agentAStatus = document.getElementById('agentAStatus');

    elements.agentBName = document.getElementById('agentBName');
    elements.agentBPrompt = document.getElementById('agentBPrompt');
    elements.agentBMessages = document.getElementById('agentBChatMessages');
    elements.agentBStatus = document.getElementById('agentBStatus');

    elements.conversationDirection = document.getElementById('conversationDirection');

    // Model source elements
    elements.modelSourceRadios = document.querySelectorAll('input[name="modelSource"]');
    elements.apiConfig = document.getElementById('apiConfig');
    elements.apiUrl = document.getElementById('apiUrl');
    elements.testApiBtn = document.getElementById('testApiBtn');
    elements.apiStatus = document.getElementById('apiStatus');

    elements.settingsBtn = document.getElementById('settingsBtn');
    elements.settingsPanel = document.getElementById('settingsPanel');
    elements.closeSettingsBtn = document.getElementById('closeSettingsBtn');
    elements.overlay = document.getElementById('overlay');
    elements.temperature = document.getElementById('temperature');
    elements.temperatureValue = document.getElementById('temperatureValue');
    elements.topP = document.getElementById('topP');
    elements.topPValue = document.getElementById('topPValue');
    elements.maxTokens = document.getElementById('maxTokens');
    elements.maxTokensValue = document.getElementById('maxTokensValue');
    elements.deviceInfo = document.getElementById('deviceInfo');
    elements.modelStatusInfo = document.getElementById('modelStatusInfo');
    elements.darkModeToggle = document.getElementById('darkModeToggle');
}

/**
 * Setup event listeners
 */
function setupEventListeners() {
    // Control buttons
    elements.startBtn.addEventListener('click', startConversation);
    elements.stopBtn.addEventListener('click', stopConversation);
    elements.clearBtn.addEventListener('click', clearConversation);

    // Max turns update
    elements.maxTurns.addEventListener('change', () => {
        elements.totalTurnsDisplay.textContent = elements.maxTurns.value;
    });

    // Model source selection
    elements.modelSourceRadios.forEach(radio => {
        radio.addEventListener('change', handleModelSourceChange);
    });

    // Test API button
    elements.testApiBtn.addEventListener('click', testApiConnection);

    // Settings panel
    elements.settingsBtn.addEventListener('click', () => {
        elements.settingsPanel.classList.add('active');
        elements.overlay.classList.add('active');
    });

    elements.closeSettingsBtn.addEventListener('click', closeSettings);
    elements.overlay.addEventListener('click', closeSettings);

    // Settings sliders
    elements.temperature.addEventListener('input', (e) => {
        elements.temperatureValue.textContent = e.target.value;
    });

    elements.topP.addEventListener('input', (e) => {
        elements.topPValue.textContent = e.target.value;
    });

    elements.maxTokens.addEventListener('input', (e) => {
        elements.maxTokensValue.textContent = e.target.value;
    });

    // Dark mode toggle
    elements.darkModeToggle.addEventListener('click', toggleDarkMode);
}

/**
 * Close settings panel
 */
function closeSettings() {
    elements.settingsPanel.classList.remove('active');
    elements.overlay.classList.remove('active');
}

/**
 * Toggle dark mode
 */
function toggleDarkMode() {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    document.documentElement.setAttribute('data-theme', isDark ? 'light' : 'dark');
    localStorage.setItem('darkMode', !isDark);
}

/**
 * Load dark mode preference
 */
function loadDarkMode() {
    const isDark = localStorage.getItem('darkMode') === 'true';
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
}

/**
 * Handle model source change
 */
function handleModelSourceChange(e) {
    modelSource = e.target.value;

    if (modelSource === 'lmstudio') {
        elements.apiConfig.style.display = 'flex';
        // Test API connection automatically
        testApiConnection();
    } else {
        elements.apiConfig.style.display = 'none';
        // Re-enable start button if local model is ready
        updateStartButtonState();
    }

    console.log('Model source changed to:', modelSource);
}

/**
 * Update start button state based on model readiness
 */
function updateStartButtonState() {
    if (modelSource === 'local') {
        elements.startBtn.disabled = !isModelReady;
    } else {
        elements.startBtn.disabled = !isApiReady;
    }
}

/**
 * Test API connection to LM Studio
 */
async function testApiConnection() {
    const apiUrl = elements.apiUrl.value.trim();

    elements.apiStatus.textContent = 'Đang kiểm tra...';
    elements.apiStatus.className = 'api-status loading';

    try {
        const response = await fetch(`${apiUrl}/v1/models`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            const data = await response.json();
            const modelCount = data.data?.length || 0;
            elements.apiStatus.textContent = `OK (${modelCount} model)`;
            elements.apiStatus.className = 'api-status success';
            isApiReady = true;
            updateStartButtonState();
            updateStatus('ready', `LM Studio sẵn sàng (${modelCount} model)`);
        } else {
            throw new Error(`HTTP ${response.status}`);
        }
    } catch (error) {
        console.error('API test failed:', error);
        elements.apiStatus.textContent = 'Lỗi kết nối';
        elements.apiStatus.className = 'api-status error';
        isApiReady = false;
        updateStartButtonState();
    }
}

/**
 * Call LM Studio API for chat completion
 */
async function callLMStudioAPI(messages, settings) {
    const apiUrl = elements.apiUrl.value.trim();

    const response = await fetch(`${apiUrl}/v1/chat/completions`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            messages: messages,
            temperature: settings.temperature,
            top_p: settings.top_p,
            max_tokens: settings.max_new_tokens,
            stream: false
        })
    });

    if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || '';
}

/**
 * Initialize Web Worker for model inference
 */
function initWorker() {
    worker = new Worker('./js/workers/inference-worker.js', { type: 'module' });

    worker.onmessage = handleWorkerMessage;
    worker.onerror = (error) => {
        console.error('Worker error:', error);
        updateStatus('error', 'Lỗi Web Worker');
    };

    // Start loading model
    worker.postMessage({ type: 'initialize', modelId: MODEL_ID });
}

/**
 * Handle messages from Web Worker
 */
function handleWorkerMessage(e) {
    const { type, data, id } = e.data;

    switch (type) {
        case 'loading':
            updateStatus('loading', data.message);
            if (data.progress !== undefined) {
                updateProgress(data.progress);
            }
            break;

        case 'deviceInfo':
            if (elements.deviceInfo) {
                elements.deviceInfo.textContent = data.device;
            }
            break;

        case 'ready':
            isModelReady = true;
            updateStatus('ready', data.message);
            updateStartButtonState();
            if (elements.modelStatusInfo) {
                elements.modelStatusInfo.textContent = 'Sẵn sàng';
            }
            break;

        case 'generating':
            handleGenerating(id, data);
            break;

        case 'complete':
            handleComplete(id, data);
            break;

        case 'error':
            console.error('Worker error:', data.message);
            handleError(id, data.message);
            break;
    }
}

/**
 * Update status display
 */
function updateStatus(status, message) {
    elements.statusText.textContent = message;

    if (status === 'loading') {
        elements.modelStatus.className = 'model-status loading';
        elements.loadingProgress.style.display = 'flex';
    } else if (status === 'ready') {
        elements.modelStatus.className = 'model-status ready';
        elements.loadingProgress.style.display = 'none';
    } else if (status === 'error') {
        elements.modelStatus.className = 'model-status error';
    }
}

/**
 * Update progress bar
 */
function updateProgress(progress) {
    elements.progressFill.style.width = `${progress}%`;
    elements.progressText.textContent = `${Math.round(progress)}%`;
}

/**
 * Start the conversation between agents
 */
async function startConversation() {
    if (!isModelReady || isConversationRunning) return;

    isConversationRunning = true;
    shouldStopConversation = false;
    currentTurn = 0;
    currentSpeaker = 'A';

    // Update UI
    elements.startBtn.style.display = 'none';
    elements.stopBtn.style.display = 'flex';

    // Clear previous messages if starting fresh
    if (agentAHistory.length === 0 && agentBHistory.length === 0) {
        clearChatUI();
    }

    // Get discussion topic and store it
    currentTopic = elements.discussionTopic.value.trim() || 'Hãy bắt đầu cuộc tranh luận!';
    const maxTurns = parseInt(elements.maxTurns.value) || 100;

    // Add topic to both chat panels
    addMessageToChat('A', currentTopic, 'incoming', 'Chủ đề');
    addMessageToChat('B', currentTopic, 'incoming', 'Chủ đề');

    // Agent A responds first to the topic
    await runConversationLoop(currentTopic, maxTurns);
}

/**
 * Run the conversation loop
 */
async function runConversationLoop(initialMessage, maxTurns) {
    let lastMessage = initialMessage;

    while (currentTurn < maxTurns && !shouldStopConversation) {
        currentTurn++;
        elements.currentTurnDisplay.textContent = currentTurn;

        // Determine which agent speaks
        const speaker = currentSpeaker;
        const listener = speaker === 'A' ? 'B' : 'A';

        // Update direction arrow
        updateDirectionArrow(speaker);

        // Update agent status
        setAgentStatus(speaker, 'thinking');
        setAgentStatus(listener, 'waiting');

        try {
            // Generate response from current speaker
            const response = await generateResponse(speaker, lastMessage);

            if (shouldStopConversation) break;

            // Add response to speaker's chat as outgoing
            const speakerName = speaker === 'A' ? elements.agentAName.value : elements.agentBName.value;
            addMessageToChat(speaker, response, 'outgoing', speakerName);

            // Add response to listener's chat as incoming
            addMessageToChat(listener, response, 'incoming', speakerName);

            // Update history
            if (speaker === 'A') {
                agentAHistory.push({ role: 'assistant', content: response });
                agentBHistory.push({ role: 'user', content: response });
            } else {
                agentBHistory.push({ role: 'assistant', content: response });
                agentAHistory.push({ role: 'user', content: response });
            }

            lastMessage = response;

            // Switch speaker
            currentSpeaker = listener;

            // Delay between turns
            const delay = parseInt(elements.turnDelay.value) || 500;
            await sleep(delay);

        } catch (error) {
            console.error('Error in conversation:', error);
            break;
        }

        // Reset status
        setAgentStatus(speaker, 'waiting');
    }

    // Conversation ended
    endConversation();
}

/**
 * Generate response from an agent
 */
function generateResponse(agent, inputMessage) {
    // Get agent's system prompt
    const systemPrompt = agent === 'A'
        ? elements.agentAPrompt.value
        : elements.agentBPrompt.value;

    // Get conversation history for this agent
    const history = agent === 'A' ? agentAHistory : agentBHistory;

    // Get settings
    const settings = {
        temperature: parseFloat(elements.temperature.value),
        top_p: parseFloat(elements.topP.value),
        max_new_tokens: parseInt(elements.maxTokens.value)
    };

    // Update status to speaking
    setAgentStatus(agent, 'speaking');

    // Use LM Studio API or local model
    if (modelSource === 'lmstudio') {
        return generateWithLMStudio(agent, systemPrompt, history, inputMessage, settings);
    } else {
        return generateWithLocalModel(agent, systemPrompt, history, inputMessage, settings);
    }
}

/**
 * Generate response using LM Studio API
 */
async function generateWithLMStudio(agent, systemPrompt, history, inputMessage, settings) {
    // Build debate context
    const debateContext = agent === 'A'
        ? `[TRANH LUẬN] Chủ đề: "${currentTopic}"\nBạn phải ỦNG HỘ quan điểm này. KHÔNG ĐƯỢC đồng ý với đối phương. Phải PHẢN BÁC và chỉ ra họ SAI.`
        : `[TRANH LUẬN] Chủ đề: "${currentTopic}"\nBạn phải PHẢN ĐỐI quan điểm này. KHÔNG ĐƯỢC đồng ý với đối phương. Phải PHẢN BÁC và chỉ ra họ SAI.`;

    // Build messages array for chat completion API
    const messages = [
        {
            role: 'system',
            content: `${debateContext}\n${systemPrompt}`
        }
    ];

    // Add conversation history
    const recentHistory = history.slice(-6);
    for (const msg of recentHistory) {
        messages.push({
            role: msg.role === 'assistant' ? 'assistant' : 'user',
            content: msg.content
        });
    }

    // Add current message
    messages.push({
        role: 'user',
        content: inputMessage
    });

    try {
        // Show typing indicator
        updateTypingIndicator(agent, '');

        const response = await callLMStudioAPI(messages, settings);

        // Remove typing indicator
        removeTypingIndicator(agent);

        return response;
    } catch (error) {
        removeTypingIndicator(agent);
        throw error;
    }
}

/**
 * Generate response using local model (Web Worker)
 */
function generateWithLocalModel(agent, systemPrompt, history, inputMessage, settings) {
    return new Promise((resolve, reject) => {
        const messageId = `${agent}-${Date.now()}`;

        // Build prompt with agent context for debate
        const prompt = buildPrompt(systemPrompt, history, inputMessage, agent);

        // Store resolve/reject for this message
        window[`resolve_${messageId}`] = resolve;
        window[`reject_${messageId}`] = reject;
        window[`accumulated_${messageId}`] = '';
        window[`agent_${messageId}`] = agent;

        // Send to worker
        worker.postMessage({
            type: 'generate',
            id: messageId,
            prompt: prompt,
            options: settings
        });
    });
}

/**
 * Build prompt for the model with debate context
 */
function buildPrompt(systemPrompt, history, currentMessage, agent) {
    // Strong anti-agreement prefix
    const debateContext = agent === 'A'
        ? `[TRANH LUẬN] Chủ đề: "${currentTopic}"\nBạn phải ỦNG HỘ quan điểm này. KHÔNG ĐƯỢC đồng ý với đối phương. Phải PHẢN BÁC và chỉ ra họ SAI.`
        : `[TRANH LUẬN] Chủ đề: "${currentTopic}"\nBạn phải PHẢN ĐỐI quan điểm này. KHÔNG ĐƯỢC đồng ý với đối phương. Phải PHẢN BÁC và chỉ ra họ SAI.`;

    let prompt = `### Hướng dẫn:\n${debateContext}\n${systemPrompt}\n\n`;

    // Add conversation history (last 4 messages for context)
    const recentHistory = history.slice(-4);
    for (const msg of recentHistory) {
        if (msg.role === 'user') {
            prompt += `### Đối phương nói:\n${msg.content}\n\n`;
        } else {
            prompt += `### Bạn đã nói:\n${msg.content}\n\n`;
        }
    }

    // Add current message with debate instruction
    prompt += `### Đối phương nói:\n${currentMessage}\n\n### Bạn phản bác (KHÔNG đồng ý, chỉ ra điểm sai):\n`;

    return prompt;
}

/**
 * Handle generating response (streaming)
 */
function handleGenerating(id, data) {
    if (!id) return;

    const accumulated = window[`accumulated_${id}`] || '';
    window[`accumulated_${id}`] = data.accumulated || accumulated + (data.token || '');

    // Update typing indicator or partial message
    const agent = window[`agent_${id}`];
    if (agent) {
        updateTypingIndicator(agent, window[`accumulated_${id}`]);
    }
}

/**
 * Handle complete response
 */
function handleComplete(id, data) {
    if (!id) return;

    const resolve = window[`resolve_${id}`];
    const agent = window[`agent_${id}`];

    // Remove typing indicator
    if (agent) {
        removeTypingIndicator(agent);
    }

    if (resolve) {
        resolve(data.text);
    }

    // Cleanup
    delete window[`resolve_${id}`];
    delete window[`reject_${id}`];
    delete window[`accumulated_${id}`];
    delete window[`agent_${id}`];
}

/**
 * Handle error
 */
function handleError(id, message) {
    if (!id) return;

    const reject = window[`reject_${id}`];
    const agent = window[`agent_${id}`];

    if (agent) {
        removeTypingIndicator(agent);
        setAgentStatus(agent, 'waiting');
    }

    if (reject) {
        reject(new Error(message));
    }

    // Cleanup
    delete window[`resolve_${id}`];
    delete window[`reject_${id}`];
    delete window[`accumulated_${id}`];
    delete window[`agent_${id}`];
}

/**
 * Stop the conversation
 */
function stopConversation() {
    shouldStopConversation = true;
    worker.postMessage({ type: 'stop' });
}

/**
 * End the conversation
 */
function endConversation() {
    isConversationRunning = false;
    shouldStopConversation = false;

    // Update UI
    elements.startBtn.style.display = 'flex';
    elements.stopBtn.style.display = 'none';

    // Reset agent status
    setAgentStatus('A', 'waiting');
    setAgentStatus('B', 'waiting');

    // Remove any typing indicators
    removeTypingIndicator('A');
    removeTypingIndicator('B');
}

/**
 * Clear conversation
 */
function clearConversation() {
    // Stop if running
    if (isConversationRunning) {
        stopConversation();
    }

    // Clear history
    agentAHistory = [];
    agentBHistory = [];
    currentTurn = 0;
    currentTopic = '';

    // Clear UI
    clearChatUI();
    elements.currentTurnDisplay.textContent = '0';
}

/**
 * Clear chat UI
 */
function clearChatUI() {
    elements.agentAMessages.innerHTML = `
        <div class="empty-chat-message">
            <p>Cuộc trò chuyện sẽ hiển thị ở đây...</p>
        </div>
    `;
    elements.agentBMessages.innerHTML = `
        <div class="empty-chat-message">
            <p>Cuộc trò chuyện sẽ hiển thị ở đây...</p>
        </div>
    `;
}

/**
 * Add message to chat
 */
function addMessageToChat(agent, message, type, senderName) {
    const messagesContainer = agent === 'A' ? elements.agentAMessages : elements.agentBMessages;

    // Remove empty message placeholder
    const emptyMsg = messagesContainer.querySelector('.empty-chat-message');
    if (emptyMsg) {
        emptyMsg.remove();
    }

    // Create message element
    const messageDiv = document.createElement('div');
    messageDiv.className = 'chat-message';

    const bubbleDiv = document.createElement('div');
    bubbleDiv.className = `message-bubble ${type}`;
    bubbleDiv.textContent = message;

    const metaDiv = document.createElement('div');
    metaDiv.className = 'message-meta';
    metaDiv.innerHTML = `
        <span class="sender-name">${senderName}</span>
        <span class="message-time">${formatTime(new Date())}</span>
    `;

    messageDiv.appendChild(bubbleDiv);
    messageDiv.appendChild(metaDiv);

    messagesContainer.appendChild(messageDiv);

    // Scroll to bottom
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

/**
 * Update typing indicator
 */
function updateTypingIndicator(agent, partialText) {
    const messagesContainer = agent === 'A' ? elements.agentAMessages : elements.agentBMessages;

    let typingDiv = messagesContainer.querySelector('.typing-message');

    if (!typingDiv) {
        // Remove empty message placeholder
        const emptyMsg = messagesContainer.querySelector('.empty-chat-message');
        if (emptyMsg) {
            emptyMsg.remove();
        }

        typingDiv = document.createElement('div');
        typingDiv.className = 'chat-message typing-message';

        const bubbleDiv = document.createElement('div');
        bubbleDiv.className = 'message-bubble outgoing typing-bubble';

        typingDiv.appendChild(bubbleDiv);
        messagesContainer.appendChild(typingDiv);
    }

    const bubbleDiv = typingDiv.querySelector('.typing-bubble');
    if (partialText) {
        bubbleDiv.textContent = partialText;
    } else {
        bubbleDiv.innerHTML = `
            <div class="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
            </div>
        `;
    }

    // Scroll to bottom
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

/**
 * Remove typing indicator
 */
function removeTypingIndicator(agent) {
    const messagesContainer = agent === 'A' ? elements.agentAMessages : elements.agentBMessages;
    const typingDiv = messagesContainer.querySelector('.typing-message');
    if (typingDiv) {
        typingDiv.remove();
    }
}

/**
 * Set agent status
 */
function setAgentStatus(agent, status) {
    const statusElement = agent === 'A' ? elements.agentAStatus : elements.agentBStatus;

    statusElement.className = `agent-status ${status}`;

    const statusText = statusElement.querySelector('.status-text');
    switch (status) {
        case 'waiting':
            statusText.textContent = 'Chờ';
            break;
        case 'thinking':
            statusText.textContent = 'Đang suy nghĩ...';
            break;
        case 'speaking':
            statusText.textContent = 'Đang nói...';
            break;
    }
}

/**
 * Update direction arrow
 */
function updateDirectionArrow(speaker) {
    const arrow = elements.conversationDirection;
    if (speaker === 'A') {
        arrow.className = 'divider-arrow to-right';
    } else {
        arrow.className = 'divider-arrow to-left';
    }
}

/**
 * Format time
 */
function formatTime(date) {
    return date.toLocaleTimeString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit'
    });
}

/**
 * Sleep utility
 */
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', init);
