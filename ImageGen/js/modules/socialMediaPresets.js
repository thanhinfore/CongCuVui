/* =====================================================
   SOCIAL MEDIA PRESETS MODULE (v12.0)
   AI-Powered Design Excellence
   ===================================================== */

export class SocialMediaPresets {
    constructor(state) {
        this.state = state;
        this.presets = this.getPresets();
        this.currentPlatform = null;
    }

    getPresets() {
        return {
            instagram: {
                name: 'Instagram',
                icon: '📷',
                color: '#E4405F',
                formats: [
                    { name: 'Post (Square)', width: 1080, height: 1080, ratio: '1:1', icon: '◼' },
                    { name: 'Story', width: 1080, height: 1920, ratio: '9:16', icon: '📱' },
                    { name: 'Reel', width: 1080, height: 1920, ratio: '9:16', icon: '🎬' },
                    { name: 'Portrait Post', width: 1080, height: 1350, ratio: '4:5', icon: '▭' },
                    { name: 'Landscape Post', width: 1080, height: 566, ratio: '1.91:1', icon: '▬' }
                ]
            },
            facebook: {
                name: 'Facebook',
                icon: '👥',
                color: '#1877F2',
                formats: [
                    { name: 'Post', width: 1200, height: 630, ratio: '1.91:1', icon: '◼' },
                    { name: 'Story', width: 1080, height: 1920, ratio: '9:16', icon: '📱' },
                    { name: 'Cover Photo', width: 820, height: 312, ratio: '2.63:1', icon: '▬' },
                    { name: 'Event Cover', width: 1920, height: 1080, ratio: '16:9', icon: '🎪' },
                    { name: 'Link Preview', width: 1200, height: 628, ratio: '1.91:1', icon: '🔗' }
                ]
            },
            linkedin: {
                name: 'LinkedIn',
                icon: '💼',
                color: '#0A66C2',
                formats: [
                    { name: 'Post', width: 1200, height: 627, ratio: '1.91:1', icon: '◼' },
                    { name: 'Article Cover', width: 744, height: 400, ratio: '1.86:1', icon: '📄' },
                    { name: 'Company Cover', width: 1536, height: 768, ratio: '2:1', icon: '🏢' },
                    { name: 'Blog Post', width: 1200, height: 627, ratio: '1.91:1', icon: '✍️' }
                ]
            },
            twitter: {
                name: 'Twitter/X',
                icon: '🐦',
                color: '#1DA1F2',
                formats: [
                    { name: 'Post', width: 1200, height: 675, ratio: '16:9', icon: '◼' },
                    { name: 'Header', width: 1500, height: 500, ratio: '3:1', icon: '▬' },
                    { name: 'Card', width: 1200, height: 628, ratio: '1.91:1', icon: '🎴' },
                    { name: 'In-Stream Photo', width: 1600, height: 900, ratio: '16:9', icon: '📷' }
                ]
            },
            youtube: {
                name: 'YouTube',
                icon: '🎥',
                color: '#FF0000',
                formats: [
                    { name: 'Thumbnail', width: 1280, height: 720, ratio: '16:9', icon: '▬' },
                    { name: 'Banner', width: 2560, height: 1440, ratio: '16:9', icon: '🎬' },
                    { name: 'Channel Art', width: 2560, height: 1440, ratio: '16:9', icon: '🎨' },
                    { name: 'End Screen', width: 1920, height: 1080, ratio: '16:9', icon: '🏁' }
                ]
            },
            pinterest: {
                name: 'Pinterest',
                icon: '📌',
                color: '#E60023',
                formats: [
                    { name: 'Standard Pin', width: 1000, height: 1500, ratio: '2:3', icon: '📍' },
                    { name: 'Long Pin', width: 1000, height: 2100, ratio: '1:2.1', icon: '📏' },
                    { name: 'Square Pin', width: 1000, height: 1000, ratio: '1:1', icon: '◼' },
                    { name: 'Board Cover', width: 600, height: 600, ratio: '1:1', icon: '📋' }
                ]
            },
            tiktok: {
                name: 'TikTok',
                icon: '🎵',
                color: '#000000',
                formats: [
                    { name: 'Video', width: 1080, height: 1920, ratio: '9:16', icon: '📱' },
                    { name: 'Profile Photo', width: 200, height: 200, ratio: '1:1', icon: '👤' }
                ]
            },
            custom: {
                name: 'Custom Size',
                icon: '⚙️',
                color: '#6366f1',
                formats: []
            }
        };
    }

    init() {
        this.createUI();
        console.log('📱 Social Media Presets initialized');
    }

    createUI() {
        // Find or create social presets section
        let section = document.getElementById('socialPresetsSection');

        if (!section) {
            // Create new section after style section
            const styleSection = document.getElementById('styleSection');
            if (!styleSection) return;

            section = document.createElement('section');
            section.id = 'socialPresetsSection';
            section.className = 'panel-section active v12-social-presets';

            section.innerHTML = `
                <div class="section-header">
                    <svg class="section-icon" viewBox="0 0 24 24">
                        <rect x="3" y="3" width="7" height="7" rx="1" stroke="currentColor" stroke-width="2" fill="none"/>
                        <rect x="14" y="3" width="7" height="7" rx="1" stroke="currentColor" stroke-width="2" fill="none"/>
                        <rect x="3" y="14" width="7" height="7" rx="1" stroke="currentColor" stroke-width="2" fill="none"/>
                        <rect x="14" y="14" width="7" height="7" rx="1" stroke="currentColor" stroke-width="2" fill="none"/>
                    </svg>
                    <h2 class="section-title">📱 Social Media Sizes</h2>
                    <span class="v7-badge v7-badge-success">New in v12!</span>
                </div>
                <div class="section-content">
                    <div class="social-platforms-grid" id="socialPlatformsGrid"></div>
                    <div class="social-formats-container" id="socialFormatsContainer" style="display: none;">
                        <div class="social-formats-header">
                            <button class="back-btn" id="backToplatforms">← Back</button>
                            <h3 id="currentPlatformName"></h3>
                        </div>
                        <div class="social-formats-grid" id="socialFormatsGrid"></div>
                    </div>
                    <div class="social-info">
                        <strong>💡 Tip:</strong> Select a platform to see optimized sizes for that social network.
                    </div>
                </div>
            `;

            styleSection.parentNode.insertBefore(section, styleSection.nextSibling);
        }

        this.renderPlatforms();
        this.setupEventListeners();
    }

    renderPlatforms() {
        const grid = document.getElementById('socialPlatformsGrid');
        if (!grid) return;

        grid.innerHTML = '';

        Object.entries(this.presets).forEach(([key, platform]) => {
            if (key === 'custom') return; // Skip custom for now

            const card = document.createElement('div');
            card.className = 'social-platform-card';
            card.dataset.platform = key;
            card.style.cssText = `
                background: white;
                border: 2px solid ${platform.color}20;
                border-radius: 12px;
                padding: 16px;
                cursor: pointer;
                transition: all 0.2s;
                text-align: center;
            `;

            card.innerHTML = `
                <div style="font-size: 2rem; margin-bottom: 8px;">${platform.icon}</div>
                <div style="font-weight: 600; color: ${platform.color}; margin-bottom: 4px;">${platform.name}</div>
                <div style="font-size: 0.75rem; color: #64748b;">${platform.formats.length} formats</div>
            `;

            card.addEventListener('mouseenter', () => {
                card.style.transform = 'translateY(-4px)';
                card.style.boxShadow = `0 8px 24px ${platform.color}40`;
                card.style.borderColor = platform.color;
            });

            card.addEventListener('mouseleave', () => {
                card.style.transform = 'translateY(0)';
                card.style.boxShadow = 'none';
                card.style.borderColor = `${platform.color}20`;
            });

            card.addEventListener('click', () => {
                this.showPlatformFormats(key);
            });

            grid.appendChild(card);
        });
    }

    showPlatformFormats(platformKey) {
        const platform = this.presets[platformKey];
        if (!platform) return;

        this.currentPlatform = platformKey;

        // Hide platforms, show formats
        const platformsGrid = document.getElementById('socialPlatformsGrid');
        const formatsContainer = document.getElementById('socialFormatsContainer');
        const platformName = document.getElementById('currentPlatformName');

        if (platformsGrid) platformsGrid.style.display = 'none';
        if (formatsContainer) formatsContainer.style.display = 'block';
        if (platformName) platformName.textContent = `${platform.icon} ${platform.name}`;

        this.renderFormats(platformKey);
    }

    renderFormats(platformKey) {
        const platform = this.presets[platformKey];
        const grid = document.getElementById('socialFormatsGrid');
        if (!grid) return;

        grid.innerHTML = '';

        platform.formats.forEach((format) => {
            const card = document.createElement('div');
            card.className = 'social-format-card';
            card.style.cssText = `
                background: white;
                border: 2px solid #e2e8f0;
                border-radius: 8px;
                padding: 16px;
                cursor: pointer;
                transition: all 0.2s;
            `;

            card.innerHTML = `
                <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px;">
                    <div style="font-size: 1.5rem;">${format.icon}</div>
                    <div style="flex: 1;">
                        <div style="font-weight: 600; color: #0f172a; margin-bottom: 2px;">${format.name}</div>
                        <div style="font-size: 0.75rem; color: #64748b;">${format.width} × ${format.height}px</div>
                    </div>
                </div>
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <span style="font-size: 0.75rem; background: #f1f5f9; padding: 4px 8px; border-radius: 4px; color: #475569;">
                        ${format.ratio}
                    </span>
                    <button class="apply-format-btn" style="background: ${platform.color}; color: white; border: none; padding: 6px 12px; border-radius: 6px; font-size: 0.75rem; cursor: pointer; font-weight: 600;">
                        Apply
                    </button>
                </div>
            `;

            const applyBtn = card.querySelector('.apply-format-btn');
            applyBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.applyFormat(format, platform);
            });

            card.addEventListener('mouseenter', () => {
                card.style.transform = 'translateX(4px)';
                card.style.borderColor = platform.color;
                card.style.boxShadow = `0 4px 12px ${platform.color}20`;
            });

            card.addEventListener('mouseleave', () => {
                card.style.transform = 'translateX(0)';
                card.style.borderColor = '#e2e8f0';
                card.style.boxShadow = 'none';
            });

            grid.appendChild(card);
        });
    }

    setupEventListeners() {
        const backBtn = document.getElementById('backToplatforms');
        if (backBtn) {
            backBtn.addEventListener('click', () => {
                this.showPlatforms();
            });
        }
    }

    showPlatforms() {
        const platformsGrid = document.getElementById('socialPlatformsGrid');
        const formatsContainer = document.getElementById('socialFormatsContainer');

        if (platformsGrid) platformsGrid.style.display = 'grid';
        if (formatsContainer) formatsContainer.style.display = 'none';

        this.currentPlatform = null;
    }

    applyFormat(format, platform) {
        // Create a solid background with the specified dimensions
        if (window.imageTextApp?.components?.solidBg) {
            const solidBg = window.imageTextApp.components.solidBg;

            // Set dimensions
            const widthInput = document.getElementById('solidBgWidth');
            const heightInput = document.getElementById('solidBgHeight');

            if (widthInput) widthInput.value = format.width;
            if (heightInput) heightInput.value = format.height;

            // Generate the background
            solidBg.generate();

            // Show success message
            if (window.imageTextApp?.components?.v6ui) {
                window.imageTextApp.components.v6ui.showToast(
                    `✅ ${platform.name} ${format.name} (${format.width}×${format.height}) applied!`,
                    'success',
                    3000
                );
            }

            // Close formats and go back to platforms
            this.showPlatforms();
        }
    }

    getPlatformInfo(platformKey) {
        return this.presets[platformKey] || null;
    }

    getAllPlatforms() {
        return Object.keys(this.presets).filter(key => key !== 'custom');
    }
}
