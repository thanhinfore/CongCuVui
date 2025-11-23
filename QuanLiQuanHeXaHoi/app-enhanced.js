// Social Relationship Manager Application - ENHANCED VERSION
// Author: Thành & Claude
// Description: Quản lý quan hệ xã hội nâng cấp với tính năng AI & Analytics

class SocialRelationshipManagerEnhanced {
    constructor() {
        this.contacts = [];
        this.currentEditId = null;
        this.userId = null;
        this.user = null;
        this.apiBaseUrl = window.location.origin;
        this.selectedContacts = new Set();
        this.chart = null;

        this.dunbarLimits = {
            inner: 5,
            close: 15,
            good: 50,
            friends: 150,
            acquaintances: 500
        };

        // Theme settings
        this.theme = localStorage.getItem('srm_theme') || 'light';

        this.init();
    }

    init() {
        this.checkAuth();
        this.setupEventListeners();
        this.loadContactsFromAPI();
        this.initTheme();
        this.setupKeyboardShortcuts();
        this.checkReminders();
        this.loadChartJS();
    }

    // ===== Load Chart.js =====
    loadChartJS() {
        if (!document.getElementById('chartjs-script')) {
            const script = document.createElement('script');
            script.id = 'chartjs-script';
            script.src = 'https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js';
            script.onload = () => {
                console.log('Chart.js loaded successfully');
            };
            document.head.appendChild(script);
        }
    }

    // ===== ENHANCED: Relationship Health Score =====
    calculateHealthScore(contact) {
        let score = 0;
        let maxScore = 100;

        // 1. Recency Score (40 points) - Tính điểm dựa trên thời gian gặp gần đây
        if (contact.lastMet) {
            const daysSinceLastMet = this.getDaysBetween(new Date(contact.lastMet), new Date());
            const levelThresholds = {
                inner: 7,      // Inner circle: nên gặp mỗi tuần
                close: 14,     // Close friends: mỗi 2 tuần
                good: 30,      // Good friends: mỗi tháng
                friends: 90,   // Friends: mỗi 3 tháng
                acquaintances: 180, // Acquaintances: mỗi 6 tháng
                others: 365    // Others: mỗi năm
            };

            const threshold = levelThresholds[contact.level] || 365;
            const recencyScore = Math.max(0, 40 - (daysSinceLastMet / threshold * 40));
            score += recencyScore;
        } else {
            score += 0; // No recent contact
        }

        // 2. Information Completeness Score (30 points)
        const fields = ['email', 'phone', 'company', 'position', 'metAt', 'metDate', 'facebook', 'tags', 'notes'];
        const filledFields = fields.filter(field => contact[field] && contact[field].toString().trim());
        score += (filledFields.length / fields.length) * 30;

        // 3. Relationship Depth Score (30 points) - Dựa trên level
        const levelScores = {
            inner: 30,
            close: 25,
            good: 20,
            friends: 15,
            acquaintances: 10,
            others: 5
        };
        score += levelScores[contact.level] || 5;

        return Math.round(score);
    }

    getHealthScoreColor(score) {
        if (score >= 80) return '#43e97b'; // Excellent - Green
        if (score >= 60) return '#4facfe'; // Good - Blue
        if (score >= 40) return '#fee140'; // Fair - Yellow
        return '#f5576c'; // Poor - Red
    }

    getHealthScoreLabel(score) {
        if (score >= 80) return 'Tuyệt vời';
        if (score >= 60) return 'Tốt';
        if (score >= 40) return 'Trung bình';
        return 'Cần chú ý';
    }

    // ===== ENHANCED: Smart Reminders =====
    checkReminders() {
        const reminders = this.getSmartReminders();
        if (reminders.length > 0) {
            this.showReminderNotification(reminders);
        }

        // Check every hour
        setInterval(() => {
            const reminders = this.getSmartReminders();
            if (reminders.length > 0) {
                this.showReminderNotification(reminders);
            }
        }, 3600000);
    }

    getSmartReminders() {
        const reminders = [];
        const today = new Date();

        this.contacts.forEach(contact => {
            if (!contact.lastMet) return;

            const daysSinceLastMet = this.getDaysBetween(new Date(contact.lastMet), today);
            const levelThresholds = {
                inner: 7,
                close: 14,
                good: 30,
                friends: 90,
                acquaintances: 180
            };

            const threshold = levelThresholds[contact.level];
            if (threshold && daysSinceLastMet > threshold) {
                reminders.push({
                    contact: contact,
                    daysSince: daysSinceLastMet,
                    message: `Đã ${daysSinceLastMet} ngày không gặp ${contact.name}!`
                });
            }
        });

        return reminders.slice(0, 5); // Top 5 reminders
    }

    showReminderNotification(reminders) {
        const reminderHtml = `
            <div class="reminder-notification">
                <div class="reminder-header">
                    <i class="fas fa-bell"></i>
                    <h3>Nhắc nhở quan hệ</h3>
                    <button class="close-reminder" onclick="this.closest('.reminder-notification').remove()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="reminder-list">
                    ${reminders.map(r => `
                        <div class="reminder-item" onclick="app.openViewModal(${r.contact.id}); this.closest('.reminder-notification').remove();">
                            <div class="reminder-avatar">${this.getInitials(r.contact.name)}</div>
                            <div class="reminder-info">
                                <strong>${this.escapeHtml(r.contact.name)}</strong>
                                <span>${r.message}</span>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;

        const existingReminder = document.querySelector('.reminder-notification');
        if (existingReminder) existingReminder.remove();

        document.body.insertAdjacentHTML('beforeend', reminderHtml);
    }

    // ===== ENHANCED: Dark Mode & Themes =====
    initTheme() {
        document.body.classList.toggle('dark-theme', this.theme === 'dark');
    }

    toggleTheme() {
        this.theme = this.theme === 'light' ? 'dark' : 'light';
        localStorage.setItem('srm_theme', this.theme);
        document.body.classList.toggle('dark-theme');
        this.showToast(`Đã chuyển sang chế độ ${this.theme === 'dark' ? 'tối' : 'sáng'}`);
    }

    // ===== ENHANCED: Keyboard Shortcuts =====
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ctrl/Cmd + K: Quick search focus
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                document.getElementById('search-input').focus();
            }

            // Ctrl/Cmd + N: New contact
            if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
                e.preventDefault();
                this.openContactModal();
            }

            // Ctrl/Cmd + D: Toggle dark mode
            if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
                e.preventDefault();
                this.toggleTheme();
            }

            // Ctrl/Cmd + E: Export data
            if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
                e.preventDefault();
                this.exportAsCSV();
            }

            // Esc: Close modal
            if (e.key === 'Escape') {
                this.closeContactModal();
                this.closeViewModal();
            }

            // Tab keys 1-3
            if (e.ctrlKey || e.metaKey) {
                if (e.key === '1') {
                    e.preventDefault();
                    this.switchTab('dashboard');
                } else if (e.key === '2') {
                    e.preventDefault();
                    this.switchTab('contacts');
                } else if (e.key === '3') {
                    e.preventDefault();
                    this.switchTab('timeline');
                }
            }
        });
    }

    // ===== ENHANCED: Import/Export Advanced =====
    exportAsCSV() {
        const contacts = this.selectedContacts.size > 0
            ? this.contacts.filter(c => this.selectedContacts.has(c.id))
            : this.contacts;

        if (contacts.length === 0) {
            alert('Không có dữ liệu để export!');
            return;
        }

        const headers = ['Name', 'Email', 'Phone', 'Level', 'Company', 'Position', 'MetAt', 'MetDate', 'LastMet', 'Facebook', 'Tags', 'Notes'];
        const csvContent = [
            headers.join(','),
            ...contacts.map(c => [
                this.escapeCsv(c.name),
                this.escapeCsv(c.email),
                this.escapeCsv(c.phone),
                this.escapeCsv(c.level),
                this.escapeCsv(c.company),
                this.escapeCsv(c.position),
                this.escapeCsv(c.metAt),
                this.escapeCsv(c.metDate),
                this.escapeCsv(c.lastMet),
                this.escapeCsv(c.facebook),
                this.escapeCsv(c.tags),
                this.escapeCsv(c.notes)
            ].join(','))
        ].join('\n');

        const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `quan-he-xa-hoi-${new Date().toISOString().split('T')[0]}.csv`;
        link.click();

        this.showToast(`Đã export ${contacts.length} người ra file CSV!`);
    }

    exportAsVCard() {
        const contacts = this.selectedContacts.size > 0
            ? this.contacts.filter(c => this.selectedContacts.has(c.id))
            : this.contacts;

        if (contacts.length === 0) {
            alert('Không có dữ liệu để export!');
            return;
        }

        const vCardContent = contacts.map(c => {
            return `BEGIN:VCARD
VERSION:3.0
FN:${c.name || ''}
EMAIL:${c.email || ''}
TEL:${c.phone || ''}
ORG:${c.company || ''}
TITLE:${c.position || ''}
NOTE:${c.notes || ''}
URL:${c.facebook || ''}
END:VCARD`;
        }).join('\n\n');

        const blob = new Blob([vCardContent], { type: 'text/vcard;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `contacts-${new Date().toISOString().split('T')[0]}.vcf`;
        link.click();

        this.showToast(`Đã export ${contacts.length} người ra file vCard!`);
    }

    exportAsJSON() {
        const contacts = this.selectedContacts.size > 0
            ? this.contacts.filter(c => this.selectedContacts.has(c.id))
            : this.contacts;

        const dataStr = JSON.stringify(contacts, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `quan-he-xa-hoi-${new Date().toISOString().split('T')[0]}.json`;
        link.click();

        this.showToast(`Đã export ${contacts.length} người ra file JSON!`);
    }

    importFromCSV() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.csv';
        input.onchange = async (e) => {
            const file = e.target.files[0];
            if (!file) return;

            const text = await file.text();
            const lines = text.split('\n').filter(l => l.trim());
            const headers = lines[0].split(',');

            const imported = [];
            for (let i = 1; i < lines.length; i++) {
                const values = this.parseCSVLine(lines[i]);
                const contact = {
                    name: values[0],
                    email: values[1],
                    phone: values[2],
                    level: values[3] || 'others',
                    company: values[4],
                    position: values[5],
                    metAt: values[6],
                    metDate: values[7] || null,
                    lastMet: values[8] || null,
                    facebook: values[9],
                    tags: values[10],
                    notes: values[11]
                };

                try {
                    const response = await fetch(`${this.apiBaseUrl}/api/contacts?userId=${this.userId}`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(contact)
                    });
                    const data = await response.json();
                    if (data.success) imported.push(contact);
                } catch (error) {
                    console.error('Error importing contact:', error);
                }
            }

            await this.loadContactsFromAPI();
            this.showToast(`Đã import thành công ${imported.length} người!`);
        };
        input.click();
    }

    escapeCsv(value) {
        if (!value) return '';
        const str = value.toString();
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
            return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
    }

    parseCSVLine(line) {
        const result = [];
        let current = '';
        let inQuotes = false;

        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            if (char === '"') {
                if (inQuotes && line[i + 1] === '"') {
                    current += '"';
                    i++;
                } else {
                    inQuotes = !inQuotes;
                }
            } else if (char === ',' && !inQuotes) {
                result.push(current);
                current = '';
            } else {
                current += char;
            }
        }
        result.push(current);
        return result;
    }

    // ===== ENHANCED: Bulk Operations =====
    toggleContactSelection(contactId) {
        if (this.selectedContacts.has(contactId)) {
            this.selectedContacts.delete(contactId);
        } else {
            this.selectedContacts.add(contactId);
        }
        this.updateBulkActionsBar();
    }

    selectAllContacts() {
        this.contacts.forEach(c => this.selectedContacts.add(c.id));
        this.renderContacts();
        this.updateBulkActionsBar();
    }

    deselectAllContacts() {
        this.selectedContacts.clear();
        this.renderContacts();
        this.updateBulkActionsBar();
    }

    async bulkDelete() {
        if (this.selectedContacts.size === 0) return;

        if (!confirm(`Bạn có chắc muốn xóa ${this.selectedContacts.size} người đã chọn?`)) return;

        for (const contactId of this.selectedContacts) {
            try {
                await fetch(`${this.apiBaseUrl}/api/contacts/${contactId}?userId=${this.userId}`, {
                    method: 'DELETE'
                });
            } catch (error) {
                console.error('Error deleting contact:', error);
            }
        }

        this.selectedContacts.clear();
        await this.loadContactsFromAPI();
        this.showToast('Đã xóa các liên hệ đã chọn!');
    }

    async bulkChangeLevel(newLevel) {
        if (this.selectedContacts.size === 0) return;

        for (const contactId of this.selectedContacts) {
            const contact = this.contacts.find(c => c.id === contactId);
            if (!contact) continue;

            try {
                await fetch(`${this.apiBaseUrl}/api/contacts/${contactId}?userId=${this.userId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ ...contact, level: newLevel })
                });
            } catch (error) {
                console.error('Error updating contact:', error);
            }
        }

        this.selectedContacts.clear();
        await this.loadContactsFromAPI();
        this.showToast(`Đã cập nhật ${this.selectedContacts.size} người sang nhóm mới!`);
    }

    updateBulkActionsBar() {
        let bar = document.querySelector('.bulk-actions-bar');

        if (this.selectedContacts.size === 0) {
            if (bar) bar.remove();
            return;
        }

        if (!bar) {
            bar = document.createElement('div');
            bar.className = 'bulk-actions-bar';
            document.body.appendChild(bar);
        }

        bar.innerHTML = `
            <div class="bulk-actions-content">
                <span class="bulk-count">${this.selectedContacts.size} người đã chọn</span>
                <div class="bulk-actions-buttons">
                    <button onclick="app.bulkDelete()" class="bulk-btn delete">
                        <i class="fas fa-trash"></i> Xóa
                    </button>
                    <select onchange="if(this.value) app.bulkChangeLevel(this.value); this.value='';" class="bulk-select">
                        <option value="">Đổi nhóm...</option>
                        <option value="inner">Inner Circle</option>
                        <option value="close">Close Friends</option>
                        <option value="good">Good Friends</option>
                        <option value="friends">Friends</option>
                        <option value="acquaintances">Acquaintances</option>
                        <option value="others">Others</option>
                    </select>
                    <button onclick="app.exportAsCSV()" class="bulk-btn">
                        <i class="fas fa-file-csv"></i> Export CSV
                    </button>
                    <button onclick="app.exportAsVCard()" class="bulk-btn">
                        <i class="fas fa-address-card"></i> Export vCard
                    </button>
                    <button onclick="app.deselectAllContacts()" class="bulk-btn">
                        <i class="fas fa-times"></i> Bỏ chọn
                    </button>
                </div>
            </div>
        `;
    }

    // ===== ENHANCED: Dashboard with Charts =====
    async renderAdvancedDashboard() {
        // Wait for Chart.js to load
        if (typeof Chart === 'undefined') {
            setTimeout(() => this.renderAdvancedDashboard(), 500);
            return;
        }

        // Add advanced charts section to dashboard
        const dashboard = document.getElementById('dashboard-tab');
        let chartsSection = document.getElementById('advanced-charts');

        if (!chartsSection) {
            chartsSection = document.createElement('div');
            chartsSection.id = 'advanced-charts';
            chartsSection.className = 'advanced-charts';
            chartsSection.innerHTML = `
                <h3 style="margin: 2rem 0 1rem;">Phân Tích Nâng Cao</h3>
                <div class="charts-grid">
                    <div class="chart-card">
                        <h4>Phân bố theo Dunbar Circles</h4>
                        <canvas id="dunbar-chart"></canvas>
                    </div>
                    <div class="chart-card">
                        <h4>Health Score Distribution</h4>
                        <canvas id="health-chart"></canvas>
                    </div>
                    <div class="chart-card">
                        <h4>Hoạt động gần đây (30 ngày)</h4>
                        <canvas id="activity-chart"></canvas>
                    </div>
                    <div class="chart-card">
                        <h4>Top Contacts by Health Score</h4>
                        <canvas id="top-contacts-chart"></canvas>
                    </div>
                </div>
            `;
            dashboard.appendChild(chartsSection);
        }

        this.renderDunbarChart();
        this.renderHealthChart();
        this.renderActivityChart();
        this.renderTopContactsChart();
    }

    renderDunbarChart() {
        const ctx = document.getElementById('dunbar-chart');
        if (!ctx) return;

        const levelCounts = {
            inner: 0, close: 0, good: 0, friends: 0, acquaintances: 0, others: 0
        };

        this.contacts.forEach(c => {
            levelCounts[c.level] = (levelCounts[c.level] || 0) + 1;
        });

        if (this.dunbarChart) this.dunbarChart.destroy();

        this.dunbarChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Inner Circle', 'Close Friends', 'Good Friends', 'Friends', 'Acquaintances', 'Others'],
                datasets: [{
                    data: [levelCounts.inner, levelCounts.close, levelCounts.good, levelCounts.friends, levelCounts.acquaintances, levelCounts.others],
                    backgroundColor: ['#667eea', '#f5576c', '#4facfe', '#43e97b', '#fee140', '#fed6e3']
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { position: 'bottom' }
                }
            }
        });
    }

    renderHealthChart() {
        const ctx = document.getElementById('health-chart');
        if (!ctx) return;

        const healthCategories = { excellent: 0, good: 0, fair: 0, poor: 0 };

        this.contacts.forEach(c => {
            const score = this.calculateHealthScore(c);
            if (score >= 80) healthCategories.excellent++;
            else if (score >= 60) healthCategories.good++;
            else if (score >= 40) healthCategories.fair++;
            else healthCategories.poor++;
        });

        if (this.healthChart) this.healthChart.destroy();

        this.healthChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['Tuyệt vời (80+)', 'Tốt (60-79)', 'Trung bình (40-59)', 'Cần chú ý (<40)'],
                datasets: [{
                    label: 'Số người',
                    data: [healthCategories.excellent, healthCategories.good, healthCategories.fair, healthCategories.poor],
                    backgroundColor: ['#43e97b', '#4facfe', '#fee140', '#f5576c']
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: { beginAtZero: true, ticks: { stepSize: 1 } }
                }
            }
        });
    }

    renderActivityChart() {
        const ctx = document.getElementById('activity-chart');
        if (!ctx) return;

        const last30Days = [];
        const today = new Date();
        for (let i = 29; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            last30Days.push(date.toISOString().split('T')[0]);
        }

        const activityData = last30Days.map(date => {
            return this.contacts.filter(c => {
                if (!c.lastMet) return false;
                return c.lastMet.split('T')[0] === date;
            }).length;
        });

        if (this.activityChart) this.activityChart.destroy();

        this.activityChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: last30Days.map(d => new Date(d).getDate()),
                datasets: [{
                    label: 'Số lượng gặp gỡ',
                    data: activityData,
                    borderColor: '#667eea',
                    backgroundColor: 'rgba(102, 126, 234, 0.1)',
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: { beginAtZero: true, ticks: { stepSize: 1 } }
                }
            }
        });
    }

    renderTopContactsChart() {
        const ctx = document.getElementById('top-contacts-chart');
        if (!ctx) return;

        const contactsWithScores = this.contacts.map(c => ({
            name: c.name,
            score: this.calculateHealthScore(c)
        })).sort((a, b) => b.score - a.score).slice(0, 10);

        if (this.topContactsChart) this.topContactsChart.destroy();

        this.topContactsChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: contactsWithScores.map(c => c.name.split(' ').slice(-1)[0]),
                datasets: [{
                    label: 'Health Score',
                    data: contactsWithScores.map(c => c.score),
                    backgroundColor: contactsWithScores.map(c => this.getHealthScoreColor(c.score))
                }]
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                scales: {
                    x: { beginAtZero: true, max: 100 }
                }
            }
        });
    }

    // ===== Authentication =====
    checkAuth() {
        const userId = localStorage.getItem('srm_userId');
        const user = localStorage.getItem('srm_user');

        if (!userId || !user) {
            window.location.href = 'login.html';
            return;
        }

        this.userId = parseInt(userId);
        this.user = JSON.parse(user);
        this.updateUserInfo();
    }

    updateUserInfo() {
        const logo = document.querySelector('.logo h1');
        if (logo && this.user) {
            logo.innerHTML = `Quản Lý Quan Hệ Xã Hội <small style="font-size: 0.6em; color: rgba(255,255,255,0.8); font-weight: 400;"> - ${this.user.fullName || this.user.username}</small>`;
        }
    }

    logout() {
        localStorage.removeItem('srm_userId');
        localStorage.removeItem('srm_user');
        localStorage.removeItem('srm_token');
        window.location.href = 'login.html';
    }

    // ===== API Calls =====
    async loadContactsFromAPI() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/api/contacts?userId=${this.userId}`);
            const data = await response.json();

            if (data.success) {
                this.contacts = data.data;
                this.updateDashboard();
                this.renderContacts();
                this.renderTimeline();
                this.renderAdvancedDashboard();
            }
        } catch (error) {
            console.error('Error loading contacts:', error);
            this.showToast('Lỗi khi tải danh bạ', 'error');
        }
    }

    async updateDashboardFromAPI() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/api/statistics?userId=${this.userId}`);
            const data = await response.json();

            if (data.success) {
                const stats = data.data;
                document.getElementById('total-contacts').textContent = stats.totalContacts;
                document.getElementById('dunbar-count').textContent = `${stats.dunbarCount}/150`;
                document.getElementById('recent-contacts').textContent = stats.recentContacts;

                this.updateCircleFromStats('inner', stats.innerCircle);
                this.updateCircleFromStats('close', stats.closeFriends);
                this.updateCircleFromStats('good', stats.goodFriends);
                this.updateCircleFromStats('friends', stats.friends);
                this.updateCircleFromStats('acquaintances', stats.acquaintances);
                this.updateCircleFromStats('others', stats.others);
            }

            this.renderAdvancedDashboard();
        } catch (error) {
            console.error('Error loading statistics:', error);
        }
    }

    updateCircleFromStats(level, stats) {
        const countEl = document.getElementById(`${level}-count`);
        const progressEl = document.getElementById(`${level}-progress`);

        if (stats.limit > 0) {
            countEl.textContent = `${stats.count}/${stats.limit}`;
        } else {
            countEl.textContent = stats.count.toString();
        }

        progressEl.style.width = `${stats.percentage}%`;
    }

    // ===== Event Listeners Setup =====
    setupEventListeners() {
        // Tab navigation
        document.querySelectorAll('.nav-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                if (e.target.dataset.tab) {
                    this.switchTab(e.target.dataset.tab);
                }
            });
        });

        // Add enhanced buttons to nav
        const navTabs = document.querySelector('.nav-tabs');

        // Theme toggle button
        const themeBtn = document.createElement('button');
        themeBtn.className = 'nav-tab';
        themeBtn.innerHTML = '<i class="fas fa-moon"></i>';
        themeBtn.title = 'Toggle Dark Mode (Ctrl+D)';
        themeBtn.addEventListener('click', () => this.toggleTheme());
        navTabs.appendChild(themeBtn);

        // Quick Actions button
        const quickActionsBtn = document.createElement('button');
        quickActionsBtn.className = 'nav-tab';
        quickActionsBtn.innerHTML = '<i class="fas fa-bolt"></i> Quick Actions';
        quickActionsBtn.addEventListener('click', () => this.showQuickActions());
        navTabs.appendChild(quickActionsBtn);

        // Logout button
        const logoutBtn = document.createElement('button');
        logoutBtn.className = 'nav-tab';
        logoutBtn.innerHTML = '<i class="fas fa-sign-out-alt"></i> Đăng Xuất';
        logoutBtn.addEventListener('click', () => this.logout());
        navTabs.appendChild(logoutBtn);

        // Add contact button
        document.getElementById('add-contact-btn').addEventListener('click', () => {
            this.openContactModal();
        });

        // Close modal buttons
        document.getElementById('close-modal').addEventListener('click', () => {
            this.closeContactModal();
        });

        document.getElementById('close-view-modal').addEventListener('click', () => {
            this.closeViewModal();
        });

        document.getElementById('cancel-btn').addEventListener('click', () => {
            this.closeContactModal();
        });

        // Form submission
        document.getElementById('contact-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveContact();
        });

        // Search and filter
        document.getElementById('search-input').addEventListener('input', (e) => {
            this.handleSearch(e.target.value);
        });

        document.getElementById('filter-level').addEventListener('change', (e) => {
            this.handleFilter(e.target.value);
        });

        document.getElementById('sort-by').addEventListener('change', (e) => {
            this.handleSort(e.target.value);
        });

        // Close modal when clicking outside
        document.getElementById('contact-modal').addEventListener('click', (e) => {
            if (e.target.id === 'contact-modal') {
                this.closeContactModal();
            }
        });

        document.getElementById('view-contact-modal').addEventListener('click', (e) => {
            if (e.target.id === 'view-contact-modal') {
                this.closeViewModal();
            }
        });

        // Circle card click to filter
        document.querySelectorAll('.circle-card').forEach(card => {
            card.addEventListener('click', (e) => {
                const level = card.dataset.level;
                this.switchTab('contacts');
                document.getElementById('filter-level').value = level;
                this.handleFilter(level);
            });
        });
    }

    showQuickActions() {
        const modal = document.createElement('div');
        modal.className = 'modal active';
        modal.innerHTML = `
            <div class="modal-content quick-actions-modal">
                <div class="modal-header">
                    <h2><i class="fas fa-bolt"></i> Quick Actions</h2>
                    <button class="close-modal" onclick="this.closest('.modal').remove()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="quick-actions-grid">
                    <button class="quick-action-btn" onclick="app.openContactModal(); this.closest('.modal').remove();">
                        <i class="fas fa-plus"></i>
                        <span>Thêm Người</span>
                        <small>Ctrl+N</small>
                    </button>
                    <button class="quick-action-btn" onclick="app.exportAsCSV(); this.closest('.modal').remove();">
                        <i class="fas fa-file-csv"></i>
                        <span>Export CSV</span>
                        <small>Ctrl+E</small>
                    </button>
                    <button class="quick-action-btn" onclick="app.exportAsVCard(); this.closest('.modal').remove();">
                        <i class="fas fa-address-card"></i>
                        <span>Export vCard</span>
                    </button>
                    <button class="quick-action-btn" onclick="app.exportAsJSON(); this.closest('.modal').remove();">
                        <i class="fas fa-file-code"></i>
                        <span>Export JSON</span>
                    </button>
                    <button class="quick-action-btn" onclick="app.importFromCSV(); this.closest('.modal').remove();">
                        <i class="fas fa-file-import"></i>
                        <span>Import CSV</span>
                    </button>
                    <button class="quick-action-btn" onclick="app.selectAllContacts(); this.closest('.modal').remove();">
                        <i class="fas fa-check-square"></i>
                        <span>Chọn Tất Cả</span>
                    </button>
                    <button class="quick-action-btn" onclick="app.toggleTheme(); this.closest('.modal').remove();">
                        <i class="fas fa-moon"></i>
                        <span>Dark Mode</span>
                        <small>Ctrl+D</small>
                    </button>
                    <button class="quick-action-btn" onclick="app.checkReminders(); this.closest('.modal').remove();">
                        <i class="fas fa-bell"></i>
                        <span>Xem Nhắc Nhở</span>
                    </button>
                </div>
                <div class="keyboard-shortcuts">
                    <h3>Keyboard Shortcuts</h3>
                    <div class="shortcuts-list">
                        <div><kbd>Ctrl+K</kbd> Quick Search</div>
                        <div><kbd>Ctrl+N</kbd> Thêm Người</div>
                        <div><kbd>Ctrl+D</kbd> Dark Mode</div>
                        <div><kbd>Ctrl+E</kbd> Export CSV</div>
                        <div><kbd>Ctrl+1/2/3</kbd> Switch Tabs</div>
                        <div><kbd>Esc</kbd> Close Modal</div>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }

    // ===== Tab Management =====
    switchTab(tabName) {
        document.querySelectorAll('.nav-tab').forEach(tab => {
            tab.classList.remove('active');
            if (tab.dataset.tab === tabName) {
                tab.classList.add('active');
            }
        });

        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        document.getElementById(`${tabName}-tab`).classList.add('active');

        if (tabName === 'dashboard') {
            this.updateDashboardFromAPI();
        } else if (tabName === 'timeline') {
            this.renderTimeline();
        }
    }

    // ===== Contact CRUD Operations =====
    async saveContact() {
        const formData = {
            name: document.getElementById('contact-name').value.trim(),
            email: document.getElementById('contact-email').value.trim(),
            phone: document.getElementById('contact-phone').value.trim(),
            level: document.getElementById('contact-level').value,
            metAt: document.getElementById('contact-met-at').value.trim(),
            metDate: document.getElementById('contact-met-date').value || null,
            lastMet: document.getElementById('contact-last-met').value || null,
            company: document.getElementById('contact-company').value.trim(),
            position: document.getElementById('contact-position').value.trim(),
            facebook: document.getElementById('contact-facebook').value.trim(),
            tags: document.getElementById('contact-tags').value.trim(),
            notes: document.getElementById('contact-notes').value.trim()
        };

        try {
            let response;
            if (this.currentEditId) {
                response = await fetch(`${this.apiBaseUrl}/api/contacts/${this.currentEditId}?userId=${this.userId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(formData)
                });
            } else {
                response = await fetch(`${this.apiBaseUrl}/api/contacts?userId=${this.userId}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(formData)
                });
            }

            const data = await response.json();

            if (data.success) {
                this.closeContactModal();
                await this.loadContactsFromAPI();
                this.showToast(data.message || (this.currentEditId ? 'Cập nhật thành công!' : 'Thêm người thành công!'));
            } else {
                alert(data.message || 'Có lỗi xảy ra');
            }
        } catch (error) {
            console.error('Error saving contact:', error);
            alert('Lỗi khi lưu dữ liệu. Vui lòng thử lại.');
        }
    }

    async deleteContact(id) {
        if (confirm('Bạn có chắc chắn muốn xóa người này?')) {
            try {
                const response = await fetch(`${this.apiBaseUrl}/api/contacts/${id}?userId=${this.userId}`, {
                    method: 'DELETE'
                });

                const data = await response.json();

                if (data.success) {
                    await this.loadContactsFromAPI();
                    this.showToast(data.message || 'Đã xóa thành công!');
                } else {
                    alert(data.message || 'Có lỗi xảy ra');
                }
            } catch (error) {
                console.error('Error deleting contact:', error);
                alert('Lỗi khi xóa dữ liệu. Vui lòng thử lại.');
            }
        }
    }

    // ===== Modal Management =====
    openContactModal(contactId = null) {
        this.currentEditId = contactId;
        const modal = document.getElementById('contact-modal');
        const form = document.getElementById('contact-form');

        form.reset();

        if (contactId) {
            const contact = this.contacts.find(c => c.id == contactId);
            if (contact) {
                document.getElementById('modal-title').textContent = 'Chỉnh Sửa Thông Tin';
                document.getElementById('contact-name').value = contact.name || '';
                document.getElementById('contact-email').value = contact.email || '';
                document.getElementById('contact-phone').value = contact.phone || '';
                document.getElementById('contact-level').value = contact.level || '';
                document.getElementById('contact-met-at').value = contact.metAt || '';
                document.getElementById('contact-met-date').value = contact.metDate ? contact.metDate.split('T')[0] : '';
                document.getElementById('contact-last-met').value = contact.lastMet ? contact.lastMet.split('T')[0] : '';
                document.getElementById('contact-company').value = contact.company || '';
                document.getElementById('contact-position').value = contact.position || '';
                document.getElementById('contact-facebook').value = contact.facebook || '';
                document.getElementById('contact-tags').value = contact.tags || '';
                document.getElementById('contact-notes').value = contact.notes || '';
            }
        } else {
            document.getElementById('modal-title').textContent = 'Thêm Người Mới';
        }

        modal.classList.add('active');
    }

    closeContactModal() {
        document.getElementById('contact-modal').classList.remove('active');
        this.currentEditId = null;
    }

    openViewModal(contactId) {
        const contact = this.contacts.find(c => c.id == contactId);
        if (!contact) return;

        const modal = document.getElementById('view-contact-modal');
        const detailsContainer = document.getElementById('contact-details');

        const levelNames = {
            'inner': 'Inner Circle',
            'close': 'Close Friends',
            'good': 'Good Friends',
            'friends': 'Friends',
            'acquaintances': 'Acquaintances',
            'others': 'Others'
        };

        const initials = this.getInitials(contact.name);
        const tags = contact.tags ? contact.tags.split(',').map(t => t.trim()).filter(t => t) : [];

        // Calculate health score
        const healthScore = this.calculateHealthScore(contact);
        const healthColor = this.getHealthScoreColor(healthScore);
        const healthLabel = this.getHealthScoreLabel(healthScore);

        detailsContainer.innerHTML = `
            <div class="detail-header">
                <div class="detail-avatar">${initials}</div>
                <h3 class="detail-name">${this.escapeHtml(contact.name)}</h3>
                <span class="contact-level ${contact.level}">${levelNames[contact.level] || contact.level}</span>
                <div class="health-score-badge" style="background: ${healthColor};">
                    <i class="fas fa-heart"></i> ${healthScore}/100 - ${healthLabel}
                </div>
            </div>
            <div class="detail-grid">
                ${contact.email ? `
                    <div class="detail-item">
                        <i class="fas fa-envelope"></i>
                        <div class="detail-item-content">
                            <strong>Email</strong>
                            <span><a href="mailto:${contact.email}">${this.escapeHtml(contact.email)}</a></span>
                        </div>
                    </div>
                ` : ''}
                ${contact.phone ? `
                    <div class="detail-item">
                        <i class="fas fa-phone"></i>
                        <div class="detail-item-content">
                            <strong>Điện thoại</strong>
                            <span><a href="tel:${contact.phone}">${this.escapeHtml(contact.phone)}</a></span>
                        </div>
                    </div>
                ` : ''}
                ${contact.company ? `
                    <div class="detail-item">
                        <i class="fas fa-building"></i>
                        <div class="detail-item-content">
                            <strong>Công ty</strong>
                            <span>${this.escapeHtml(contact.company)}</span>
                        </div>
                    </div>
                ` : ''}
                ${contact.position ? `
                    <div class="detail-item">
                        <i class="fas fa-briefcase"></i>
                        <div class="detail-item-content">
                            <strong>Chức vụ</strong>
                            <span>${this.escapeHtml(contact.position)}</span>
                        </div>
                    </div>
                ` : ''}
                ${contact.metAt ? `
                    <div class="detail-item">
                        <i class="fas fa-map-marker-alt"></i>
                        <div class="detail-item-content">
                            <strong>Gặp lần đầu tại</strong>
                            <span>${this.escapeHtml(contact.metAt)}</span>
                        </div>
                    </div>
                ` : ''}
                ${contact.metDate ? `
                    <div class="detail-item">
                        <i class="fas fa-calendar"></i>
                        <div class="detail-item-content">
                            <strong>Ngày gặp lần đầu</strong>
                            <span>${this.formatDate(contact.metDate)}</span>
                        </div>
                    </div>
                ` : ''}
                ${contact.lastMet ? `
                    <div class="detail-item">
                        <i class="fas fa-calendar-check"></i>
                        <div class="detail-item-content">
                            <strong>Gặp lần cuối</strong>
                            <span>${this.formatDate(contact.lastMet)} (${this.getDaysAgo(contact.lastMet)})</span>
                        </div>
                    </div>
                ` : ''}
                ${contact.facebook ? `
                    <div class="detail-item">
                        <i class="fab fa-facebook"></i>
                        <div class="detail-item-content">
                            <strong>Facebook</strong>
                            <span><a href="${contact.facebook}" target="_blank">${this.escapeHtml(contact.facebook)}</a></span>
                        </div>
                    </div>
                ` : ''}
                ${tags.length > 0 ? `
                    <div class="detail-item full-width">
                        <i class="fas fa-tags"></i>
                        <div class="detail-item-content">
                            <strong>Tags</strong>
                            <div class="detail-tags">
                                ${tags.map(tag => `<span class="tag">${this.escapeHtml(tag)}</span>`).join('')}
                            </div>
                        </div>
                    </div>
                ` : ''}
                ${contact.notes ? `
                    <div class="detail-item full-width">
                        <i class="fas fa-sticky-note"></i>
                        <div class="detail-item-content">
                            <strong>Ghi chú</strong>
                            <span>${this.escapeHtml(contact.notes)}</span>
                        </div>
                    </div>
                ` : ''}
            </div>
            <div class="detail-actions">
                <button class="btn-primary" onclick="app.openContactModal(${contact.id}); app.closeViewModal();">
                    <i class="fas fa-edit"></i> Chỉnh sửa
                </button>
                <button class="btn-secondary" onclick="app.deleteContact(${contact.id}); app.closeViewModal();">
                    <i class="fas fa-trash"></i> Xóa
                </button>
            </div>
        `;

        modal.classList.add('active');
    }

    closeViewModal() {
        document.getElementById('view-contact-modal').classList.remove('active');
    }

    // ===== Dashboard Updates =====
    updateDashboard() {
        this.updateDashboardFromAPI();
    }

    // ===== ENHANCED: Contacts Rendering with Health Score =====
    renderContacts(filteredContacts = null) {
        const container = document.getElementById('contacts-list');
        const contacts = filteredContacts || this.contacts;

        if (contacts.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-users-slash"></i>
                    <h3>Chưa có người nào</h3>
                    <p>Hãy bắt đầu thêm người vào danh bạ của bạn!</p>
                    <button class="btn-primary" onclick="app.openContactModal()">
                        <i class="fas fa-plus"></i> Thêm Người Đầu Tiên
                    </button>
                </div>
            `;
            return;
        }

        const levelNames = {
            'inner': 'Inner Circle',
            'close': 'Close Friends',
            'good': 'Good Friends',
            'friends': 'Friends',
            'acquaintances': 'Acquaintances',
            'others': 'Others'
        };

        // Add bulk actions header
        let html = `
            <div class="contacts-bulk-header">
                <label class="checkbox-label">
                    <input type="checkbox" onchange="if(this.checked) app.selectAllContacts(); else app.deselectAllContacts();">
                    <span>Chọn tất cả</span>
                </label>
                <span class="contacts-count">${contacts.length} người</span>
            </div>
        `;

        html += contacts.map(contact => {
            const initials = this.getInitials(contact.name);
            const lastMetText = contact.lastMet ? this.getDaysAgo(contact.lastMet) : 'Chưa cập nhật';
            const healthScore = this.calculateHealthScore(contact);
            const healthColor = this.getHealthScoreColor(healthScore);
            const isSelected = this.selectedContacts.has(contact.id);

            return `
                <div class="contact-item ${isSelected ? 'selected' : ''}" onclick="app.openViewModal(${contact.id})">
                    <label class="contact-checkbox" onclick="event.stopPropagation()">
                        <input type="checkbox" ${isSelected ? 'checked' : ''} onchange="app.toggleContactSelection(${contact.id})">
                    </label>
                    <div class="contact-avatar">${initials}</div>
                    <div class="contact-info">
                        <div class="contact-name">${this.escapeHtml(contact.name)}</div>
                        <div class="contact-meta">
                            ${contact.company ? `<span><i class="fas fa-building"></i> ${this.escapeHtml(contact.company)}</span>` : ''}
                            ${contact.position ? `<span><i class="fas fa-briefcase"></i> ${this.escapeHtml(contact.position)}</span>` : ''}
                            <span><i class="fas fa-calendar"></i> ${lastMetText}</span>
                        </div>
                    </div>
                    <div class="contact-health-score" style="background: ${healthColor};" title="Health Score: ${healthScore}/100">
                        <i class="fas fa-heart"></i> ${healthScore}
                    </div>
                    <span class="contact-level ${contact.level}">${levelNames[contact.level]}</span>
                    <div class="contact-actions" onclick="event.stopPropagation()">
                        <button class="btn-icon" onclick="app.openContactModal(${contact.id})" title="Chỉnh sửa">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn-icon delete" onclick="app.deleteContact(${contact.id})" title="Xóa">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            `;
        }).join('');

        container.innerHTML = html;
    }

    // ===== Timeline Rendering =====
    renderTimeline() {
        const container = document.getElementById('timeline-list');

        const timelineContacts = this.contacts
            .filter(c => c.lastMet || c.metDate)
            .sort((a, b) => {
                const dateA = new Date(a.lastMet || a.metDate);
                const dateB = new Date(b.lastMet || b.metDate);
                return dateB - dateA;
            });

        if (timelineContacts.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-clock"></i>
                    <h3>Chưa có lịch sử gặp gỡ</h3>
                    <p>Thêm ngày gặp gỡ cho các liên hệ của bạn để xem timeline.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = timelineContacts.map(contact => {
            const date = contact.lastMet || contact.metDate;
            const isLastMet = !!contact.lastMet;
            const title = isLastMet ? 'Gặp gỡ' : 'Gặp lần đầu';
            const location = contact.metAt ? ` tại ${this.escapeHtml(contact.metAt)}` : '';
            const healthScore = this.calculateHealthScore(contact);
            const healthColor = this.getHealthScoreColor(healthScore);

            return `
                <div class="timeline-item" onclick="app.openViewModal(${contact.id})" style="cursor: pointer;">
                    <div class="timeline-date">${this.formatDate(date)} - ${this.getDaysAgo(date)}</div>
                    <div class="timeline-content">
                        <div style="display: flex; align-items: center; gap: 10px;">
                            <h4>${title}: ${this.escapeHtml(contact.name)}</h4>
                            <span class="timeline-health-badge" style="background: ${healthColor};">
                                <i class="fas fa-heart"></i> ${healthScore}
                            </span>
                        </div>
                        <p>${location}${contact.notes ? ` - ${this.escapeHtml(contact.notes.substring(0, 100))}${contact.notes.length > 100 ? '...' : ''}` : ''}</p>
                    </div>
                </div>
            `;
        }).join('');
    }

    // ===== Search and Filter =====
    async handleSearch(query) {
        if (!query.trim()) {
            await this.loadContactsFromAPI();
            return;
        }

        try {
            const response = await fetch(`${this.apiBaseUrl}/api/contacts/search?userId=${this.userId}&q=${encodeURIComponent(query)}`);
            const data = await response.json();

            if (data.success) {
                this.contacts = data.data;
                this.renderContacts();
            }
        } catch (error) {
            console.error('Error searching contacts:', error);
        }
    }

    async handleFilter(level) {
        try {
            const url = level ?
                `${this.apiBaseUrl}/api/contacts/filter?userId=${this.userId}&level=${level}` :
                `${this.apiBaseUrl}/api/contacts?userId=${this.userId}`;

            const response = await fetch(url);
            const data = await response.json();

            if (data.success) {
                this.contacts = data.data;
                this.applySort(this.contacts);
            }
        } catch (error) {
            console.error('Error filtering contacts:', error);
        }
    }

    handleSort(sortBy) {
        this.applySort(this.contacts);
    }

    applySort(contacts) {
        const sortBy = document.getElementById('sort-by').value;

        if (sortBy === 'name') {
            contacts.sort((a, b) => a.name.localeCompare(b.name, 'vi'));
        } else if (sortBy === 'recent') {
            contacts.sort((a, b) => {
                const dateA = a.lastMet ? new Date(a.lastMet) : new Date(0);
                const dateB = b.lastMet ? new Date(b.lastMet) : new Date(0);
                return dateB - dateA;
            });
        } else if (sortBy === 'level') {
            const levelOrder = { inner: 0, close: 1, good: 2, friends: 3, acquaintances: 4, others: 5 };
            contacts.sort((a, b) => levelOrder[a.level] - levelOrder[b.level]);
        }

        this.renderContacts(contacts);
    }

    // ===== Utility Functions =====
    getInitials(name) {
        if (!name) return '?';
        const words = name.trim().split(' ');
        if (words.length === 1) {
            return words[0].charAt(0).toUpperCase();
        }
        return (words[0].charAt(0) + words[words.length - 1].charAt(0)).toUpperCase();
    }

    formatDate(dateString) {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('vi-VN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    getDaysAgo(dateString) {
        if (!dateString) return '';
        const date = new Date(dateString);
        const now = new Date();
        const diffTime = Math.abs(now - date);
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return 'Hôm nay';
        if (diffDays === 1) return '1 ngày trước';
        if (diffDays < 7) return `${diffDays} ngày trước`;
        if (diffDays < 30) return `${Math.floor(diffDays / 7)} tuần trước`;
        if (diffDays < 365) return `${Math.floor(diffDays / 30)} tháng trước`;
        return `${Math.floor(diffDays / 365)} năm trước`;
    }

    getDaysBetween(date1, date2) {
        const diffTime = Math.abs(date2 - date1);
        return Math.floor(diffTime / (1000 * 60 * 60 * 24));
    }

    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    showToast(message, type = 'success') {
        const toast = document.createElement('div');
        const bgColor = type === 'error' ? '#f56565' : 'linear-gradient(135deg, #667eea, #764ba2)';
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${bgColor};
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 0.5rem;
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
            z-index: 10000;
            animation: slideInRight 0.3s ease;
        `;
        toast.textContent = message;
        document.body.appendChild(toast);

        setTimeout(() => {
            toast.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }
}

// Initialize the enhanced application
const app = new SocialRelationshipManagerEnhanced();

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from { transform: translateX(400px); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOutRight {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(400px); opacity: 0; }
    }
`;
document.head.appendChild(style);
