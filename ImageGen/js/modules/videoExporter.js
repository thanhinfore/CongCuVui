/* =====================================================
   VIDEO EXPORTER v11 - Export Images to Video
   Features: MP4, WebM, GIF export with transitions
   ===================================================== */

export class VideoExporter {
    constructor(app) {
        this.app = app;
        this.isExporting = false;
        this.recorder = null;
        this.chunks = [];
        this.gifWorker = null;
        this.init();
    }

    init() {
        this.createUI();
        this.setupEventListeners();
        this.injectStyles();
    }

    createUI() {
        // Create video export panel
        const panel = document.createElement('div');
        panel.id = 'videoExportPanel';
        panel.className = 'video-export-panel-container';
        panel.innerHTML = `
            <div class="video-export-panel">
                <div class="panel-header">
                    <h3>🎬 Video Export</h3>
                    <button class="btn-close-panel" id="closeVideoExport">
                        <svg viewBox="0 0 24 24" width="20" height="20">
                            <path stroke="currentColor" stroke-width="2" fill="none" d="M18 6L6 18M6 6l12 12"/>
                        </svg>
                    </button>
                </div>

                <div class="panel-body">
                    <div class="export-section">
                        <h4>📹 Format</h4>
                        <div class="format-options">
                            <label class="format-option">
                                <input type="radio" name="videoFormat" value="webm" checked>
                                <div class="option-card">
                                    <div class="option-icon">🎥</div>
                                    <div class="option-name">WebM</div>
                                    <div class="option-desc">High quality, small size</div>
                                </div>
                            </label>
                            <label class="format-option">
                                <input type="radio" name="videoFormat" value="gif">
                                <div class="option-card">
                                    <div class="option-icon">🖼️</div>
                                    <div class="option-name">GIF</div>
                                    <div class="option-desc">Universal compatibility</div>
                                </div>
                            </label>
                        </div>
                    </div>

                    <div class="export-section">
                        <h4>⏱️ Timing</h4>
                        <div class="setting-group">
                            <label>
                                Duration per image:
                                <span class="value-display" id="imageDurationValue">2.0s</span>
                            </label>
                            <input type="range" id="imageDuration" min="0.5" max="5" step="0.1" value="2" class="v11-range">
                            <div class="range-labels">
                                <span>0.5s</span>
                                <span>5s</span>
                            </div>
                        </div>

                        <div class="setting-group">
                            <label>
                                Transition duration:
                                <span class="value-display" id="transitionDurationValue">0.5s</span>
                            </label>
                            <input type="range" id="transitionDuration" min="0" max="2" step="0.1" value="0.5" class="v11-range">
                            <div class="range-labels">
                                <span>None</span>
                                <span>2s</span>
                            </div>
                        </div>

                        <div class="setting-group">
                            <label>
                                Frame rate:
                                <span class="value-display" id="fpsValue">30 fps</span>
                            </label>
                            <input type="range" id="videoFps" min="15" max="60" step="5" value="30" class="v11-range">
                            <div class="range-labels">
                                <span>15 fps</span>
                                <span>60 fps</span>
                            </div>
                        </div>
                    </div>

                    <div class="export-section">
                        <h4>✨ Transition Effect</h4>
                        <select id="transitionEffect" class="v11-select v11-input">
                            <option value="fade">Fade</option>
                            <option value="slide-left">Slide Left</option>
                            <option value="slide-right">Slide Right</option>
                            <option value="slide-up">Slide Up</option>
                            <option value="slide-down">Slide Down</option>
                            <option value="zoom">Zoom</option>
                            <option value="none">No Transition</option>
                        </select>
                    </div>

                    <div class="export-section">
                        <h4>🔄 Loop</h4>
                        <label class="checkbox-label">
                            <input type="checkbox" id="videoLoop" checked class="v11-checkbox">
                            <span>Loop video (repeat infinitely)</span>
                        </label>
                    </div>

                    <div class="export-section">
                        <h4>📊 Preview</h4>
                        <div class="video-preview-info">
                            <div class="info-item">
                                <span class="info-label">Images:</span>
                                <span class="info-value" id="previewImageCount">0</span>
                            </div>
                            <div class="info-item">
                                <span class="info-label">Duration:</span>
                                <span class="info-value" id="previewDuration">0.0s</span>
                            </div>
                            <div class="info-item">
                                <span class="info-label">Size estimate:</span>
                                <span class="info-value" id="previewSize">~0 MB</span>
                            </div>
                        </div>
                    </div>

                    <div class="export-progress" id="exportProgress" style="display: none;">
                        <div class="progress-header">
                            <span>Exporting...</span>
                            <span id="exportProgressPercent">0%</span>
                        </div>
                        <div class="v11-progress">
                            <div class="v11-progress-bar" id="exportProgressBar" style="width: 0%"></div>
                        </div>
                        <div class="progress-status" id="exportProgressStatus">Preparing...</div>
                    </div>
                </div>

                <div class="panel-footer">
                    <button class="btn-cancel" id="cancelVideoExport">Cancel</button>
                    <button class="btn-export v11-btn" id="startVideoExport">
                        <svg viewBox="0 0 24 24" width="20" height="20">
                            <path stroke="currentColor" stroke-width="2" fill="none" d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/>
                        </svg>
                        Export Video
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(panel);
        this.panel = panel;
    }

    setupEventListeners() {
        // Close panel
        const closeBtn = document.getElementById('closeVideoExport');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.close());
        }

        // Click outside to close
        this.panel.addEventListener('click', (e) => {
            if (e.target === this.panel) {
                this.close();
            }
        });

        // Range inputs
        const imageDuration = document.getElementById('imageDuration');
        const transitionDuration = document.getElementById('transitionDuration');
        const videoFps = document.getElementById('videoFps');

        if (imageDuration) {
            imageDuration.addEventListener('input', (e) => {
                document.getElementById('imageDurationValue').textContent = `${e.target.value}s`;
                this.updatePreview();
            });
        }

        if (transitionDuration) {
            transitionDuration.addEventListener('input', (e) => {
                document.getElementById('transitionDurationValue').textContent = `${e.target.value}s`;
                this.updatePreview();
            });
        }

        if (videoFps) {
            videoFps.addEventListener('input', (e) => {
                document.getElementById('fpsValue').textContent = `${e.target.value} fps`;
                this.updatePreview();
            });
        }

        // Format change
        document.querySelectorAll('input[name="videoFormat"]').forEach(radio => {
            radio.addEventListener('change', () => {
                this.updatePreview();
            });
        });

        // Export button
        const exportBtn = document.getElementById('startVideoExport');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => this.startExport());
        }

        // Cancel button
        const cancelBtn = document.getElementById('cancelVideoExport');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => this.close());
        }

        // Transition effect
        const transitionEffect = document.getElementById('transitionEffect');
        if (transitionEffect) {
            transitionEffect.addEventListener('change', () => {
                this.updatePreview();
            });
        }
    }

    open() {
        const imageCount = this.app.state?.images?.length || 0;

        if (imageCount === 0) {
            this.showToast('Please add images first before exporting video', 'warning');
            return;
        }

        this.panel.classList.add('active');
        this.updatePreview();
    }

    close() {
        if (this.isExporting) {
            if (!confirm('Export is in progress. Are you sure you want to cancel?')) {
                return;
            }
            this.cancelExport();
        }
        this.panel.classList.remove('active');
    }

    updatePreview() {
        const imageCount = this.app.state?.images?.length || 0;
        const imageDuration = parseFloat(document.getElementById('imageDuration')?.value || 2);
        const transitionDuration = parseFloat(document.getElementById('transitionDuration')?.value || 0.5);
        const format = document.querySelector('input[name="videoFormat"]:checked')?.value || 'webm';

        const totalDuration = imageCount * (imageDuration + transitionDuration);

        // Size estimate (very rough)
        const fps = parseInt(document.getElementById('videoFps')?.value || 30);
        const totalFrames = totalDuration * fps;
        const bytesPerFrame = format === 'gif' ? 1024 * 50 : 1024 * 10; // GIF larger than video
        const estimatedSize = (totalFrames * bytesPerFrame) / (1024 * 1024);

        document.getElementById('previewImageCount').textContent = imageCount;
        document.getElementById('previewDuration').textContent = `${totalDuration.toFixed(1)}s`;
        document.getElementById('previewSize').textContent = `~${estimatedSize.toFixed(1)} MB`;
    }

    async startExport() {
        if (this.isExporting) return;

        const imageCount = this.app.state?.images?.length || 0;
        if (imageCount === 0) {
            this.showToast('No images to export', 'error');
            return;
        }

        this.isExporting = true;
        this.showProgress(true);

        const format = document.querySelector('input[name="videoFormat"]:checked')?.value || 'webm';

        try {
            if (format === 'gif') {
                await this.exportGIF();
            } else {
                await this.exportVideo(format);
            }
        } catch (error) {
            console.error('Export failed:', error);
            this.showToast('Export failed: ' + error.message, 'error');
        } finally {
            this.isExporting = false;
            this.showProgress(false);
        }
    }

    async exportVideo(format = 'webm') {
        const images = this.app.state.images;
        if (!images || images.length === 0) {
            throw new Error('No images to export');
        }

        const imageDuration = parseFloat(document.getElementById('imageDuration')?.value || 2) * 1000; // ms
        const transitionDuration = parseFloat(document.getElementById('transitionDuration')?.value || 0.5) * 1000; // ms
        const fps = parseInt(document.getElementById('videoFps')?.value || 30);
        const transitionEffect = document.getElementById('transitionEffect')?.value || 'fade';

        // Get dimensions from first image
        const firstImage = images[0];
        if (!firstImage || !firstImage.img) {
            throw new Error('Invalid image data');
        }

        // Create canvas with original image dimensions
        const canvas = document.createElement('canvas');
        canvas.width = firstImage.img.width;
        canvas.height = firstImage.img.height;
        const ctx = canvas.getContext('2d');

        // Render full-resolution canvases for all images
        this.updateProgressStatus('Preparing images...');
        const renderedCanvases = await this.renderAllImages(images, canvas.width, canvas.height);

        // Setup MediaRecorder
        const stream = canvas.captureStream(fps);
        const mimeType = format === 'webm' ? 'video/webm;codecs=vp9' : 'video/mp4';

        // Fallback if VP9 not supported
        const finalMimeType = MediaRecorder.isTypeSupported(mimeType)
            ? mimeType
            : 'video/webm';

        this.recorder = new MediaRecorder(stream, {
            mimeType: finalMimeType,
            videoBitsPerSecond: 5000000 // 5 Mbps
        });

        this.chunks = [];

        this.recorder.ondataavailable = (e) => {
            if (e.data.size > 0) {
                this.chunks.push(e.data);
            }
        };

        this.recorder.onstop = () => {
            const blob = new Blob(this.chunks, { type: finalMimeType });
            this.downloadBlob(blob, `video-export.${format}`);
            this.showToast('Video exported successfully!', 'success');
        };

        // Start recording
        this.recorder.start();

        const totalFrames = images.length * ((imageDuration + transitionDuration) * fps / 1000);
        let currentFrame = 0;

        // Render each image with transitions
        for (let i = 0; i < renderedCanvases.length; i++) {
            this.updateProgressStatus(`Rendering image ${i + 1}/${renderedCanvases.length}...`);

            const currentCanvas = renderedCanvases[i];
            if (!currentCanvas) continue;

            const nextCanvas = i < renderedCanvases.length - 1 ? renderedCanvases[i + 1] : null;

            // Display current image
            const displayFrames = Math.floor(imageDuration * fps / 1000);
            for (let f = 0; f < displayFrames; f++) {
                ctx.drawImage(currentCanvas, 0, 0);
                await this.waitForNextFrame(1000 / fps);
                currentFrame++;
                this.updateProgressBar((currentFrame / totalFrames) * 100);
            }

            // Transition to next image
            if (nextCanvas && transitionDuration > 0) {
                const transitionFrames = Math.floor(transitionDuration * fps / 1000);
                for (let f = 0; f < transitionFrames; f++) {
                    const progress = f / transitionFrames;
                    this.renderTransition(ctx, currentCanvas, nextCanvas, progress, transitionEffect);
                    await this.waitForNextFrame(1000 / fps);
                    currentFrame++;
                    this.updateProgressBar((currentFrame / totalFrames) * 100);
                }
            }
        }

        // Stop recording
        this.recorder.stop();
    }

    async exportGIF() {
        this.updateProgressStatus('Loading GIF encoder...');

        const images = this.app.state.images;
        if (!images || images.length === 0) {
            throw new Error('No images to export');
        }

        // Load gif.js library dynamically
        if (!window.GIF) {
            await this.loadGifJS();
        }

        const imageDuration = parseFloat(document.getElementById('imageDuration')?.value || 2) * 1000; // ms
        const transitionDuration = parseFloat(document.getElementById('transitionDuration')?.value || 0.5) * 1000; // ms
        const fps = Math.min(parseInt(document.getElementById('videoFps')?.value || 30), 30); // GIF max 30fps recommended
        const transitionEffect = document.getElementById('transitionEffect')?.value || 'fade';

        // Get dimensions from first image
        const firstImage = images[0];
        const gifWidth = Math.min(firstImage.img.width, 800); // Limit GIF size
        const gifHeight = Math.round(firstImage.img.height * (gifWidth / firstImage.img.width));

        const gif = new window.GIF({
            workers: 2,
            quality: 10,
            width: gifWidth,
            height: gifHeight,
            workerScript: 'https://cdn.jsdelivr.net/npm/gif.js@0.2.0/dist/gif.worker.js'
        });

        // Create temp canvas for frames
        const canvas = document.createElement('canvas');
        canvas.width = gifWidth;
        canvas.height = gifHeight;
        const ctx = canvas.getContext('2d');

        // Render full-resolution canvases for all images
        this.updateProgressStatus('Preparing images...');
        const renderedCanvases = await this.renderAllImages(images, gifWidth, gifHeight);

        const totalSteps = renderedCanvases.length * 2; // image display + transition
        let currentStep = 0;

        for (let i = 0; i < renderedCanvases.length; i++) {
            this.updateProgressStatus(`Processing image ${i + 1}/${renderedCanvases.length}...`);

            const currentCanvas = renderedCanvases[i];
            const nextCanvas = i < renderedCanvases.length - 1 ? renderedCanvases[i + 1] : null;

            // Add current image frame
            ctx.drawImage(currentCanvas, 0, 0);
            gif.addFrame(ctx, { delay: imageDuration, copy: true });

            currentStep++;
            this.updateProgressBar((currentStep / totalSteps) * 100);

            // Add transition frames
            if (nextCanvas && transitionDuration > 0) {
                const transitionFrames = Math.max(Math.floor(transitionDuration * fps / 1000), 5);
                for (let f = 0; f < transitionFrames; f++) {
                    const progress = f / transitionFrames;
                    this.renderTransition(ctx, currentCanvas, nextCanvas, progress, transitionEffect);
                    gif.addFrame(ctx, { delay: transitionDuration / transitionFrames, copy: true });
                }
            }

            currentStep++;
            this.updateProgressBar((currentStep / totalSteps) * 100);
        }

        this.updateProgressStatus('Encoding GIF...');

        gif.on('finished', (blob) => {
            this.downloadBlob(blob, 'video-export.gif');
            this.showToast('GIF exported successfully!', 'success');
        });

        gif.render();
    }

    async renderAllImages(images, width, height) {
        const canvases = [];
        const preview = this.app.components?.preview;

        if (!preview) {
            throw new Error('Preview component not available');
        }

        for (let i = 0; i < images.length; i++) {
            this.updateProgressStatus(`Preparing image ${i + 1}/${images.length}...`);

            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');

            const img = images[i].img;

            // Draw image
            ctx.drawImage(img, 0, 0, width, height);

            // Get text config - use textConfigs if available, otherwise use default from DOM
            let textConfig;
            if (preview.textConfigs && preview.textConfigs[i]) {
                textConfig = preview.textConfigs[i];
            } else {
                // Build config from current DOM state
                textConfig = this.getCurrentTextConfig(i);
            }

            // Render text overlay using preview's render method
            // We need to call the text rendering part
            await this.renderTextOnCanvas(ctx, canvas, textConfig, width, height);

            canvases.push(canvas);
        }

        return canvases;
    }

    getCurrentTextConfig(imageIndex) {
        // Build text config from current DOM state
        const app = this.app;
        return {
            imageIndex: imageIndex,
            text: app.DOM?.textInput?.value || '',
            font: app.DOM?.fontSelect?.value || 'Inter, sans-serif',
            mainColor: app.DOM?.colorPicker?.value || '#FFFFFF',
            subColor: app.DOM?.subColorPicker?.value || '#FFFFFF',
            position: app.DOM?.positionPicker?.value || 'bottom',
            mainFontSize: parseInt(app.DOM?.mainFontSize?.value || 48),
            subFontSize: parseInt(app.DOM?.subFontSize?.value || 32),
            fontWeight: app.DOM?.fontWeightSelect?.value || '400',
            textBorder: app.DOM?.textBorderCheckbox?.checked || false,
            textShadow: app.DOM?.textShadowCheckbox?.checked || false,
            borderWidth: parseInt(app.DOM?.borderWidth?.value || 2),
            shadowBlur: parseInt(app.DOM?.shadowBlur?.value || 4)
        };
    }

    async renderTextOnCanvas(ctx, canvas, config, width, height) {
        // Simple text rendering - we'll use basic implementation
        // In production, this should use the full preview panel rendering logic

        if (!config.text || config.text.trim() === '') {
            return;
        }

        const lines = config.text.split('\n').filter(line => line.trim());
        if (lines.length === 0) return;

        const mainText = lines[0];
        const subText = lines.slice(1).join('\n');

        ctx.save();

        // Setup text style
        ctx.font = `${config.fontWeight} ${config.mainFontSize}px ${config.font}`;
        ctx.fillStyle = config.mainColor;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Calculate position
        let y;
        const centerX = width / 2;

        switch (config.position) {
            case 'top':
                y = height * 0.15;
                break;
            case 'middle':
                y = height * 0.5;
                break;
            case 'bottom':
            default:
                y = height * 0.85;
                break;
        }

        // Draw text effects
        if (config.textShadow) {
            ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
            ctx.shadowBlur = config.shadowBlur;
            ctx.shadowOffsetX = 2;
            ctx.shadowOffsetY = 2;
        }

        if (config.textBorder) {
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = config.borderWidth;
            ctx.strokeText(mainText, centerX, y);
        }

        // Draw main text
        ctx.fillText(mainText, centerX, y);

        // Draw subtitle if exists
        if (subText) {
            ctx.font = `${config.fontWeight} ${config.subFontSize}px ${config.font}`;
            ctx.fillStyle = config.subColor;

            const subLines = subText.split('\n');
            subLines.forEach((line, index) => {
                const subY = y + config.mainFontSize + 20 + (index * config.subFontSize * 1.2);

                if (config.textBorder) {
                    ctx.strokeText(line, centerX, subY);
                }
                ctx.fillText(line, centerX, subY);
            });
        }

        ctx.restore();
    }

    renderTransition(ctx, canvas1, canvas2, progress, effect) {
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

        switch (effect) {
            case 'fade':
                ctx.globalAlpha = 1 - progress;
                ctx.drawImage(canvas1, 0, 0);
                ctx.globalAlpha = progress;
                ctx.drawImage(canvas2, 0, 0);
                ctx.globalAlpha = 1;
                break;

            case 'slide-left':
                ctx.drawImage(canvas1, -ctx.canvas.width * progress, 0);
                ctx.drawImage(canvas2, ctx.canvas.width * (1 - progress), 0);
                break;

            case 'slide-right':
                ctx.drawImage(canvas1, ctx.canvas.width * progress, 0);
                ctx.drawImage(canvas2, -ctx.canvas.width * (1 - progress), 0);
                break;

            case 'slide-up':
                ctx.drawImage(canvas1, 0, -ctx.canvas.height * progress);
                ctx.drawImage(canvas2, 0, ctx.canvas.height * (1 - progress));
                break;

            case 'slide-down':
                ctx.drawImage(canvas1, 0, ctx.canvas.height * progress);
                ctx.drawImage(canvas2, 0, -ctx.canvas.height * (1 - progress));
                break;

            case 'zoom':
                const scale1 = 1 + progress;
                const scale2 = progress;

                ctx.save();
                ctx.translate(ctx.canvas.width / 2, ctx.canvas.height / 2);
                ctx.scale(scale1, scale1);
                ctx.globalAlpha = 1 - progress;
                ctx.drawImage(canvas1, -ctx.canvas.width / 2, -ctx.canvas.height / 2);
                ctx.restore();

                ctx.save();
                ctx.translate(ctx.canvas.width / 2, ctx.canvas.height / 2);
                ctx.scale(scale2, scale2);
                ctx.globalAlpha = progress;
                ctx.drawImage(canvas2, -ctx.canvas.width / 2, -ctx.canvas.height / 2);
                ctx.restore();

                ctx.globalAlpha = 1;
                break;

            case 'none':
                ctx.drawImage(progress < 0.5 ? canvas1 : canvas2, 0, 0);
                break;

            default:
                ctx.drawImage(canvas2, 0, 0);
        }
    }

    waitForNextFrame(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    loadGifJS() {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/gif.js@0.2.0/dist/gif.js';
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    downloadBlob(blob, filename) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
    }

    showProgress(show) {
        const progress = document.getElementById('exportProgress');
        if (progress) {
            progress.style.display = show ? 'block' : 'none';
        }

        const exportBtn = document.getElementById('startVideoExport');
        if (exportBtn) {
            exportBtn.disabled = show;
            exportBtn.textContent = show ? 'Exporting...' : 'Export Video';
        }
    }

    updateProgressBar(percent) {
        const bar = document.getElementById('exportProgressBar');
        const text = document.getElementById('exportProgressPercent');
        if (bar) {
            bar.style.width = `${percent}%`;
        }
        if (text) {
            text.textContent = `${Math.round(percent)}%`;
        }
    }

    updateProgressStatus(status) {
        const statusEl = document.getElementById('exportProgressStatus');
        if (statusEl) {
            statusEl.textContent = status;
        }
    }

    cancelExport() {
        if (this.recorder && this.recorder.state !== 'inactive') {
            this.recorder.stop();
        }
        this.isExporting = false;
        this.showProgress(false);
    }

    showToast(message, type) {
        if (this.app.components?.v6ui) {
            this.app.components.v6ui.showToast(message, type, 3000);
        }
    }

    injectStyles() {
        if (document.getElementById('videoExporterStyles')) return;

        const style = document.createElement('style');
        style.id = 'videoExporterStyles';
        style.textContent = `
            .video-export-panel-container {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0, 0, 0, 0.5);
                backdrop-filter: blur(8px);
                z-index: 10003;
                display: none;
                align-items: center;
                justify-content: center;
                padding: 20px;
            }

            .video-export-panel-container.active {
                display: flex;
            }

            .video-export-panel {
                background: white;
                border-radius: 16px;
                box-shadow: 0 25px 70px rgba(0, 0, 0, 0.4);
                width: 100%;
                max-width: 600px;
                max-height: 90vh;
                overflow: hidden;
                display: flex;
                flex-direction: column;
                animation: slideUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
            }

            .video-export-panel .panel-header {
                padding: 24px;
                border-bottom: 1px solid #e5e7eb;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                display: flex;
                justify-content: space-between;
                align-items: center;
            }

            .video-export-panel .panel-header h3 {
                margin: 0;
                font-size: 1.5rem;
                color: white;
            }

            .btn-close-panel {
                background: rgba(255, 255, 255, 0.2);
                border: 1px solid rgba(255, 255, 255, 0.3);
                border-radius: 8px;
                padding: 8px;
                cursor: pointer;
                color: white;
                transition: all 0.2s;
            }

            .btn-close-panel:hover {
                background: rgba(255, 255, 255, 0.3);
            }

            .video-export-panel .panel-body {
                flex: 1;
                overflow-y: auto;
                padding: 24px;
            }

            .export-section {
                margin-bottom: 28px;
            }

            .export-section h4 {
                margin: 0 0 16px 0;
                font-size: 1rem;
                font-weight: 600;
                color: #374151;
            }

            .format-options {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 16px;
            }

            .format-option {
                cursor: pointer;
            }

            .format-option input[type="radio"] {
                display: none;
            }

            .option-card {
                border: 2px solid #e5e7eb;
                border-radius: 12px;
                padding: 20px;
                text-align: center;
                transition: all 0.2s;
            }

            .format-option input[type="radio"]:checked + .option-card {
                border-color: #667eea;
                background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%);
                box-shadow: 0 4px 12px rgba(102, 126, 234, 0.2);
            }

            .option-card:hover {
                border-color: #667eea;
            }

            .option-icon {
                font-size: 2.5rem;
                margin-bottom: 12px;
            }

            .option-name {
                font-weight: 600;
                font-size: 1.125rem;
                color: #1f2937;
                margin-bottom: 6px;
            }

            .option-desc {
                font-size: 0.875rem;
                color: #6b7280;
            }

            .setting-group {
                margin-bottom: 24px;
            }

            .setting-group label {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 12px;
                font-weight: 500;
                color: #374151;
            }

            .value-display {
                font-weight: 600;
                color: #667eea;
            }

            .range-labels {
                display: flex;
                justify-content: space-between;
                font-size: 0.75rem;
                color: #9ca3af;
                margin-top: 6px;
            }

            .checkbox-label {
                display: flex;
                align-items: center;
                gap: 12px;
                cursor: pointer;
                font-weight: 500;
                color: #374151;
            }

            .video-preview-info {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
                gap: 16px;
            }

            .info-item {
                background: #f9fafb;
                padding: 16px;
                border-radius: 8px;
                border: 1px solid #e5e7eb;
            }

            .info-label {
                display: block;
                font-size: 0.75rem;
                color: #6b7280;
                margin-bottom: 6px;
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }

            .info-value {
                display: block;
                font-size: 1.25rem;
                font-weight: 600;
                color: #1f2937;
            }

            .export-progress {
                background: #f9fafb;
                border: 1px solid #e5e7eb;
                border-radius: 12px;
                padding: 20px;
                margin-top: 20px;
            }

            .progress-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 12px;
                font-weight: 600;
                color: #374151;
            }

            .progress-status {
                margin-top: 12px;
                font-size: 0.875rem;
                color: #6b7280;
                text-align: center;
            }

            .video-export-panel .panel-footer {
                padding: 20px 24px;
                border-top: 1px solid #e5e7eb;
                background: #f9fafb;
                display: flex;
                gap: 12px;
                justify-content: flex-end;
            }

            .btn-cancel {
                padding: 12px 24px;
                border: 1px solid #d1d5db;
                background: white;
                border-radius: 8px;
                font-weight: 500;
                color: #374151;
                cursor: pointer;
                transition: all 0.2s;
            }

            .btn-cancel:hover {
                background: #f3f4f6;
                border-color: #9ca3af;
            }

            .btn-export {
                padding: 12px 24px;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                border: none;
                border-radius: 8px;
                font-weight: 600;
                cursor: pointer;
                display: flex;
                align-items: center;
                gap: 8px;
                transition: all 0.2s;
            }

            .btn-export:hover:not(:disabled) {
                transform: translateY(-2px);
                box-shadow: 0 8px 20px rgba(102, 126, 234, 0.4);
            }

            .btn-export:disabled {
                opacity: 0.6;
                cursor: not-allowed;
            }

            @media (max-width: 768px) {
                .video-export-panel {
                    width: 95%;
                    max-height: 95vh;
                }

                .format-options {
                    grid-template-columns: 1fr;
                }

                .video-preview-info {
                    grid-template-columns: 1fr;
                }
            }
        `;
        document.head.appendChild(style);
    }
}
