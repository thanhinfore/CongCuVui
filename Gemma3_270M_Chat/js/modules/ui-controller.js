/**
 * UI Controller Module
 * Handles all UI interactions and updates
 */

export class UIController {
    constructor(chatManager, settingsManager) {
        this.chatManager = chatManager;
        this.settingsManager = settingsManager;
        this.elements = {};
        this.isTyping = false;
        this.scrollPending = false;
        this.pendingUpdate = false;
        this.lastUpdateTime = 0;
        this.updateThrottle = 16; // ~60fps for smooth rendering
    }

    /**
     * Initialize UI controller
     */
    initialize() {
        this.cacheElements();
        this.attachEventListeners();
        this.loadMessages();
        this.updateCharCount();

        // Apply dark mode from settings
        const settings = this.settingsManager.getSettings();
        if (settings.darkMode) {
            document.body.classList.add('dark-mode');
        }
    }

    /**
     * Cache DOM elements
     */
    cacheElements() {
        this.elements = {
            chatMessages: document.getElementById('chatMessages'),
            messageInput: document.getElementById('messageInput'),
            sendBtn: document.getElementById('sendBtn'),
            stopBtn: document.getElementById('stopBtn'),
            charCount: document.getElementById('charCount'),
            darkModeToggle: document.getElementById('darkModeToggle'),
            settingsBtn: document.getElementById('settingsBtn'),
            settingsPanel: document.getElementById('settingsPanel'),
            closeSettingsBtn: document.getElementById('closeSettingsBtn'),
            clearHistoryBtn: document.getElementById('clearHistoryBtn'),
            overlay: document.getElementById('overlay'),
            modelStatus: document.getElementById('modelStatus'),
            statusText: document.getElementById('statusText'),
            progressFill: document.getElementById('progressFill'),
            progressText: document.getElementById('progressText'),
            performanceStats: document.getElementById('performanceStats'),
            performanceStatsContainer: document.getElementById('performanceStatsContainer')
        };
    }

    /**
     * Attach event listeners
     */
    attachEventListeners() {
        // Send message
        this.elements.sendBtn.addEventListener('click', () => this.handleSendMessage());

        // Stop generation
        this.elements.stopBtn.addEventListener('click', () => this.handleStopGeneration());

        // Input handling
        this.elements.messageInput.addEventListener('input', () => {
            this.updateCharCount();
            this.autoResizeTextarea();
        });

        this.elements.messageInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.handleSendMessage();
            }
        });

        // Dark mode toggle
        this.elements.darkModeToggle.addEventListener('click', () => this.toggleDarkMode());

        // Settings panel
        this.elements.settingsBtn.addEventListener('click', () => this.openSettings());
        this.elements.closeSettingsBtn.addEventListener('click', () => this.closeSettings());
        this.elements.overlay.addEventListener('click', () => this.closeSettings());

        // Clear history
        this.elements.clearHistoryBtn.addEventListener('click', () => this.handleClearHistory());
    }

    /**
     * Update character count
     */
    updateCharCount() {
        const count = this.elements.messageInput.value.length;
        this.elements.charCount.textContent = count;

        // Enable/disable send button
        this.elements.sendBtn.disabled = count === 0 || this.isTyping;
    }

    /**
     * Auto resize textarea
     */
    autoResizeTextarea() {
        this.elements.messageInput.style.height = 'auto';
        this.elements.messageInput.style.height = this.elements.messageInput.scrollHeight + 'px';
    }

    /**
     * Handle send message
     */
    async handleSendMessage() {
        const message = this.elements.messageInput.value.trim();
        if (!message || this.isTyping) return;

        // Clear input
        this.elements.messageInput.value = '';
        this.updateCharCount();
        this.elements.messageInput.style.height = 'auto';

        // Show typing state
        this.setTypingState(true);

        // Hide welcome message if exists
        const welcomeMsg = this.elements.chatMessages.querySelector('.welcome-message');
        if (welcomeMsg) {
            welcomeMsg.remove();
        }

        // Add user message to UI
        this.addMessageToUI('user', message);

        // Add typing indicator
        const typingIndicator = this.addTypingIndicator();

        try {
            // Send message and get response
            await this.chatManager.sendMessage(
                message,
                (token, accumulated) => {
                    // Remove typing indicator on first token
                    if (typingIndicator && typingIndicator.parentNode) {
                        typingIndicator.remove();
                    }

                    // Update assistant message
                    this.updateStreamingMessage(accumulated);
                },
                (response) => {
                    // Complete
                    this.setTypingState(false);
                },
                (error) => {
                    // Error
                    this.setTypingState(false);
                    this.showError(`Lỗi: ${error.message}`);

                    if (typingIndicator && typingIndicator.parentNode) {
                        typingIndicator.remove();
                    }
                }
            );
        } catch (error) {
            console.error('Error in handleSendMessage:', error);
            this.setTypingState(false);

            if (typingIndicator && typingIndicator.parentNode) {
                typingIndicator.remove();
            }
        }
    }

    /**
     * Handle stop generation
     */
    handleStopGeneration() {
        this.chatManager.stopGeneration();
        this.setTypingState(false);

        const typingIndicator = this.elements.chatMessages.querySelector('.typing-indicator');
        if (typingIndicator) {
            typingIndicator.remove();
        }
    }

    /**
     * Set typing state
     */
    setTypingState(isTyping) {
        this.isTyping = isTyping;
        this.elements.sendBtn.style.display = isTyping ? 'none' : 'flex';
        this.elements.stopBtn.style.display = isTyping ? 'flex' : 'none';
        this.elements.messageInput.disabled = isTyping;
        this.updateCharCount();
    }

    /**
     * Add message to UI
     */
    addMessageToUI(role, content, timestamp = null) {
        const messageEl = document.createElement('div');
        messageEl.className = `message ${role}`;

        const time = timestamp ? new Date(timestamp) : new Date();
        const timeStr = time.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });

        messageEl.innerHTML = `
            <div class="message-avatar">${role === 'user' ? 'B' : 'AI'}</div>
            <div class="message-content">
                <div class="message-bubble">${this.escapeHtml(content)}</div>
                <div class="message-meta">
                    <span class="message-time">${timeStr}</span>
                    ${role === 'assistant' ? `
                        <div class="message-actions">
                            <button class="message-action-btn" title="Sao chép">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                </svg>
                            </button>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;

        // Add copy functionality
        if (role === 'assistant') {
            const copyBtn = messageEl.querySelector('.message-action-btn');
            copyBtn.addEventListener('click', () => {
                navigator.clipboard.writeText(content);
                copyBtn.innerHTML = `
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                    </svg>
                `;
                setTimeout(() => {
                    copyBtn.innerHTML = `
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                    `;
                }, 2000);
            });
        }

        this.elements.chatMessages.appendChild(messageEl);
        this.scrollToBottom();
    }

    /**
     * Add typing indicator
     */
    addTypingIndicator() {
        const messageEl = document.createElement('div');
        messageEl.className = 'message assistant';

        messageEl.innerHTML = `
            <div class="message-avatar">AI</div>
            <div class="message-content">
                <div class="typing-indicator">
                    <div class="typing-dot"></div>
                    <div class="typing-dot"></div>
                    <div class="typing-dot"></div>
                </div>
            </div>
        `;

        this.elements.chatMessages.appendChild(messageEl);
        this.scrollToBottom();

        return messageEl;
    }

    /**
     * Update streaming message (optimized with throttling)
     */
    updateStreamingMessage(content) {
        const now = performance.now();

        // Throttle updates to ~60fps for smoother rendering
        if (now - this.lastUpdateTime < this.updateThrottle) {
            // Schedule update for next frame
            if (!this.pendingUpdate) {
                this.pendingUpdate = true;
                requestAnimationFrame(() => {
                    this.performStreamingUpdate(content);
                    this.pendingUpdate = false;
                    this.lastUpdateTime = performance.now();
                });
            }
            return;
        }

        this.performStreamingUpdate(content);
        this.lastUpdateTime = now;
    }

    /**
     * Perform the actual streaming update
     */
    performStreamingUpdate(content) {
        // Check if there's already an assistant message being streamed
        let lastMessage = this.elements.chatMessages.lastElementChild;

        if (lastMessage && lastMessage.classList.contains('assistant')) {
            const bubble = lastMessage.querySelector('.message-bubble');
            if (bubble) {
                bubble.textContent = content;
                this.scrollToBottom();
                return;
            }
        }

        // If not, add new message
        this.addMessageToUI('assistant', content);
    }

    /**
     * Load messages from chat manager
     */
    loadMessages() {
        const messages = this.chatManager.getMessages();

        // Clear existing messages except welcome
        const existingMessages = this.elements.chatMessages.querySelectorAll('.message');
        existingMessages.forEach(msg => msg.remove());

        // Add all messages
        messages.forEach(msg => {
            this.addMessageToUI(msg.role, msg.content, msg.timestamp);
        });

        // Hide welcome if there are messages
        if (messages.length > 0) {
            const welcomeMsg = this.elements.chatMessages.querySelector('.welcome-message');
            if (welcomeMsg) {
                welcomeMsg.remove();
            }
        }
    }

    /**
     * Show error message
     */
    showError(message) {
        const errorEl = document.createElement('div');
        errorEl.className = 'error-message';
        errorEl.innerHTML = `
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>${message}</span>
        `;

        this.elements.chatMessages.appendChild(errorEl);
        this.scrollToBottom();

        // Remove after 5 seconds
        setTimeout(() => {
            errorEl.remove();
        }, 5000);
    }

    /**
     * Scroll to bottom (optimized with requestAnimationFrame)
     */
    scrollToBottom() {
        if (!this.scrollPending) {
            this.scrollPending = true;
            requestAnimationFrame(() => {
                this.elements.chatMessages.scrollTop = this.elements.chatMessages.scrollHeight;
                this.scrollPending = false;
            });
        }
    }

    /**
     * Escape HTML
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Toggle dark mode
     */
    toggleDarkMode() {
        document.body.classList.toggle('dark-mode');
        const isDark = document.body.classList.contains('dark-mode');
        this.settingsManager.updateSetting('darkMode', isDark);
    }

    /**
     * Open settings
     */
    openSettings() {
        this.elements.settingsPanel.classList.add('open');
        this.elements.overlay.classList.add('active');
    }

    /**
     * Close settings
     */
    closeSettings() {
        this.elements.settingsPanel.classList.remove('open');
        this.elements.overlay.classList.remove('active');
    }

    /**
     * Handle clear history
     */
    handleClearHistory() {
        if (confirm('Bạn có chắc chắn muốn xóa toàn bộ lịch sử chat?')) {
            this.chatManager.clearMessages();

            // Clear UI
            const messages = this.elements.chatMessages.querySelectorAll('.message');
            messages.forEach(msg => msg.remove());

            // Show welcome message again
            this.showWelcomeMessage();
        }
    }

    /**
     * Show welcome message
     */
    showWelcomeMessage() {
        const welcomeExists = this.elements.chatMessages.querySelector('.welcome-message');
        if (!welcomeExists) {
            const welcomeEl = document.createElement('div');
            welcomeEl.className = 'welcome-message';
            welcomeEl.innerHTML = `
                <div class="welcome-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                </div>
                <h2>Chào mừng đến với Gemma 3 Chat!</h2>
                <p>Mô hình AI Gemma 3 270M đang chạy hoàn toàn trên trình duyệt của bạn.</p>
                <p class="welcome-note">Lần đầu sử dụng, mô hình sẽ được tải xuống (~150MB). Dữ liệu của bạn luôn được bảo mật và không gửi đi đâu cả.</p>
            `;
            this.elements.chatMessages.appendChild(welcomeEl);
        }
    }

    /**
     * Update model status
     */
    updateModelStatus(message, type = 'loading') {
        this.elements.statusText.textContent = message;

        this.elements.modelStatus.classList.remove('success', 'error');
        if (type === 'success') {
            this.elements.modelStatus.classList.add('success');
        } else if (type === 'error') {
            this.elements.modelStatus.classList.add('error');
        }
    }

    /**
     * Update loading progress
     */
    updateProgress(progress) {
        this.elements.progressFill.style.width = `${progress}%`;
        this.elements.progressText.textContent = `${Math.round(progress)}%`;
    }

    /**
     * Update performance stats display
     */
    updatePerformanceStats(perfData) {
        if (!perfData) return;

        const statsText = `${perfData.tokensPerSecond} tokens/s | ${perfData.generationTime}ms`;
        this.elements.performanceStats.textContent = statsText;
        this.elements.performanceStatsContainer.style.display = 'grid';

        // Log to console for debugging
        console.log(`📊 Performance: ${statsText} | Device: ${perfData.device} (${perfData.dtype})`);
    }
}
