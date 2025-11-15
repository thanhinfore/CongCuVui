// Social Relationship Manager Application - API Version
// Author: Thành
// Description: Quản lý quan hệ xã hội dựa trên số Dunbar với Backend API

class SocialRelationshipManagerAPI {
    constructor() {
        this.contacts = [];
        this.currentEditId = null;
        this.userId = null;
        this.user = null;
        this.apiBaseUrl = window.location.origin;

        this.dunbarLimits = {
            inner: 5,
            close: 15,
            good: 50,
            friends: 150,
            acquaintances: 500
        };

        this.init();
    }

    init() {
        // Check if user is logged in
        this.checkAuth();
        this.setupEventListeners();
        this.loadContactsFromAPI();
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

        // Update header with user info
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

                // Update stats
                document.getElementById('total-contacts').textContent = stats.totalContacts;
                document.getElementById('dunbar-count').textContent = `${stats.dunbarCount}/150`;
                document.getElementById('recent-contacts').textContent = stats.recentContacts;

                // Update circles
                this.updateCircleFromStats('inner', stats.innerCircle);
                this.updateCircleFromStats('close', stats.closeFriends);
                this.updateCircleFromStats('good', stats.goodFriends);
                this.updateCircleFromStats('friends', stats.friends);
                this.updateCircleFromStats('acquaintances', stats.acquaintances);
                this.updateCircleFromStats('others', stats.others);
            }
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
            tab.addEventListener('click', (e) => this.switchTab(e.target.dataset.tab));
        });

        // Add logout button
        const navTabs = document.querySelector('.nav-tabs');
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

    // ===== Tab Management =====
    switchTab(tabName) {
        // Update tab buttons
        document.querySelectorAll('.nav-tab').forEach(tab => {
            tab.classList.remove('active');
            if (tab.dataset.tab === tabName) {
                tab.classList.add('active');
            }
        });

        // Update tab content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        document.getElementById(`${tabName}-tab`).classList.add('active');

        // Refresh content if needed
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
                // Update existing contact
                response = await fetch(`${this.apiBaseUrl}/api/contacts/${this.currentEditId}?userId=${this.userId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(formData)
                });
            } else {
                // Create new contact
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
            // Edit mode
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
            // Add mode
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

        detailsContainer.innerHTML = `
            <div class="detail-header">
                <div class="detail-avatar">${initials}</div>
                <h3 class="detail-name">${this.escapeHtml(contact.name)}</h3>
                <span class="contact-level ${contact.level}">${levelNames[contact.level] || contact.level}</span>
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
        // Use API statistics instead
        this.updateDashboardFromAPI();
    }

    // ===== Contacts Rendering =====
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

        container.innerHTML = contacts.map(contact => {
            const initials = this.getInitials(contact.name);
            const lastMetText = contact.lastMet ? this.getDaysAgo(contact.lastMet) : 'Chưa cập nhật';

            return `
                <div class="contact-item" onclick="app.openViewModal(${contact.id})">
                    <div class="contact-avatar">${initials}</div>
                    <div class="contact-info">
                        <div class="contact-name">${this.escapeHtml(contact.name)}</div>
                        <div class="contact-meta">
                            ${contact.company ? `<span><i class="fas fa-building"></i> ${this.escapeHtml(contact.company)}</span>` : ''}
                            ${contact.position ? `<span><i class="fas fa-briefcase"></i> ${this.escapeHtml(contact.position)}</span>` : ''}
                            <span><i class="fas fa-calendar"></i> ${lastMetText}</span>
                        </div>
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
    }

    // ===== Timeline Rendering =====
    renderTimeline() {
        const container = document.getElementById('timeline-list');

        // Sort contacts by last met date
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

            return `
                <div class="timeline-item">
                    <div class="timeline-date">${this.formatDate(date)} - ${this.getDaysAgo(date)}</div>
                    <div class="timeline-content">
                        <h4>${title}: ${this.escapeHtml(contact.name)}</h4>
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

// Initialize the application
const app = new SocialRelationshipManagerAPI();

// Add CSS animation for toast
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(400px);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);
