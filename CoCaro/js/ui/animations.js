// ================================
// CỜ CARO 11.0 - ANIMATIONS
// Version: 11.0.0
// Advanced UI animations and visual effects
// ================================

import { soundManager } from './sound-manager.js';

/**
 * Show AI thinking animation
 */
export function showAIThinking() {
    const status = document.querySelector('#status');
    if (status) {
        status.classList.add('thinking');

        // Pulse sound effect during thinking
        const pulseInterval = setInterval(() => {
            if (!status.classList.contains('thinking')) {
                clearInterval(pulseInterval);
            } else {
                soundManager.playThinkingPulse();
            }
        }, 800);
    }
}

/**
 * Hide AI thinking animation
 */
export function hideAIThinking() {
    const status = document.querySelector('#status');
    if (status) {
        status.classList.remove('thinking');
    }
}

/**
 * Animate cell placement with enhanced effects
 */
export function animateCellPlacement(row, col, player) {
    const cell = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
    if (!cell) return;

    // Pop-in animation
    cell.classList.add('pop-in');
    setTimeout(() => cell.classList.remove('pop-in'), 300);

    // Play sound based on player
    if (player === 'X') {
        soundManager.playPlayerMove();
    } else {
        soundManager.playAIMove();
    }

    // Add ripple effect
    createRipple(cell);

    // Particle burst effect
    createParticleBurst(cell, player);

    // Glow effect
    addGlowEffect(cell, player);
}

/**
 * Create ripple effect on cell
 */
function createRipple(cell) {
    const ripple = document.createElement('div');
    ripple.className = 'ripple-effect';

    const rect = cell.getBoundingClientRect();
    ripple.style.left = '50%';
    ripple.style.top = '50%';

    cell.style.position = 'relative';
    cell.appendChild(ripple);

    setTimeout(() => ripple.remove(), 600);
}

/**
 * Create particle burst effect
 */
function createParticleBurst(cell, player) {
    const colors = player === 'X'
        ? ['#FF6B6B', '#FF8E8E', '#FFB4B4']
        : ['#4ECDC4', '#45B7D1', '#96E6FC'];

    const rect = cell.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    for (let i = 0; i < 12; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.style.position = 'fixed';
        particle.style.width = '6px';
        particle.style.height = '6px';
        particle.style.borderRadius = '50%';
        particle.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        particle.style.left = centerX + 'px';
        particle.style.top = centerY + 'px';
        particle.style.pointerEvents = 'none';
        particle.style.zIndex = '10000';

        document.body.appendChild(particle);

        const angle = (i / 12) * Math.PI * 2;
        const velocity = 50 + Math.random() * 50;
        const vx = Math.cos(angle) * velocity;
        const vy = Math.sin(angle) * velocity;

        animateParticle(particle, vx, vy);
    }
}

/**
 * Animate particle with physics
 */
function animateParticle(particle, vx, vy) {
    let x = 0, y = 0;
    let opacity = 1;
    const gravity = 0.5;
    let currentVy = vy;

    const animate = () => {
        x += vx * 0.1;
        y += currentVy * 0.1;
        currentVy += gravity;
        opacity -= 0.02;

        particle.style.transform = `translate(${x}px, ${y}px)`;
        particle.style.opacity = opacity;

        if (opacity > 0) {
            requestAnimationFrame(animate);
        } else {
            particle.remove();
        }
    };

    requestAnimationFrame(animate);
}

/**
 * Add glow effect to cell
 */
function addGlowEffect(cell, player) {
    const glowClass = player === 'X' ? 'glow-player' : 'glow-ai';
    cell.classList.add(glowClass);

    setTimeout(() => {
        cell.classList.remove(glowClass);
    }, 500);
}

/**
 * Animate winning line with spectacular effects
 */
export function animateWinningLine(line, winner) {
    line.forEach(({ row, col }, index) => {
        setTimeout(() => {
            const cell = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
            if (cell) {
                cell.classList.add('win-pulse');

                // Play combo sound
                if (index === line.length - 1) {
                    soundManager.playCombo(5);
                }

                // Add rainbow glow effect
                addRainbowGlow(cell, index);
            }
        }, index * 100);
    });

    // Trigger celebration after line animation
    setTimeout(() => {
        if (winner === 'X') {
            soundManager.playWin();
            triggerVictoryCelebration();
        } else {
            soundManager.playLose();
        }
    }, line.length * 100 + 200);
}

/**
 * Add rainbow glow to winning cells
 */
function addRainbowGlow(cell, index) {
    const hue = (index * 60) % 360;
    cell.style.boxShadow = `
        0 0 20px hsla(${hue}, 100%, 50%, 0.8),
        0 0 40px hsla(${hue}, 100%, 50%, 0.6),
        0 0 60px hsla(${hue}, 100%, 50%, 0.4)
    `;
}

/**
 * Trigger victory celebration with confetti and fireworks
 */
export function triggerVictoryCelebration() {
    // Screen shake
    screenShake();

    // Confetti explosion
    createConfetti();

    // Fireworks
    for (let i = 0; i < 5; i++) {
        setTimeout(() => {
            createFirework();
            soundManager.playFirework();
        }, i * 400);
    }

    // Victory message animation
    showVictoryMessage();
}

/**
 * Screen shake effect
 */
function screenShake() {
    const board = document.querySelector('#board');
    if (!board) return;

    let intensity = 10;
    const duration = 500;
    const startTime = Date.now();

    const shake = () => {
        const elapsed = Date.now() - startTime;
        if (elapsed < duration) {
            const x = (Math.random() - 0.5) * intensity;
            const y = (Math.random() - 0.5) * intensity;
            board.style.transform = `translate(${x}px, ${y}px)`;

            intensity *= 0.95; // Decay
            requestAnimationFrame(shake);
        } else {
            board.style.transform = '';
        }
    };

    shake();
}

/**
 * Create confetti explosion
 */
function createConfetti() {
    const colors = ['#FF6B6B', '#4ECDC4', '#FFE66D', '#95E1D3', '#F38181', '#AA96DA'];
    const confettiCount = 150;

    for (let i = 0; i < confettiCount; i++) {
        setTimeout(() => {
            const confetti = document.createElement('div');
            confetti.className = 'confetti';
            confetti.style.position = 'fixed';
            confetti.style.width = Math.random() * 10 + 5 + 'px';
            confetti.style.height = Math.random() * 20 + 10 + 'px';
            confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            confetti.style.left = Math.random() * window.innerWidth + 'px';
            confetti.style.top = '-20px';
            confetti.style.opacity = Math.random() * 0.5 + 0.5;
            confetti.style.transform = `rotate(${Math.random() * 360}deg)`;
            confetti.style.pointerEvents = 'none';
            confetti.style.zIndex = '10001';

            document.body.appendChild(confetti);

            animateConfetti(confetti);
        }, i * 10);
    }
}

/**
 * Animate confetti piece
 */
function animateConfetti(confetti) {
    let y = -20;
    let rotation = Math.random() * 360;
    const rotationSpeed = Math.random() * 10 - 5;
    const vx = Math.random() * 4 - 2;
    const vy = Math.random() * 2 + 2;
    let x = parseFloat(confetti.style.left);

    const animate = () => {
        y += vy;
        x += vx;
        rotation += rotationSpeed;

        confetti.style.top = y + 'px';
        confetti.style.left = x + 'px';
        confetti.style.transform = `rotate(${rotation}deg)`;

        if (y < window.innerHeight) {
            requestAnimationFrame(animate);
        } else {
            confetti.remove();
        }
    };

    requestAnimationFrame(animate);
}

/**
 * Create firework effect
 */
function createFirework() {
    const x = Math.random() * window.innerWidth;
    const y = Math.random() * window.innerHeight * 0.5;

    const colors = ['#FF6B6B', '#4ECDC4', '#FFE66D', '#95E1D3', '#F38181'];
    const color = colors[Math.floor(Math.random() * colors.length)];

    for (let i = 0; i < 30; i++) {
        const particle = document.createElement('div');
        particle.className = 'firework-particle';
        particle.style.position = 'fixed';
        particle.style.width = '4px';
        particle.style.height = '4px';
        particle.style.borderRadius = '50%';
        particle.style.backgroundColor = color;
        particle.style.left = x + 'px';
        particle.style.top = y + 'px';
        particle.style.pointerEvents = 'none';
        particle.style.zIndex = '10000';
        particle.style.boxShadow = `0 0 10px ${color}`;

        document.body.appendChild(particle);

        const angle = (i / 30) * Math.PI * 2;
        const velocity = Math.random() * 5 + 3;
        const vx = Math.cos(angle) * velocity;
        const vy = Math.sin(angle) * velocity;

        animateFireworkParticle(particle, vx, vy);
    }
}

/**
 * Animate firework particle
 */
function animateFireworkParticle(particle, vx, vy) {
    let x = 0, y = 0;
    let opacity = 1;
    const gravity = 0.1;
    let currentVy = vy;

    const animate = () => {
        x += vx;
        y += currentVy;
        currentVy += gravity;
        opacity -= 0.015;

        particle.style.transform = `translate(${x}px, ${y}px)`;
        particle.style.opacity = opacity;

        if (opacity > 0) {
            requestAnimationFrame(animate);
        } else {
            particle.remove();
        }
    };

    requestAnimationFrame(animate);
}

/**
 * Show victory message with animation
 */
function showVictoryMessage() {
    const message = document.createElement('div');
    message.className = 'victory-message';
    message.innerHTML = `
        <div style="
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%) scale(0);
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 40px 60px;
            border-radius: 20px;
            font-size: 48px;
            font-weight: bold;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            z-index: 10002;
            animation: victoryPop 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55) forwards;
            text-align: center;
        ">
            🎉 VICTORY! 🎉
            <div style="font-size: 24px; margin-top: 10px; opacity: 0.9;">
                You Won!
            </div>
        </div>
    `;

    document.body.appendChild(message);

    setTimeout(() => {
        message.style.transition = 'opacity 0.5s';
        message.style.opacity = '0';
        setTimeout(() => message.remove(), 500);
    }, 3000);
}

/**
 * Hover effect on cells
 */
export function addCellHoverEffects() {
    const board = document.querySelector('#board');
    if (!board) return;

    board.addEventListener('mouseover', (e) => {
        if (e.target.classList.contains('cell') && !e.target.classList.contains('occupied')) {
            e.target.classList.add('hover-effect');
            soundManager.playHover();
        }
    });

    board.addEventListener('mouseout', (e) => {
        if (e.target.classList.contains('cell')) {
            e.target.classList.remove('hover-effect');
        }
    });
}

/**
 * Add button click effects
 */
export function addButtonEffects() {
    const buttons = document.querySelectorAll('button');
    buttons.forEach(button => {
        button.addEventListener('click', () => {
            soundManager.playButtonClick();
            button.classList.add('button-pressed');
            setTimeout(() => button.classList.remove('button-pressed'), 150);
        });
    });
}

/**
 * Invalid move shake effect
 */
export function shakeCell(row, col) {
    const cell = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
    if (cell) {
        cell.classList.add('shake');
        soundManager.playInvalidMove();
        setTimeout(() => cell.classList.remove('shake'), 500);
    }
}

/**
 * Critical move warning animation
 */
export function showCriticalMoveWarning(row, col) {
    const cell = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
    if (cell) {
        cell.classList.add('critical-warning');
        soundManager.playCriticalMove();

        setTimeout(() => {
            cell.classList.remove('critical-warning');
        }, 1000);
    }
}

/**
 * Initialize all animation effects
 */
export function initAnimations() {
    addCellHoverEffects();
    addButtonEffects();

    // Add CSS animations dynamically
    addAnimationStyles();
}

/**
 * Add CSS animation styles
 */
function addAnimationStyles() {
    const style = document.createElement('style');
    style.textContent = `
        @keyframes victoryPop {
            0% { transform: translate(-50%, -50%) scale(0) rotate(-180deg); }
            50% { transform: translate(-50%, -50%) scale(1.1) rotate(10deg); }
            100% { transform: translate(-50%, -50%) scale(1) rotate(0deg); }
        }

        .pop-in {
            animation: popIn 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55);
        }

        @keyframes popIn {
            0% { transform: scale(0); }
            50% { transform: scale(1.2); }
            100% { transform: scale(1); }
        }

        .win-pulse {
            animation: winPulse 0.6s ease-in-out infinite;
        }

        @keyframes winPulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.15); }
        }

        .glow-player {
            box-shadow: 0 0 20px rgba(255, 107, 107, 0.8),
                        0 0 40px rgba(255, 107, 107, 0.6);
        }

        .glow-ai {
            box-shadow: 0 0 20px rgba(78, 205, 196, 0.8),
                        0 0 40px rgba(78, 205, 196, 0.6);
        }

        .ripple-effect {
            position: absolute;
            border-radius: 50%;
            border: 2px solid currentColor;
            width: 20px;
            height: 20px;
            transform: translate(-50%, -50%);
            animation: ripple 0.6s ease-out;
            pointer-events: none;
        }

        @keyframes ripple {
            to {
                width: 100px;
                height: 100px;
                opacity: 0;
            }
        }

        .hover-effect {
            background-color: rgba(100, 126, 234, 0.1);
            transform: scale(1.05);
            transition: all 0.2s ease;
        }

        .button-pressed {
            transform: scale(0.95);
            transition: transform 0.1s ease;
        }

        .shake {
            animation: shake 0.5s;
        }

        @keyframes shake {
            0%, 100% { transform: translateX(0); }
            10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
            20%, 40%, 60%, 80% { transform: translateX(5px); }
        }

        .critical-warning {
            animation: criticalPulse 0.3s ease-in-out 3;
            background-color: rgba(255, 193, 7, 0.3);
        }

        @keyframes criticalPulse {
            0%, 100% { transform: scale(1); opacity: 1; }
            50% { transform: scale(1.1); opacity: 0.8; }
        }

        .thinking {
            animation: thinking 1.5s ease-in-out infinite;
        }

        @keyframes thinking {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
        }
    `;
    document.head.appendChild(style);
}
