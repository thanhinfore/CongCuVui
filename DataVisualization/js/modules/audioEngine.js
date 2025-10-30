// ========================================
// Audio Engine Module - v3.0
// Handles background music, audio sync, and audio visualization
// ========================================

export class AudioEngine {
    constructor() {
        this.audioContext = null;
        this.audioElement = null;
        this.analyser = null;
        this.sourceNode = null;
        this.gainNode = null;
        this.isPlaying = false;
        this._isLoaded = false;  // Private property
        this.volume = 0.5; // Default 50%
        this.frequencyData = null;
        this.timeDomainData = null;
    }

    /**
     * Initialize Audio Context
     */
    async initialize() {
        try {
            // Create Audio Context
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();

            // Create audio element
            this.audioElement = new Audio();
            this.audioElement.loop = false;
            this.audioElement.volume = this.volume;

            // Create analyser for visualization
            this.analyser = this.audioContext.createAnalyser();
            this.analyser.fftSize = 256;
            this.analyser.smoothingTimeConstant = 0.8;

            // Create gain node for volume control
            this.gainNode = this.audioContext.createGain();
            this.gainNode.gain.value = this.volume;

            // Setup frequency data arrays
            this.frequencyData = new Uint8Array(this.analyser.frequencyBinCount);
            this.timeDomainData = new Uint8Array(this.analyser.fftSize);

            console.log('✅ Audio Engine initialized');
            return true;
        } catch (error) {
            console.error('❌ Audio Engine initialization failed:', error);
            return false;
        }
    }

    /**
     * Load audio file
     * @param {File|string} source - File object or URL
     */
    async loadAudio(source) {
        if (!this.audioContext) {
            await this.initialize();
        }

        try {
            // Disconnect previous source if exists
            if (this.sourceNode) {
                this.sourceNode.disconnect();
            }

            // Handle File object or URL
            if (source instanceof File) {
                const url = URL.createObjectURL(source);
                this.audioElement.src = url;
            } else {
                this.audioElement.src = source;
            }

            // Wait for audio to be ready
            await new Promise((resolve, reject) => {
                this.audioElement.addEventListener('canplaythrough', resolve, { once: true });
                this.audioElement.addEventListener('error', reject, { once: true });
            });

            // Create source from audio element
            this.sourceNode = this.audioContext.createMediaElementSource(this.audioElement);

            // Connect nodes: source → analyser → gain → destination
            this.sourceNode.connect(this.analyser);
            this.analyser.connect(this.gainNode);
            this.gainNode.connect(this.audioContext.destination);

            this._isLoaded = true;
            console.log('✅ Audio loaded:', source);
            return true;

        } catch (error) {
            console.error('❌ Failed to load audio:', error);
            this._isLoaded = false;
            return false;
        }
    }

    /**
     * Try to load default background.wav
     */
    async loadDefaultAudio() {
        try {
            const response = await fetch('background.wav');
            if (response.ok) {
                await this.loadAudio('background.wav');
                console.log('✅ Loaded default background.wav');
                return true;
            }
        } catch (error) {
            console.log('ℹ️ No default background.wav found (optional)');
        }
        return false;
    }

    /**
     * Play audio
     */
    async play() {
        if (!this._isLoaded) {
            console.warn('No audio loaded');
            return false;
        }

        try {
            // Resume audio context if suspended
            if (this.audioContext.state === 'suspended') {
                await this.audioContext.resume();
            }

            await this.audioElement.play();
            this.isPlaying = true;
            console.log('▶️ Audio playing');
            return true;
        } catch (error) {
            console.error('Failed to play audio:', error);
            return false;
        }
    }

    /**
     * Pause audio
     */
    pause() {
        if (this.audioElement) {
            this.audioElement.pause();
            this.isPlaying = false;
            console.log('⏸️ Audio paused');
        }
    }

    /**
     * Stop and reset audio
     */
    stop() {
        if (this.audioElement) {
            this.audioElement.pause();
            this.audioElement.currentTime = 0;
            this.isPlaying = false;
            console.log('⏹️ Audio stopped');
        }
    }

    /**
     * Seek to specific time
     * @param {number} time - Time in seconds
     */
    seek(time) {
        if (this.audioElement) {
            this.audioElement.currentTime = time;
        }
    }

    /**
     * Set volume
     * @param {number} volume - Volume (0.0 - 1.0)
     */
    setVolume(volume) {
        this.volume = Math.max(0, Math.min(1, volume));
        if (this.audioElement) {
            this.audioElement.volume = this.volume;
        }
        if (this.gainNode) {
            this.gainNode.gain.value = this.volume;
        }
    }

    /**
     * Get current playback time
     * @returns {number} Current time in seconds
     */
    getCurrentTime() {
        return this.audioElement ? this.audioElement.currentTime : 0;
    }

    /**
     * Get audio duration
     * @returns {number} Duration in seconds
     */
    getDuration() {
        return this.audioElement ? this.audioElement.duration : 0;
    }

    /**
     * Check if audio is loaded
     * @returns {boolean} True if audio is loaded
     */
    isLoaded() {
        return this._isLoaded;
    }

    /**
     * Get frequency data for visualization
     * @returns {Uint8Array} Frequency data (0-255)
     */
    getFrequencyData() {
        if (this.analyser && this.isPlaying) {
            this.analyser.getByteFrequencyData(this.frequencyData);
            return this.frequencyData;
        }
        return null;
    }

    /**
     * Get time domain data (waveform)
     * @returns {Uint8Array} Time domain data (0-255)
     */
    getTimeDomainData() {
        if (this.analyser && this.isPlaying) {
            this.analyser.getByteTimeDomainData(this.timeDomainData);
            return this.timeDomainData;
        }
        return null;
    }

    /**
     * Get average frequency (for simple visualization)
     * @returns {number} Average frequency (0-255)
     */
    getAverageFrequency() {
        const freqData = this.getFrequencyData();
        if (!freqData) return 0;

        let sum = 0;
        for (let i = 0; i < freqData.length; i++) {
            sum += freqData[i];
        }
        return sum / freqData.length;
    }

    /**
     * Get bass frequencies (low range)
     * @returns {number} Bass intensity (0-255)
     */
    getBass() {
        const freqData = this.getFrequencyData();
        if (!freqData) return 0;

        // Use first 20% of frequencies (bass range)
        const bassRange = Math.floor(freqData.length * 0.2);
        let sum = 0;
        for (let i = 0; i < bassRange; i++) {
            sum += freqData[i];
        }
        return sum / bassRange;
    }

    /**
     * Sync audio with animation timeline
     * @param {number} animationProgress - Progress (0-1)
     * @param {number} totalDuration - Total animation duration in seconds
     */
    syncWithAnimation(animationProgress, totalDuration) {
        if (!this._isLoaded) return;

        const targetTime = animationProgress * this.getDuration();
        const currentTime = this.getCurrentTime();

        // Sync if difference > 0.1 seconds
        if (Math.abs(targetTime - currentTime) > 0.1) {
            this.seek(targetTime);
        }
    }

    /**
     * Get audio element for stream capture (v3.0)
     * @returns {HTMLAudioElement} Audio element
     */
    getAudioElement() {
        return this.audioElement;
    }

    /**
     * Destroy audio engine
     */
    destroy() {
        this.stop();

        if (this.sourceNode) {
            this.sourceNode.disconnect();
        }
        if (this.analyser) {
            this.analyser.disconnect();
        }
        if (this.gainNode) {
            this.gainNode.disconnect();
        }
        if (this.audioContext) {
            this.audioContext.close();
        }

        this.audioElement = null;
        this.audioContext = null;
        console.log('🗑️ Audio Engine destroyed');
    }
}
