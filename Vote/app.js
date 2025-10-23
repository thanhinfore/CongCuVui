// ============================================================================
// Live Voting Application - Ultra Fast Classroom Edition
// ============================================================================

const VotingApp = (() => {
    'use strict';

    // ========================================================================
    // CONSTANTS - OPTIMIZED FOR CLASSROOM
    // ========================================================================

    const CONFIG = Object.freeze({
        UPDATE_INTERVAL: 2000,        // 2s - Fast classroom updates
        MAX_RETRIES: 3,
        RETRY_DELAY_BASE: 1000,       // Faster retry
        MAX_HISTORY_ITEMS: 20,
        MAX_SESSION_STATS: 50,
        MAX_DEBUG_LOGS: 100,
        DEBOUNCE_DELAY: 100,          // 100ms - Instant feel
        ANIMATION_DURATION: 300,      // 300ms - Snappy
        STAGGER_DELAY: 30,            // Faster stagger
        TOAST_DURATION: 2000,         // Shorter toasts
        LOCALSTORAGE_PREFIX: 'voting_app_'
    });

    const STATE = Object.freeze({
        IDLE: 'idle',
        SETUP: 'setup',
        LOADING: 'loading',
        VOTING: 'voting',
        ERROR: 'error',
        STATS: 'stats'
    });

    const VIEW_MODE = Object.freeze({
        SINGLE: 'single',
        ALL: 'all'
    });

    // ========================================================================
    // PERCENTAGE CALCULATOR - Largest Remainder Method (FIXED)
    // ========================================================================

    class PercentageCalculator {
        static calculate(counts) {
            // Handle edge cases
            if (!counts || counts.length === 0) {
                console.warn('PercentageCalculator: Empty counts');
                return [];
            }

            const total = counts.reduce((sum, c) => sum + c, 0);

            if (total === 0) {
                console.warn('PercentageCalculator: Zero total');
                return counts.map(() => '0.0');
            }

            // Single item gets 100%
            if (counts.length === 1) {
                return ['100.0'];
            }

            // Step 1: Calculate exact percentages
            const exactPercentages = counts.map(count => (count / total) * 100);

            // Step 2: Get integer parts (round DOWN)
            const integerParts = exactPercentages.map(p => Math.floor(p));

            // Step 3: Get decimal parts with index tracking
            const decimalParts = exactPercentages.map((p, i) => ({
                index: i,
                decimal: p - integerParts[i]
            }));

            // Step 4: Calculate how many units to distribute
            const currentSum = integerParts.reduce((acc, val) => acc + val, 0);
            let remaining = 100 - currentSum;

            console.log('PercentageCalculator DEBUG:', {
                counts,
                total,
                exactPercentages,
                integerParts,
                currentSum,
                remaining
            });

            // Safety check
            if (remaining < 0) {
                console.error('PercentageCalculator: Negative remaining!', remaining);
                remaining = 0;
            }

            if (remaining > counts.length) {
                console.error('PercentageCalculator: Remaining > length!', { remaining, length: counts.length });
                remaining = counts.length;
            }

            // Step 5: Sort by decimal part (largest first)
            decimalParts.sort((a, b) => b.decimal - a.decimal);

            // Step 6: Distribute remaining percentages to largest decimals
            const finalPercentages = [...integerParts];

            for (let i = 0; i < remaining && i < decimalParts.length; i++) {
                const targetIndex = decimalParts[i].index;
                finalPercentages[targetIndex] += 1;
            }

            // Step 7: Format with 1 decimal place
            const result = finalPercentages.map(p => p.toFixed(1));

            // Verify sum = 100
            const sum = finalPercentages.reduce((acc, val) => acc + val, 0);
            if (Math.abs(sum - 100) > 0.01) {
                console.error('PercentageCalculator: Sum != 100!', {
                    sum,
                    finalPercentages,
                    result
                });
            }

            console.log('PercentageCalculator RESULT:', {
                finalPercentages,
                result,
                sum
            });

            return result;
        }
    }

    // ========================================================================
    // DATA COMPARATOR
    // ========================================================================

    class DataComparator {
        static compareQuestions(oldQuestions, newQuestions) {
            if (!oldQuestions || oldQuestions.length === 0) {
                return { hasChanges: true, isInitial: true };
            }

            if (oldQuestions.length !== newQuestions.length) {
                return { hasChanges: true, isInitial: false };
            }

            for (let i = 0; i < oldQuestions.length; i++) {
                if (oldQuestions[i].text !== newQuestions[i].text) {
                    return { hasChanges: true, isInitial: false };
                }
            }

            return { hasChanges: false, isInitial: false };
        }

        static compareResponses(oldResponses, newResponses, questions) {
            if (!oldResponses || oldResponses.length === 0) {
                return {
                    hasChanges: true,
                    isInitial: true,
                    changes: []
                };
            }

            if (oldResponses.length !== newResponses.length) {
                const changes = this._computeDetailedChanges(oldResponses, newResponses, questions);
                return {
                    hasChanges: true,
                    isInitial: false,
                    changes,
                    newVoteCount: newResponses.length - oldResponses.length
                };
            }

            const changes = this._computeDetailedChanges(oldResponses, newResponses, questions);

            return {
                hasChanges: changes.length > 0,
                isInitial: false,
                changes,
                newVoteCount: 0
            };
        }

        static _computeDetailedChanges(oldResponses, newResponses, questions) {
            const changes = [];

            questions.forEach(question => {
                const oldVotes = this._aggregateVotes(oldResponses, question.columnIndex);
                const newVotes = this._aggregateVotes(newResponses, question.columnIndex);

                const questionChanges = this._compareVoteCounts(oldVotes, newVotes, question.id);
                if (questionChanges.length > 0) {
                    changes.push({
                        questionId: question.id,
                        optionChanges: questionChanges
                    });
                }
            });

            return changes;
        }

        static _aggregateVotes(responses, columnIndex) {
            const votes = {};

            responses.forEach(row => {
                const value = row[columnIndex];
                if (value && value.trim()) {
                    votes[value] = (votes[value] || 0) + 1;
                }
            });

            return votes;
        }

        static _compareVoteCounts(oldVotes, newVotes, questionId) {
            const changes = [];
            const allOptions = new Set([
                ...Object.keys(oldVotes),
                ...Object.keys(newVotes)
            ]);

            allOptions.forEach(option => {
                const oldCount = oldVotes[option] || 0;
                const newCount = newVotes[option] || 0;

                if (oldCount !== newCount) {
                    changes.push({
                        option,
                        oldCount,
                        newCount,
                        delta: newCount - oldCount
                    });
                }
            });

            return changes;
        }

        static createDataFingerprint(responses) {
            if (!responses || responses.length === 0) return 'empty-0';
            const content = responses.map(row => row.join('|')).join('||');
            return `${responses.length}-${this._simpleHash(content)}`;
        }

        static _simpleHash(str) {
            let hash = 0;
            for (let i = 0; i < str.length; i++) {
                const char = str.charCodeAt(i);
                hash = ((hash << 5) - hash) + char;
                hash = hash & hash;
            }
            return Math.abs(hash).toString(36);
        }
    }

    // ========================================================================
    // VERSIONED DATA STORE
    // ========================================================================

    class VersionedDataStore {
        constructor() {
            this.version = 0;
            this.data = {
                questions: [],
                responses: [],
                fingerprint: null,
                timestamp: null
            };
        }

        shouldUpdate(newFingerprint, newResponseCount) {
            if (this.data.responses.length > newResponseCount) {
                return false;
            }
            return this.data.fingerprint !== newFingerprint;
        }

        update(questions, responses, fingerprint) {
            if (!this.shouldUpdate(fingerprint, responses.length)) {
                return false;
            }

            this.version++;
            this.data = {
                questions: [...questions],
                responses: [...responses],
                fingerprint,
                timestamp: Date.now()
            };

            return true;
        }

        get() {
            return {
                ...this.data,
                version: this.version
            };
        }

        getQuestions() {
            return [...this.data.questions];
        }

        getResponses() {
            return [...this.data.responses];
        }
    }

    // ========================================================================
    // ANIMATION QUEUE - Faster
    // ========================================================================

    class AnimationQueue {
        constructor() {
            this.queue = [];
            this.isProcessing = false;
        }

        add(animation) {
            this.queue.push(animation);
            if (!this.isProcessing) {
                this.process();
            }
        }

        async process() {
            this.isProcessing = true;

            while (this.queue.length > 0) {
                const animation = this.queue.shift();
                try {
                    await animation();
                } catch (error) {
                    console.error('Animation error:', error);
                }
            }

            this.isProcessing = false;
        }

        clear() {
            this.queue = [];
            this.isProcessing = false;
        }
    }

    // ========================================================================
    // SMOOTH RENDERER - Optimized
    // ========================================================================

    class SmoothRenderer {
        constructor(animationQueue) {
            this.animationQueue = animationQueue;
            this.pendingUpdates = new Map();
            this.rafId = null;
        }

        scheduleUpdate(key, updateFn) {
            this.pendingUpdates.set(key, updateFn);

            if (!this.rafId) {
                this.rafId = requestAnimationFrame(() => this._flush());
            }
        }

        _flush() {
            const updates = Array.from(this.pendingUpdates.entries());
            this.pendingUpdates.clear();
            this.rafId = null;

            updates.forEach(([key, fn]) => {
                try {
                    fn();
                } catch (error) {
                    console.error(`Update error [${key}]:`, error);
                }
            });
        }

        updateNumber(element, newValue) {
            if (!element) return;

            const oldValue = parseInt(element.textContent) || 0;
            if (oldValue === newValue) return;

            // Instant update for classroom - no animation
            element.classList.add('updating');
            element.textContent = newValue;

            setTimeout(() => {
                element.classList.remove('updating');
            }, CONFIG.ANIMATION_DURATION);
        }

        updateVoteBar(questionId, option, newPercentage, newCount) {
            const card = document.querySelector(`[data-question-id="${questionId}"]`);
            if (!card) {
                console.warn('updateVoteBar: Card not found', questionId);
                return;
            }

            const voteItem = Array.from(card.querySelectorAll('.vote-item'))
                .find(item => item.dataset.option === option);

            if (!voteItem) {
                console.warn('updateVoteBar: Vote item not found', { questionId, option });
                return;
            }

            const bar = voteItem.querySelector('.vote-bar');
            const countElem = voteItem.querySelector('.vote-header > div:last-child');

            if (bar && countElem) {
                console.log('updateVoteBar:', { questionId, option, newPercentage, newCount });

                // Instant update with brief highlight
                voteItem.classList.add('updating');

                bar.style.width = `${newPercentage}%`;
                bar.textContent = `${newPercentage}%`;
                countElem.innerHTML = `<strong>${newCount}</strong> phiếu (${newPercentage}%)`;

                setTimeout(() => {
                    voteItem.classList.remove('updating');
                }, CONFIG.ANIMATION_DURATION);
            }
        }

        updateQuestion(question, oldData, newData) {
            const card = document.querySelector(`[data-question-id="${question.id}"]`);
            if (!card) return;

            const oldResponses = this._getQuestionResponses(oldData.responses, question.columnIndex);
            const newResponses = this._getQuestionResponses(newData.responses, question.columnIndex);

            newResponses.forEach((newResp, index) => {
                const oldResp = oldResponses.find(r => r.option === newResp.option);

                if (!oldResp || oldResp.count !== newResp.count || oldResp.percentage !== newResp.percentage) {
                    this.updateVoteBar(question.id, newResp.option, newResp.percentage, newResp.count);
                }
            });

            const totalCount = newResponses.reduce((sum, r) => sum + r.count, 0);
            const metaElem = card.querySelector('.question-meta > div:first-child strong');
            if (metaElem) {
                this.updateNumber(metaElem, totalCount);
            }
        }

        fullRender(questionsToShow, dataStore) {
            const grid = document.getElementById('questionsGrid');
            if (!grid) return;

            // Validate input
            if (!questionsToShow || questionsToShow.length === 0) {
                grid.innerHTML = `
                    <div class="empty-state">
                        <div class="empty-icon">📭</div>
                        <div>Chưa có dữ liệu câu hỏi</div>
                    </div>
                `;
                return;
            }

            const data = dataStore.get();

            // Validate data
            if (!data || !data.responses) {
                grid.innerHTML = `
                    <div class="empty-state">
                        <div class="empty-icon">⚠️</div>
                        <div>Lỗi dữ liệu</div>
                    </div>
                `;
                return;
            }

            try {
                const html = questionsToShow.map(q => this._renderQuestionCard(q, data)).join('');

                // Fast render without complex animations
                grid.style.opacity = '0.7';

                requestAnimationFrame(() => {
                    grid.innerHTML = html;
                    grid.style.opacity = '1';
                });
            } catch (error) {
                console.error('Render error:', error);
                grid.innerHTML = `
                    <div class="empty-state">
                        <div class="empty-icon">⚠️</div>
                        <div>Lỗi khi hiển thị câu hỏi</div>
                    </div>
                `;
            }
        }

        _renderQuestionCard(question, data) {
            // Validate question
            if (!question || !question.columnIndex) {
                return `
                    <div class="question-card">
                        <div class="empty-state">
                            <div class="empty-icon">⚠️</div>
                            <div>Dữ liệu câu hỏi không hợp lệ</div>
                        </div>
                    </div>
                `;
            }

            const responses = this._getQuestionResponses(data.responses, question.columnIndex);
            const totalCount = responses.reduce((sum, r) => sum + r.count, 0);

            const votesHtml = responses.length > 0
                ? responses.map((r, idx) => this._renderVoteItem(r, idx)).join('')
                : `<div class="empty-state"><div class="empty-icon">📥</div><div>Chưa có phản hồi</div></div>`;

            return `
                <div class="question-card" data-question-id="${question.id}">
                    <div class="question-header">
                        <div class="question-label">CÂU HỎI ${question.id}</div>
                        <div class="question-text">${this._escapeHtml(question.text)}</div>
                        <div class="question-meta">
                            <div>👥 <strong>${totalCount}</strong> phản hồi</div>
                            <div>📊 <strong>${responses.length}</strong> lựa chọn</div>
                        </div>
                    </div>
                    <div class="vote-list">${votesHtml}</div>
                </div>
            `;
        }

        _renderVoteItem(response, index) {
            const rankClass = index === 0 ? 'rank-1' : index === 1 ? 'rank-2' : index === 2 ? 'rank-3' : '';
            const barClass = `bar-${Math.min(index + 1, 3)}`;

            return `
                <div class="vote-item" data-option="${this._escapeHtml(response.option)}">
                    <div class="vote-header">
                        <div class="vote-option">
                            ${rankClass ? `<span class="vote-rank ${rankClass}">${index + 1}</span>` : ''}
                            ${this._escapeHtml(response.option)}
                        </div>
                        <div><strong>${response.count}</strong> phiếu (${response.percentage}%)</div>
                    </div>
                    <div class="vote-bar-container">
                        <div class="vote-bar ${barClass}" style="width: ${response.percentage}%">
                            ${response.percentage}%
                        </div>
                    </div>
                </div>
            `;
        }

        _getQuestionResponses(responses, columnIndex) {
            // Validate inputs
            if (!responses || responses.length === 0) {
                console.warn('_getQuestionResponses: No responses');
                return [];
            }

            if (columnIndex === undefined || columnIndex === null) {
                console.error('_getQuestionResponses: Invalid columnIndex');
                return [];
            }

            const votes = {};
            const options = [];

            responses.forEach(row => {
                // Ensure row exists and has the column
                if (!row || row.length <= columnIndex) {
                    return;
                }

                const value = row[columnIndex];
                if (value && value.trim()) {
                    if (!votes[value]) {
                        votes[value] = 0;
                        options.push(value);
                    }
                    votes[value]++;
                }
            });

            // No votes found
            if (options.length === 0) {
                console.warn('_getQuestionResponses: No votes for column', columnIndex);
                return [];
            }

            // CRITICAL: Always recalculate from scratch
            const counts = options.map(opt => votes[opt]);
            const total = counts.reduce((sum, c) => sum + c, 0);

            console.log('_getQuestionResponses INPUT:', {
                columnIndex,
                options,
                counts,
                total,
                votes
            });

            // Calculate percentages using proper algorithm
            const percentages = PercentageCalculator.calculate(counts);

            // Validate percentages array
            if (!percentages || percentages.length !== counts.length) {
                console.error('Percentage calculation failed', { counts, percentages });
                // Fallback: equal distribution that sums to 100
                const fallbackPerc = (100 / counts.length).toFixed(1);
                return options.map((option, idx) => ({
                    option,
                    count: counts[idx],
                    percentage: fallbackPerc
                }));
            }

            // Verify sum
            const sum = percentages.reduce((acc, p) => acc + parseFloat(p), 0);
            if (Math.abs(sum - 100) > 0.2) {
                console.error('Percentages sum != 100!', {
                    percentages,
                    sum,
                    counts,
                    options
                });
            }

            // Create response objects
            const result = options.map((option, idx) => ({
                option,
                count: counts[idx],
                percentage: percentages[idx]
            }));

            console.log('_getQuestionResponses OUTPUT:', {
                result,
                totalPercentage: sum
            });

            // Sort by count descending
            return result.sort((a, b) => b.count - a.count);
        }

        _escapeHtml(text) {
            if (!text) return '';
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        }

        cancel() {
            if (this.rafId) {
                cancelAnimationFrame(this.rafId);
                this.rafId = null;
            }
            this.pendingUpdates.clear();
        }
    }

    // ========================================================================
    // CSV PARSER
    // ========================================================================

    class CSVParser {
        static parse(text) {
            try {
                text = text.replace(/^\uFEFF/, '')
                    .replace(/\r\n/g, '\n')
                    .replace(/\r/g, '\n');

                const lines = text.split('\n');
                if (lines.length === 0) return { headers: [], rows: [] };

                const headers = this._parseRow(lines[0]);
                const rows = [];

                for (let i = 1; i < lines.length; i++) {
                    if (!lines[i].trim()) continue;
                    const row = this._parseRow(lines[i]);
                    if (row.length === headers.length && row.some(cell => cell)) {
                        rows.push(row);
                    }
                }

                return { headers, rows };
            } catch (error) {
                console.error('CSV parse error:', error);
                return { headers: [], rows: [] };
            }
        }

        static _parseRow(line) {
            const result = [];
            let current = '';
            let inQuotes = false;
            let i = 0;

            while (i < line.length) {
                const char = line[i];
                const nextChar = line[i + 1];

                if (char === '"') {
                    if (inQuotes && nextChar === '"') {
                        current += '"';
                        i += 2;
                        continue;
                    } else {
                        inQuotes = !inQuotes;
                        i++;
                        continue;
                    }
                }

                if (char === ',' && !inQuotes) {
                    result.push(current.trim());
                    current = '';
                    i++;
                    continue;
                }

                current += char;
                i++;
            }

            result.push(current.trim());
            return result;
        }
    }

    // ========================================================================
    // STORAGE MANAGER
    // ========================================================================

    class StorageManager {
        static get(key, defaultValue = null) {
            try {
                const item = localStorage.getItem(CONFIG.LOCALSTORAGE_PREFIX + key);
                return item ? JSON.parse(item) : defaultValue;
            } catch (error) {
                return defaultValue;
            }
        }

        static set(key, value) {
            try {
                localStorage.setItem(CONFIG.LOCALSTORAGE_PREFIX + key, JSON.stringify(value));
                return true;
            } catch (error) {
                if (error.name === 'QuotaExceededError') {
                    this._clearOldData();
                    try {
                        localStorage.setItem(CONFIG.LOCALSTORAGE_PREFIX + key, JSON.stringify(value));
                        return true;
                    } catch {
                        return false;
                    }
                }
                return false;
            }
        }

        static remove(key) {
            try {
                localStorage.removeItem(CONFIG.LOCALSTORAGE_PREFIX + key);
                return true;
            } catch {
                return false;
            }
        }

        static _clearOldData() {
            try {
                this.remove('debug_logs');
                const stats = this.get('session_stats', []);
                if (stats.length > 10) this.set('session_stats', stats.slice(0, 10));
                const history = this.get('history', []);
                if (history.length > 5) this.set('history', history.slice(0, 5));
            } catch (error) {
                console.error('Clear old data error:', error);
            }
        }
    }

    // ========================================================================
    // LOGGER
    // ========================================================================

    class Logger {
        constructor(debugMode = false) {
            this.debugMode = debugMode;
            this.logs = [];
        }

        log(message, type = 'info', data = null) {
            const timestamp = new Date().toLocaleTimeString('vi-VN');

            if (type === 'error') {
                console.error(`[${timestamp}] ${message}`, data || '');
            } else if (this.debugMode) {
                const colors = { info: '#3b82f6', success: '#10b981', warning: '#f59e0b' };
                console.log(`%c[${timestamp}] ${message}`, `color: ${colors[type] || '#3b82f6'}; font-weight: bold;`, data || '');
            }

            if (this.debugMode) {
                this.logs.push({ timestamp, type, message, data });
                if (this.logs.length > CONFIG.MAX_DEBUG_LOGS) this.logs.shift();
            }
        }

        getLogs() { return [...this.logs]; }
        clear() { this.logs = []; }
    }

    // ========================================================================
    // DATA FETCHER
    // ========================================================================

    class DataFetcher {
        constructor(logger) {
            this.logger = logger;
            this.abortController = null;
        }

        async fetchCSV(url, retryCount = 0) {
            if (this.abortController) this.abortController.abort();
            this.abortController = new AbortController();

            try {
                const timestamp = Date.now();
                const separator = url.includes('?') ? '&' : '?';
                const fetchUrl = `${url}${separator}t=${timestamp}`;

                const response = await fetch(fetchUrl, {
                    cache: 'no-store',
                    signal: this.abortController.signal
                });

                if (!response.ok) throw new Error(`HTTP ${response.status}`);

                const text = await response.text();
                if (!text || text.trim().length === 0) throw new Error('Empty response');

                const { headers, rows } = CSVParser.parse(text);
                if (headers.length === 0) throw new Error('CSV không có header');

                this.logger.log('CSV fetched', 'success', { rows: rows.length });
                return { headers, rows, success: true };

            } catch (error) {
                if (error.name === 'AbortError') return { headers: [], rows: [], success: false, error: 'Aborted' };

                if (retryCount < CONFIG.MAX_RETRIES) {
                    const delay = CONFIG.RETRY_DELAY_BASE * Math.pow(2, retryCount);
                    await this._sleep(delay);
                    return this.fetchCSV(url, retryCount + 1);
                }

                return { headers: [], rows: [], success: false, error: error.message };
            } finally {
                this.abortController = null;
            }
        }

        cancel() {
            if (this.abortController) {
                this.abortController.abort();
                this.abortController = null;
            }
        }

        _sleep(ms) {
            return new Promise(resolve => setTimeout(resolve, ms));
        }
    }

    // ========================================================================
    // STATE MANAGER
    // ========================================================================

    class StateManager {
        constructor() {
            this._state = {
                mode: STATE.SETUP,
                view: VIEW_MODE.SINGLE,
                selectedQuestion: 0,
                csvUrl: '',
                formUrl: '',
                debugMode: false,
                sessionId: null,
                sessionStartTime: null,
                lastUpdateTime: null,
                errorCount: 0,
                isUpdating: false
            };
            this._listeners = new Set();
        }

        get state() {
            return Object.freeze({ ...this._state });
        }

        setState(updates) {
            this._state = { ...this._state, ...updates };
            this._notifyListeners();
        }

        subscribe(listener) {
            this._listeners.add(listener);
            return () => this._listeners.delete(listener);
        }

        _notifyListeners() {
            this._listeners.forEach(listener => {
                try { listener(this.state); }
                catch (error) { console.error('State listener error:', error); }
            });
        }
    }

    // ========================================================================
    // MAIN APPLICATION
    // ========================================================================

    class Application {
        constructor() {
            this.stateManager = new StateManager();
            this.dataStore = new VersionedDataStore();
            this.logger = new Logger(false);
            this.dataFetcher = new DataFetcher(this.logger);
            this.animationQueue = new AnimationQueue();
            this.renderer = new SmoothRenderer(this.animationQueue);

            this.updateTimer = null;
            this.debounceTimer = null;
            this.unsubscribe = null;
        }

        init() {
            this._parseURLParams();
            this._setupEventListeners();
            this._setupVisibilityHandler();

            const state = this.stateManager.state;

            if (state.debugMode) {
                this.logger.debugMode = true;
                this._createDebugPanel();
            }

            this.unsubscribe = this.stateManager.subscribe((state) => this._onStateChange(state));

            if (state.csvUrl && state.formUrl) {
                this.startVoting();
            } else {
                this.showSetup();
            }
        }

        _parseURLParams() {
            const params = new URLSearchParams(window.location.search);
            const updates = {};

            if (params.has('csv')) updates.csvUrl = decodeURIComponent(params.get('csv'));
            if (params.has('form')) updates.formUrl = decodeURIComponent(params.get('form'));
            if (params.has('debug')) updates.debugMode = params.get('debug') === 'true';

            if (Object.keys(updates).length > 0) this.stateManager.setState(updates);
        }

        _setupEventListeners() {
            const setupForm = document.getElementById('setupForm');
            if (setupForm) setupForm.addEventListener('submit', (e) => this.handleSetupSubmit(e));

            const formUrlInput = document.getElementById('formUrl');
            const csvUrlInput = document.getElementById('csvUrl');

            if (formUrlInput) {
                formUrlInput.addEventListener('input', () => this._validateFormUrl());
                formUrlInput.addEventListener('blur', () => this._validateFormUrl());
            }

            if (csvUrlInput) {
                csvUrlInput.addEventListener('input', () => this._validateCsvUrl());
                csvUrlInput.addEventListener('blur', () => this._validateCsvUrl());
            }

            const testBtn = document.getElementById('testConnection');
            if (testBtn) testBtn.addEventListener('click', () => this._testConnection());

            document.querySelectorAll('.view-tab').forEach(tab => {
                tab.addEventListener('click', (e) => this.setView(e.target.dataset.view));
            });

            this._setupMenuListeners();

            document.addEventListener('keydown', (e) => {
                if (e.ctrlKey && e.key === 'q') {
                    e.preventDefault();
                    this._toggleQRWidget();
                }
            });

            const guideToggle = document.getElementById('guideToggle');
            const guideContent = document.getElementById('guideContent');
            if (guideToggle && guideContent) {
                guideToggle.addEventListener('click', () => guideContent.classList.toggle('open'));
            }
        }

        _setupMenuListeners() {
            const menuBtn = document.getElementById('menuBtn');
            const dropdownMenu = document.getElementById('dropdownMenu');

            if (menuBtn && dropdownMenu) {
                menuBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    dropdownMenu.classList.toggle('show');
                });
                document.addEventListener('click', () => dropdownMenu.classList.remove('show'));
            }

            const listeners = {
                viewStats: () => this.showStats(),
                copyLink: () => this._copyCurrentLink(),
                newSession: () => this.newSession(),
                refreshBtn: () => this.forceRefresh(),
                clearHistory: () => this._clearHistory(),
                backToSetup: () => this.newSession(),
                backToSetupFromError: () => this.newSession()
            };

            Object.entries(listeners).forEach(([id, handler]) => {
                const elem = document.getElementById(id);
                if (elem) elem.addEventListener('click', handler);
            });
        }

        _setupVisibilityHandler() {
            document.addEventListener('visibilitychange', () => {
                if (document.hidden) {
                    this._stopAutoUpdate();
                } else {
                    const state = this.stateManager.state;
                    if (state.mode === STATE.VOTING) {
                        this._startAutoUpdate();
                        this.loadData();
                    }
                }
            });
        }

        _onStateChange(state) {
            if (state.debugMode) this._updateDebugPanel();
        }

        // ====================================================================
        // SETUP SCREEN
        // ====================================================================

        showSetup() {
            this.stateManager.setState({ mode: STATE.SETUP });
            document.getElementById('setupScreen').classList.add('active');
            document.getElementById('mainApp').classList.remove('active');
            document.getElementById('statsDashboard').classList.remove('active');
            this._loadRecentSessions();
        }

        _validateFormUrl() {
            const input = document.getElementById('formUrl');
            const validation = document.getElementById('formUrlValidation');
            const url = input?.value.trim() || '';

            if (!url) {
                input?.classList.remove('valid', 'invalid');
                validation?.classList.remove('success', 'error');
                return false;
            }

            const isValid = url.includes('docs.google.com/forms');

            if (isValid) {
                input?.classList.add('valid');
                input?.classList.remove('invalid');
                validation?.classList.add('success');
                validation?.classList.remove('error');
                if (validation) validation.textContent = '✅ Link Google Form hợp lệ';
            } else {
                input?.classList.add('invalid');
                input?.classList.remove('valid');
                validation?.classList.add('error');
                validation?.classList.remove('success');
                if (validation) validation.textContent = '❌ Phải là link Google Form';
            }

            return isValid;
        }

        _validateCsvUrl() {
            const input = document.getElementById('csvUrl');
            const validation = document.getElementById('csvUrlValidation');
            const url = input?.value.trim() || '';

            if (!url) {
                input?.classList.remove('valid', 'invalid');
                validation?.classList.remove('success', 'error');
                return false;
            }

            const isValid = url.includes('docs.google.com/spreadsheets') &&
                (url.includes('/pub?') || url.includes('/export?'));

            if (isValid) {
                input?.classList.add('valid');
                input?.classList.remove('invalid');
                validation?.classList.add('success');
                validation?.classList.remove('error');
                if (validation) validation.textContent = '✅ Link CSV hợp lệ';
            } else {
                input?.classList.add('invalid');
                input?.classList.remove('valid');
                validation?.classList.add('error');
                validation?.classList.remove('success');
                if (validation) validation.textContent = '❌ Phải là link CSV published';
            }

            return isValid;
        }

        async _testConnection() {
            if (!this._validateFormUrl() || !this._validateCsvUrl()) {
                this._showToast('❌ Vui lòng nhập link hợp lệ', 'error');
                return;
            }

            const testBtn = document.getElementById('testConnection');
            if (!testBtn) return;

            const originalText = testBtn.textContent;
            testBtn.textContent = '⏳ Đang kiểm tra...';
            testBtn.disabled = true;

            this._showLoadingOverlay(true, 'Đang kiểm tra kết nối...');

            try {
                const csvUrl = document.getElementById('csvUrl')?.value.trim();
                if (!csvUrl) throw new Error('CSV URL not found');

                const result = await this.dataFetcher.fetchCSV(csvUrl);

                if (!result.success) throw new Error(result.error || 'Unknown error');

                const msg = result.rows.length === 0
                    ? '✅ Kết nối OK! Chưa có response'
                    : `✅ Thành công! ${result.rows.length} responses`;
                this._showToast(msg, 'success');
            } catch (error) {
                this._showToast(`❌ Lỗi: ${error.message}`, 'error');
            } finally {
                testBtn.textContent = originalText;
                testBtn.disabled = false;
                this._showLoadingOverlay(false);
            }
        }

        handleSetupSubmit(e) {
            e.preventDefault();

            const formUrl = document.getElementById('formUrl')?.value.trim();
            const csvUrl = document.getElementById('csvUrl')?.value.trim();

            if (!this._validateFormUrl() || !this._validateCsvUrl() || !formUrl || !csvUrl) {
                this._showToast('❌ Vui lòng nhập link hợp lệ', 'error');
                return;
            }

            this._saveToHistory(formUrl, csvUrl);

            const state = this.stateManager.state;
            const debugParam = state.debugMode ? '&debug=true' : '';
            const newUrl = `${window.location.pathname}?form=${encodeURIComponent(formUrl)}&csv=${encodeURIComponent(csvUrl)}${debugParam}`;
            window.location.href = newUrl;
        }

        _saveToHistory(formUrl, csvUrl) {
            const history = StorageManager.get('history', []);
            const session = {
                id: Date.now().toString(),
                formUrl,
                csvUrl,
                timestamp: new Date().toISOString(),
                title: this._extractFormTitle(formUrl)
            };
            history.unshift(session);
            StorageManager.set('history', history.slice(0, CONFIG.MAX_HISTORY_ITEMS));
        }

        _loadRecentSessions() {
            const history = StorageManager.get('history', []);
            const container = document.getElementById('recentSessions');
            const list = document.getElementById('sessionsList');

            if (!container || !list) return;

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
                    <div class="session-item" data-session-id="${session.id}">
                        <div class="session-info">
                            <div class="session-title">${this._escapeHtml(session.title)}</div>
                            <div class="session-meta">📅 ${formattedDate}</div>
                        </div>
                        <div style="color: var(--primary); font-weight: 600;">→</div>
                    </div>
                `;
            }).join('');

            list.innerHTML = html;

            list.querySelectorAll('.session-item').forEach(item => {
                item.addEventListener('click', () => this._loadSession(item.dataset.sessionId));
            });
        }

        _loadSession(sessionId) {
            const history = StorageManager.get('history', []);
            const session = history.find(s => s.id === sessionId);

            if (session) {
                const formUrlInput = document.getElementById('formUrl');
                const csvUrlInput = document.getElementById('csvUrl');

                if (formUrlInput) formUrlInput.value = session.formUrl;
                if (csvUrlInput) csvUrlInput.value = session.csvUrl;

                this._validateFormUrl();
                this._validateCsvUrl();
                this._showToast('✅ Đã tải phiên khảo sát', 'success');
            }
        }

        _clearHistory() {
            if (confirm('Xóa toàn bộ lịch sử phiên khảo sát?')) {
                StorageManager.remove('history');
                this._loadRecentSessions();
                this._showToast('🗑️ Đã xóa lịch sử', 'success');
            }
        }

        _extractFormTitle(formUrl) {
            const match = formUrl.match(/\/forms\/d\/e\/([^\/]+)/);
            return match ? `Form ${match[1].substring(0, 8)}...` : 'Khảo sát';
        }

        // ====================================================================
        // VOTING MODE - FAST CLASSROOM
        // ====================================================================

        startVoting() {
            this.stateManager.setState({
                mode: STATE.VOTING,
                sessionStartTime: Date.now(),
                sessionId: Date.now().toString(),
                errorCount: 0
            });

            document.getElementById('setupScreen').classList.remove('active');
            document.getElementById('mainApp').classList.add('active');
            document.getElementById('statsDashboard').classList.remove('active');

            this._hideError();
            this._generateQR();
            this._restoreQRState();

            this._showLoadingOverlay(true, 'Đang tải dữ liệu...');
            this.loadData();
            this._startAutoUpdate();
        }

        async loadData() {
            const state = this.stateManager.state;
            if (state.isUpdating) return;

            if (this.debounceTimer) clearTimeout(this.debounceTimer);

            return new Promise((resolve) => {
                this.debounceTimer = setTimeout(async () => {
                    await this._performSmartUpdate();
                    resolve();
                }, CONFIG.DEBOUNCE_DELAY);
            });
        }

        async _performSmartUpdate() {
            const state = this.stateManager.state;
            this.stateManager.setState({ isUpdating: true });
            this._showUpdateIndicator(true);

            try {
                const result = await this.dataFetcher.fetchCSV(state.csvUrl);

                if (!result.success) throw new Error(result.error || 'Failed to fetch data');

                const questions = result.headers.slice(1).map((header, idx) => ({
                    id: idx + 1,
                    text: header || `Câu hỏi ${idx + 1}`,
                    columnIndex: idx + 1
                }));

                // Validate we have questions
                if (questions.length === 0) {
                    throw new Error('Không có câu hỏi trong CSV');
                }

                const newFingerprint = DataComparator.createDataFingerprint(result.rows);

                if (!this.dataStore.shouldUpdate(newFingerprint, result.rows.length)) {
                    this.stateManager.setState({
                        isUpdating: false,
                        lastUpdateTime: Date.now()
                    });
                    this._showUpdateIndicator(false);
                    this._showLoadingOverlay(false);
                    return;
                }

                const oldData = this.dataStore.get();
                const wasUpdated = this.dataStore.update(questions, result.rows, newFingerprint);

                if (!wasUpdated) return;

                const newData = this.dataStore.get();

                // Ensure selectedQuestion is valid
                const maxIndex = newData.questions.length - 1;
                if (state.selectedQuestion > maxIndex) {
                    this.stateManager.setState({ selectedQuestion: Math.max(0, maxIndex) });
                }

                const questionComparison = DataComparator.compareQuestions(oldData.questions, newData.questions);
                const responseComparison = DataComparator.compareResponses(oldData.responses, newData.responses, newData.questions);

                this.logger.log('Data comparison', 'info', {
                    questionComparison,
                    responseComparison,
                    totalQuestions: newData.questions.length,
                    totalResponses: newData.responses.length
                });

                if (questionComparison.isInitial || responseComparison.isInitial) {
                    this._fullRenderWithAnimation();
                    this._updateStats();
                } else if (questionComparison.hasChanges) {
                    this._fullRenderWithAnimation();
                    this._updateStats();
                } else if (responseComparison.hasChanges) {
                    this._smartUpdateResponses(responseComparison.changes);
                    this._updateStats();

                    if (responseComparison.newVoteCount > 0) {
                        this._showToast(`+${responseComparison.newVoteCount} phiếu mới`, 'success', 1500);
                    }
                }

                this._hideError();
                this.stateManager.setState({
                    errorCount: 0,
                    lastUpdateTime: Date.now()
                });

                this._updateSessionStats();

            } catch (error) {
                this.logger.log('Data update failed', 'error', error);
                this._handleLoadError(error);
            } finally {
                this.stateManager.setState({ isUpdating: false });
                this._showUpdateIndicator(false);
                this._showLoadingOverlay(false);
            }
        }

        _fullRenderWithAnimation() {
            const state = this.stateManager.state;
            const data = this.dataStore.get();

            // Validate data exists
            if (!data || !data.questions || data.questions.length === 0) {
                const grid = document.getElementById('questionsGrid');
                if (grid) {
                    grid.innerHTML = `
                        <div class="empty-state">
                            <div class="empty-icon">📭</div>
                            <div>Chưa có dữ liệu câu hỏi</div>
                        </div>
                    `;
                }
                return;
            }

            let questionsToShow = [];

            if (state.view === VIEW_MODE.SINGLE) {
                // Ensure selectedQuestion is valid
                const validIndex = Math.min(state.selectedQuestion, data.questions.length - 1);
                if (validIndex >= 0 && data.questions[validIndex]) {
                    questionsToShow = [data.questions[validIndex]];

                    // Update state if index was adjusted
                    if (validIndex !== state.selectedQuestion) {
                        this.stateManager.setState({ selectedQuestion: validIndex });
                    }
                }
            } else {
                questionsToShow = data.questions;
            }

            // Double check we have questions to show
            if (questionsToShow.length === 0) {
                const grid = document.getElementById('questionsGrid');
                if (grid) {
                    grid.innerHTML = `
                        <div class="empty-state">
                            <div class="empty-icon">📭</div>
                            <div>Không có câu hỏi để hiển thị</div>
                        </div>
                    `;
                }
                return;
            }

            this.renderer.fullRender(questionsToShow, this.dataStore);
            this._updateNavigation();
        }

        _smartUpdateResponses(changes) {
            const data = this.dataStore.get();

            console.log('_smartUpdateResponses:', { changes, totalQuestions: data.questions.length });

            changes.forEach(questionChange => {
                const question = data.questions.find(q => q.id === questionChange.questionId);
                if (!question) {
                    console.warn('Question not found for smart update', questionChange.questionId);
                    return;
                }

                // CRITICAL: Always recalculate ALL responses for this question
                // Don't trust optionChanges, recalculate from scratch to avoid drift
                const allResponses = this.renderer._getQuestionResponses(data.responses, question.columnIndex);

                console.log(`Smart update Q${question.id}:`, {
                    questionText: question.text,
                    allResponses,
                    totalPercent: allResponses.reduce((sum, r) => sum + parseFloat(r.percentage), 0)
                });

                // Update each option
                allResponses.forEach(response => {
                    this.renderer.updateVoteBar(
                        question.id,
                        response.option,
                        response.percentage,
                        response.count
                    );
                });
            });
        }

        _updateNavigation() {
            const nav = document.getElementById('questionNav');
            if (!nav) return;

            const state = this.stateManager.state;
            const data = this.dataStore.get();

            // Validate data
            if (!data || !data.questions || data.questions.length === 0) {
                nav.innerHTML = '<div class="empty-state">Chưa có câu hỏi</div>';
                return;
            }

            const html = data.questions.map((q, idx) => {
                const responses = this.renderer._getQuestionResponses(data.responses, q.columnIndex);
                const count = responses.reduce((sum, r) => sum + r.count, 0);

                return `
                    <div class="nav-item ${idx === state.selectedQuestion ? 'active' : ''}" data-question-idx="${idx}">
                        <span>${this._escapeHtml(q.text)}</span>
                        <span style="opacity: 0.7">${count}</span>
                    </div>
                `;
            }).join('');

            nav.innerHTML = html || '<div class="empty-state">Chưa có câu hỏi</div>';

            nav.querySelectorAll('.nav-item').forEach(item => {
                item.addEventListener('click', () => {
                    const idx = parseInt(item.dataset.questionIdx);
                    this.selectQuestion(idx);
                });
            });
        }

        _updateStats() {
            const data = this.dataStore.get();

            const totalVotesElem = document.getElementById('totalVotes');
            const totalQuestionsElem = document.getElementById('totalQuestions');
            const updateTimeElem = document.getElementById('updateTime');

            if (totalVotesElem) this.renderer.updateNumber(totalVotesElem, data.responses.length);
            if (totalQuestionsElem) this.renderer.updateNumber(totalQuestionsElem, data.questions.length);

            if (updateTimeElem) {
                updateTimeElem.textContent = new Date().toLocaleTimeString('vi-VN', {
                    hour: '2-digit',
                    minute: '2-digit'
                });
            }
        }

        _handleLoadError(error) {
            const state = this.stateManager.state;
            const newErrorCount = state.errorCount + 1;

            this.stateManager.setState({ errorCount: newErrorCount });

            if (newErrorCount > CONFIG.MAX_RETRIES) {
                const errorMsg = `Không thể tải dữ liệu sau ${CONFIG.MAX_RETRIES} lần thử.\n\nChi tiết: ${error.message}\n\nKiểm tra:\n1. Sheet đã Publish to web?\n2. Link CSV đúng format?\n3. Có dữ liệu trong sheet?`;
                this._showError(errorMsg);
                this._showToast('❌ Lỗi kết nối dữ liệu', 'error');
            } else {
                const delay = CONFIG.RETRY_DELAY_BASE * Math.pow(2, newErrorCount - 1);
                setTimeout(() => this.loadData(), delay);
            }
        }

        // ====================================================================
        // QR CODE
        // ====================================================================

        _generateQR() {
            const container = document.getElementById('qrcode');
            if (!container || container.children.length > 0) return;

            container.innerHTML = '';

            try {
                const state = this.stateManager.state;
                new QRCode(container, {
                    text: state.formUrl,
                    width: 200,
                    height: 200,
                    colorDark: '#000000',
                    colorLight: '#ffffff',
                    correctLevel: QRCode.CorrectLevel.H
                });
            } catch (error) {
                container.innerHTML = '<p style="color: #ef4444;">Không thể tạo mã QR</p>';
            }
        }

        _toggleQRWidget() {
            const widget = document.getElementById('qrWidget');
            if (widget) {
                widget.classList.toggle('minimized');
                StorageManager.set('qr_widget_minimized', widget.classList.contains('minimized'));
            }
        }

        _restoreQRState() {
            const wasMinimized = StorageManager.get('qr_widget_minimized', false);
            const widget = document.getElementById('qrWidget');
            if (wasMinimized && widget) widget.classList.add('minimized');
        }

        // ====================================================================
        // SESSION STATS
        // ====================================================================

        _updateSessionStats() {
            const state = this.stateManager.state;
            const data = this.dataStore.get();
            const sessions = StorageManager.get('session_stats', []);

            const currentSession = {
                id: state.sessionId,
                formUrl: state.formUrl,
                csvUrl: state.csvUrl,
                startTime: state.sessionStartTime,
                lastUpdate: Date.now(),
                totalResponses: data.responses.length,
                totalQuestions: data.questions.length
            };

            const index = sessions.findIndex(s => s.id === state.sessionId);
            if (index >= 0) {
                sessions[index] = currentSession;
            } else {
                sessions.unshift(currentSession);
            }

            StorageManager.set('session_stats', sessions.slice(0, CONFIG.MAX_SESSION_STATS));
        }

        // ====================================================================
        // STATS DASHBOARD
        // ====================================================================

        showStats() {
            this.stateManager.setState({ mode: STATE.STATS });
            document.getElementById('setupScreen').classList.remove('active');
            document.getElementById('mainApp').classList.remove('active');
            document.getElementById('statsDashboard').classList.add('active');
            this._loadStatsGrid();
        }

        _loadStatsGrid() {
            const sessions = StorageManager.get('session_stats', []);
            const grid = document.getElementById('statsGrid');

            if (!grid) return;

            if (sessions.length === 0) {
                grid.innerHTML = `<div class="empty-state"><div class="empty-icon">📊</div><div>Chưa có phiên khảo sát nào</div></div>`;
                return;
            }

            const html = sessions.map(session => {
                const startDate = new Date(session.startTime);
                const duration = Math.round((session.lastUpdate - session.startTime) / 1000 / 60);

                return `
                    <div class="stat-card">
                        <div class="stat-card-header">
                            <div class="stat-card-title">📊 Phiên ${startDate.toLocaleDateString('vi-VN')}</div>
                            <div class="stat-card-date">${startDate.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</div>
                        </div>
                        <div class="stat-card-metrics">
                            <div class="metric"><div class="metric-value">${session.totalResponses}</div><div class="metric-label">Phản hồi</div></div>
                            <div class="metric"><div class="metric-value">${session.totalQuestions}</div><div class="metric-label">Câu hỏi</div></div>
                            <div class="metric"><div class="metric-value">${duration}</div><div class="metric-label">Phút</div></div>
                            <div class="metric"><div class="metric-value">${session.totalQuestions > 0 ? (session.totalResponses / session.totalQuestions).toFixed(1) : '0'}</div><div class="metric-label">TB/Câu</div></div>
                        </div>
                        <div class="stat-card-actions">
                            <button class="action-btn primary" data-session-id="${session.id}" data-action="reload">🔄 Tải lại</button>
                            <button class="action-btn secondary" data-session-id="${session.id}" data-action="copy">🔗 Copy link</button>
                        </div>
                    </div>
                `;
            }).join('');

            grid.innerHTML = html;

            grid.querySelectorAll('.action-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    const sessionId = btn.dataset.sessionId;
                    const action = btn.dataset.action;
                    if (action === 'reload') this._reloadSession(sessionId);
                    else if (action === 'copy') this._copySessionLink(sessionId);
                });
            });
        }

        _reloadSession(sessionId) {
            const sessions = StorageManager.get('session_stats', []);
            const session = sessions.find(s => s.id === sessionId);

            if (session) {
                const state = this.stateManager.state;
                const debugParam = state.debugMode ? '&debug=true' : '';
                const url = `${window.location.pathname}?form=${encodeURIComponent(session.formUrl)}&csv=${encodeURIComponent(session.csvUrl)}${debugParam}`;
                window.location.href = url;
            }
        }

        _copySessionLink(sessionId) {
            const sessions = StorageManager.get('session_stats', []);
            const session = sessions.find(s => s.id === sessionId);

            if (session) {
                const url = `${window.location.origin}${window.location.pathname}?form=${encodeURIComponent(session.formUrl)}&csv=${encodeURIComponent(session.csvUrl)}`;
                navigator.clipboard.writeText(url).then(() => {
                    this._showToast('✅ Đã copy link', 'success');
                }).catch(() => {
                    this._showToast('❌ Không thể copy', 'error');
                });
            }
        }

        // ====================================================================
        // USER ACTIONS
        // ====================================================================

        selectQuestion(index) {
            const state = this.stateManager.state;
            const data = this.dataStore.get();

            // Validate index
            if (index < 0 || !data.questions || index >= data.questions.length) {
                this.logger.log('Invalid question index', 'warning', {
                    index,
                    totalQuestions: data.questions ? data.questions.length : 0
                });
                return;
            }

            if (state.selectedQuestion === index) return;

            this.stateManager.setState({ selectedQuestion: index });
            this._fullRenderWithAnimation();
        }

        setView(view) {
            const state = this.stateManager.state;
            const data = this.dataStore.get();

            this.logger.log(`Setting view to: ${view}`, 'info', {
                currentView: state.view,
                newView: view,
                selectedQuestion: state.selectedQuestion,
                totalQuestions: data.questions ? data.questions.length : 0
            });

            // When switching to single view, ensure selectedQuestion is valid
            if (view === VIEW_MODE.SINGLE) {
                if (!data.questions || data.questions.length === 0) {
                    this.logger.log('No questions available for single view', 'warning');
                    this._showToast('Chưa có dữ liệu câu hỏi', 'error');
                    return;
                }

                // Ensure selectedQuestion is within bounds
                if (state.selectedQuestion >= data.questions.length) {
                    this.stateManager.setState({
                        view,
                        selectedQuestion: 0
                    });
                } else {
                    this.stateManager.setState({ view });
                }
            } else {
                this.stateManager.setState({ view });
            }

            document.querySelectorAll('.view-tab').forEach(tab => {
                if (tab.dataset.view === view) {
                    tab.classList.add('active');
                } else {
                    tab.classList.remove('active');
                }
            });

            this._fullRenderWithAnimation();
        }

        forceRefresh() {
            const btn = document.getElementById('refreshBtn');
            if (btn) btn.classList.add('loading');

            console.log('=== FORCE REFRESH TRIGGERED ===');

            // Force clear any cached state
            const grid = document.getElementById('questionsGrid');
            if (grid) {
                grid.innerHTML = '<div class="empty-state"><div class="empty-icon">🔄</div><div>Đang làm mới...</div></div>';
            }

            this.loadData().finally(() => {
                setTimeout(() => {
                    if (btn) btn.classList.remove('loading');
                    console.log('=== FORCE REFRESH COMPLETED ===');
                }, 300);
            });
        }

        _copyCurrentLink() {
            navigator.clipboard.writeText(window.location.href).then(() => {
                this._showToast('✅ Đã copy link chia sẻ', 'success');
            }).catch(() => {
                this._showToast('❌ Không thể copy', 'error');
            });
        }

        newSession() {
            this._stopAutoUpdate();
            this.dataFetcher.cancel();

            const state = this.stateManager.state;
            const debugParam = state.debugMode ? '?debug=true' : '';
            window.location.href = window.location.pathname + debugParam;
        }

        // ====================================================================
        // AUTO UPDATE
        // ====================================================================

        _startAutoUpdate() {
            this._stopAutoUpdate();

            this.updateTimer = setInterval(() => {
                const state = this.stateManager.state;
                if (!state.isUpdating && state.mode === STATE.VOTING) {
                    this.loadData();
                }
            }, CONFIG.UPDATE_INTERVAL);
        }

        _stopAutoUpdate() {
            if (this.updateTimer) {
                clearInterval(this.updateTimer);
                this.updateTimer = null;
            }
        }

        // ====================================================================
        // UI HELPERS
        // ====================================================================

        _showLoadingOverlay(show, text = 'Đang tải...') {
            const overlay = document.getElementById('loadingOverlay');
            if (!overlay) return;

            const textElem = overlay.querySelector('.loading-text');
            if (textElem && text) textElem.textContent = text;

            if (show) overlay.classList.add('show');
            else overlay.classList.remove('show');
        }

        _showUpdateIndicator(show) {
            const indicator = document.getElementById('updateIndicator');
            if (indicator) {
                if (show) indicator.classList.add('show');
                else indicator.classList.remove('show');
            }
        }

        _showError(message) {
            const box = document.getElementById('errorBox');
            const msg = document.getElementById('errorMessage');
            if (box && msg) {
                msg.textContent = message;
                box.classList.add('show');
            }
        }

        _hideError() {
            const box = document.getElementById('errorBox');
            if (box) box.classList.remove('show');
        }

        _showToast(message, type = 'info', duration = CONFIG.TOAST_DURATION) {
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

        // ====================================================================
        // DEBUG PANEL
        // ====================================================================

        _createDebugPanel() {
            if (document.getElementById('debugPanel')) return;

            const panel = document.createElement('div');
            panel.id = 'debugPanel';
            panel.className = 'debug-panel';
            panel.innerHTML = `
                <div class="debug-header">
                    <span>🐛 Debug Console</span>
                    <div>
                        <button class="debug-clear" id="debugClearBtn">🗑️</button>
                        <button class="debug-toggle" id="debugToggleBtn">_</button>
                    </div>
                </div>
                <div class="debug-content" id="debugContent"></div>
            `;

            document.body.appendChild(panel);

            const toggleBtn = panel.querySelector('#debugToggleBtn');
            const clearBtn = panel.querySelector('#debugClearBtn');

            if (toggleBtn) toggleBtn.addEventListener('click', () => panel.classList.toggle('minimized'));
            if (clearBtn) clearBtn.addEventListener('click', () => {
                this.logger.clear();
                this._updateDebugPanel();
            });
        }

        _updateDebugPanel() {
            const content = document.getElementById('debugContent');
            if (!content) return;

            const logs = this.logger.getLogs().slice(-20).reverse();

            const html = logs.map(log => {
                const icon = { info: 'ℹ️', success: '✅', error: '❌', warning: '⚠️' }[log.type] || 'ℹ️';

                return `
                    <div class="debug-log ${log.type}">
                        <span class="debug-time">${log.timestamp}</span>
                        <span class="debug-icon">${icon}</span>
                        <span class="debug-msg">${this._escapeHtml(log.message)}</span>
                        ${log.data ? `<pre class="debug-data">${this._escapeHtml(JSON.stringify(log.data, null, 2))}</pre>` : ''}
                    </div>
                `;
            }).join('');

            content.innerHTML = html || '<div class="debug-log info"><span class="debug-msg">No logs</span></div>';
        }

        // ====================================================================
        // UTILITIES
        // ====================================================================

        _escapeHtml(text) {
            if (!text) return '';
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        }
    }

    // ========================================================================
    // SINGLETON & AUTO-INIT
    // ========================================================================

    let appInstance = null;

    function getApp() {
        if (!appInstance) appInstance = new Application();
        return appInstance;
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => getApp().init());
    } else {
        getApp().init();
    }

    return {
        getApp,
        selectQuestion: (idx) => getApp().selectQuestion(idx),
        setView: (view) => getApp().setView(view),
        forceRefresh: () => getApp().forceRefresh(),
        newSession: () => getApp().newSession(),
        showStats: () => getApp().showStats(),
        // Debug helper
        debugState: () => {
            const app = getApp();
            const state = app.stateManager.state;
            const data = app.dataStore.get();
            console.log('=== Debug State ===');
            console.log('Mode:', state.mode);
            console.log('View:', state.view);
            console.log('Selected Question:', state.selectedQuestion);
            console.log('Total Questions:', data.questions.length);
            console.log('Total Responses:', data.responses.length);
            console.log('Questions:', data.questions);
            console.log('Data version:', data.version);
            return { state, data };
        }
    };

})();

window.app = VotingApp;