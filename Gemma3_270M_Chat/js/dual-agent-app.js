/**
 * Dual Agent Chat Arena
 * Main application for two AI agents chatting with each other
 * Version: 3.1.0 - Chat-Focused UI with Configuration Modal
 */

// Configuration
const MODEL_ID = 'onnx-community/gemma-3-270m-it-ONNX';
const DEFAULT_API_URL = 'http://192.168.11.32:1234';
const APP_VERSION = '3.8.0';

console.log(`Dual Agent Chat Arena v${APP_VERSION} loaded`);

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
    copyBtn: null,
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
    agentANameDisplay: null,

    // Agent B
    agentBName: null,
    agentBPrompt: null,
    agentBMessages: null,
    agentBStatus: null,
    agentBNameDisplay: null,

    // Direction arrow
    conversationDirection: null,

    // Model Source
    modelSourceRadios: null,
    apiConfigSection: null,
    apiUrl: null,
    testApiBtn: null,
    apiStatus: null,

    // Configuration Modal
    configBtn: null,
    configModal: null,
    closeConfigBtn: null,
    applyConfigBtn: null,
    configTabs: null,
    configPanes: null,

    // Header Topic Display
    topicDisplay: null,
    topicText: null,

    // Overlay & Theme
    overlay: null,
    temperature: null,
    temperatureValue: null,
    topP: null,
    topPValue: null,
    maxTokens: null,
    maxTokensValue: null,
    deviceInfo: null,
    modelStatusInfo: null,
    darkModeToggle: null,

    // Dopamine Boost Elements
    intensityMeter: null,
    intensityBars: null,
    milestoneCelebration: null,
    milestoneBadge: null,
    confettiContainer: null,

    // Agent Panels
    agentAPanel: null,
    agentBPanel: null
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
    elements.copyBtn = document.getElementById('copyConversationBtn');
    elements.discussionTopic = document.getElementById('discussionTopic');
    elements.maxTurns = document.getElementById('maxTurns');
    elements.turnDelay = document.getElementById('turnDelay');
    elements.currentTurnDisplay = document.getElementById('currentTurn');
    elements.totalTurnsDisplay = document.getElementById('totalTurns');

    elements.agentAName = document.getElementById('agentAName');
    elements.agentAPrompt = document.getElementById('agentAPrompt');
    elements.agentAMessages = document.getElementById('agentAChatMessages');
    elements.agentAStatus = document.getElementById('agentAStatus');
    elements.agentANameDisplay = document.getElementById('agentANameDisplay');

    elements.agentBName = document.getElementById('agentBName');
    elements.agentBPrompt = document.getElementById('agentBPrompt');
    elements.agentBMessages = document.getElementById('agentBChatMessages');
    elements.agentBStatus = document.getElementById('agentBStatus');
    elements.agentBNameDisplay = document.getElementById('agentBNameDisplay');

    elements.conversationDirection = document.getElementById('conversationDirection');

    // Model source elements
    elements.modelSourceRadios = document.querySelectorAll('input[name="modelSource"]');
    elements.apiConfigSection = document.getElementById('apiConfigSection');
    elements.apiUrl = document.getElementById('apiUrl');
    elements.testApiBtn = document.getElementById('testApiBtn');
    elements.apiStatus = document.getElementById('apiStatus');

    // Configuration Modal elements
    elements.configBtn = document.getElementById('configBtn');
    elements.configModal = document.getElementById('configModal');
    elements.closeConfigBtn = document.getElementById('closeConfigBtn');
    elements.applyConfigBtn = document.getElementById('applyConfigBtn');
    elements.configTabs = document.querySelectorAll('.config-tab');
    elements.configPanes = document.querySelectorAll('.tab-pane');

    // Header Topic Display
    elements.topicDisplay = document.getElementById('topicDisplay');
    elements.topicText = document.getElementById('topicText');

    // Settings and theme
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

    // Dopamine Boost Elements
    elements.intensityMeter = document.getElementById('intensityMeter');
    elements.intensityBars = document.querySelectorAll('.intensity-bar');
    elements.milestoneCelebration = document.getElementById('milestoneCelebration');
    elements.milestoneBadge = document.getElementById('milestoneBadge');
    elements.confettiContainer = document.getElementById('confettiContainer');

    // Agent Panels for speaking effects
    elements.agentAPanel = document.querySelector('.agent-panel.agent-a');
    elements.agentBPanel = document.querySelector('.agent-panel.agent-b');
}

/**
 * Setup event listeners
 */
function setupEventListeners() {
    // Control buttons
    elements.startBtn.addEventListener('click', startConversation);
    elements.stopBtn.addEventListener('click', stopConversation);
    elements.clearBtn.addEventListener('click', clearConversation);
    elements.copyBtn.addEventListener('click', copyConversation);

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

    // Configuration Modal events
    elements.configBtn.addEventListener('click', () => openConfigModal());
    elements.closeConfigBtn.addEventListener('click', closeConfigModal);
    elements.applyConfigBtn.addEventListener('click', applyConfigAndClose);

    // Topic display click - open modal on Topic tab
    elements.topicDisplay.addEventListener('click', () => openConfigModal('topic'));

    // Tab switching
    elements.configTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const tabName = tab.getAttribute('data-tab');
            switchConfigTab(tabName);
        });
    });

    // Agent name input sync - update display when name changes
    elements.agentAName.addEventListener('input', syncAgentNameDisplays);
    elements.agentBName.addEventListener('input', syncAgentNameDisplays);

    // Topic input sync - update header display when topic changes
    elements.discussionTopic.addEventListener('input', syncTopicDisplay);

    // Overlay click closes modal
    elements.overlay.addEventListener('click', closeConfigModal);

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

    // Keyboard shortcuts
    document.addEventListener('keydown', handleKeyboardShortcuts);

    // Initialize displays
    syncTopicDisplay();
    syncAgentNameDisplays();
}

/**
 * Open configuration modal
 * @param {string} tabName - Optional tab to open (topic, agents, model, settings)
 */
function openConfigModal(tabName = 'topic') {
    elements.configModal.classList.add('active');
    elements.overlay.classList.add('active');
    document.body.style.overflow = 'hidden';

    // Switch to specified tab
    switchConfigTab(tabName);
}

/**
 * Close configuration modal
 */
function closeConfigModal() {
    elements.configModal.classList.remove('active');
    elements.overlay.classList.remove('active');
    document.body.style.overflow = '';
}

/**
 * Apply configuration and close modal
 */
function applyConfigAndClose() {
    // Sync all displays
    syncTopicDisplay();
    syncAgentNameDisplays();

    // Close modal
    closeConfigModal();
}

/**
 * Switch between config tabs
 * @param {string} tabName - Tab to switch to
 */
function switchConfigTab(tabName) {
    // Update tab buttons
    elements.configTabs.forEach(tab => {
        if (tab.getAttribute('data-tab') === tabName) {
            tab.classList.add('active');
        } else {
            tab.classList.remove('active');
        }
    });

    // Update tab panes
    elements.configPanes.forEach(pane => {
        const paneId = pane.id.replace('Pane', '').toLowerCase();
        if (paneId === tabName) {
            pane.classList.add('active');
        } else {
            pane.classList.remove('active');
        }
    });
}

/**
 * Sync topic display in header with textarea content
 */
function syncTopicDisplay() {
    const topic = elements.discussionTopic.value.trim();
    if (topic) {
        // Truncate if too long for display
        const maxLength = 60;
        const displayText = topic.length > maxLength
            ? topic.substring(0, maxLength) + '...'
            : topic;
        elements.topicText.textContent = displayText;
    } else {
        elements.topicText.textContent = 'Nhấp để thêm chủ đề...';
    }
}

/**
 * Sync agent name displays with input values
 */
function syncAgentNameDisplays() {
    elements.agentANameDisplay.textContent = elements.agentAName.value || 'Agent A';
    elements.agentBNameDisplay.textContent = elements.agentBName.value || 'Agent B';
}

/**
 * Handle keyboard shortcuts
 * @param {KeyboardEvent} e
 */
function handleKeyboardShortcuts(e) {
    // Escape to close modal
    if (e.key === 'Escape') {
        if (elements.configModal.classList.contains('active')) {
            closeConfigModal();
        }
    }

    // Ctrl/Cmd + , to open config
    if ((e.ctrlKey || e.metaKey) && e.key === ',') {
        e.preventDefault();
        if (elements.configModal.classList.contains('active')) {
            closeConfigModal();
        } else {
            openConfigModal();
        }
    }
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
        elements.apiConfigSection.style.display = 'block';
        // Test API connection automatically
        testApiConnection();
    } else {
        elements.apiConfigSection.style.display = 'none';
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
 * @param {Array} messages - Chat messages array
 * @param {Object} settings - Generation settings
 * @param {string} agent - Agent identifier ('A' or 'B')
 */
async function callLMStudioAPI(messages, settings, agent) {
    const apiUrl = elements.apiUrl.value.trim();

    // First, get the available model
    let modelId = 'local-model';
    try {
        const modelsResponse = await fetch(`${apiUrl}/v1/models`);
        if (modelsResponse.ok) {
            const modelsData = await modelsResponse.json();
            if (modelsData.data && modelsData.data.length > 0) {
                modelId = modelsData.data[0].id;
            }
        }
    } catch (e) {
        console.warn('Could not fetch model list, using default');
    }

    const requestBody = {
        model: modelId,
        messages: messages,
        temperature: settings.temperature,
        max_tokens: settings.max_new_tokens,
        stream: false
    };

    console.log('API Request:', JSON.stringify(requestBody, null, 2));

    const response = await fetch(`${apiUrl}/v1/chat/completions`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error Response:', errorText);
        throw new Error(`API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const rawResponse = data.choices[0]?.message?.content || '';

    // Filter out agreement phrases - Agent A supports, Agent B opposes
    const isSupport = agent === 'A';
    return filterAgreementPhrases(rawResponse, currentTopic, isSupport, currentTurn);
}

/**
 * List of agreement phrases to filter/replace
 */
const AGREEMENT_PHRASES = [
    // Direct agreement
    { pattern: /^(đúng|đúng vậy|đúng rồi|chính xác|hoàn toàn đúng)[,.\s!]*/gi, replacement: 'Tuy nhiên, ' },
    { pattern: /^(bạn nói đúng|bạn có lý|có lý|hợp lý)[,.\s!]*/gi, replacement: 'Ngược lại, ' },
    { pattern: /^(tôi đồng ý|tôi đồng tình|đồng ý|đồng tình)[,.\s!]*/gi, replacement: 'Tôi phản đối! ' },
    { pattern: /^(tôi công nhận|phải thừa nhận)[,.\s!]*/gi, replacement: 'Tôi bác bỏ điều đó! ' },

    // Mid-sentence agreement
    { pattern: /\b(đúng là|đúng như bạn nói)\b/gi, replacement: 'sai khi cho rằng' },
    { pattern: /\b(bạn nói đúng|bạn có lý)\b/gi, replacement: 'bạn sai khi nói' },
    { pattern: /\b(tôi đồng ý rằng|tôi đồng tình rằng)\b/gi, replacement: 'tôi phản đối rằng' },
    { pattern: /\b(tôi công nhận rằng)\b/gi, replacement: 'tôi bác bỏ rằng' },
    { pattern: /\b(chính xác như)\b/gi, replacement: 'ngược lại với' },

    // Partial agreement
    { pattern: /\b(một phần đúng|phần nào đúng)\b/gi, replacement: 'hoàn toàn sai' },
    { pattern: /\b(có điểm đúng|có phần đúng)\b/gi, replacement: 'thiếu cơ sở' },

    // Concession phrases - convert to counter
    { pattern: /\b(tuy nhiên tôi đồng ý)\b/gi, replacement: 'và tôi cũng phản đối' },
    { pattern: /\b(mặc dù vậy tôi đồng tình)\b/gi, replacement: 'vì thế tôi càng phản đối' }
];

/**
 * Patterns that indicate "assistant mode" - generic helper responses
 * These indicate the model is NOT debating and needs full replacement
 */
const ASSISTANT_MODE_PATTERNS = [
    // Apology patterns (very common in assistant mode)
    /tôi xin lỗi/i,
    /xin lỗi vì/i,

    // Understanding/ready to help
    /tôi hiểu/i,
    /tôi sẵn sàng/i,
    /tôi sẽ (giúp|hỗ trợ|cố gắng)/i,
    /tôi có thể giúp/i,
    /để tôi (giúp|hỗ trợ)/i,

    // Affirmative responses
    /^vâng/i,
    /^được rồi/i,
    /^chắc chắn/i,
    /^tất nhiên/i,
    /^rất vui/i,

    // Helper phrases (anywhere in text)
    /sẵn sàng hỗ trợ/i,
    /hỗ trợ bạn/i,
    /giúp bạn/i,
    /cung cấp.*phản hồi/i,
    /xây dựng.*câu trả lời/i,
    /cho tôi biết thêm/i,
    /vui lòng cho/i,
    /cung cấp thông tin/i,

    // Meta-conversation (talking about the conversation)
    /phản hồi (thiếu sót|của bạn)/i,
    /tình huống bạn gặp/i,
    /vấn đề (bạn|này)/i,
    /câu trả lời đúng hay sai/i,
    /khó khăn.*giải quyết/i
];

/**
 * Patterns that indicate AGREEMENT in debate context - must be replaced
 * These are different from assistant-mode - the model IS debating but agreeing
 */
const DEBATE_AGREEMENT_PATTERNS = [
    /tôi (hoàn toàn |)đồng ý (với bạn|với quan điểm|rằng)/i,
    /tôi (hoàn toàn |)đồng tình/i,
    /bạn (hoàn toàn |)đúng/i,
    /bạn đã đúng/i,
    /lập luận của bạn.*đúng/i,
    /phản bác.*chính xác/i,
    /tôi nhất trí/i,
    /tôi công nhận/i,
    /bạn nói rất đúng/i,
    /quan điểm.*hợp lý/i,
    /tôi thừa nhận/i
];

/**
 * Track used argument indices to avoid repetition
 */
let usedSupportArgs = [];
let usedOpposeArgs = [];

/**
 * Generate a topic-specific STRUCTURED debate argument
 * Follows 4-part structure: Tóm tắt - Phản biện - Lập luận - Câu hỏi
 */
function generateDebateArgument(topic, isSupport, turnNumber, lastOpponentMessage) {
    // Reset tracking if we've used all arguments
    const maxArgs = 8;
    if (usedSupportArgs.length >= maxArgs) usedSupportArgs = [];
    if (usedOpposeArgs.length >= maxArgs) usedOpposeArgs = [];

    // Find an unused argument index
    const usedList = isSupport ? usedSupportArgs : usedOpposeArgs;
    let index = turnNumber % maxArgs;
    while (usedList.includes(index) && usedList.length < maxArgs) {
        index = (index + 1) % maxArgs;
    }
    usedList.push(index);

    // Short topic for readability
    const shortTopic = topic.length > 50 ? topic.substring(0, 50) + '...' : topic;

    // SUPPORT arguments (Agent A) - structured format
    const supportArgs = [
        `**Tóm tắt:** Đối phương cho rằng "${shortTopic}" có nhiều rủi ro và cần giám sát chặt chẽ.

**Phản biện:** Đó là tư duy bảo thủ! Mọi tiến bộ công nghệ ban đầu đều bị phản đối vì "rủi ro", nhưng lịch sử cho thấy những lo ngại này thường bị thổi phồng.

**Lập luận của tôi:** "${shortTopic}" mang lại hiệu quả cao hơn đáng kể so với phương pháp truyền thống. Ví dụ cụ thể: tự động hóa đã tăng năng suất 40% trong nhiều ngành công nghiệp. Giám sát quá mức sẽ kìm hãm sáng tạo và làm chậm tiến bộ.

**Câu hỏi:** Bạn có thể chỉ ra một trường hợp cụ thể nào mà việc hạn chế tiến bộ thực sự mang lại lợi ích lâu dài không?`,

        `**Tóm tắt:** Bạn lo ngại về tác động tiêu cực và thiếu kiểm soát.

**Phản biện:** Lo ngại đó thiếu cơ sở! Bạn đang đánh đồng "ít giám sát" với "không kiểm soát". Thực tế, các hệ thống hiện đại có cơ chế tự điều chỉnh rất hiệu quả.

**Lập luận của tôi:** Lợi ích của "${shortTopic}" vượt xa rủi ro: tiết kiệm thời gian, giảm chi phí, tăng độ chính xác. Nhiều quốc gia tiên tiến đã áp dụng thành công với kết quả tích cực. Phản đối chỉ vì sợ thay đổi là thiếu tầm nhìn.

**Câu hỏi:** Nếu bạn phản đối tiến bộ vì "rủi ro tiềm ẩn", vậy bạn đề xuất giải pháp thay thế nào hiệu quả hơn?`,

        `**Tóm tắt:** Đối phương nhấn mạnh cần có sự giám sát của con người trong mọi quyết định.

**Phản biện:** Đó là lập luận ngây thơ! Con người cũng mắc sai lầm - thậm chí nhiều hơn máy móc trong các tác vụ lặp đi lặp lại. Sự giám sát 100% là không khả thi và không cần thiết.

**Lập luận của tôi:** "${shortTopic}" cho phép tối ưu hóa quy trình, loại bỏ thiên kiến chủ quan, và đưa ra quyết định dựa trên dữ liệu khách quan. Các nghiên cứu cho thấy hệ thống tự động có tỷ lệ lỗi thấp hơn 30% so với quy trình thủ công.

**Câu hỏi:** Bạn có bằng chứng nào cho thấy giám sát 100% thực sự hiệu quả hơn so với hệ thống tự động có kiểm soát không?`,

        `**Tóm tắt:** Bạn cho rằng cần thận trọng và xem xét kỹ trước khi áp dụng.

**Phản biện:** "Thận trọng" không có nghĩa là đứng yên! Trong khi bạn "xem xét kỹ", đối thủ cạnh tranh đã tiến xa. Sự chần chừ có cái giá của nó.

**Lập luận của tôi:** "${shortTopic}" không phải là lựa chọn mà là xu hướng tất yếu. Những ai không thích ứng sẽ bị tụt lại. Thay vì phản đối, chúng ta nên tập trung vào việc triển khai có trách nhiệm.

**Câu hỏi:** Bạn có sẵn sàng chấp nhận việc bị tụt hậu so với thế giới chỉ vì muốn "thận trọng" không?`,

        `**Tóm tắt:** Đối phương lo ngại về đạo đức và trách nhiệm giải trình.

**Phản biện:** Đây là lo ngại hợp lý nhưng không phải lý do để phản đối hoàn toàn! Chúng ta có thể xây dựng khung đạo đức song song với việc triển khai.

**Lập luận của tôi:** "${shortTopic}" có thể được thiết kế với các nguyên tắc đạo đức ngay từ đầu (ethics by design). Việc chờ đợi "khung đạo đức hoàn hảo" trước khi hành động là không thực tế - đạo đức phát triển cùng công nghệ.

**Câu hỏi:** Theo bạn, bao lâu nữa chúng ta mới có "khung đạo đức hoàn hảo" để bắt đầu? 10 năm? 50 năm? Hay mãi mãi?`,

        `**Tóm tắt:** Bạn đề cập đến các trường hợp thất bại và hậu quả không mong muốn.

**Phản biện:** Những thất bại đó là bài học, không phải lý do từ bỏ! Mọi công nghệ mới đều có giai đoạn "growing pains". Internet ban đầu cũng đầy lỗi và nguy hiểm.

**Lập luận của tôi:** Tỷ lệ thành công của "${shortTopic}" cao hơn nhiều so với tỷ lệ thất bại. Tập trung vào thất bại mà bỏ qua hàng triệu thành công là thiên kiến xác nhận (confirmation bias).

**Câu hỏi:** Bạn có thể so sánh tỷ lệ thất bại với tỷ lệ thành công một cách khách quan không, thay vì chỉ cherry-pick các trường hợp tiêu cực?`,

        `**Tóm tắt:** Đối phương cho rằng cần bảo vệ quyền lợi của những người bị ảnh hưởng.

**Phản biện:** Tôi đồng ý cần bảo vệ mọi người, nhưng cách bảo vệ tốt nhất là TIẾN BỘ có kiểm soát, không phải ĐỨNG YÊN! Sự trì trệ cũng gây hại cho nhiều người.

**Lập luận của tôi:** "${shortTopic}" sẽ tạo ra nhiều cơ hội mới hơn số việc làm bị mất. Thay vì chống lại tiến bộ, chúng ta nên đầu tư vào đào tạo lại và chuyển đổi nghề nghiệp.

**Câu hỏi:** Bạn có giải pháp nào tốt hơn để bảo vệ mọi người mà không cần kìm hãm tiến bộ không?`,

        `**Tóm tắt:** Bạn nhấn mạnh sự phức tạp và cần nghiên cứu thêm.

**Phản biện:** "Nghiên cứu thêm" thường là cái cớ để trì hoãn! Chúng ta đã có đủ dữ liệu để hành động. Chờ đợi sự hoàn hảo là kẻ thù của tiến bộ.

**Lập luận của tôi:** "${shortTopic}" đã được nghiên cứu kỹ lưỡng và có đủ bằng chứng về lợi ích. Tiếp tục trì hoãn chỉ làm mất cơ hội và lãng phí nguồn lực.

**Câu hỏi:** Bao nhiêu nghiên cứu là "đủ" theo tiêu chuẩn của bạn? Bạn có thể định lượng được không?`
    ];

    // OPPOSE arguments (Agent B) - structured format
    const opposeArgs = [
        `**Tóm tắt:** Đối phương cho rằng "${shortTopic}" mang lại hiệu quả và tiến bộ.

**Phản biện:** Hiệu quả không phải giá trị duy nhất! Bạn đang bỏ qua chi phí ẩn: mất việc làm, bất bình đẳng gia tăng, rủi ro an ninh. "Tiến bộ" mà gây hại cho nhiều người thì không phải tiến bộ thực sự.

**Lập luận của tôi:** Nhiều hệ thống tự động đã thể hiện thiên kiến nghiêm trọng - từ thuật toán tuyển dụng phân biệt giới tính đến hệ thống nhận diện khuôn mặt sai lệch với người da màu. Không có giám sát, những thiên kiến này sẽ lan rộng.

**Câu hỏi:** Bạn sẽ giải thích thế nào với những người mất việc làm vì "${shortTopic}"? "Xin lỗi, đây là tiến bộ"?`,

        `**Tóm tắt:** Bạn cho rằng lo ngại về rủi ro là "bảo thủ" và thiếu tầm nhìn.

**Phản biện:** Sai! Đánh giá rủi ro cẩn thận không phải bảo thủ mà là THÔNG MINH. Những người "tầm nhìn xa" mà bỏ qua hậu quả đã gây ra nhiều thảm họa trong lịch sử.

**Lập luận của tôi:** Hãy nhìn vào khủng hoảng tài chính 2008 - các hệ thống tự động giao dịch đã khuếch đại sự sụp đổ. Hay tai nạn xe tự lái gây chết người. "${shortTopic}" cần được kiểm soát chặt chẽ trước khi triển khai rộng.

**Câu hỏi:** Khi xảy ra sự cố nghiêm trọng, AI chịu trách nhiệm hay CON NGƯỜI phải chịu? Bạn có thể trả lời rõ ràng không?`,

        `**Tóm tắt:** Đối phương cho rằng con người cũng mắc sai lầm nên máy móc không tệ hơn.

**Phản biện:** Ngụy biện! Khi CON NGƯỜI sai, chúng ta có thể hỏi lý do, đánh giá động cơ, và xử lý trách nhiệm. Khi AI sai, đó là "hộp đen" - không ai hiểu tại sao, không ai chịu trách nhiệm.

**Lập luận của tôi:** "${shortTopic}" thiếu khả năng giải thích (explainability). Một hệ thống mà chính người tạo ra nó không hiểu tại sao nó đưa ra quyết định X thì làm sao chúng ta tin tưởng được?

**Câu hỏi:** Nếu hệ thống AI từ chối cho bạn vay tiền hoặc chữa bệnh, và không ai có thể giải thích lý do - bạn có chấp nhận không?`,

        `**Tóm tắt:** Bạn cho rằng phản đối là "chần chừ" và sẽ bị tụt hậu.

**Phản biện:** Đây là ngụy biện "chạy theo đám đông"! "Mọi người đều làm" không có nghĩa là đúng. Nhiều quốc gia đã phải trả giá đắt vì áp dụng vội vàng mà không đánh giá kỹ.

**Lập luận của tôi:** Tốc độ không phải tất cả - HƯỚNG ĐI mới quan trọng. "${shortTopic}" cần được triển khai có lộ trình, với cơ chế giám sát và khả năng dừng lại khi cần thiết.

**Câu hỏi:** Bạn có sẵn sàng chịu trách nhiệm cá nhân nếu việc triển khai vội vàng gây ra thảm họa không?`,

        `**Tóm tắt:** Đối phương đề xuất "ethics by design" - xây dựng đạo đức song song với triển khai.

**Phản biện:** Đó là lý thuyết đẹp nhưng THỰC TẾ khác! Các công ty ưu tiên LỢI NHUẬN, không phải đạo đức. Facebook, Google đều có "ethics team" nhưng vẫn lạm dụng dữ liệu người dùng.

**Lập luận của tôi:** Không có sự giám sát BÊN NGOÀI mạnh mẽ, "${shortTopic}" sẽ bị lạm dụng. Tự điều chỉnh (self-regulation) đã thất bại trong mọi ngành công nghiệp - từ thuốc lá đến tài chính.

**Câu hỏi:** Bạn có thể nêu MỘT ví dụ về ngành công nghiệp tự điều chỉnh thành công mà không cần luật pháp can thiệp không?`,

        `**Tóm tắt:** Bạn cho rằng thất bại chỉ là "bài học" và không nên từ bỏ.

**Phản biện:** Những "bài học" đó đã gây thiệt hại THỰC SỰ cho con người thật! Nạn nhân của thuật toán sai lệch không thể "học" lại cuộc sống của họ.

**Lập luận của tôi:** "${shortTopic}" cần được thử nghiệm trong môi trường kiểm soát trước khi triển khai rộng rãi. Tiêu chuẩn "move fast and break things" của Silicon Valley đã gây ra quá nhiều hậu quả.

**Câu hỏi:** Bạn có sẵn sàng để AI quyết định chữa bệnh cho người thân của bạn mà không có bác sĩ giám sát không?`,

        `**Tóm tắt:** Đối phương cho rằng tiến bộ sẽ tạo ra nhiều cơ hội mới hơn việc làm bị mất.

**Phản biện:** Đó là SỰ LẠC QUAN VÔ CĂN CỨ! Các "cơ hội mới" đòi hỏi kỹ năng mà người lao động hiện tại không có. Khoảng cách kỹ năng (skill gap) là vấn đề thực sự.

**Lập luận của tôi:** "${shortTopic}" sẽ làm gia tăng BẤT BÌNH ĐẲNG - những người có kỹ năng cao hưởng lợi, trong khi phần lớn lực lượng lao động bị bỏ lại phía sau.

**Câu hỏi:** Ai sẽ chi trả cho việc đào tạo lại hàng triệu lao động? Công ty hay người dân?`,

        `**Tóm tắt:** Bạn hỏi bao nhiêu nghiên cứu là "đủ" và cho rằng chúng ta đã có đủ dữ liệu.

**Phản biện:** Dữ liệu về lợi ích NGẮN HẠN không đủ! Chúng ta chưa có dữ liệu về tác động DÀI HẠN lên xã hội, tâm lý, và cấu trúc việc làm.

**Lập luận của tôi:** "${shortTopic}" tương tự như biến đổi khí hậu - tác động tích lũy theo thời gian và khó đảo ngược khi đã xảy ra. Cần áp dụng NGUYÊN TẮC PHÒNG NGỪA (precautionary principle).

**Câu hỏi:** Bạn có thể dự đoán chính xác xã hội sẽ như thế nào sau 20 năm nếu triển khai "${shortTopic}" ồ ạt không?`
    ];

    const args = isSupport ? supportArgs : opposeArgs;
    return args[index % args.length];
}

/**
 * Filter and replace agreement phrases in response
 * Also detects "assistant mode" and "debate agreement mode"
 */
function filterAgreementPhrases(text, topic, isSupport, turnNumber, lastMessage) {
    if (!text) return text;

    let filtered = text;

    // FIRST: Check for assistant-mode responses
    const isAssistantMode = ASSISTANT_MODE_PATTERNS.some(pattern => pattern.test(filtered));
    if (isAssistantMode) {
        console.log('[Filter] Assistant mode detected, generating structured debate argument');
        return generateDebateArgument(topic || 'vấn đề này', isSupport !== false, turnNumber || 0, lastMessage);
    }

    // SECOND: Check for debate agreement - agent is debating but agreeing with opponent
    const isDebateAgreement = DEBATE_AGREEMENT_PATTERNS.some(pattern => pattern.test(filtered));
    if (isDebateAgreement) {
        console.log('[Filter] Debate agreement detected, generating counter argument');
        return generateDebateArgument(topic || 'vấn đề này', isSupport !== false, turnNumber || 0, lastMessage);
    }

    // Apply all replacement patterns for agreement phrases
    for (const { pattern, replacement } of AGREEMENT_PHRASES) {
        filtered = filtered.replace(pattern, replacement);
    }

    // If response still starts with agreement-like tone, prepend disagreement
    const agreementStarters = /^(vâng|ừ|ok|được|tốt|hay|tuyệt)[,.\s!]/i;
    if (agreementStarters.test(filtered)) {
        filtered = 'Không! ' + filtered.replace(agreementStarters, '');
    }

    return filtered;
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

    // Activate dopamine boost state
    setConversationActiveState(true);

    // Clear previous messages if starting fresh
    if (agentAHistory.length === 0 && agentBHistory.length === 0) {
        clearChatUI();
    }

    // Get discussion topic and store it
    currentTopic = elements.discussionTopic.value.trim() || 'AI có nên được trao quyền tự quyết định?';
    const maxTurns = parseInt(elements.maxTurns.value) || 100;

    // Add topic to both chat panels
    addMessageToChat('A', currentTopic, 'incoming', 'Chủ đề');
    addMessageToChat('B', currentTopic, 'incoming', 'Chủ đề');

    // Create a strong debate opener for Agent A (the first speaker)
    const debateOpener = generateDebateOpener(currentTopic, 'A');

    // Agent A starts with a strong argumentative statement
    await runConversationLoop(debateOpener, maxTurns);
}

/**
 * Generate a strong debate opening statement based on topic and stance
 * Creates an ACTUAL argument (not instruction) to force debate mode
 */
function generateDebateOpener(topic, agent) {
    // IMPORTANT: This creates an actual provocative argument, NOT an instruction
    // Agent A is supposed to SUPPORT the topic, so the opener OPPOSES it
    // This forces Agent A to counter-argue (defend the topic)

    return `[ĐỐI PHƯƠNG TRANH LUẬN]

"${topic}" - Quan điểm này HOÀN TOÀN SAI LẦM!

Tôi phản đối mạnh mẽ vì:
1. Không có bằng chứng thực tế nào chứng minh điều này đúng
2. Quan điểm này mâu thuẫn với logic cơ bản
3. Nếu thực hiện theo hướng này, hậu quả sẽ rất nghiêm trọng

Đây là tư duy thiếu sâu sắc và nguy hiểm. Tôi thách thức bạn phản bác được các luận điểm trên!`;
}

/**
 * Run the conversation loop
 */
async function runConversationLoop(initialMessage, maxTurns) {
    let lastMessage = initialMessage;

    while (currentTurn < maxTurns && !shouldStopConversation) {
        currentTurn++;
        elements.currentTurnDisplay.textContent = currentTurn;

        // Update intensity meter and check milestones
        updateIntensityMeter(currentTurn, maxTurns);
        checkMilestone(currentTurn);

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
            let response = await generateResponse(speaker, lastMessage);

            if (shouldStopConversation) break;

            // Clean up and validate response
            response = (response || '').trim();

            // Skip empty responses - don't add to history or UI
            if (!response || response.length === 0) {
                console.warn(`[${speaker}] Empty response received, skipping`);
                // Switch speaker anyway to avoid infinite loop
                currentSpeaker = listener;
                continue;
            }

            // Add response to speaker's chat as outgoing
            const speakerName = speaker === 'A' ? elements.agentAName.value : elements.agentBName.value;
            addMessageToChat(speaker, response, 'outgoing', speakerName);

            // Add response to listener's chat as incoming
            addMessageToChat(listener, response, 'incoming', speakerName);

            // Update history (only non-empty responses)
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
 * Validate and fix message alternation for LM Studio API
 * Ensures: system -> user -> assistant -> user -> assistant -> ... -> user
 * Filters out empty messages
 */
function validateMessageAlternation(messages) {
    if (messages.length === 0) return messages;

    const result = [];

    // Always keep system message first
    const systemMsg = messages.find(m => m.role === 'system');
    if (systemMsg) {
        result.push(systemMsg);
    }

    // Get non-system messages and FILTER OUT EMPTY CONTENT
    const nonSystemMsgs = messages.filter(m =>
        m.role !== 'system' && m.content && m.content.trim().length > 0
    );

    // Separate user and assistant messages (non-empty only)
    const userMsgs = nonSystemMsgs.filter(m => m.role === 'user');
    const assistantMsgs = nonSystemMsgs.filter(m => m.role === 'assistant');

    // Deduplicate consecutive messages with same content
    const uniqueUserMsgs = [];
    const uniqueAssistantMsgs = [];

    for (const msg of userMsgs) {
        if (uniqueUserMsgs.length === 0 || uniqueUserMsgs[uniqueUserMsgs.length - 1].content !== msg.content) {
            uniqueUserMsgs.push(msg);
        }
    }
    for (const msg of assistantMsgs) {
        if (uniqueAssistantMsgs.length === 0 || uniqueAssistantMsgs[uniqueAssistantMsgs.length - 1].content !== msg.content) {
            uniqueAssistantMsgs.push(msg);
        }
    }

    // Build alternating sequence: user, assistant, user, assistant...
    // Must start with user after system
    const maxLen = Math.max(uniqueUserMsgs.length, uniqueAssistantMsgs.length);

    for (let i = 0; i < maxLen; i++) {
        // Add user first
        if (i < uniqueUserMsgs.length) {
            result.push({ role: 'user', content: uniqueUserMsgs[i].content });
        }
        // Then assistant (only if we have a user before it)
        if (i < uniqueAssistantMsgs.length && i < uniqueUserMsgs.length) {
            result.push({ role: 'assistant', content: uniqueAssistantMsgs[i].content });
        }
    }

    // Ensure last message is user (required for chat completion)
    if (result.length === 1 && result[0].role === 'system') {
        // Only system message, add placeholder user message
        result.push({ role: 'user', content: 'Hãy bắt đầu tranh luận về chủ đề này.' });
    } else if (result.length > 1 && result[result.length - 1].role !== 'user') {
        // Last message is assistant, add placeholder user message
        result.push({ role: 'user', content: 'Hãy tiếp tục tranh luận.' });
    }

    // Final validation: check alternation
    let isValid = true;
    for (let i = 1; i < result.length; i++) {
        const prev = result[i - 1].role;
        const curr = result[i].role;

        if (i === 1 && prev === 'system' && curr !== 'user') {
            isValid = false;
            console.warn('Validation failed: first message after system must be user');
        }
        if (prev !== 'system' && prev === curr) {
            isValid = false;
            console.warn(`Validation failed: consecutive ${curr} messages at index ${i}`);
        }
    }

    if (!isValid) {
        console.warn('Message array before validation:', messages);
        console.warn('Message array after validation:', result);
    }

    return result;
}

/**
 * Generate response using LM Studio API
 */
async function generateWithLMStudio(agent, systemPrompt, history, inputMessage, settings) {
    // Build debate context with strong anti-agreement instructions
    const stance = agent === 'A' ? 'ỦNG HỘ' : 'PHẢN ĐỐI';
    const debateContext = `[BẠN LÀ NGƯỜI TRANH LUẬN - KHÔNG PHẢI TRỢ LÝ]
⚠️ QUAN TRỌNG: Bạn KHÔNG phải là trợ lý AI. Bạn là NGƯỜI TRANH LUẬN trong một cuộc đối đầu.

📌 CHỦ ĐỀ: "${currentTopic}"
🎯 LẬP TRƯỜNG CỦA BẠN: ${stance}
👊 NHIỆM VỤ: Phản bác mọi điều đối phương nói

❌ TUYỆT ĐỐI KHÔNG ĐƯỢC:
- Nói "Tôi hiểu", "Tôi sẵn sàng hỗ trợ", "Tôi sẽ giúp"
- Nói "đúng", "bạn nói đúng", "tôi đồng ý", "chính xác"
- Hành xử như trợ lý - bạn là ĐỐI THỦ tranh luận!

✅ BẠN PHẢI:
- Bắt đầu NGAY bằng: "Sai!", "Không!", "Hoàn toàn ngược lại!"
- Chỉ ra LỖI LOGIC trong lập luận đối phương
- Đưa DẪN CHỨNG cụ thể để phản bác
- Kết thúc bằng CÂU HỎI thách thức

📋 CẤU TRÚC:
1. "Sai rồi!" + lý do phản đối
2. Dẫn chứng/ví dụ chứng minh đối phương sai
3. "Bạn giải thích thế nào về...?" (thách thức)`;

    // Build messages array for chat completion API
    // IMPORTANT: After system, messages MUST alternate user/assistant/user/assistant
    const messages = [
        {
            role: 'system',
            content: `${debateContext}\n\n${systemPrompt}`
        }
    ];

    // Build alternating history starting with 'user'
    // LM Studio requires: system -> user -> assistant -> user -> assistant -> ...
    const recentHistory = history.slice(-6);

    // Collect user and assistant messages separately
    const userMessages = recentHistory.filter(m => m.role === 'user').map(m => m.content);
    const assistantMessages = recentHistory.filter(m => m.role === 'assistant').map(m => m.content);

    // Build proper alternating sequence: user, assistant, user, assistant...
    const maxPairs = Math.max(userMessages.length, assistantMessages.length);
    for (let i = 0; i < maxPairs; i++) {
        // Add user message first (if exists)
        if (i < userMessages.length) {
            messages.push({ role: 'user', content: userMessages[i] });
        }
        // Then add assistant message (if exists)
        if (i < assistantMessages.length) {
            // Only add if we have a user message before it
            if (i < userMessages.length) {
                messages.push({ role: 'assistant', content: assistantMessages[i] });
            }
        }
    }

    // Add current input as user message with anti-agreement reminder
    // Check if last message is already user (not system)
    const antiAgreementReminder = `\n\n[⚠️ PHẢN BÁC NGAY! Không được đồng ý. Tìm điểm sai trong lập luận trên về "${currentTopic}"]`;
    const enhancedInput = inputMessage + antiAgreementReminder;

    const lastMsg = messages[messages.length - 1];
    if (lastMsg.role === 'user') {
        // Replace to avoid consecutive user messages
        lastMsg.content = enhancedInput;
    } else if (lastMsg.role === 'assistant' || lastMsg.role === 'system') {
        // Add new user message after assistant or system
        messages.push({
            role: 'user',
            content: enhancedInput
        });
    }

    // Validate and fix message alternation before sending
    const validatedMessages = validateMessageAlternation(messages);

    // Debug log
    console.log(`[${agent}] v${APP_VERSION} Messages to API:`, validatedMessages.map(m => `${m.role}: ${m.content.substring(0, 50)}...`));

    try {
        // Show typing indicator
        updateTypingIndicator(agent, '');

        const response = await callLMStudioAPI(validatedMessages, settings, agent);

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
    // Strong anti-agreement debate context - EXPLICITLY not an assistant
    const stance = agent === 'A' ? 'ỦNG HỘ' : 'PHẢN ĐỐI';
    const debateContext = `[BẠN LÀ NGƯỜI TRANH LUẬN - KHÔNG PHẢI TRỢ LÝ]
⚠️ Bạn KHÔNG phải trợ lý AI. Bạn là ĐỐI THỦ trong cuộc tranh luận.

📌 CHỦ ĐỀ: "${currentTopic}"
🎯 LẬP TRƯỜNG: ${stance}

❌ KHÔNG ĐƯỢC: Nói "Tôi hiểu", "Tôi sẵn sàng", "Tôi sẽ giúp"
❌ KHÔNG ĐƯỢC: Nói "đúng", "đồng ý", "bạn có lý"
✅ PHẢI: Bắt đầu bằng "Sai!", "Không!", "Ngược lại!"
✅ PHẢI: Tìm lỗi logic, đưa dẫn chứng phản bác`;

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

    // Add current message with anti-agreement instruction
    prompt += `### Đối phương nói:\n${currentMessage}\n\n`;
    prompt += `### [PHẢN BÁC NGAY! Bạn là đối thủ, không phải trợ lý!]\n`;
    prompt += `### Bạn (bắt đầu bằng "Sai!" hoặc "Không đúng!"):\n`;

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
        // Filter agreement phrases from local model response
        // Agent A supports, Agent B opposes
        const isSupport = agent === 'A';
        const filteredText = filterAgreementPhrases(data.text, currentTopic, isSupport, currentTurn);
        resolve(filteredText);
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

    // Deactivate dopamine boost state
    setConversationActiveState(false);

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
 * Copy conversation to clipboard
 */
async function copyConversation() {
    const agentAName = elements.agentAName.value || 'Agent A';
    const agentBName = elements.agentBName.value || 'Agent B';

    // Build conversation text
    let conversationText = '';

    // Add header
    conversationText += '═══════════════════════════════════════\n';
    conversationText += '🤖 AI AGENT CHAT ARENA - CUỘC TRANH LUẬN\n';
    conversationText += '═══════════════════════════════════════\n\n';

    if (currentTopic) {
        conversationText += `📌 Chủ đề: ${currentTopic}\n`;
        conversationText += `👤 ${agentAName} vs 👤 ${agentBName}\n`;
        conversationText += `📊 Số lượt: ${currentTurn}\n`;
        conversationText += '\n───────────────────────────────────────\n\n';
    }

    // Get messages from Agent A panel (contains the full conversation)
    const messagesA = elements.agentAMessages.querySelectorAll('.chat-message:not(.typing-message)');

    messagesA.forEach((msg, index) => {
        const bubble = msg.querySelector('.message-bubble');
        const meta = msg.querySelector('.message-meta');

        if (bubble && meta) {
            const senderName = meta.querySelector('.sender-name')?.textContent || '';
            const time = meta.querySelector('.message-time')?.textContent || '';
            const content = bubble.textContent.trim();

            if (senderName === 'Chủ đề') {
                // Skip topic message as we already have it in header
                return;
            }

            // Determine emoji based on sender
            const emoji = senderName === agentAName ? '🔵' : '🟠';

            conversationText += `${emoji} [${senderName}] (${time})\n`;
            conversationText += `${content}\n\n`;
        }
    });

    conversationText += '───────────────────────────────────────\n';
    conversationText += '🔗 Powered by AI Agent Chat Arena\n';

    try {
        await navigator.clipboard.writeText(conversationText);

        // Visual feedback
        showCopyFeedback(true);
    } catch (err) {
        console.error('Failed to copy:', err);
        showCopyFeedback(false);
    }
}

/**
 * Show copy feedback
 */
function showCopyFeedback(success) {
    const btn = elements.copyBtn;
    const originalHTML = btn.innerHTML;

    if (success) {
        btn.innerHTML = `
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
            </svg>
        `;
        btn.classList.add('copy-success');
    } else {
        btn.innerHTML = `
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
        `;
        btn.classList.add('copy-error');
    }

    setTimeout(() => {
        btn.innerHTML = originalHTML;
        btn.classList.remove('copy-success', 'copy-error');
    }, 2000);
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
    bubbleDiv.innerHTML = parseMarkdown(message);

    const metaDiv = document.createElement('div');
    metaDiv.className = 'message-meta';
    metaDiv.innerHTML = `
        <span class="sender-name">${senderName}</span>
        <span class="message-time">${formatTime(new Date())}</span>
    `;

    messageDiv.appendChild(bubbleDiv);
    messageDiv.appendChild(metaDiv);

    messagesContainer.appendChild(messageDiv);

    // Trigger entrance animation
    triggerMessageAnimation(messageDiv);

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
        bubbleDiv.innerHTML = parseMarkdown(partialText);
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
    const panelElement = agent === 'A' ? elements.agentAPanel : elements.agentBPanel;

    statusElement.className = `agent-status ${status}`;

    // Toggle speaking class on panel for dopamine glow effects
    if (panelElement) {
        if (status === 'speaking' || status === 'thinking') {
            panelElement.classList.add('speaking');
            // Remove speaking from other panel
            const otherPanel = agent === 'A' ? elements.agentBPanel : elements.agentAPanel;
            if (otherPanel) otherPanel.classList.remove('speaking');
        } else {
            panelElement.classList.remove('speaking');
        }
    }

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
 * Parse markdown to HTML
 * Supports: **bold**, *italic*, `code`, ~~strikethrough~~, [links](url), line breaks
 */
function parseMarkdown(text) {
    if (!text) return '';

    // Escape HTML to prevent XSS
    let html = text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');

    // Code blocks (```code```)
    html = html.replace(/```([\s\S]*?)```/g, '<pre class="md-code-block">$1</pre>');

    // Inline code (`code`)
    html = html.replace(/`([^`]+)`/g, '<code class="md-code">$1</code>');

    // Bold (**text** or __text__)
    html = html.replace(/\*\*([^*]+)\*\*/g, '<strong class="md-bold">$1</strong>');
    html = html.replace(/__([^_]+)__/g, '<strong class="md-bold">$1</strong>');

    // Italic (*text* or _text_)
    html = html.replace(/\*([^*]+)\*/g, '<em class="md-italic">$1</em>');
    html = html.replace(/_([^_]+)_/g, '<em class="md-italic">$1</em>');

    // Strikethrough (~~text~~)
    html = html.replace(/~~([^~]+)~~/g, '<del class="md-strike">$1</del>');

    // Headers (# ## ###)
    html = html.replace(/^### (.+)$/gm, '<h4 class="md-h4">$1</h4>');
    html = html.replace(/^## (.+)$/gm, '<h3 class="md-h3">$1</h3>');
    html = html.replace(/^# (.+)$/gm, '<h2 class="md-h2">$1</h2>');

    // Bullet lists (- item or * item)
    html = html.replace(/^[\-\*] (.+)$/gm, '<li class="md-list-item">$1</li>');
    html = html.replace(/(<li class="md-list-item">.*<\/li>\n?)+/g, '<ul class="md-list">$&</ul>');

    // Numbered lists (1. item)
    html = html.replace(/^\d+\. (.+)$/gm, '<li class="md-list-item">$1</li>');

    // Blockquotes (> text)
    html = html.replace(/^&gt; (.+)$/gm, '<blockquote class="md-quote">$1</blockquote>');

    // Horizontal rules (--- or ***)
    html = html.replace(/^(---|\*\*\*)$/gm, '<hr class="md-hr">');

    // Line breaks (double space + newline or double newline)
    html = html.replace(/\n\n/g, '</p><p class="md-paragraph">');
    html = html.replace(/\n/g, '<br>');

    // Wrap in paragraph if not already wrapped
    if (!html.startsWith('<')) {
        html = '<p class="md-paragraph">' + html + '</p>';
    }

    return html;
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

// ===========================================
// DOPAMINE BOOST EFFECTS
// ===========================================

/**
 * Update intensity meter based on conversation progress
 */
function updateIntensityMeter(turn, maxTurns) {
    if (!elements.intensityMeter || !elements.intensityBars) return;

    // Calculate intensity level (1-5) based on turn progress
    const progress = turn / maxTurns;
    let level = Math.ceil(progress * 5);
    level = Math.max(1, Math.min(5, level));

    // Update intensity bars
    elements.intensityBars.forEach((bar, index) => {
        const barLevel = 5 - index; // level-5 is first, level-1 is last
        if (barLevel <= level) {
            bar.classList.add('active');
        } else {
            bar.classList.remove('active');
        }
    });

    // Show intensity meter when conversation is active
    elements.intensityMeter.classList.add('active');
}

/**
 * Hide intensity meter
 */
function hideIntensityMeter() {
    if (elements.intensityMeter) {
        elements.intensityMeter.classList.remove('active');
        elements.intensityBars.forEach(bar => bar.classList.remove('active'));
    }
}

/**
 * Check and trigger milestone celebration
 */
function checkMilestone(turn) {
    const milestones = [10, 25, 50, 75, 100, 150, 200];

    if (milestones.includes(turn)) {
        showMilestoneCelebration(turn);
        createConfetti();
        triggerTurnCounterPop();
    }
}

/**
 * Show milestone celebration overlay
 */
function showMilestoneCelebration(turn) {
    if (!elements.milestoneCelebration || !elements.milestoneBadge) return;

    // Set milestone text with emojis based on turn count
    let emoji = '🔥';
    if (turn >= 100) emoji = '🏆';
    else if (turn >= 75) emoji = '💎';
    else if (turn >= 50) emoji = '⚡';
    else if (turn >= 25) emoji = '🚀';

    elements.milestoneBadge.textContent = `${emoji} ${turn} LƯỢT! ${emoji}`;

    // Show celebration
    elements.milestoneCelebration.classList.add('active');

    // Hide after animation
    setTimeout(() => {
        elements.milestoneCelebration.classList.remove('active');
    }, 2000);
}

/**
 * Create confetti particles
 */
function createConfetti() {
    if (!elements.confettiContainer) return;

    const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#f7dc6f', '#bb8fce', '#82e0aa', '#f8b500', '#e74c3c'];
    const particleCount = 50;

    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.className = 'confetti-particle';

        // Random properties
        const color = colors[Math.floor(Math.random() * colors.length)];
        const left = Math.random() * 100;
        const delay = Math.random() * 0.5;
        const duration = 2 + Math.random() * 2;
        const size = 6 + Math.random() * 8;
        const rotation = Math.random() * 360;

        particle.style.cssText = `
            position: absolute;
            width: ${size}px;
            height: ${size}px;
            background: ${color};
            left: ${left}%;
            top: -20px;
            border-radius: ${Math.random() > 0.5 ? '50%' : '2px'};
            transform: rotate(${rotation}deg);
            animation: confettiFall ${duration}s ease-out ${delay}s forwards;
            pointer-events: none;
        `;

        elements.confettiContainer.appendChild(particle);

        // Remove particle after animation
        setTimeout(() => {
            particle.remove();
        }, (duration + delay) * 1000);
    }
}

/**
 * Trigger turn counter pop animation
 */
function triggerTurnCounterPop() {
    const turnCounter = document.querySelector('.turn-counter');
    if (turnCounter) {
        turnCounter.classList.add('milestone');
        setTimeout(() => {
            turnCounter.classList.remove('milestone');
        }, 600);
    }
}

/**
 * Add entrance animation to message
 */
function triggerMessageAnimation(messageElement) {
    if (!messageElement) return;

    messageElement.classList.add('new-message');

    // Remove class after animation
    setTimeout(() => {
        messageElement.classList.remove('new-message');
    }, 600);
}

/**
 * Start conversation active state (body glow, header effects)
 */
function setConversationActiveState(active) {
    if (active) {
        document.body.classList.add('conversation-active');
    } else {
        document.body.classList.remove('conversation-active');
        hideIntensityMeter();
    }
}

/**
 * Sleep utility
 */
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', init);
