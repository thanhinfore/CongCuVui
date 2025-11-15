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
     * Get all messages
     */
    getMessages() {
        return this.messages;
    }

    /**
     * Add a message
     */
    addMessage(role, content) {
        const message = {
            id: Date.now() + Math.random(),
            role, // 'user' or 'assistant'
            content,
            timestamp: new Date().toISOString()
        };

        this.messages.push(message);
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
     */
    buildPrompt(userMessage) {
        const settings = this.settingsManager.getSettings();
        const systemPrompt = settings.systemPrompt || 'Bạn là trợ lý AI thông minh và hữu ích.';

        // Format conversation for Gemma model
        let prompt = `<start_of_turn>system\n${systemPrompt}<end_of_turn>\n`;

        // Add conversation history (last 10 messages for context)
        // Exclude the last message if it's from user (to avoid duplication)
        const recentMessages = this.messages.slice(-10);
        for (const msg of recentMessages) {
            // Skip if this is the current user message (it will be added separately)
            if (msg.role === 'user' && msg.content === userMessage) {
                continue;
            }

            if (msg.role === 'user') {
                prompt += `<start_of_turn>user\n${msg.content}<end_of_turn>\n`;
            } else if (msg.role === 'assistant') {
                prompt += `<start_of_turn>model\n${msg.content}<end_of_turn>\n`;
            }
        }

        // Add current user message
        prompt += `<start_of_turn>user\n${userMessage}<end_of_turn>\n`;
        prompt += `<start_of_turn>model\n`;

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
