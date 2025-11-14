// ================================
// CỜ CARO 11.0 - SOUND MANAGER
// Version: 11.0.0
// Professional sound effects using Web Audio API
// ================================

class SoundManager {
    constructor() {
        this.audioContext = null;
        this.masterVolume = 0.7;
        this.enabled = true;
        this.init();
    }

    init() {
        try {
            // Create AudioContext (handle vendor prefixes)
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            this.audioContext = new AudioContext();

            // Resume context on user interaction (required by browsers)
            document.addEventListener('click', () => {
                if (this.audioContext.state === 'suspended') {
                    this.audioContext.resume();
                }
            }, { once: true });
        } catch (e) {
            console.warn('Web Audio API not supported', e);
            this.enabled = false;
        }
    }

    /**
     * Play a tone with specific frequency and duration
     */
    playTone(frequency, duration, type = 'sine', volume = 1.0) {
        if (!this.enabled || !this.audioContext) return;

        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        oscillator.type = type;
        oscillator.frequency.value = frequency;

        // ADSR envelope for smoother sound
        const now = this.audioContext.currentTime;
        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.linearRampToValueAtTime(volume * this.masterVolume, now + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + duration);

        oscillator.start(now);
        oscillator.stop(now + duration);
    }

    /**
     * Play a chord (multiple frequencies)
     */
    playChord(frequencies, duration, type = 'sine', volume = 0.3) {
        frequencies.forEach(freq => {
            this.playTone(freq, duration, type, volume);
        });
    }

    /**
     * Sound: Player move - Pleasant click sound
     */
    playPlayerMove() {
        // Layered sound for richness
        this.playTone(880, 0.08, 'sine', 0.4);      // High ping
        this.playTone(440, 0.12, 'triangle', 0.3);  // Mid tone

        // Add a subtle bass for depth
        setTimeout(() => {
            this.playTone(220, 0.06, 'sine', 0.2);
        }, 20);
    }

    /**
     * Sound: AI move - Different tone to distinguish
     */
    playAIMove() {
        // Lower, more mechanical sound
        this.playTone(660, 0.1, 'square', 0.3);
        this.playTone(330, 0.14, 'triangle', 0.25);

        setTimeout(() => {
            this.playTone(165, 0.08, 'sine', 0.15);
        }, 25);
    }

    /**
     * Sound: Hover over cell
     */
    playHover() {
        this.playTone(1320, 0.04, 'sine', 0.15);
    }

    /**
     * Sound: Invalid move
     */
    playInvalidMove() {
        this.playTone(150, 0.15, 'sawtooth', 0.3);
        setTimeout(() => {
            this.playTone(120, 0.15, 'sawtooth', 0.3);
        }, 100);
    }

    /**
     * Sound: Win celebration
     */
    playWin() {
        // Victory fanfare - ascending arpeggio
        const notes = [523, 659, 784, 1047]; // C-E-G-C major chord
        notes.forEach((freq, i) => {
            setTimeout(() => {
                this.playTone(freq, 0.3, 'sine', 0.5);
            }, i * 100);
        });

        // Final chord
        setTimeout(() => {
            this.playChord([523, 659, 784, 1047], 0.8, 'sine', 0.4);
        }, 500);

        // Sparkle effects
        for (let i = 0; i < 5; i++) {
            setTimeout(() => {
                this.playTone(2000 + Math.random() * 1000, 0.1, 'sine', 0.2);
            }, 600 + i * 80);
        }
    }

    /**
     * Sound: Lose
     */
    playLose() {
        // Descending sad trombone effect
        const notes = [440, 392, 349, 294]; // A-G-F-D
        notes.forEach((freq, i) => {
            setTimeout(() => {
                this.playTone(freq, 0.25, 'triangle', 0.4);
            }, i * 150);
        });
    }

    /**
     * Sound: Draw/Tie
     */
    playDraw() {
        // Neutral chord
        this.playChord([440, 554, 659], 0.5, 'sine', 0.35);
    }

    /**
     * Sound: Button click
     */
    playButtonClick() {
        this.playTone(800, 0.06, 'sine', 0.3);
        setTimeout(() => {
            this.playTone(1000, 0.04, 'sine', 0.2);
        }, 30);
    }

    /**
     * Sound: AI thinking pulse
     */
    playThinkingPulse() {
        this.playTone(330, 0.08, 'sine', 0.2);
    }

    /**
     * Sound: Combo/Multiple in a row
     */
    playCombo(count) {
        // More dramatic for higher combos
        const baseFreq = 600;
        for (let i = 0; i < count; i++) {
            setTimeout(() => {
                this.playTone(baseFreq + i * 200, 0.08, 'sine', 0.3);
            }, i * 60);
        }
    }

    /**
     * Sound: Critical move warning
     */
    playCriticalMove() {
        // Urgent warning sound
        this.playTone(1000, 0.1, 'square', 0.4);
        setTimeout(() => {
            this.playTone(1000, 0.1, 'square', 0.4);
        }, 150);
    }

    /**
     * Sound: Celebration firework
     */
    playFirework() {
        // Whoosh up
        const now = this.audioContext.currentTime;
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        oscillator.frequency.setValueAtTime(200, now);
        oscillator.frequency.exponentialRampToValueAtTime(2000, now + 0.3);

        gainNode.gain.setValueAtTime(0.3, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.3);

        oscillator.start(now);
        oscillator.stop(now + 0.3);

        // Explosion
        setTimeout(() => {
            for (let i = 0; i < 8; i++) {
                setTimeout(() => {
                    this.playTone(1000 + Math.random() * 1500, 0.15, 'sine', 0.25);
                }, i * 20);
            }
        }, 300);
    }

    /**
     * Sound: Explosion - v12.0
     * Hiệu ứng nổ cho 5 khóa
     */
    playExplosion() {
        if (!this.enabled || !this.audioContext) return;

        const now = this.audioContext.currentTime;

        // Deep bass rumble
        const bass = this.audioContext.createOscillator();
        const bassGain = this.audioContext.createGain();
        bass.connect(bassGain);
        bassGain.connect(this.audioContext.destination);

        bass.type = 'sawtooth';
        bass.frequency.setValueAtTime(50, now);
        bass.frequency.exponentialRampToValueAtTime(20, now + 0.3);

        bassGain.gain.setValueAtTime(0.5, now);
        bassGain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);

        bass.start(now);
        bass.stop(now + 0.3);

        // Mid-range explosion crackle
        for (let i = 0; i < 15; i++) {
            setTimeout(() => {
                const freq = 100 + Math.random() * 400;
                this.playTone(freq, 0.08, 'square', 0.2);
            }, i * 15);
        }

        // High sparkle (debris sounds)
        setTimeout(() => {
            for (let i = 0; i < 10; i++) {
                setTimeout(() => {
                    const freq = 2000 + Math.random() * 2000;
                    this.playTone(freq, 0.05, 'sine', 0.15);
                }, i * 25);
            }
        }, 100);

        // Final impact
        setTimeout(() => {
            this.playTone(80, 0.2, 'triangle', 0.4);
        }, 300);
    }

    /**
     * Toggle sound on/off
     */
    toggle() {
        this.enabled = !this.enabled;
        return this.enabled;
    }

    /**
     * Set master volume (0.0 to 1.0)
     */
    setVolume(volume) {
        this.masterVolume = Math.max(0, Math.min(1, volume));
    }
}

// Create singleton instance
export const soundManager = new SoundManager();
