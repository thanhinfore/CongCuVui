// ============================================================================
// Live Voting Application - Production Version with Floating QR
// ============================================================================

const app = {
    // Configuration
    config: {
        csvUrl: '',
        formUrl: '',
        updateInterval: 5000,
        maxRetries: 3,
        retryDelay: 2000,
        maxHistoryItems: 20,
        debugMode: false
    },

    // Application State
    state: {
        mode: 'setup',
        questions: [],
        responses: [],
        currentView: 'single',
        selectedQuestion: 0,
        updateTimer: null,
        errorCount: 0,
        isUpdating: false,
        lastUpdateTime: null,
        previousData: null,
        sessionStartTime: null,
        sessionId: null,
        debugLogs: []
    },

    // Debounce timer
    debounceTimer: null,

    // ========================================================================
    // Lightweight Logging
    // ========================================================================

    log(message, type = 'info', data = null) {
        if (!this.config.debugMode && type !== 'error') return;

        const timestamp = new Date().toLocaleTimeString('vi-VN');

        if (type === 'error') {
            console.error(`[${timestamp}] ${message}`, data || '');
        } else if (this.config.debugMode) {
            const colors = {
                info: '#3b82f6',
                success: '#10b981',
                warning: '#f59e0b'
            };
            console.log(
                `%c[${timestamp}] ${message}`,
                `color: ${colors[type] || '#3b82f6'}; font-weight: bold;`,
                data || ''
            );
        }

        if (this.config.debugMode) {
            this.state.debugLogs.push({ timestamp, type, message, data });
            if (this.state.debugLogs.length > 100) {
                this.state.debugLogs.shift();
            }
            this.updateDebugPanel();
        }
    },

    updateDebugPanel() {
        if (!this.config.debugMode) return;

        const panel = document.getElementById('debugPanel');
        if (!panel) return;

        const logs = this.state.debugLogs.slice(-20).reverse();
        const html = logs.map(log => {
            const icon = {
                info: 'ℹ️',
                success: '✅',
                error: '❌',
                warning: '⚠️'
            }[log.type];

            return `
                <div class="debug-log ${log.type}">
                    <span class="debug-time">${log.timestamp}</span>
                    <span class="debug-icon">${icon}</span>
                    <span class="debug-msg">${log.message}</span>
                    ${log.data ? `<pre class="debug-data">${JSON.stringify(log.data, null, 2)}</pre>` : ''}
                </div>
            `;
        }).join('');

        const content = panel.querySelector('.debug-content');
        if (content) content.innerHTML = html;
    },

    // ========================================================================
    // Initialization
    // ========================================================================

    init() {
        this.parseURLParams();
        this.setupEventListeners();

        if (this.config.debugMode) {
            this.createDebugPanel();
            this.log('Debug mode enabled', 'info');
        }

        if (this.config.csvUrl && this.config.formUrl) {
            this.startVotingMode();
        } else {
            this.showSetupScreen();
        }
    },

    createDebugPanel() {
        const panel = document.createElement('div');
        panel.id = 'debugPanel';
        panel.className = 'debug-panel';
        panel.innerHTML = `
            <div class="debug-header">
                <span>🐛 Debug Console</span>
                <button class="debug-toggle" onclick="app.toggleDebugPanel()">_</button>
                <button class="debug-clear" onclick="app.clearDebugLogs()">🗑️</button>
            </div>
            <div class="debug-content"></div>
        `;
        document.body.appendChild(panel);
    },

    toggleDebugPanel() {
        const panel = document.getElementById('debugPanel');
        if (panel) panel.classList.toggle('minimized');
    },

    clearDebugLogs() {
        this.state.debugLogs = [];
        this.updateDebugPanel();
    },

    setupEventListeners() {
        const setupForm = document.getElementById('setupForm');
        if (setupForm) {
            setupForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleSetupSubmit();
            });
        }

        const formUrlInput = document.getElementById('formUrl');
        const csvUrlInput = document.getElementById('csvUrl');

        if (formUrlInput) {
            formUrlInput.addEventListener('input', () => this.validateFormUrl());
            formUrlInput.addEventListener('blur', () => this.validateFormUrl());
        }

        if (csvUrlInput) {
            csvUrlInput.addEventListener('input', () => this.validateCsvUrl());
            csvUrlInput.addEventListener('blur', () => this.validateCsvUrl());
        }

        const testBtn = document.getElementById('testConnection');
        if (testBtn) {
            testBtn.addEventListener('click', () => this.testConnection());
        }

        document.querySelectorAll('.view-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                const view = e.target.dataset.view;
                this.setView(view, e);
            });
        });

        const guideToggle = document.getElementById('guideToggle');
        const guideContent = document.getElementById('guideContent');
        if (guideToggle && guideContent) {
            guideToggle.addEventListener('click', () => {
                guideContent.classList.toggle('open');
            });
        }

        const clearHistoryBtn = document.getElementById('clearHistory');
        if (clearHistoryBtn) {
            clearHistoryBtn.addEventListener('click', () => this.clearHistory());
        }

        const menuBtn = document.getElementById('menuBtn');
        const dropdownMenu = document.getElementById('dropdownMenu');
        if (menuBtn && dropdownMenu) {
            menuBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                dropdownMenu.classList.toggle('show');
            });

            document.addEventListener('click', () => {
                dropdownMenu.classList.remove('show');
            });
        }

        const viewStatsBtn = document.getElementById('viewStats');
        const copyLinkBtn = document.getElementById('copyLink');
        const newSessionBtn = document.getElementById('newSession');

        if (viewStatsBtn) viewStatsBtn.addEventListener('click', () => this.showStatsPage());
        if (copyLinkBtn) copyLinkBtn.addEventListener('click', () => this.copyCurrentLink());
        if (newSessionBtn) newSessionBtn.addEventListener('click', () => this.newSession());

        const backToSetup = document.getElementById('backToSetup');
        const backToSetupFromError = document.getElementById('backToSetupFromError');

        if (backToSetup) backToSetup.addEventListener('click', () => this.newSession());
        if (backToSetupFromError) backToSetupFromError.addEventListener('click', () => this.newSession());

        // Keyboard shortcut for QR toggle
        document.addEventListener('keydown', (e) => {
            if (e.key === 'q' && e.ctrlKey) {
                this.toggleQRWidget();
            }
        });
    },

    parseURLParams() {
        const params = new URLSearchParams(window.location.search);

        if (params.has('csv')) {
            this.config.csvUrl = decodeURIComponent(params.get('csv'));
        }

        if (params.has('form')) {
            this.config.formUrl = decodeURIComponent(params.get('form'));
        }

        if (params.has('debug')) {
            this.config.debugMode = params.get('debug') === 'true';
        }
    },

    // ========================================================================
    // Setup Screen
    // ========================================================================

    showSetupScreen() {
        this.state.mode = 'setup';
        document.getElementById('setupScreen').classList.add('active');
        document.getElementById('mainApp').classList.remove('active');
        document.getElementById('statsDashboard').classList.remove('active');

        this.loadRecentSessions();
    },

    validateFormUrl() {
        const input = document.getElementById('formUrl');
        const validation = document.getElementById('formUrlValidation');
        const url = input.value.trim();

        if (!url) {
            input.classList.remove('valid', 'invalid');
            validation.classList.remove('success', 'error');
            return false;
        }

        const isValid = url.includes('docs.google.com/forms');

        if (isValid) {
            input.classList.add('valid');
            input.classList.remove('invalid');
            validation.classList.add('success');
            validation.classList.remove('error');
            validation.textContent = '✅ Link Google Form hợp lệ';
            return true;
        } else {
            input.classList.add('invalid');
            input.classList.remove('valid');
            validation.classList.add('error');
            validation.classList.remove('success');
            validation.textContent = '❌ Phải là link Google Form (docs.google.com/forms/...)';
            return false;
        }
    },

    validateCsvUrl() {
        const input = document.getElementById('csvUrl');
        const validation = document.getElementById('csvUrlValidation');
        const url = input.value.trim();

        if (!url) {
            input.classList.remove('valid', 'invalid');
            validation.classList.remove('success', 'error');
            return false;
        }

        const isValid = url.includes('docs.google.com/spreadsheets') &&
            (url.includes('/pub?') || url.includes('/export?'));

        if (isValid) {
            input.classList.add('valid');
            input.classList.remove('invalid');
            validation.classList.add('success');
            validation.classList.remove('error');
            validation.textContent = '✅ Link CSV hợp lệ';
            return true;
        } else {
            input.classList.add('invalid');
            input.classList.remove('valid');
            validation.classList.add('error');
            validation.classList.remove('success');
            validation.textContent = '❌ Phải là link CSV đã publish (File → Share → Publish to web → CSV)';
            return false;
        }
    },

    async testConnection() {
        const formUrlValid = this.validateFormUrl();
        const csvUrlValid = this.validateCsvUrl();

        if (!formUrlValid || !csvUrlValid) {
            this.showToast('❌ Vui lòng nhập link hợp lệ', 'error');
            return;
        }

        const testBtn = document.getElementById('testConnection');
        const originalText = testBtn.textContent;
        testBtn.textContent = '⏳ Đang kiểm tra...';
        testBtn.disabled = true;

        this.showLoadingOverlay(true, 'Đang kiểm tra kết nối...');

        try {
            const csvUrl = document.getElementById('csvUrl').value.trim();
            const response = await fetch(`${csvUrl}&t=${Date.now()}`, {
                cache: 'no-store'
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const text = await response.text();
            const { headers, rows } = this.parseCSV(text);

            if (headers.length === 0) {
                throw new Error('CSV không có header (dòng đầu trống)');
            }

            if (rows.length === 0) {
                this.showToast(`✅ Kết nối OK! Chưa có response. Headers: ${headers.length} columns`, 'success');
            } else {
                this.showToast(`✅ Kết nối thành công! ${rows.length} responses, ${headers.length} questions`, 'success');
            }

        } catch (error) {
            this.log('Test connection failed', 'error', error);
            this.showToast(`❌ Lỗi: ${error.message}`, 'error');
        } finally {
            testBtn.textContent = originalText;
            testBtn.disabled = false;
            this.showLoadingOverlay(false);
        }
    },

    async handleSetupSubmit() {
        const formUrl = document.getElementById('formUrl').value.trim();
        const csvUrl = document.getElementById('csvUrl').value.trim();

        if (!this.validateFormUrl() || !this.validateCsvUrl()) {
            this.showToast('❌ Vui lòng nhập link hợp lệ', 'error');
            return;
        }

        this.saveToHistory(formUrl, csvUrl);

        const debugParam = this.config.debugMode ? '&debug=true' : '';
        const newUrl = `${window.location.pathname}?form=${encodeURIComponent(formUrl)}&csv=${encodeURIComponent(csvUrl)}${debugParam}`;
        window.location.href = newUrl;
    },

    // ========================================================================
    // Session History
    // ========================================================================

    saveToHistory(formUrl, csvUrl) {
        const history = this.getHistory();

        const session = {
            id: Date.now().toString(),
            formUrl,
            csvUrl,
            timestamp: new Date().toISOString(),
            title: this.extractFormTitle(formUrl)
        };

        history.unshift(session);
        const trimmed = history.slice(0, this.config.maxHistoryItems);
        localStorage.setItem('votingHistory', JSON.stringify(trimmed));
    },

    getHistory() {
        try {
            const data = localStorage.getItem('votingHistory');
            return data ? JSON.parse(data) : [];
        } catch (error) {
            return [];
        }
    },

    clearHistory() {
        if (confirm('Xóa toàn bộ lịch sử phiên khảo sát?')) {
            localStorage.removeItem('votingHistory');
            this.loadRecentSessions();
            this.showToast('🗑️ Đã xóa lịch sử', 'success');
        }
    },

    extractFormTitle(formUrl) {
        const match = formUrl.match(/\/forms\/d\/e\/([^\/]+)/);
        return match ? `Form ${match[1].substring(0, 8)}...` : 'Khảo sát';
    },

    loadRecentSessions() {
        const history = this.getHistory();
        const container = document.getElementById('recentSessions');
        const list = document.getElementById('sessionsList');

        if (history.length === 0) {
            container.classList.remove('has-sessions');
            return;
        }

        container.classList.add('has-sessions');

        const html = history.slice(0, 5).map(session => {
            const date = new Date(session.timestamp);
            const formattedDate = date.toLocaleDateString('vi-VN') + ' ' +
                date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });

            return `
                <div class="session-item" onclick="app.loadSession('${session.id}')">
                    <div class="session-info">
                        <div class="session-title">${session.title}</div>
                        <div class="session-meta">📅 ${formattedDate}</div>
                    </div>
                    <div style="color: var(--primary); font-weight: 600;">→</div>
                </div>
            `;
        }).join('');

        list.innerHTML = html;
    },

    loadSession(sessionId) {
        const history = this.getHistory();
        const session = history.find(s => s.id === sessionId);

        if (session) {
            document.getElementById('formUrl').value = session.formUrl;
            document.getElementById('csvUrl').value = session.csvUrl;
            this.validateFormUrl();
            this.validateCsvUrl();
            this.showToast('✅ Đã tải phiên khảo sát', 'success');
        }
    },

    // ========================================================================
    // Voting Mode
    // ========================================================================

    startVotingMode() {
        this.state.mode = 'voting';
        this.state.sessionStartTime = Date.now();
        this.state.sessionId = Date.now().toString();

        document.getElementById('setupScreen').classList.remove('active');
        document.getElementById('mainApp').classList.add('active');
        document.getElementById('statsDashboard').classList.remove('active');

        // CRITICAL: Clear any previous errors
        this.hideError();
        this.state.errorCount = 0;

        this.generateQR();

        // Restore QR widget state
        const wasMinimized = localStorage.getItem('qrWidgetMinimized') === 'true';
        if (wasMinimized) {
            const widget = document.getElementById('qrWidget');
            if (widget) widget.classList.add('minimized');
        }

        this.showLoadingOverlay(true, 'Đang tải dữ liệu...');
        this.loadData();
        this.startAutoUpdate();
    },

    updateSessionStats() {
        const sessions = this.getSessionStats();

        const currentSession = {
            id: this.state.sessionId,
            formUrl: this.config.formUrl,
            csvUrl: this.config.csvUrl,
            startTime: this.state.sessionStartTime,
            lastUpdate: Date.now(),
            totalResponses: this.state.responses.length,
            totalQuestions: this.state.questions.length
        };

        const index = sessions.findIndex(s => s.id === this.state.sessionId);
        if (index >= 0) {
            sessions[index] = currentSession;
        } else {
            sessions.unshift(currentSession);
        }

        const trimmed = sessions.slice(0, 50);
        localStorage.setItem('sessionStats', JSON.stringify(trimmed));
    },

    getSessionStats() {
        try {
            const data = localStorage.getItem('sessionStats');
            return data ? JSON.parse(data) : [];
        } catch (error) {
            return [];
        }
    },

    generateQR() {
        const container = document.getElementById('qrcode');
        if (!container) return;

        // Only generate once
        if (container.children.length > 0) return;

        container.innerHTML = '';

        try {
            new QRCode(container, {
                text: this.config.formUrl,
                width: 200,
                height: 200,
                colorDark: '#000000',
                colorLight: '#ffffff',
                correctLevel: QRCode.CorrectLevel.H
            });
        } catch (error) {
            this.log('QR generation failed', 'error', error);
            container.innerHTML = '<p style="color: #ef4444;">Không thể tạo mã QR</p>';
        }
    },

    toggleQRWidget() {
        const widget = document.getElementById('qrWidget');
        if (widget) {
            widget.classList.toggle('minimized');

            const isMinimized = widget.classList.contains('minimized');
            localStorage.setItem('qrWidgetMinimized', isMinimized);
        }
    },

    // ========================================================================
    // Data Loading & Parsing (with debounce)
    // ========================================================================

    async loadData() {
        if (this.state.isUpdating) {
            this.log('Update in progress, skipping', 'warning');
            return;
        }

        // Debounce rapid calls
        if (this.debounceTimer) {
            clearTimeout(this.debounceTimer);
        }

        return new Promise((resolve) => {
            this.debounceTimer = setTimeout(async () => {
                await this._performUpdate();
                resolve();
            }, 300);
        });
    },

    async _performUpdate() {
        this.state.isUpdating = true;
        this.showUpdateIndicator(true);

        const wasAutoUpdating = !!this.state.updateTimer;
        if (wasAutoUpdating) {
            clearInterval(this.state.updateTimer);
        }

        try {
            const timestamp = Date.now();
            const url = `${this.config.csvUrl}${this.config.csvUrl.includes('?') ? '&' : '?'}t=${timestamp}`;

            const response = await fetch(url, {
                cache: 'no-store'
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const text = await response.text();
            const { headers, rows } = this.parseCSV(text);

            const needsInitialRender = this.state.questions.length === 0;
            const newDataHash = this.hashData(rows);
            const hasChanged = this.state.previousData !== newDataHash;

            if (needsInitialRender || hasChanged) {
                this.processData(headers, rows);

                await new Promise(resolve => requestAnimationFrame(resolve));

                this.updateUI();

                await new Promise(resolve => setTimeout(resolve, 100));
                this.state.previousData = newDataHash;

                this.updateSessionStats();

                if (this.state.lastUpdateTime) {
                    this.showToast('✅ Dữ liệu đã cập nhật', 'success', 1500);
                }
            }

            // CRITICAL: Always hide error on success
            this.hideError();
            this.state.errorCount = 0;
            this.state.lastUpdateTime = Date.now();

            // CRITICAL: Force update stats even if no data change
            this.updateStats();

        } catch (error) {
            this.log('Load data failed', 'error', error);
            this.handleLoadError(error);
        } finally {
            this.state.isUpdating = false;
            this.showUpdateIndicator(false);
            this.showLoadingOverlay(false);

            if (wasAutoUpdating) {
                this.startAutoUpdate();
            }
        }
    },

    parseCSV(text) {
        try {
            text = text.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n').replace(/\r/g, '\n');
            const lines = text.split('\n').filter(line => line.trim());

            if (lines.length === 0) return { headers: [], rows: [] };

            const parseRow = (row) => {
                const result = [];
                let current = '';
                let inQuotes = false;

                for (let i = 0; i < row.length; i++) {
                    const char = row[i];

                    if (char === '"') {
                        if (inQuotes && row[i + 1] === '"') {
                            current += '"';
                            i++;
                        } else {
                            inQuotes = !inQuotes;
                        }
                    } else if (char === ',' && !inQuotes) {
                        result.push(current.trim());
                        current = '';
                    } else {
                        current += char;
                    }
                }
                result.push(current.trim());
                return result;
            };

            const headers = parseRow(lines[0]);
            const rows = lines.slice(1)
                .map(line => parseRow(line))
                .filter(row => row.length === headers.length && row.some(cell => cell));

            return { headers, rows };

        } catch (error) {
            this.log('CSV parse error', 'error', error);
            return { headers: [], rows: [] };
        }
    },

    processData(headers, rows) {
        this.state.questions = headers.slice(1).map((header, idx) => ({
            id: idx + 1,
            text: header || `Câu hỏi ${idx + 1}`,
            columnIndex: idx + 1
        }));

        this.state.responses = rows;
    },

    hashData(data) {
        return JSON.stringify(data).length + '-' + data.length;
    },

    handleLoadError(error) {
        this.state.errorCount++;

        if (this.state.errorCount > this.config.maxRetries) {
            const errorMsg = `Không thể tải dữ liệu sau ${this.config.maxRetries} lần thử. 

Chi tiết lỗi: ${error.message}

Kiểm tra:
1. Google Sheets đã Publish to web chưa?
2. Link CSV có chứa '/pub?' hoặc '/export?' không?
3. Sheet có dữ liệu chưa?`;

            this.showError(errorMsg);
            this.showToast('❌ Lỗi kết nối dữ liệu', 'error');
        } else {
            setTimeout(() => this.loadData(), this.config.retryDelay * this.state.errorCount);
        }
    },

    // ========================================================================
    // UI Updates
    // ========================================================================

    updateUI() {
        this.log('Updating UI...', 'info');

        try {
            this.updateNavigation();
            this.updateQuestions();
            this.updateStats();

            // CRITICAL: Hide error if we successfully updated UI with data
            if (this.state.questions.length > 0) {
                this.hideError();
            }
        } catch (error) {
            this.log('UI update error', 'error', error);
            this.showError('Lỗi hiển thị dữ liệu: ' + error.message);
        }
    },

    updateNavigation() {
        const nav = document.getElementById('questionNav');
        const newHtml = this.state.questions.map((q, idx) => {
            const responses = this.getQuestionResponses(q.columnIndex);
            const count = responses.reduce((sum, r) => sum + r.count, 0);

            return `
                <div class="nav-item ${idx === this.state.selectedQuestion ? 'active' : ''}"
                     onclick="app.selectQuestion(${idx})">
                    <span>${q.text}</span>
                    <span style="opacity: 0.7">${count}</span>
                </div>
            `;
        }).join('');

        if (nav.innerHTML !== newHtml) {
            nav.innerHTML = newHtml || '<div class="empty-state">Chưa có câu hỏi</div>';
        }
    },

    updateQuestions() {
        const grid = document.getElementById('questionsGrid');
        if (!grid) return;

        let questionsToShow = [];

        if (this.state.currentView === 'single') {
            if (this.state.questions[this.state.selectedQuestion]) {
                questionsToShow = [this.state.questions[this.state.selectedQuestion]];
            }
        } else {
            questionsToShow = this.state.questions;
        }

        if (questionsToShow.length === 0) {
            grid.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">📭</div>
                    <div>Chưa có dữ liệu câu hỏi</div>
                </div>
            `;
            return;
        }

        try {
            const newHtml = questionsToShow.map(question =>
                this.renderQuestionCard(question)
            ).join('');

            requestAnimationFrame(() => {
                grid.innerHTML = newHtml;
            });

        } catch (error) {
            this.log('Render error', 'error', error);
            grid.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">⚠️</div>
                    <div>Lỗi khi render câu hỏi</div>
                </div>
            `;
        }
    },

    renderQuestionCard(question) {
        const responses = this.getQuestionResponses(question.columnIndex);
        const totalCount = responses.reduce((sum, r) => sum + r.count, 0);

        const votesHtml = responses.length > 0
            ? responses.map((response, idx) => this.renderVoteItem(response, idx)).join('')
            : `
                <div class="empty-state">
                    <div class="empty-icon">📥</div>
                    <div>Chưa có phản hồi cho câu hỏi này</div>
                </div>
            `;

        return `
            <div class="question-card" data-question-id="${question.id}">
                <div class="question-header">
                    <div class="question-label">CÂU HỎI ${question.id}</div>
                    <div class="question-text">${question.text}</div>
                    <div class="question-meta">
                        <div>👥 <strong>${totalCount}</strong> phản hồi</div>
                        <div>📊 <strong>${responses.length}</strong> lựa chọn</div>
                    </div>
                </div>
                <div class="vote-list">
                    ${votesHtml}
                </div>
            </div>
        `;
    },

    renderVoteItem(response, index) {
        const rankClass = index === 0 ? 'rank-1' : index === 1 ? 'rank-2' : index === 2 ? 'rank-3' : '';
        const barClass = `bar-${Math.min(index + 1, 3)}`;

        return `
            <div class="vote-item" data-option="${response.option}">
                <div class="vote-header">
                    <div class="vote-option">
                        ${rankClass ? `<span class="vote-rank ${rankClass}">${index + 1}</span>` : ''}
                        ${response.option}
                    </div>
                    <div>
                        <strong>${response.count}</strong> phiếu
                        (${response.percentage}%)
                    </div>
                </div>
                <div class="vote-bar-container">
                    <div class="vote-bar ${barClass}" style="width: ${response.percentage}%" data-percentage="${response.percentage}">
                        ${response.percentage}%
                    </div>
                </div>
            </div>
        `;
    },

    getQuestionResponses(columnIndex) {
        const votes = {};
        let total = 0;

        this.state.responses.forEach(row => {
            const value = row[columnIndex];
            if (value && value.trim()) {
                votes[value] = (votes[value] || 0) + 1;
                total++;
            }
        });

        return Object.entries(votes)
            .map(([option, count]) => ({
                option,
                count,
                percentage: total > 0 ? ((count / total) * 100).toFixed(1) : '0'
            }))
            .sort((a, b) => b.count - a.count);
    },

    updateStats() {
        const totalVotesElem = document.getElementById('totalVotes');
        const totalQuestionsElem = document.getElementById('totalQuestions');
        const updateTimeElem = document.getElementById('updateTime');

        // CRITICAL: Always update, even if value is 0
        if (totalVotesElem) {
            const newValue = this.state.responses.length;
            this.animateNumber(totalVotesElem, newValue);
        }

        if (totalQuestionsElem) {
            const newValue = this.state.questions.length;
            this.animateNumber(totalQuestionsElem, newValue);
        }

        if (updateTimeElem) {
            updateTimeElem.textContent = new Date().toLocaleTimeString('vi-VN', {
                hour: '2-digit',
                minute: '2-digit'
            });
        }
    },

    animateNumber(element, newValue) {
        if (!element) return;

        const oldValue = parseInt(element.textContent) || 0;

        // Always update, even if same value (to ensure consistency)
        element.classList.add('updating');
        element.textContent = newValue;
        setTimeout(() => element.classList.remove('updating'), 400);
    },

    // ========================================================================
    // Statistics Dashboard
    // ========================================================================

    showStatsPage() {
        this.state.mode = 'stats';
        document.getElementById('setupScreen').classList.remove('active');
        document.getElementById('mainApp').classList.remove('active');
        document.getElementById('statsDashboard').classList.add('active');

        this.loadStatsGrid();
    },

    loadStatsGrid() {
        const sessions = this.getSessionStats();
        const grid = document.getElementById('statsGrid');

        if (sessions.length === 0) {
            grid.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">📊</div>
                    <div>Chưa có phiên khảo sát nào</div>
                </div>
            `;
            return;
        }

        const html = sessions.map(session => {
            const startDate = new Date(session.startTime);
            const duration = Math.round((session.lastUpdate - session.startTime) / 1000 / 60);

            return `
                <div class="stat-card">
                    <div class="stat-card-header">
                        <div class="stat-card-title">
                            📊 Phiên ${startDate.toLocaleDateString('vi-VN')}
                        </div>
                        <div class="stat-card-date">
                            ${startDate.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                    </div>
                    <div class="stat-card-metrics">
                        <div class="metric">
                            <div class="metric-value">${session.totalResponses}</div>
                            <div class="metric-label">Phản hồi</div>
                        </div>
                        <div class="metric">
                            <div class="metric-value">${session.totalQuestions}</div>
                            <div class="metric-label">Câu hỏi</div>
                        </div>
                        <div class="metric">
                            <div class="metric-value">${duration}</div>
                            <div class="metric-label">Phút</div>
                        </div>
                        <div class="metric">
                            <div class="metric-value">${session.totalQuestions > 0 ? (session.totalResponses / session.totalQuestions).toFixed(1) : '0'}</div>
                            <div class="metric-label">TB/Câu</div>
                        </div>
                    </div>
                    <div class="stat-card-actions">
                        <button class="action-btn primary" onclick="app.reloadSession('${session.id}')">
                            🔄 Tải lại
                        </button>
                        <button class="action-btn secondary" onclick="app.copySessionLink('${session.id}')">
                            🔗 Copy link
                        </button>
                    </div>
                </div>
            `;
        }).join('');

        grid.innerHTML = html;
    },

    reloadSession(sessionId) {
        const sessions = this.getSessionStats();
        const session = sessions.find(s => s.id === sessionId);

        if (session) {
            const debugParam = this.config.debugMode ? '&debug=true' : '';
            const url = `${window.location.pathname}?form=${encodeURIComponent(session.formUrl)}&csv=${encodeURIComponent(session.csvUrl)}${debugParam}`;
            window.location.href = url;
        }
    },

    copySessionLink(sessionId) {
        const sessions = this.getSessionStats();
        const session = sessions.find(s => s.id === sessionId);

        if (session) {
            const url = `${window.location.origin}${window.location.pathname}?form=${encodeURIComponent(session.formUrl)}&csv=${encodeURIComponent(session.csvUrl)}`;

            navigator.clipboard.writeText(url).then(() => {
                this.showToast('✅ Đã copy link', 'success');
            });
        }
    },

    // ========================================================================
    // User Actions
    // ========================================================================

    selectQuestion(index) {
        if (this.state.selectedQuestion === index) return;

        this.state.selectedQuestion = index;
        this.updateUI();
    },

    setView(view, event) {
        this.state.currentView = view;

        document.querySelectorAll('.view-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        event.target.classList.add('active');

        this.updateQuestions();
    },

    forceRefresh() {
        const btn = document.getElementById('refreshBtn');
        btn.classList.add('loading');

        this.loadData().finally(() => {
            setTimeout(() => btn.classList.remove('loading'), 500);
        });
    },

    copyCurrentLink() {
        const url = window.location.href;
        navigator.clipboard.writeText(url).then(() => {
            this.showToast('✅ Đã copy link chia sẻ', 'success');
        });
    },

    newSession() {
        if (this.state.updateTimer) {
            clearInterval(this.state.updateTimer);
        }

        const debugParam = this.config.debugMode ? '?debug=true' : '';
        window.location.href = window.location.pathname + debugParam;
    },

    // ========================================================================
    // Auto Update
    // ========================================================================

    startAutoUpdate() {
        if (this.state.updateTimer) {
            clearInterval(this.state.updateTimer);
        }

        this.state.updateTimer = setInterval(() => {
            if (!this.state.isUpdating && this.state.mode === 'voting') {
                this.loadData();
            }
        }, this.config.updateInterval);
    },

    // ========================================================================
    // UI Helpers
    // ========================================================================

    showLoadingOverlay(show, text = 'Đang tải...') {
        const overlay = document.getElementById('loadingOverlay');
        if (!overlay) return;

        const textElem = overlay.querySelector('.loading-text');
        if (textElem) textElem.textContent = text;

        if (show) {
            overlay.classList.add('show');
        } else {
            overlay.classList.remove('show');
        }
    },

    showUpdateIndicator(show) {
        const indicator = document.getElementById('updateIndicator');
        if (indicator) {
            if (show) {
                indicator.classList.add('show');
            } else {
                indicator.classList.remove('show');
            }
        }
    },

    showError(message) {
        const box = document.getElementById('errorBox');
        const msg = document.getElementById('errorMessage');
        if (box && msg) {
            msg.textContent = message;
            box.classList.add('show');
        }
    },

    hideError() {
        const box = document.getElementById('errorBox');
        if (box) box.classList.remove('show');
    },

    showToast(message, type = 'info', duration = 3000) {
        const container = document.getElementById('toastContainer');
        if (!container) return;

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;

        container.appendChild(toast);

        setTimeout(() => {
            toast.classList.add('removing');
            setTimeout(() => toast.remove(), 300);
        }, duration);
    }
};

// ============================================================================
// Initialize Application
// ============================================================================

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => app.init());
} else {
    app.init();
}