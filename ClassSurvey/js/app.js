/**
 * ClassSurvey Application
 * Main application logic
 */
class ClassSurveyApp {
    constructor() {
        // Initialize modules
        this.sheetsHandler = new GoogleSheetsHandler();
        this.surveyManager = new SurveyManager();
        this.chartRenderer = new ChartRenderer('surveyChart');

        // UI Elements
        this.setupScreen = document.getElementById('setupScreen');
        this.mainApp = document.getElementById('mainApp');
        this.loadingOverlay = document.getElementById('loadingOverlay');
        this.errorBox = document.getElementById('errorBox');

        // State
        this.currentSession = null;
        this.sessions = this.loadSessions();

        // Initialize
        this.init();
    }

    /**
     * Initialize application
     */
    init() {
        this.setupEventListeners();
        this.renderRecentSessions();
        this.showSetupScreen();
    }

    /**
     * Setup all event listeners
     */
    setupEventListeners() {
        // Setup form
        const setupForm = document.getElementById('setupForm');
        setupForm?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleSetupSubmit();
        });

        // Test connection button
        const testBtn = document.getElementById('testConnection');
        testBtn?.addEventListener('click', () => this.testConnection());

        // Clear history button
        const clearHistoryBtn = document.getElementById('clearHistory');
        clearHistoryBtn?.addEventListener('click', () => this.clearHistory());

        // Guide toggle
        const guideToggle = document.getElementById('guideToggle');
        const guideContent = document.getElementById('guideContent');
        guideToggle?.addEventListener('click', () => {
            guideContent?.classList.toggle('open');
            const isOpen = guideContent?.classList.contains('open');
            guideToggle.setAttribute('aria-expanded', isOpen);
            guideContent?.setAttribute('aria-hidden', !isOpen);
        });

        // Menu button
        const menuBtn = document.getElementById('menuBtn');
        const dropdownMenu = document.getElementById('dropdownMenu');
        menuBtn?.addEventListener('click', () => {
            dropdownMenu?.classList.toggle('show');
        });

        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('#menuBtn') && !e.target.closest('#dropdownMenu')) {
                dropdownMenu?.classList.remove('show');
            }
        });

        // Menu items
        document.getElementById('exportJSON')?.addEventListener('click', () => this.exportJSON());
        document.getElementById('exportCSV')?.addEventListener('click', () => this.exportCSV());
        document.getElementById('printResults')?.addEventListener('click', () => this.printResults());
        document.getElementById('newSession')?.addEventListener('click', () => this.newSession());

        // Refresh button
        document.getElementById('refreshBtn')?.addEventListener('click', () => this.refreshData());

        // Chart controls
        document.getElementById('chartType')?.addEventListener('change', (e) => {
            this.changeChartType(e.target.value);
        });

        document.getElementById('colorScheme')?.addEventListener('change', (e) => {
            this.changeColorScheme(e.target.value);
        });

        // Error box close
        document.getElementById('closeError')?.addEventListener('click', () => {
            this.hideError();
        });
    }

    /**
     * Show setup screen
     */
    showSetupScreen() {
        this.setupScreen?.classList.add('active');
        this.mainApp?.classList.remove('active');
    }

    /**
     * Show main app
     */
    showMainApp() {
        this.setupScreen?.classList.remove('active');
        this.mainApp?.classList.add('active');
    }

    /**
     * Show loading overlay
     * @param {string} message - Loading message
     */
    showLoading(message = 'Đang tải...') {
        const loadingText = document.getElementById('loadingText');
        if (loadingText) loadingText.textContent = message;
        this.loadingOverlay?.classList.add('show');
    }

    /**
     * Hide loading overlay
     */
    hideLoading() {
        this.loadingOverlay?.classList.remove('show');
    }

    /**
     * Show error message
     * @param {string} message - Error message
     */
    showError(message) {
        const errorMessage = document.getElementById('errorMessage');
        if (errorMessage) errorMessage.textContent = message;
        this.errorBox?.classList.add('show');
    }

    /**
     * Hide error message
     */
    hideError() {
        this.errorBox?.classList.remove('show');
    }

    /**
     * Show toast notification
     * @param {string} message - Toast message
     * @param {string} type - Toast type (success, error, info)
     */
    showToast(message, type = 'info') {
        const container = document.getElementById('toastContainer');
        if (!container) return;

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;

        container.appendChild(toast);

        // Auto remove after 3 seconds
        setTimeout(() => {
            toast.classList.add('removing');
            setTimeout(() => toast.remove(), 250);
        }, 3000);
    }

    /**
     * Test connection to Google Sheets
     */
    async testConnection() {
        const csvUrlInput = document.getElementById('csvUrl');
        const csvUrl = csvUrlInput?.value.trim();

        if (!csvUrl) {
            this.showToast('Vui lòng nhập link Google Sheets CSV', 'error');
            return;
        }

        if (!this.sheetsHandler.validateUrl(csvUrl)) {
            this.showToast('Link không hợp lệ. Vui lòng kiểm tra lại.', 'error');
            return;
        }

        try {
            this.showLoading('Đang kiểm tra kết nối...');

            const data = await this.sheetsHandler.loadData(csvUrl);

            this.hideLoading();
            this.showToast(`✅ Kết nối thành công! Tìm thấy ${data.rowCount} phản hồi.`, 'success');

            // Mark as valid
            csvUrlInput?.classList.add('valid');
            csvUrlInput?.classList.remove('invalid');

        } catch (error) {
            this.hideLoading();
            this.showToast(`❌ ${error.message}`, 'error');

            csvUrlInput?.classList.add('invalid');
            csvUrlInput?.classList.remove('valid');
        }
    }

    /**
     * Handle setup form submission
     */
    async handleSetupSubmit() {
        const csvUrl = document.getElementById('csvUrl')?.value.trim();
        const surveyTitle = document.getElementById('surveyTitle')?.value.trim() || 'Khảo sát';

        if (!csvUrl) {
            this.showToast('Vui lòng nhập link Google Sheets CSV', 'error');
            return;
        }

        try {
            this.showLoading('Đang tải dữ liệu...');

            // Load data
            const parsedData = await this.sheetsHandler.loadData(csvUrl);

            // Process survey
            const surveyData = this.surveyManager.loadData(parsedData);

            // Save session
            this.currentSession = {
                csvUrl,
                title: surveyTitle,
                timestamp: new Date().toISOString(),
                totalQuestions: surveyData.totalQuestions,
                totalResponses: surveyData.totalResponses
            };
            this.saveSession(this.currentSession);

            // Show main app
            this.hideLoading();
            this.showMainApp();
            this.renderMainApp();
            this.showToast('Dữ liệu đã được tải thành công!', 'success');

        } catch (error) {
            this.hideLoading();
            this.showError(error.message);
        }
    }

    /**
     * Render main application
     */
    renderMainApp() {
        // Update header
        const displayTitle = document.getElementById('displaySurveyTitle');
        if (displayTitle) displayTitle.textContent = this.currentSession.title;

        const totalQuestions = document.getElementById('totalQuestions');
        if (totalQuestions) totalQuestions.textContent = this.surveyManager.questions.length;

        const totalResponses = document.getElementById('totalResponses');
        if (totalResponses) totalResponses.textContent = this.surveyManager.totalResponses;

        // Render questions navigation
        this.renderQuestionsNav();

        // Render first question
        this.renderQuestion(0);
    }

    /**
     * Render questions navigation
     */
    renderQuestionsNav() {
        const navList = document.getElementById('navList');
        if (!navList) return;

        navList.innerHTML = '';

        const questions = this.surveyManager.getAllQuestions();

        questions.forEach((question, index) => {
            const navItem = document.createElement('div');
            navItem.className = 'nav-item';
            if (index === 0) navItem.classList.add('active');

            navItem.innerHTML = `
                <div class="nav-item-number">Câu ${index + 1}</div>
                <div class="nav-item-text">${question.text}</div>
            `;

            navItem.addEventListener('click', () => {
                document.querySelectorAll('.nav-item').forEach(item => {
                    item.classList.remove('active');
                });
                navItem.classList.add('active');
                this.renderQuestion(index);
            });

            navList.appendChild(navItem);
        });
    }

    /**
     * Render a specific question
     * @param {number} index - Question index
     */
    renderQuestion(index) {
        this.surveyManager.setCurrentQuestion(index);
        const question = this.surveyManager.getCurrentQuestion();

        if (!question) return;

        // Update question display
        const questionNumber = document.getElementById('questionNumber');
        if (questionNumber) questionNumber.textContent = `Câu ${index + 1}`;

        const questionText = document.getElementById('questionText');
        if (questionText) questionText.textContent = question.text;

        // Update statistics
        const questionResponses = document.getElementById('questionResponses');
        if (questionResponses) questionResponses.textContent = question.totalResponses;

        const questionOptions = document.getElementById('questionOptions');
        if (questionOptions) questionOptions.textContent = question.uniqueOptions;

        const questionMostPopular = document.getElementById('questionMostPopular');
        if (questionMostPopular) {
            questionMostPopular.textContent = question.mostPopular.length > 30
                ? question.mostPopular.substring(0, 30) + '...'
                : question.mostPopular;
        }

        // Render chart
        const chartType = document.getElementById('chartType')?.value || 'bar';
        this.chartRenderer.render(question, chartType);

        // Render data table
        this.renderDataTable(question);
    }

    /**
     * Render data table
     * @param {Object} question - Question data
     */
    renderDataTable(question) {
        const tableBody = document.getElementById('dataTableBody');
        if (!tableBody) return;

        tableBody.innerHTML = '';

        question.options.forEach(option => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${option.option}</td>
                <td><strong>${option.count}</strong></td>
                <td>${option.percentage}%</td>
            `;
            tableBody.appendChild(row);
        });
    }

    /**
     * Change chart type
     * @param {string} type - New chart type
     */
    changeChartType(type) {
        const question = this.surveyManager.getCurrentQuestion();
        if (question) {
            this.chartRenderer.changeType(type, question);
        }
    }

    /**
     * Change color scheme
     * @param {string} scheme - Color scheme name
     */
    changeColorScheme(scheme) {
        this.chartRenderer.setColorScheme(scheme);
        const question = this.surveyManager.getCurrentQuestion();
        if (question) {
            this.chartRenderer.update(question);
        }
    }

    /**
     * Refresh data
     */
    async refreshData() {
        if (!this.currentSession) return;

        const refreshBtn = document.getElementById('refreshBtn');
        refreshBtn?.classList.add('loading');

        try {
            this.showToast('Đang làm mới dữ liệu...', 'info');

            const parsedData = await this.sheetsHandler.loadData(this.currentSession.csvUrl);
            const surveyData = this.surveyManager.loadData(parsedData);

            // Update current session
            this.currentSession.totalQuestions = surveyData.totalQuestions;
            this.currentSession.totalResponses = surveyData.totalResponses;
            this.currentSession.timestamp = new Date().toISOString();

            this.renderMainApp();
            this.showToast('Dữ liệu đã được cập nhật!', 'success');

        } catch (error) {
            this.showToast(`Lỗi khi làm mới: ${error.message}`, 'error');
        } finally {
            refreshBtn?.classList.remove('loading');
        }
    }

    /**
     * Export data as JSON
     */
    exportJSON() {
        const jsonData = this.surveyManager.exportJSON();
        this.downloadFile(jsonData, `survey-${Date.now()}.json`, 'application/json');
        this.showToast('Đã export JSON thành công!', 'success');
    }

    /**
     * Export data as CSV
     */
    exportCSV() {
        const csvData = this.surveyManager.exportCSV();
        this.downloadFile(csvData, `survey-${Date.now()}.csv`, 'text/csv');
        this.showToast('Đã export CSV thành công!', 'success');
    }

    /**
     * Download file
     * @param {string} content - File content
     * @param {string} filename - File name
     * @param {string} mimeType - MIME type
     */
    downloadFile(content, filename, mimeType) {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    /**
     * Print results
     */
    printResults() {
        window.print();
    }

    /**
     * Start new session
     */
    newSession() {
        if (confirm('Bạn có chắc muốn bắt đầu phiên mới? Dữ liệu hiện tại sẽ không bị mất.')) {
            this.showSetupScreen();
            this.currentSession = null;
            this.surveyManager.clear();
            this.chartRenderer.destroyChart();
        }
    }

    /**
     * Save session to localStorage
     * @param {Object} session - Session data
     */
    saveSession(session) {
        this.sessions.unshift(session);
        // Keep only last 10 sessions
        if (this.sessions.length > 10) {
            this.sessions = this.sessions.slice(0, 10);
        }
        localStorage.setItem('classSurvey_sessions', JSON.stringify(this.sessions));
        this.renderRecentSessions();
    }

    /**
     * Load sessions from localStorage
     * @returns {Array} - Array of sessions
     */
    loadSessions() {
        try {
            const stored = localStorage.getItem('classSurvey_sessions');
            return stored ? JSON.parse(stored) : [];
        } catch (error) {
            console.error('Error loading sessions:', error);
            return [];
        }
    }

    /**
     * Clear session history
     */
    clearHistory() {
        if (confirm('Bạn có chắc muốn xóa toàn bộ lịch sử?')) {
            this.sessions = [];
            localStorage.removeItem('classSurvey_sessions');
            this.renderRecentSessions();
            this.showToast('Đã xóa lịch sử', 'success');
        }
    }

    /**
     * Render recent sessions
     */
    renderRecentSessions() {
        const recentSessions = document.getElementById('recentSessions');
        const sessionsList = document.getElementById('sessionsList');

        if (!recentSessions || !sessionsList) return;

        if (this.sessions.length === 0) {
            recentSessions.classList.remove('has-sessions');
            return;
        }

        recentSessions.classList.add('has-sessions');
        sessionsList.innerHTML = '';

        this.sessions.forEach(session => {
            const item = document.createElement('div');
            item.className = 'session-item';
            item.setAttribute('role', 'listitem');

            const date = new Date(session.timestamp);
            const dateStr = date.toLocaleDateString('vi-VN');
            const timeStr = date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });

            item.innerHTML = `
                <div class="session-info">
                    <div class="session-title">${session.title}</div>
                    <div class="session-meta">${dateStr} ${timeStr} • ${session.totalQuestions} câu • ${session.totalResponses} phản hồi</div>
                </div>
            `;

            item.addEventListener('click', () => {
                document.getElementById('csvUrl').value = session.csvUrl;
                document.getElementById('surveyTitle').value = session.title;
            });

            sessionsList.appendChild(item);
        });
    }
}

// Initialize application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.app = new ClassSurveyApp();
});
