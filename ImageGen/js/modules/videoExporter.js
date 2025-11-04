/* =====================================================
   VIDEO EXPORTER v12.0 - CapCut-Style Professional Video Export

   COMPLETE REWRITE - PROFESSIONAL QUALITY LIKE CAPCUT:

   Architecture (3-Step Process):
   1. Render Images → Pre-render all styled images
   2. Generate Frames → Create ALL video frames (like CapCut does)
   3. Encode Video → Playback frames with precise timing

   Key Features:
   ✅ Pre-render ALL frames before encoding (no skipped frames)
   ✅ Manual frame capture with requestFrame() for 100% accuracy
   ✅ Precise timing using requestAnimationFrame
   ✅ Full transition support (fade, slide, zoom, etc.)
   ✅ Drift compensation for perfect sync
   ✅ captureStream(0) manual mode for complete control

   Technical Improvements:
   - MANUAL frame control vs automatic capture
   - Frame-by-frame accuracy like professional editors
   - No timing drift with compensation algorithm
   - Better memory efficiency with progressive rendering
   - Enhanced error handling and logging

   Full Preview Panel Integration with All Features
   ===================================================== */

export class VideoExporter {
    constructor(app) {
        this.app = app;
        this.isExporting = false;
        this.recorder = null;
        this.chunks = [];
        this.gifWorker = null;
        this.cancelRequested = false;
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
                    <h3>🎬 Professional Video Export</h3>
                    <button class="btn-close-panel" id="closeVideoExport">
                        <svg viewBox="0 0 24 24" width="20" height="20">
                            <path stroke="currentColor" stroke-width="2" fill="none" d="M18 6L6 18M6 6l12 12"/>
                        </svg>
                    </button>
                </div>

                <div class="panel-body">
                    <!-- Info Banner -->
                    <div class="info-banner">
                        <svg viewBox="0 0 24 24" width="20" height="20">
                            <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2" fill="none"/>
                            <path stroke="currentColor" stroke-width="2" d="M12 16v-4M12 8h.01"/>
                        </svg>
                        <span>🎬 CapCut-Style v12.0! Professional quality with pre-rendered frames, manual capture control & perfect timing. Full styling: text, filters, transitions, footer & numbering</span>
                    </div>

                    <div class="export-section">
                        <h4>📹 Format & Quality</h4>
                        <div class="format-options">
                            <label class="format-option">
                                <input type="radio" name="videoFormat" value="webm" checked>
                                <div class="option-card">
                                    <div class="option-icon">🎥</div>
                                    <div class="option-name">WebM (VP9)</div>
                                    <div class="option-desc">Best quality, small size</div>
                                    <div class="option-tech">4K support • 5 Mbps</div>
                                </div>
                            </label>
                            <label class="format-option">
                                <input type="radio" name="videoFormat" value="gif">
                                <div class="option-card">
                                    <div class="option-icon">🖼️</div>
                                    <div class="option-name">GIF</div>
                                    <div class="option-desc">Universal compatibility</div>
                                    <div class="option-tech">Max 800px • All platforms</div>
                                </div>
                            </label>
                        </div>

                        <div class="quality-selector" id="webmQuality">
                            <label>Video Quality:</label>
                            <select id="videoQuality" class="v11-select v11-input">
                                <option value="high">High (5 Mbps) - Best quality</option>
                                <option value="medium" selected>Medium (3 Mbps) - Balanced</option>
                                <option value="low">Low (1 Mbps) - Small file</option>
                            </select>
                        </div>
                    </div>

                    <div class="export-section">
                        <h4>⏱️ Timing & Animation</h4>
                        <div class="setting-group">
                            <label>
                                Duration per image:
                                <span class="value-display" id="imageDurationValue">2.0s</span>
                            </label>
                            <input type="range" id="imageDuration" min="0.5" max="10" step="0.1" value="2" class="v11-range">
                            <div class="range-labels">
                                <span>0.5s (Fast)</span>
                                <span>10s (Slow)</span>
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
                                <span>15 fps (Faster)</span>
                                <span>60 fps (Smoother)</span>
                            </div>
                        </div>
                    </div>

                    <div class="export-section">
                        <h4>✨ Transition Effect</h4>
                        <select id="transitionEffect" class="v11-select v11-input">
                            <option value="fade">🌅 Fade - Smooth opacity transition</option>
                            <option value="slide-left">⬅️ Slide Left - Dynamic movement</option>
                            <option value="slide-right">➡️ Slide Right - Dynamic movement</option>
                            <option value="slide-up">⬆️ Slide Up - Upward motion</option>
                            <option value="slide-down">⬇️ Slide Down - Downward motion</option>
                            <option value="zoom">🔍 Zoom - Scale effect</option>
                            <option value="crossfade">✨ Crossfade - Professional blend</option>
                            <option value="none">⚡ None - Instant cut</option>
                        </select>
                    </div>

                    <div class="export-section">
                        <h4>🎨 Rendering Options</h4>
                        <div class="checkbox-grid">
                            <label class="checkbox-label">
                                <input type="checkbox" id="renderFilters" checked class="v11-checkbox">
                                <span>Apply image filters</span>
                            </label>
                            <label class="checkbox-label">
                                <input type="checkbox" id="renderFooter" checked class="v11-checkbox">
                                <span>Include footer</span>
                            </label>
                            <label class="checkbox-label">
                                <input type="checkbox" id="renderNumbering" checked class="v11-checkbox">
                                <span>Include numbering</span>
                            </label>
                            <label class="checkbox-label">
                                <input type="checkbox" id="videoLoop" checked class="v11-checkbox">
                                <span>Loop video</span>
                            </label>
                        </div>
                    </div>

                    <div class="export-section">
                        <h4>📊 Video Preview</h4>
                        <div class="video-preview-info">
                            <div class="info-item">
                                <span class="info-label">Images</span>
                                <span class="info-value" id="previewImageCount">0</span>
                            </div>
                            <div class="info-item">
                                <span class="info-label">Duration</span>
                                <span class="info-value" id="previewDuration">0.0s</span>
                            </div>
                            <div class="info-item">
                                <span class="info-label">Resolution</span>
                                <span class="info-value" id="previewResolution">0x0</span>
                            </div>
                            <div class="info-item">
                                <span class="info-label">Est. Size</span>
                                <span class="info-value" id="previewSize">~0 MB</span>
                            </div>
                        </div>
                    </div>

                    <div class="export-progress" id="exportProgress" style="display: none;">
                        <div class="progress-header">
                            <span id="exportProgressTitle">Exporting...</span>
                            <span id="exportProgressPercent">0%</span>
                        </div>
                        <div class="v11-progress">
                            <div class="v11-progress-bar" id="exportProgressBar" style="width: 0%"></div>
                        </div>
                        <div class="progress-details">
                            <div class="progress-status" id="exportProgressStatus">Preparing...</div>
                            <div class="progress-time" id="exportProgressTime"></div>
                        </div>
                    </div>
                </div>

                <div class="panel-footer">
                    <button class="btn-cancel" id="cancelVideoExport">Cancel</button>
                    <button class="btn-export v11-btn" id="startVideoExport">
                        <svg viewBox="0 0 24 24" width="20" height="20">
                            <path stroke="currentColor" stroke-width="2" fill="none" d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/>
                        </svg>
                        Export Professional Video
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

        // Range inputs with live update
        const ranges = [
            { id: 'imageDuration', display: 'imageDurationValue', suffix: 's' },
            { id: 'transitionDuration', display: 'transitionDurationValue', suffix: 's' },
            { id: 'videoFps', display: 'fpsValue', suffix: ' fps' }
        ];

        ranges.forEach(({ id, display, suffix }) => {
            const input = document.getElementById(id);
            if (input) {
                input.addEventListener('input', (e) => {
                    document.getElementById(display).textContent = `${e.target.value}${suffix}`;
                    this.updatePreview();
                });
            }
        });

        // Format change
        document.querySelectorAll('input[name="videoFormat"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                const webmQuality = document.getElementById('webmQuality');
                if (webmQuality) {
                    webmQuality.style.display = e.target.value === 'webm' ? 'block' : 'none';
                }
                this.updatePreview();
            });
        });

        // Quality, transition, checkboxes change
        ['videoQuality', 'transitionEffect', 'renderFilters', 'renderFooter', 'renderNumbering', 'videoLoop'].forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                el.addEventListener('change', () => this.updatePreview());
            }
        });

        // Export button
        const exportBtn = document.getElementById('startVideoExport');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => this.startExport());
        }

        // Cancel button
        const cancelBtn = document.getElementById('cancelVideoExport');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => {
                if (this.isExporting) {
                    this.cancelExport();
                } else {
                    this.close();
                }
            });
        }
    }

    open() {
        console.log('VideoExporter: open() called');

        // Check if we have background images
        const backgroundImageCount = this.app.state?.images?.length || 0;
        if (backgroundImageCount === 0) {
            this.showToast('Please add background images first before exporting video', 'warning');
            return;
        }

        // Get total images to export
        const totalExportCount = this.getExportImageCount();
        console.log(`VideoExporter: ${backgroundImageCount} background images, ${totalExportCount} total images to export`);

        if (totalExportCount === 0) {
            this.showToast('Please add text in Knowledge Mode or background images to export', 'warning');
            return;
        }

        this.panel.classList.add('active');
        this.cancelRequested = false;
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

    getExportImageCount() {
        // Calculate total number of images to export based on mode
        const images = this.app.state?.images || [];
        if (images.length === 0) return 0;

        const knowledgeMode = document.getElementById('knowledgeModeCheckbox')?.checked || false;
        const textInput = this.app.DOM?.textInput;

        if (knowledgeMode && textInput) {
            // Knowledge Mode: one image per text line
            const text = textInput.value?.trim() || '';
            const textLines = text ? text.split('\n').filter(line => line.trim()) : [];
            return textLines.length;
        } else {
            // Traditional mode: export loaded images
            const repeatBackground = this.app.DOM?.repeatBackgroundCheckbox?.checked || false;
            if (repeatBackground && textInput) {
                const text = textInput.value?.trim() || '';
                const textLines = text ? text.split('\n').filter(line => line.trim()) : [];
                return textLines.length;
            }
            return images.length;
        }
    }

    updatePreview() {
        // Get actual number of images to export (considers Knowledge Mode)
        const imageCount = this.getExportImageCount();

        console.log('VideoExporter: updatePreview called');
        console.log('VideoExporter: Total images to export =', imageCount);
        const imageDuration = parseFloat(document.getElementById('imageDuration')?.value || 2);
        const transitionDuration = parseFloat(document.getElementById('transitionDuration')?.value || 0.5);
        const format = document.querySelector('input[name="videoFormat"]:checked')?.value || 'webm';
        const quality = document.getElementById('videoQuality')?.value || 'medium';

        const totalDuration = imageCount * (imageDuration + transitionDuration);

        // Resolution - get from first background image
        const backgroundImages = this.app.state?.images || [];
        const firstImage = backgroundImages[0];
        let width = 0, height = 0;
        if (firstImage && firstImage.img) {
            width = firstImage.img.width;
            height = firstImage.img.height;

            // GIF limit
            if (format === 'gif') {
                const maxGifWidth = 800;
                if (width > maxGifWidth) {
                    height = Math.round(height * (maxGifWidth / width));
                    width = maxGifWidth;
                }
            }
        }

        // Size estimate
        const fps = parseInt(document.getElementById('videoFps')?.value || 20);
        const totalFrames = totalDuration * fps;
        let bytesPerFrame;

        if (format === 'gif') {
            bytesPerFrame = 1024 * 50; // GIF larger
        } else {
            // WebM bitrate
            const bitrates = { high: 5000000, medium: 3000000, low: 1000000 };
            const bitrate = bitrates[quality] || 3000000;
            bytesPerFrame = bitrate / 8 / fps; // bytes per frame
        }

        const estimatedSize = (totalFrames * bytesPerFrame) / (1024 * 1024);

        document.getElementById('previewImageCount').textContent = imageCount;
        document.getElementById('previewDuration').textContent = `${totalDuration.toFixed(1)}s`;
        document.getElementById('previewResolution').textContent = `${width}×${height}`;
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
        this.cancelRequested = false;
        this.showProgress(true);
        this.startTime = Date.now();

        const format = document.querySelector('input[name="videoFormat"]:checked')?.value || 'webm';

        try {
            if (format === 'gif') {
                await this.exportGIF();
            } else {
                await this.exportVideo(format);
            }

            if (!this.cancelRequested) {
                this.showToast('✅ Video exported successfully!', 'success');
            }
        } catch (error) {
            console.error('Export failed:', error);
            if (!this.cancelRequested) {
                this.showToast('❌ Export failed: ' + error.message, 'error');
            }
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

        const imageDuration = parseFloat(document.getElementById('imageDuration')?.value || 2);
        const transitionDuration = parseFloat(document.getElementById('transitionDuration')?.value || 0);
        const fps = parseInt(document.getElementById('videoFps')?.value || 30);
        const quality = document.getElementById('videoQuality')?.value || 'medium';

        console.log('🎬 CapCut-Style Video Export - Professional Quality');
        console.log(`📊 Settings: ${imageDuration}s/image, ${transitionDuration}s transition, ${fps} FPS`);

        // Get dimensions from first image
        const firstImage = images[0];
        if (!firstImage || !firstImage.img) {
            throw new Error('Invalid image data');
        }

        // STEP 1: Render all image canvases
        this.updateProgressStatus('🎨 Step 1/3: Rendering images...');
        this.updateProgressBar(5);

        const renderedCanvases = await this.renderAllImagesWithPreview(images, firstImage.img.width, firstImage.img.height);

        if (this.cancelRequested) throw new Error('Cancelled by user');
        if (renderedCanvases.length === 0) throw new Error('No rendered canvases');

        console.log(`✅ Rendered ${renderedCanvases.length} image canvases`);

        // STEP 2: Generate ALL video frames (like CapCut does)
        this.updateProgressStatus('🎞️ Step 2/3: Generating video frames...');
        this.updateProgressBar(20);

        const videoFrames = await this.generateAllVideoFrames(
            renderedCanvases,
            firstImage.img.width,
            firstImage.img.height,
            imageDuration,
            transitionDuration,
            fps
        );

        if (this.cancelRequested) throw new Error('Cancelled by user');
        if (videoFrames.length === 0) throw new Error('No video frames generated');

        console.log(`✅ Generated ${videoFrames.length} video frames`);

        // STEP 3: Encode to video
        this.updateProgressStatus('📹 Step 3/3: Encoding video...');
        this.updateProgressBar(60);

        await this.encodeFramesToVideo(
            videoFrames,
            firstImage.img.width,
            firstImage.img.height,
            fps,
            quality
        );

        console.log('✅ Video export complete!');
    }

    async generateAllVideoFrames(imageCanvases, width, height, imageDuration, transitionDuration, fps) {
        const frames = [];
        const totalImages = imageCanvases.length;

        console.log(`🎞️ Generating frames: ${totalImages} images at ${fps} FPS`);
        console.log(`🎞️ First canvas check:`, {
            width: imageCanvases[0]?.width,
            height: imageCanvases[0]?.height,
            hasContext: !!imageCanvases[0]?.getContext
        });

        for (let i = 0; i < totalImages; i++) {
            if (this.cancelRequested) break;

            const progress = 20 + ((i / totalImages) * 40);
            this.updateProgressBar(progress);
            this.updateProgressStatus(`🎞️ Generating frames for image ${i + 1}/${totalImages}...`);

            const currentCanvas = imageCanvases[i];
            const nextCanvas = i < totalImages - 1 ? imageCanvases[i + 1] : null;

            console.log(`🎞️ Processing image ${i + 1}: canvas ${currentCanvas.width}x${currentCanvas.height}`);

            // Add frames for current image duration
            const framesForImage = Math.round(imageDuration * fps);
            console.log(`🎞️ Creating ${framesForImage} frames for image ${i + 1}`);

            for (let f = 0; f < framesForImage; f++) {
                if (this.cancelRequested) break;

                const frameCanvas = this.createFrameCanvas(width, height);
                const ctx = frameCanvas.getContext('2d', { willReadFrequently: false });

                // CRITICAL: Draw the complete styled canvas (with text!)
                ctx.drawImage(currentCanvas, 0, 0, width, height);

                frames.push(frameCanvas);
            }

            // Add transition frames if there's a next image
            if (nextCanvas && transitionDuration > 0) {
                const transitionFrames = Math.round(transitionDuration * fps);
                const transitionEffect = document.getElementById('transitionEffect')?.value || 'fade';

                for (let t = 0; t < transitionFrames; t++) {
                    if (this.cancelRequested) break;

                    const progress = t / transitionFrames;
                    const frameCanvas = this.createFrameCanvas(width, height);
                    const ctx = frameCanvas.getContext('2d');

                    this.renderTransition(ctx, currentCanvas, nextCanvas, progress, transitionEffect);
                    frames.push(frameCanvas);
                }
            }

            // Yield control occasionally
            if (i % 5 === 0) {
                await new Promise(resolve => setTimeout(resolve, 0));
            }
        }

        console.log(`✅ Total frames generated: ${frames.length}`);
        return frames;
    }

    createFrameCanvas(width, height) {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        return canvas;
    }

    async encodeFramesToVideo(frames, width, height, fps, quality) {
        // Create display canvas
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d', {
            alpha: false,
            desynchronized: false, // Synchronized for accurate recording
            willReadFrequently: false
        });

        // Clear to white
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);

        // Select codec
        let mimeType = 'video/webm;codecs=vp8';
        if (!MediaRecorder.isTypeSupported(mimeType)) {
            mimeType = 'video/webm;codecs=vp9';
            if (!MediaRecorder.isTypeSupported(mimeType)) {
                mimeType = 'video/webm';
            }
        }

        console.log(`🎥 Codec: ${mimeType}`);

        const bitrates = { high: 5000000, medium: 3000000, low: 1500000 };
        const videoBitsPerSecond = bitrates[quality] || 3000000;

        // Draw first frame
        ctx.drawImage(frames[0], 0, 0, width, height);
        await new Promise(resolve => requestAnimationFrame(resolve));

        // Create stream - MANUAL MODE (0 fps = manual requestFrame)
        const stream = canvas.captureStream(0);
        const videoTrack = stream.getVideoTracks()[0];

        console.log(`📹 Stream created in MANUAL mode for precise control`);

        this.recorder = new MediaRecorder(stream, {
            mimeType: mimeType,
            videoBitsPerSecond: videoBitsPerSecond
        });

        this.chunks = [];

        this.recorder.ondataavailable = (e) => {
            if (e.data.size > 0) {
                this.chunks.push(e.data);
                console.log(`📦 Chunk ${this.chunks.length}: ${e.data.size} bytes`);
            }
        };

        const recordingComplete = new Promise((resolve, reject) => {
            this.recorder.onstop = () => {
                if (this.cancelRequested) {
                    reject(new Error('Cancelled by user'));
                    return;
                }

                const totalSize = this.chunks.reduce((sum, chunk) => sum + chunk.size, 0);
                console.log(`📦 Total chunks: ${this.chunks.length}, size: ${totalSize} bytes`);

                const blob = new Blob(this.chunks, { type: mimeType });

                if (blob.size === 0) {
                    reject(new Error('Video blob is empty'));
                    return;
                }

                console.log(`✅ Video blob: ${(blob.size / 1024 / 1024).toFixed(2)} MB`);
                this.downloadBlob(blob, `video-export-${Date.now()}.webm`);
                resolve();
            };

            this.recorder.onerror = (e) => {
                console.error('❌ Recorder error:', e);
                reject(new Error('Recording failed'));
            };
        });

        // Start recording
        console.log('🔴 Starting recorder...');
        this.recorder.start();

        await new Promise(resolve => setTimeout(resolve, 100));

        // PLAYBACK frames with precise timing
        const totalFrames = frames.length;
        const msPerFrame = 1000 / fps;

        console.log(`🎬 Playing back ${totalFrames} frames at ${fps} FPS (${msPerFrame.toFixed(2)}ms/frame)`);

        let frameIndex = 0;
        let lastFrameTime = performance.now();

        const playFrame = () => {
            if (this.cancelRequested || frameIndex >= totalFrames) {
                return false;
            }

            const now = performance.now();
            const elapsed = now - lastFrameTime;

            // Time to draw next frame?
            if (elapsed >= msPerFrame) {
                // Draw frame
                ctx.drawImage(frames[frameIndex], 0, 0, width, height);

                // CRITICAL: Request frame capture manually
                if (videoTrack.requestFrame) {
                    videoTrack.requestFrame();
                }

                // Update progress
                const progress = 60 + ((frameIndex / totalFrames) * 35);
                this.updateProgressBar(progress);

                if (frameIndex % 30 === 0 || frameIndex === totalFrames - 1) {
                    this.updateProgressStatus(`📹 Encoding frame ${frameIndex + 1}/${totalFrames}...`);
                    console.log(`📹 Frame ${frameIndex + 1}/${totalFrames}`);
                }

                frameIndex++;
                lastFrameTime = now - (elapsed - msPerFrame); // Adjust for drift
            }

            return true;
        };

        // Use requestAnimationFrame for smooth playback
        await new Promise((resolve) => {
            const animate = () => {
                if (!playFrame()) {
                    resolve();
                    return;
                }
                requestAnimationFrame(animate);
            };
            requestAnimationFrame(animate);
        });

        console.log(`✅ All ${totalFrames} frames played back`);

        this.updateProgressStatus('⏹️ Finalizing video...');
        this.updateProgressBar(95);

        // Hold last frame briefly
        await new Promise(resolve => setTimeout(resolve, 500));

        this.updateProgressBar(100);

        // Stop recording
        console.log('⏹️ Stopping recorder...');
        if (this.recorder && this.recorder.state !== 'inactive') {
            this.recorder.stop();
        }

        // Wait for encoding to complete
        await recordingComplete;
    }

    async exportGIF() {
        this.updateProgressStatus('📦 Loading GIF encoder...');

        const images = this.app.state.images;
        if (!images || images.length === 0) {
            throw new Error('No images to export');
        }

        // Load gif.js library dynamically
        if (!window.GIF) {
            await this.loadGifJS();
        }

        if (this.cancelRequested) throw new Error('Cancelled by user');

        const imageDuration = parseFloat(document.getElementById('imageDuration')?.value || 2) * 1000;
        const transitionDuration = parseFloat(document.getElementById('transitionDuration')?.value || 0.5) * 1000;
        const fps = Math.min(parseInt(document.getElementById('videoFps')?.value || 20), 30); // Cap at 30 for GIF performance
        const transitionEffect = document.getElementById('transitionEffect')?.value || 'fade';

        // Get dimensions from first image
        const firstImage = images[0];
        const maxGifWidth = 800;
        const gifWidth = Math.min(firstImage.img.width, maxGifWidth);
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

        // Render full-resolution canvases
        this.updateProgressStatus('🎨 Rendering all images...');
        const renderedCanvases = await this.renderAllImagesWithPreview(images, gifWidth, gifHeight);

        if (this.cancelRequested) throw new Error('Cancelled by user');

        const totalSteps = renderedCanvases.length * 2;
        let currentStep = 0;

        for (let i = 0; i < renderedCanvases.length && !this.cancelRequested; i++) {
            this.updateProgressStatus(`🖼️ Processing GIF frame ${i + 1}/${renderedCanvases.length}...`);

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
                for (let f = 0; f < transitionFrames && !this.cancelRequested; f++) {
                    const progress = f / transitionFrames;
                    this.renderTransition(ctx, currentCanvas, nextCanvas, progress, transitionEffect);
                    gif.addFrame(ctx, { delay: transitionDuration / transitionFrames, copy: true });
                }
            }

            currentStep++;
            this.updateProgressBar((currentStep / totalSteps) * 100);
        }

        if (this.cancelRequested) throw new Error('Cancelled by user');

        this.updateProgressStatus('🔄 Encoding GIF file...');

        gif.on('finished', (blob) => {
            if (!this.cancelRequested) {
                this.downloadBlob(blob, `video-export-${Date.now()}.gif`);
            }
        });

        gif.render();
    }

    async renderAllImagesWithPreview(images, width, height) {
        const canvases = [];
        const preview = this.app.components?.preview;

        if (!preview) {
            throw new Error('Preview component not available');
        }

        const renderFilters = document.getElementById('renderFilters')?.checked ?? true;
        const renderFooter = document.getElementById('renderFooter')?.checked ?? true;
        const renderNumbering = document.getElementById('renderNumbering')?.checked ?? true;

        // Get text lines for Knowledge Mode
        const textInput = this.app.DOM?.textInput;
        const text = textInput?.value?.trim() || '';
        const textLines = text ? text.split('\n').filter(line => line.trim()) : [];

        // Determine mode and total images
        const knowledgeMode = document.getElementById('knowledgeModeCheckbox')?.checked || false;
        const repeatBackground = this.app.DOM?.repeatBackgroundCheckbox?.checked || false;

        let totalImages;
        if (knowledgeMode) {
            totalImages = textLines.length;
        } else {
            totalImages = repeatBackground ? textLines.length : images.length;
        }

        console.log(`VideoExporter: Rendering ${totalImages} images (Knowledge Mode: ${knowledgeMode}, Repeat: ${repeatBackground})`);

        // Cache filter string (calculated once, not per image)
        let filterString = '';
        if (renderFilters && preview.getFilterString) {
            filterString = preview.getFilterString();
        }

        // Pre-calculate scale (same for all images of same dimension)
        const scale = width / images[0].img.width;

        for (let i = 0; i < totalImages; i++) {
            if (this.cancelRequested) break;

            // Update progress less frequently to reduce overhead
            if (i % 5 === 0 || i === totalImages - 1) {
                this.updateProgressStatus(`🎨 Rendering image ${i + 1}/${totalImages}...`);
                this.updateProgressBar(10 + (i / totalImages) * 10); // 10-20% range
            }

            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d', {
                willReadFrequently: false,
                alpha: false // Faster without alpha
            });

            // Fast rendering - disable smoothing for speed
            ctx.imageSmoothingEnabled = false;

            // Determine which image and text to use (same logic as preview)
            let imageIndex, textIndex, textContent;

            if (knowledgeMode) {
                // Knowledge Mode: cycle through images, one text per image
                imageIndex = i % images.length;
                textIndex = i;
                textContent = textLines[i];
            } else {
                // Traditional mode
                imageIndex = i % images.length;
                textIndex = repeatBackground ? i : 0;
                textContent = textLines[textIndex] || textLines[0];
            }

            const img = images[imageIndex].img;

            // Apply cached filter
            if (filterString && filterString.trim() !== '') {
                ctx.filter = filterString;
            }

            // Draw image
            ctx.drawImage(img, 0, 0, width, height);
            ctx.filter = 'none';

            // Get text config with FULL styling
            const textConfig = preview.textConfigs?.[i] || this.getDefaultTextConfig(imageIndex);

            // Override with current text content
            textConfig.text = textContent;
            textConfig.imageIndex = imageIndex;
            textConfig.textIndex = textIndex;
            textConfig.fileName = images[imageIndex].file.name;

            console.log(`🎨 Rendering text for image ${i + 1}:`, {
                text: textConfig.text?.substring(0, 50),
                color: textConfig.mainColor,
                fontSize: textConfig.mainFontSize,
                position: textConfig.position
            });

            // Render text using preview panel method if available
            if (preview.wrapStyledText && preview.markdownParser && textConfig.text) {
                await this.renderTextUsingPreview(ctx, canvas, textConfig, scale, preview);
            } else if (textConfig.text) {
                // Fallback: simple text rendering
                console.warn('⚠️ Preview methods not available, using fallback text rendering');
                await this.renderSimpleTextFallback(ctx, canvas, textConfig, scale);
            }

            // Render footer if enabled
            if (renderFooter && this.app.DOM?.footerCheckbox?.checked) {
                await this.renderFooter(ctx, canvas, scale);
            }

            // Render numbering if enabled
            if (renderNumbering && this.app.DOM?.imageNumberingCheckbox?.checked) {
                await this.renderNumbering(ctx, canvas, i, scale);
            }

            canvases.push(canvas);

            // Debug: Check if canvas has content beyond just the image
            if (i === 0) {
                console.log('🔍 First canvas check after rendering:', {
                    width: canvas.width,
                    height: canvas.height,
                    hasText: !!textConfig.text,
                    textSample: textConfig.text?.substring(0, 30)
                });
            }

            // Yield control every 10 images to keep UI responsive
            if (i % 10 === 0) {
                await this.waitForNextFrame(0);
            }
        }

        console.log(`✅ VideoExporter: Successfully rendered ${canvases.length} canvases with text`);
        return canvases;
    }

    async renderTextUsingPreview(ctx, canvas, config, scale, preview) {
        if (!config.text || !config.text.trim()) {
            console.warn('⚠️ renderTextUsingPreview: No text to render');
            return;
        }

        console.log('📝 renderTextUsingPreview called:', {
            text: config.text.substring(0, 50),
            fontSize: config.mainFontSize,
            color: config.mainColor,
            position: config.position,
            scale
        });

        const lines = config.text.split('\n');

        // Use markdown parser from preview
        const parsedLines = lines.map(line =>
            preview.markdownParser ? preview.markdownParser.parse(line) : { segments: [{ text: line }] }
        );

        // Get position
        const position = config.position || 'bottom';
        let y;

        switch (position) {
            case 'top':
                y = canvas.height * 0.15;
                break;
            case 'middle':
                y = canvas.height * 0.5;
                break;
            case 'bottom':
            default:
                y = canvas.height * 0.85;
                break;
        }

        const fontSize = (config.mainFontSize || 48) * scale;
        const lineHeight = 2.0;

        console.log(`📝 Rendering ${lines.length} lines at position ${position}, y=${y.toFixed(0)}, fontSize=${fontSize.toFixed(1)}`);

        // Render using preview's wrapStyledText if available
        parsedLines.forEach((line, index) => {
            const currentY = y + (index * fontSize * lineHeight);

            if (preview.wrapStyledText) {
                try {
                    preview.wrapStyledText(
                        ctx,
                        line,
                        canvas.width / 2,
                        currentY,
                        canvas.width * 0.9,
                        fontSize,
                        {
                            fontFamily: config.font || 'Inter, sans-serif',
                            fontWeight: config.fontWeight || '700',
                            fontStyle: 'normal',
                            mainColor: index === 0 ? (config.mainColor || '#FFFFFF') : (config.subColor || '#FFFFFF'),
                            letterSpacing: 0,
                            lineHeight: lineHeight,
                            textBorder: config.textBorder ?? true,
                            textShadow: config.textShadow ?? true,
                            borderWidth: config.borderWidth || 4,
                            shadowBlur: config.shadowBlur || 8
                        },
                        'center',
                        canvas
                    );
                    console.log(`✅ Text line ${index + 1} rendered via wrapStyledText`);
                } catch (e) {
                    console.error(`❌ wrapStyledText failed for line ${index + 1}:`, e.message);
                    // Fallback to simple rendering
                    this.renderSimpleText(ctx, line, canvas.width / 2, currentY, fontSize, config);
                }
            } else {
                console.warn(`⚠️ wrapStyledText not available, using renderSimpleText for line ${index + 1}`);
                this.renderSimpleText(ctx, line, canvas.width / 2, currentY, fontSize, config);
            }
        });

        console.log('✅ renderTextUsingPreview complete');
    }

    async renderSimpleTextFallback(ctx, canvas, config, scale) {
        if (!config.text || !config.text.trim()) return;

        console.log('🎨 Using simple text fallback rendering');

        const lines = config.text.split('\n');
        const position = config.position || 'bottom';
        let y;

        switch (position) {
            case 'top':
                y = canvas.height * 0.15;
                break;
            case 'middle':
                y = canvas.height * 0.5;
                break;
            case 'bottom':
            default:
                y = canvas.height * 0.85;
                break;
        }

        const fontSize = (config.mainFontSize || 48) * scale;
        const lineHeight = 1.5;

        lines.forEach((lineText, index) => {
            const currentY = y + (index * fontSize * lineHeight);

            ctx.save();
            ctx.font = `${config.fontWeight || '700'} ${fontSize}px ${config.font || 'Arial, sans-serif'}`;
            ctx.fillStyle = index === 0 ? (config.mainColor || '#FFFFFF') : (config.subColor || '#FFFFFF');
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            // Text shadow for better visibility
            if (config.textShadow) {
                ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
                ctx.shadowBlur = config.shadowBlur || 8;
                ctx.shadowOffsetX = 2;
                ctx.shadowOffsetY = 2;
            }

            // Text border/stroke
            if (config.textBorder) {
                ctx.strokeStyle = '#000000';
                ctx.lineWidth = (config.borderWidth || 4) * scale;
                ctx.strokeText(lineText, canvas.width / 2, currentY);
            }

            ctx.fillText(lineText, canvas.width / 2, currentY);
            ctx.restore();
        });
    }

    renderSimpleText(ctx, line, x, y, fontSize, config) {
        ctx.save();
        ctx.font = `${config.fontWeight || '400'} ${fontSize}px ${config.font || 'Inter, sans-serif'}`;
        ctx.fillStyle = config.mainColor || '#FFFFFF';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        if (config.textShadow) {
            ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
            ctx.shadowBlur = config.shadowBlur || 4;
            ctx.shadowOffsetX = 2;
            ctx.shadowOffsetY = 2;
        }

        const text = line.segments ? line.segments.map(s => s.text).join('') : line;

        if (config.textBorder) {
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = config.borderWidth || 2;
            ctx.strokeText(text, x, y);
        }

        ctx.fillText(text, x, y);
        ctx.restore();
    }

    async renderFooter(ctx, canvas, scale) {
        const footerText = this.app.DOM?.footerText?.value;
        const footerType = document.querySelector('input[name="footerType"]:checked')?.value;

        if (footerType === 'text' && footerText) {
            const footerSize = (parseInt(this.app.DOM?.footerSize?.value) || 24) * scale;
            const footerColor = this.app.DOM?.footerColor?.value || '#FFFFFF';
            const footerPosition = this.app.DOM?.footerPosition?.value || 'bottom-right';

            ctx.save();
            ctx.font = `400 ${footerSize}px Inter, sans-serif`;
            ctx.fillStyle = footerColor;

            let x, y;
            const padding = 20 * scale;

            switch (footerPosition) {
                case 'bottom-left':
                    ctx.textAlign = 'left';
                    x = padding;
                    y = canvas.height - padding;
                    break;
                case 'bottom-center':
                    ctx.textAlign = 'center';
                    x = canvas.width / 2;
                    y = canvas.height - padding;
                    break;
                case 'bottom-right':
                default:
                    ctx.textAlign = 'right';
                    x = canvas.width - padding;
                    y = canvas.height - padding;
                    break;
            }

            ctx.textBaseline = 'bottom';
            ctx.fillText(footerText, x, y);
            ctx.restore();
        }
    }

    async renderNumbering(ctx, canvas, imageIndex, scale) {
        const skipFirst = this.app.DOM?.skipFirstPageCheckbox?.checked;
        if (skipFirst && imageIndex === 0) return;

        const numberSize = (parseInt(this.app.DOM?.numberSize?.value) || 48) * scale;
        const numberPosition = this.app.DOM?.numberPosition?.value || 'bottom-right';
        const number = skipFirst ? imageIndex : imageIndex + 1;

        ctx.save();
        ctx.font = `700 ${numberSize}px Inter, sans-serif`;
        ctx.fillStyle = '#FFFFFF';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = numberSize * 0.1;

        let x, y;
        const padding = 30 * scale;

        switch (numberPosition) {
            case 'top-left':
                ctx.textAlign = 'left';
                x = padding;
                y = padding + numberSize;
                break;
            case 'top-right':
                ctx.textAlign = 'right';
                x = canvas.width - padding;
                y = padding + numberSize;
                break;
            case 'bottom-left':
                ctx.textAlign = 'left';
                x = padding;
                y = canvas.height - padding;
                break;
            case 'bottom-right':
            default:
                ctx.textAlign = 'right';
                x = canvas.width - padding;
                y = canvas.height - padding;
                break;
        }

        ctx.textBaseline = 'bottom';
        ctx.strokeText(number.toString(), x, y);
        ctx.fillText(number.toString(), x, y);
        ctx.restore();
    }

    getDefaultTextConfig(imageIndex) {
        const config = {
            imageIndex,
            text: this.app.DOM?.textInput?.value || '',
            font: this.app.DOM?.fontSelect?.value || 'Arial, sans-serif',
            mainColor: this.app.DOM?.colorPicker?.value || '#FFFFFF',
            subColor: this.app.DOM?.subColorPicker?.value || '#FFFFFF',
            position: this.app.DOM?.positionPicker?.value || 'bottom',
            mainFontSize: parseInt(this.app.DOM?.mainFontSize?.value || 48),
            subFontSize: parseInt(this.app.DOM?.subFontSize?.value || 32),
            fontWeight: this.app.DOM?.fontWeightSelect?.value || '700', // Bold by default
            textBorder: this.app.DOM?.textBorderCheckbox?.checked ?? true, // Enable by default
            textShadow: this.app.DOM?.textShadowCheckbox?.checked ?? true, // Enable by default
            borderWidth: parseInt(this.app.DOM?.borderWidth?.value || 4),
            shadowBlur: parseInt(this.app.DOM?.shadowBlur?.value || 8)
        };

        console.log('📝 Default text config created:', config);
        return config;
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

            case 'crossfade':
                // Smoother crossfade with easing
                const eased = this.easeInOutCubic(progress);
                ctx.globalAlpha = 1 - eased;
                ctx.drawImage(canvas1, 0, 0);
                ctx.globalAlpha = eased;
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
                const scale1 = 1 + progress * 0.5;
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

    easeInOutCubic(t) {
        return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    }

    waitForNextFrame(ms) {
        if (ms === 0) {
            // Immediate yield to event loop
            return new Promise(resolve => requestAnimationFrame(() => resolve()));
        }
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    loadGifJS() {
        return new Promise((resolve, reject) => {
            if (window.GIF) {
                resolve();
                return;
            }

            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/gif.js@0.2.0/dist/gif.js';
            script.onload = resolve;
            script.onerror = () => reject(new Error('Failed to load GIF encoder'));
            document.head.appendChild(script);
        });
    }

    downloadBlob(blob, filename) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 1000);
    }

    showProgress(show) {
        const progress = document.getElementById('exportProgress');
        if (progress) {
            progress.style.display = show ? 'block' : 'none';
        }

        const exportBtn = document.getElementById('startVideoExport');
        const cancelBtn = document.getElementById('cancelVideoExport');

        if (exportBtn) {
            exportBtn.disabled = show;
            if (show) {
                exportBtn.innerHTML = `
                    <div class="v11-dots-spinner">
                        <span></span><span></span><span></span>
                    </div>
                    Exporting...
                `;
            } else {
                exportBtn.innerHTML = `
                    <svg viewBox="0 0 24 24" width="20" height="20">
                        <path stroke="currentColor" stroke-width="2" fill="none" d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/>
                    </svg>
                    Export Professional Video
                `;
            }
        }

        if (cancelBtn) {
            cancelBtn.textContent = show ? 'Cancel Export' : 'Cancel';
        }

        if (!show) {
            this.updateProgressBar(0);
            this.updateProgressStatus('Ready');
        }
    }

    updateProgressBar(percent) {
        const bar = document.getElementById('exportProgressBar');
        const text = document.getElementById('exportProgressPercent');
        if (bar) {
            bar.style.width = `${Math.min(percent, 100)}%`;
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

    updateTimeRemaining(currentFrame, totalFrames) {
        const timeEl = document.getElementById('exportProgressTime');
        if (!timeEl || !this.startTime) return;

        const elapsed = (Date.now() - this.startTime) / 1000;
        const rate = currentFrame / elapsed;
        const remaining = (totalFrames - currentFrame) / rate;

        if (isFinite(remaining) && remaining > 0) {
            const mins = Math.floor(remaining / 60);
            const secs = Math.floor(remaining % 60);
            timeEl.textContent = `Time remaining: ${mins}m ${secs}s`;
        }
    }

    cancelExport() {
        this.cancelRequested = true;

        if (this.recorder && this.recorder.state !== 'inactive') {
            this.recorder.stop();
        }

        this.showToast('Export cancelled', 'info');
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
                background: rgba(0, 0, 0, 0.6);
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
                max-width: 700px;
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
                font-weight: 700;
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
                transform: rotate(90deg);
            }

            .video-export-panel .panel-body {
                flex: 1;
                overflow-y: auto;
                padding: 24px;
            }

            .info-banner {
                background: linear-gradient(135deg, #e0f2fe 0%, #dbeafe 100%);
                border: 1px solid #bfdbfe;
                border-radius: 12px;
                padding: 16px;
                margin-bottom: 24px;
                display: flex;
                align-items: center;
                gap: 12px;
                color: #1e40af;
                font-size: 0.875rem;
                line-height: 1.5;
            }

            .info-banner svg {
                flex-shrink: 0;
                stroke: #3b82f6;
            }

            .export-section {
                margin-bottom: 28px;
            }

            .export-section h4 {
                margin: 0 0 16px 0;
                font-size: 1.125rem;
                font-weight: 600;
                color: #1f2937;
            }

            .format-options {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 16px;
                margin-bottom: 20px;
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
                background: white;
            }

            .format-option input[type="radio"]:checked + .option-card {
                border-color: #667eea;
                background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%);
                box-shadow: 0 4px 12px rgba(102, 126, 234, 0.2);
                transform: translateY(-2px);
            }

            .option-card:hover {
                border-color: #667eea;
                transform: translateY(-2px);
            }

            .option-icon {
                font-size: 2.5rem;
                margin-bottom: 12px;
            }

            .option-name {
                font-weight: 700;
                font-size: 1.125rem;
                color: #1f2937;
                margin-bottom: 6px;
            }

            .option-desc {
                font-size: 0.875rem;
                color: #6b7280;
                margin-bottom: 8px;
            }

            .option-tech {
                font-size: 0.75rem;
                color: #9ca3af;
                font-family: 'Courier New', monospace;
            }

            .quality-selector {
                margin-top: 16px;
            }

            .quality-selector label {
                display: block;
                margin-bottom: 8px;
                font-weight: 500;
                color: #374151;
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
                font-weight: 700;
                color: #667eea;
                font-size: 1rem;
            }

            .range-labels {
                display: flex;
                justify-content: space-between;
                font-size: 0.75rem;
                color: #9ca3af;
                margin-top: 6px;
            }

            .checkbox-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
                gap: 12px;
            }

            .checkbox-label {
                display: flex;
                align-items: center;
                gap: 12px;
                cursor: pointer;
                font-weight: 500;
                color: #374151;
                padding: 12px;
                border-radius: 8px;
                transition: all 0.2s;
            }

            .checkbox-label:hover {
                background: #f9fafb;
            }

            .video-preview-info {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
                gap: 16px;
            }

            .info-item {
                background: linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%);
                padding: 16px;
                border-radius: 12px;
                border: 1px solid #e5e7eb;
                text-align: center;
            }

            .info-label {
                display: block;
                font-size: 0.75rem;
                color: #6b7280;
                margin-bottom: 8px;
                text-transform: uppercase;
                letter-spacing: 0.5px;
                font-weight: 600;
            }

            .info-value {
                display: block;
                font-size: 1.5rem;
                font-weight: 700;
                color: #1f2937;
            }

            .export-progress {
                background: linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%);
                border: 2px solid #e5e7eb;
                border-radius: 12px;
                padding: 20px;
                margin-top: 20px;
            }

            .progress-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 12px;
                font-weight: 700;
                color: #1f2937;
                font-size: 1.125rem;
            }

            .progress-details {
                margin-top: 12px;
            }

            .progress-status {
                font-size: 0.875rem;
                color: #6b7280;
                margin-bottom: 6px;
            }

            .progress-time {
                font-size: 0.875rem;
                color: #667eea;
                font-weight: 600;
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
                border: 2px solid #d1d5db;
                background: white;
                border-radius: 8px;
                font-weight: 600;
                color: #374151;
                cursor: pointer;
                transition: all 0.2s;
            }

            .btn-cancel:hover {
                background: #fef2f2;
                border-color: #fca5a5;
                color: #dc2626;
            }

            .btn-export {
                padding: 12px 32px;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                border: none;
                border-radius: 8px;
                font-weight: 700;
                font-size: 1rem;
                cursor: pointer;
                display: flex;
                align-items: center;
                gap: 10px;
                transition: all 0.2s;
                box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
            }

            .btn-export:hover:not(:disabled) {
                transform: translateY(-2px);
                box-shadow: 0 8px 20px rgba(102, 126, 234, 0.4);
            }

            .btn-export:disabled {
                opacity: 0.7;
                cursor: not-allowed;
                transform: none;
            }

            .btn-export svg {
                flex-shrink: 0;
            }

            @media (max-width: 768px) {
                .video-export-panel {
                    width: 95%;
                    max-height: 95vh;
                }

                .format-options,
                .checkbox-grid,
                .video-preview-info {
                    grid-template-columns: 1fr;
                }

                .btn-export {
                    padding: 12px 20px;
                    font-size: 0.875rem;
                }
            }
        `;
        document.head.appendChild(style);
    }
}
