/**
 * Chat Manager Module
 * Handles chat conversation flow and message management
 */

export class ChatManager {
    constructor(modelLoader, storageManager, settingsManager) {
        this.modelLoader = modelLoader;
        this.storageManager = storageManager;
        this.settingsManager = settingsManager;
        this.messages = [];
        this.isGenerating = false;
        this.currentGenerationController = null;
        this.performanceCallback = null;
    }

    /**
     * Initialize chat manager
     */
    async initialize() {
        // Load chat history from storage
        const history = await this.storageManager.getChatHistory();
        if (history && history.length > 0) {
            this.messages = history;
        }
    }

    /**
     * Set performance callback
     */
    setPerformanceCallback(callback) {
        this.performanceCallback = callback;
    }

    /**
     * Get all messages
     */
    getMessages() {
        return this.messages;
    }

    /**
     * Add a message
     * Handles consecutive same-role messages by replacing the last one
     */
    addMessage(role, content) {
        const message = {
            id: Date.now() + Math.random(),
            role, // 'user' or 'assistant'
            content,
            timestamp: new Date().toISOString()
        };

        // Check if last message has same role - if so, replace it
        // This prevents consecutive user messages when previous request failed
        if (this.messages.length > 0 && this.messages[this.messages.length - 1].role === role) {
            this.messages[this.messages.length - 1] = message;
        } else {
            this.messages.push(message);
        }

        this.saveHistory();
        return message;
    }

    /**
     * Update last message content (for streaming)
     */
    updateLastMessage(content) {
        if (this.messages.length > 0) {
            this.messages[this.messages.length - 1].content = content;
        }
    }

    /**
     * Delete a message
     */
    deleteMessage(messageId) {
        this.messages = this.messages.filter(m => m.id !== messageId);
        this.saveHistory();
    }

    /**
     * Clear all messages
     */
    clearMessages() {
        this.messages = [];
        this.saveHistory();
    }

    /**
     * Save chat history to storage
     */
    async saveHistory() {
        await this.storageManager.saveChatHistory(this.messages);
    }

    /**
     * Build prompt from conversation history
     * Using simple format for ONNX model compatibility
     * Optimized: limit context to reduce inference time
     */
    buildPrompt(userMessage) {
        const settings = this.settingsManager.getSettings();
        const systemPrompt = settings.systemPrompt || 'Bạn là trợ lý AI thông minh và hữu ích.';

        // Simple prompt format for better ONNX compatibility
        let prompt = '';

        // Add system instruction
        if (systemPrompt && systemPrompt.trim()) {
            prompt += `### Hướng dẫn:\n${systemPrompt}\n\n`;
        }

        // OPTIMIZATION: Limit to last 4 messages (2 turns) for faster inference
        // More context = slower generation. 270M model works best with shorter context
        const recentMessages = this.messages.slice(-4);

        // Find a valid starting point (must start with user message)
        let startIdx = 0;
        for (let i = 0; i < recentMessages.length; i++) {
            if (recentMessages[i].role === 'user') {
                startIdx = i;
                break;
            }
        }

        for (let i = startIdx; i < recentMessages.length; i++) {
            const msg = recentMessages[i];

            // Skip if this is the current user message
            if (msg.role === 'user' && msg.content === userMessage) {
                continue;
            }

            if (msg.role === 'user') {
                prompt += `### Người dùng:\n${msg.content}\n\n`;
            } else if (msg.role === 'assistant') {
                prompt += `### Trợ lý:\n${msg.content}\n\n`;
            }
        }

        // Add current user message
        prompt += `### Người dùng:\n${userMessage}\n\n### Trợ lý:\n`;

        return prompt;
    }

    /**
     * Send a message and get response
     */
    async sendMessage(userMessage, onToken = null, onComplete = null, onError = null) {
        if (this.isGenerating) {
            console.warn('Already generating response');
            return;
        }

        try {
            this.isGenerating = true;

            // Add user message
            this.addMessage('user', userMessage);

            // Build prompt
            const prompt = this.buildPrompt(userMessage);

            // Get settings
            const settings = this.settingsManager.getSettings();

            // Add empty assistant message (will be updated with streaming)
            const assistantMessage = this.addMessage('assistant', '');

            let fullResponse = '';

            // Generate response
            const response = await this.modelLoader.generate(prompt, {
                temperature: settings.temperature,
                top_p: settings.topP,
                max_new_tokens: settings.maxTokens,
                onToken: (token, accumulated) => {
                    fullResponse = accumulated;
                    this.updateLastMessage(fullResponse);

                    if (onToken) {
                        onToken(token, accumulated);
                    }
                },
                onPerformance: (perfData) => {
                    // Call performance callback if set
                    if (this.performanceCallback) {
                        this.performanceCallback(perfData);
                    }
                }
            });

            // Update final response
            this.updateLastMessage(response);
            this.saveHistory();

            this.isGenerating = false;

            if (onComplete) {
                onComplete(response);
            }

            return response;

        } catch (error) {
            console.error('Error sending message:', error);
            this.isGenerating = false;

            // Remove incomplete assistant message
            if (this.messages.length > 0 && this.messages[this.messages.length - 1].role === 'assistant') {
                this.messages.pop();
            }

            if (onError) {
                onError(error);
            }

            throw error;
        }
    }

    /**
     * Stop current generation
     */
    stopGeneration() {
        if (this.isGenerating) {
            this.modelLoader.stopGeneration();
            this.isGenerating = false;

            // Keep the partial response
            this.saveHistory();
        }
    }

    /**
     * Export chat history
     */
    exportChat() {
        const exportData = {
            timestamp: new Date().toISOString(),
            messages: this.messages,
            settings: this.settingsManager.getSettings()
        };

        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `gemma-chat-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }

    /**
     * Import chat history
     */
    async importChat(file) {
        try {
            const text = await file.text();
            const data = JSON.parse(text);

            if (data.messages && Array.isArray(data.messages)) {
                this.messages = data.messages;
                await this.saveHistory();
                return true;
            }

            return false;
        } catch (error) {
            console.error('Error importing chat:', error);
            return false;
        }
    }

    /**
     * Get conversation statistics
     */
    getStats() {
        const userMessages = this.messages.filter(m => m.role === 'user').length;
        const assistantMessages = this.messages.filter(m => m.role === 'assistant').length;
        const totalCharacters = this.messages.reduce((sum, m) => sum + m.content.length, 0);

        return {
            totalMessages: this.messages.length,
            userMessages,
            assistantMessages,
            totalCharacters,
            averageMessageLength: this.messages.length > 0 ? Math.round(totalCharacters / this.messages.length) : 0
        };
    }
}
