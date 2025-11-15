/**
 * Settings Manager Module
 * Handles application settings and preferences
 */

export class SettingsManager {
    constructor(storageManager) {
        this.storageManager = storageManager;
        this.settings = this.getDefaultSettings();
        this.elements = {};
    }

    /**
     * Get default settings
     */
    getDefaultSettings() {
        return {
            temperature: 0.7,
            topP: 0.9,
            maxTokens: 512,
            systemPrompt: 'Bạn là trợ lý AI thông minh và hữu ích. Hãy trả lời ngắn gọn, chính xác và thân thiện.',
            darkMode: false
        };
    }

    /**
     * Initialize settings manager
     */
    async initialize() {
        // Load settings from storage
        const savedSettings = await this.storageManager.getSettings();
        if (savedSettings) {
            this.settings = { ...this.getDefaultSettings(), ...savedSettings };
        }

        this.cacheElements();
        this.attachEventListeners();
        this.updateUI();
    }

    /**
     * Cache DOM elements
     */
    cacheElements() {
        this.elements = {
            temperature: document.getElementById('temperature'),
            temperatureValue: document.getElementById('temperatureValue'),
            topP: document.getElementById('topP'),
            topPValue: document.getElementById('topPValue'),
            maxTokens: document.getElementById('maxTokens'),
            maxTokensValue: document.getElementById('maxTokensValue'),
            systemPrompt: document.getElementById('systemPrompt'),
            resetSettingsBtn: document.getElementById('resetSettingsBtn'),
            deviceInfo: document.getElementById('deviceInfo'),
            modelStatusInfo: document.getElementById('modelStatusInfo')
        };
    }

    /**
     * Attach event listeners
     */
    attachEventListeners() {
        // Temperature slider
        this.elements.temperature.addEventListener('input', (e) => {
            const value = parseFloat(e.target.value);
            this.elements.temperatureValue.textContent = value.toFixed(1);
            this.updateSetting('temperature', value);
        });

        // Top P slider
        this.elements.topP.addEventListener('input', (e) => {
            const value = parseFloat(e.target.value);
            this.elements.topPValue.textContent = value.toFixed(2);
            this.updateSetting('topP', value);
        });

        // Max Tokens slider
        this.elements.maxTokens.addEventListener('input', (e) => {
            const value = parseInt(e.target.value);
            this.elements.maxTokensValue.textContent = value;
            this.updateSetting('maxTokens', value);
        });

        // System Prompt
        this.elements.systemPrompt.addEventListener('blur', (e) => {
            this.updateSetting('systemPrompt', e.target.value);
        });

        // Reset button
        this.elements.resetSettingsBtn.addEventListener('click', () => {
            this.resetSettings();
        });
    }

    /**
     * Update UI with current settings
     */
    updateUI() {
        // Update sliders and values
        this.elements.temperature.value = this.settings.temperature;
        this.elements.temperatureValue.textContent = this.settings.temperature.toFixed(1);

        this.elements.topP.value = this.settings.topP;
        this.elements.topPValue.textContent = this.settings.topP.toFixed(2);

        this.elements.maxTokens.value = this.settings.maxTokens;
        this.elements.maxTokensValue.textContent = this.settings.maxTokens;

        this.elements.systemPrompt.value = this.settings.systemPrompt;

        // Update device info
        this.updateDeviceInfo();
    }

    /**
     * Update device info
     */
    updateDeviceInfo() {
        // Detect device capabilities
        const hasWebGPU = 'gpu' in navigator;
        const hasWASM = typeof WebAssembly !== 'undefined';

        let deviceText = 'WASM (CPU)';
        if (hasWebGPU) {
            deviceText = 'WebGPU (GPU)';
        }

        this.elements.deviceInfo.textContent = deviceText;
    }

    /**
     * Update model status info
     */
    updateModelStatusInfo(status) {
        this.elements.modelStatusInfo.textContent = status;
    }

    /**
     * Get current settings
     */
    getSettings() {
        return { ...this.settings };
    }

    /**
     * Update a setting
     */
    updateSetting(key, value) {
        this.settings[key] = value;
        this.saveSettings();
    }

    /**
     * Update multiple settings
     */
    updateSettings(newSettings) {
        this.settings = { ...this.settings, ...newSettings };
        this.saveSettings();
        this.updateUI();
    }

    /**
     * Reset settings to default
     */
    resetSettings() {
        if (confirm('Bạn có chắc chắn muốn đặt lại tất cả cài đặt về mặc định?')) {
            this.settings = this.getDefaultSettings();
            this.saveSettings();
            this.updateUI();
        }
    }

    /**
     * Save settings to storage
     */
    async saveSettings() {
        await this.storageManager.saveSettings(this.settings);
    }

    /**
     * Export settings
     */
    exportSettings() {
        const blob = new Blob([JSON.stringify(this.settings, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `gemma-chat-settings-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }

    /**
     * Import settings
     */
    async importSettings(file) {
        try {
            const text = await file.text();
            const importedSettings = JSON.parse(text);

            // Validate settings
            const validSettings = {};
            const defaults = this.getDefaultSettings();

            for (const key in defaults) {
                if (key in importedSettings) {
                    validSettings[key] = importedSettings[key];
                }
            }

            this.updateSettings(validSettings);
            return true;
        } catch (error) {
            console.error('Error importing settings:', error);
            return false;
        }
    }

    /**
     * Get setting value
     */
    getSetting(key) {
        return this.settings[key];
    }

    /**
     * Validate settings
     */
    validateSettings(settings) {
        const validated = {};

        // Temperature: 0-2
        if (settings.temperature !== undefined) {
            validated.temperature = Math.max(0, Math.min(2, parseFloat(settings.temperature)));
        }

        // Top P: 0-1
        if (settings.topP !== undefined) {
            validated.topP = Math.max(0, Math.min(1, parseFloat(settings.topP)));
        }

        // Max Tokens: 64-2048
        if (settings.maxTokens !== undefined) {
            validated.maxTokens = Math.max(64, Math.min(2048, parseInt(settings.maxTokens)));
        }

        // System Prompt: string
        if (settings.systemPrompt !== undefined) {
            validated.systemPrompt = String(settings.systemPrompt);
        }

        // Dark Mode: boolean
        if (settings.darkMode !== undefined) {
            validated.darkMode = Boolean(settings.darkMode);
        }

        return validated;
    }
}
