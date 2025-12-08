// audio.js
const AudioContext = window.AudioContext || window.webkitAudioContext;
const actx = new AudioContext();

function playTone(freq, type, vol, duration, slide = 0) {
    if (actx.state === 'suspended') actx.resume();
    const osc = actx.createOscillator();
    const gain = actx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, actx.currentTime);
    if (slide !== 0) osc.frequency.linearRampToValueAtTime(freq + slide, actx.currentTime + duration);
    gain.gain.setValueAtTime(vol, actx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, actx.currentTime + duration);
    osc.connect(gain);
    gain.connect(actx.destination);
    osc.start();
    osc.stop(actx.currentTime + duration);
}

export const sfx = {
    kick: () => playTone(100, 'square', 0.1, 0.1, -40),
    slide: () => playTone(200, 'sawtooth', 0.01, 0.05),
    bounce: () => playTone(300, 'sine', 0.05, 0.1),
    wall: () => playTone(100, 'sawtooth', 0.05, 0.1, -20),
    save: () => playTone(600, 'triangle', 0.15, 0.1, -300),
    goal: () => {
        playTone(400, 'square', 0.1, 0.4);
        setTimeout(() => playTone(500, 'square', 0.1, 0.4), 100);
        setTimeout(() => playTone(800, 'square', 0.1, 0.6), 200);
    }
};

export const resumeAudio = () => {
    if (actx.state === 'suspended') actx.resume();
};