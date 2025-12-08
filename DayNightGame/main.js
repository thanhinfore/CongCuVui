import * as C from './constants.js';
import { sfx, resumeAudio } from './audio.js';
import Ball from './Ball.js';
import Player from './Player.js';
import Particle from './Particle.js';

// --- SETUP CANVAS ---
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.width = C.WIDTH;
canvas.height = C.HEIGHT;

// --- DOM ELEMENTS ---
const scoreBlueEl = document.getElementById('scoreBlue');
const scoreRedEl = document.getElementById('scoreRed');
const timerEl = document.getElementById('timer');
const overlay = document.getElementById('message-overlay');
const msgTitle = document.getElementById('msg-title');
const msgSub = document.getElementById('msg-sub');
const btnAction = document.getElementById('btn-action');

// --- GAME STATE ---
let gameState = 'MENU';
let frameCount = 0;
let gameTime = 0;
let shakeFrames = 0;
let particles = [];
let score = { blue: 0, red: 0 };
const keys = { ArrowUp: false, ArrowDown: false, ArrowLeft: false, ArrowRight: false, Space: false };

// --- OBJECTS ---
let ball = new Ball();
let players = [];

// --- HELPER FUNCTIONS ---

function createParticles(x, y, color, count) {
    for (let i = 0; i < count; i++) particles.push(new Particle(x, y, color));
}

function shakeScreen(amount) {
    shakeFrames = amount;
}

function kickBall(player, dirX, dirY) {
    ball.owner = null;
    ball.cooldown = 20;
    sfx.kick();
    ball.vx = dirX * C.KICK_POWER;
    ball.vy = dirY * C.KICK_POWER;

    shakeScreen(5);
    createParticles(player.x, player.y, '#fff', 6);
}

function handleGoal(teamConceded) {
    gameState = 'GOAL';
    sfx.goal();

    // Đội thủng lưới là teamConceded -> Đội kia ghi bàn
    let scoringTeam = (teamConceded === 'red') ? 'blue' : 'red';
    let color = (scoringTeam === 'blue') ? C.COLOR_BLUE : C.COLOR_RED;
    let text = (scoringTeam === 'blue') ? "BLUE SCORES!" : "RED SCORES!";

    if (scoringTeam === 'blue') score.blue++; else score.red++;

    // Hiệu ứng nổ tại gôn
    createParticles((teamConceded === 'red') ? 0 : C.WIDTH, C.HEIGHT / 2, color, 80);

    // Cập nhật UI
    msgTitle.innerText = "GOAL!!!";
    msgTitle.style.color = color;
    msgSub.innerText = text;
    scoreBlueEl.innerText = score.blue;
    scoreRedEl.innerText = score.red;

    shakeScreen(40);

    // Reset sau 2 giây
    setTimeout(() => {
        initGame();
        gameState = 'PLAYING';
    }, 2000);
}

// --- LOGIC DI CHUYỂN ĐỘI HÌNH (QUAN TRỌNG) ---
function handleTeamMovement() {

    // 1. ĐỘI XANH (Người chơi)
    const bluePlayers = players.filter(p => p.team === 'blue');
    let blueDelta = 0;
    if (keys.ArrowUp) blueDelta = -C.SLIDE_SPEED;
    if (keys.ArrowDown) blueDelta = C.SLIDE_SPEED;

    if (blueDelta !== 0) {
        let canMove = true;
        for (let p of bluePlayers) {
            let nextY = p.y + blueDelta;
            if (nextY < C.PLAYER_RADIUS || nextY > C.HEIGHT - C.PLAYER_RADIUS) {
                canMove = false;
                break;
            }
        }
        if (canMove) bluePlayers.forEach(p => p.moveY(blueDelta));
    }

    // 2. ĐỘI ĐỎ (AI SIÊU THÔNG MINH)
    const redPlayers = players.filter(p => p.team === 'red');
    let redDelta = 0;

    // Kiểm tra xem AI có đang giữ bóng không
    let aiHasBall = ball.owner && ball.owner.team === 'red';

    if (aiHasBall) {
        // [CHIẾN THUẬT TẤN CÔNG]
        // Lừa bóng (Dribbling): Di chuyển lên xuống theo hình sin để làm rối loạn thủ môn
        redDelta = Math.sin(frameCount * 0.15) * C.SLIDE_SPEED;
    } else {
        // [CHIẾN THUẬT PHÒNG THỦ]
        let avgY = redPlayers.reduce((sum, p) => sum + p.y, 0) / redPlayers.length;
        let targetY = ball.y;

        // Dự đoán hướng bóng rơi
        if (ball.vx > 0) targetY += ball.vy * 5;

        // Phản xạ
        let reaction = (ball.x > C.WIDTH / 2) ? 0.9 : 0.5; // Nhanh hơn khi bóng ở sân nhà

        if (targetY > avgY + 10) redDelta = C.SLIDE_SPEED * reaction;
        else if (targetY < avgY - 10) redDelta = -C.SLIDE_SPEED * reaction;
    }

    // Kiểm tra biên cho AI
    if (redDelta !== 0) {
        let canMoveAI = true;
        for (let p of redPlayers) {
            let nextY = p.y + redDelta;
            if (nextY < C.PLAYER_RADIUS || nextY > C.HEIGHT - C.PLAYER_RADIUS) {
                canMoveAI = false;
                break;
            }
        }
        if (canMoveAI) redPlayers.forEach(p => p.moveY(redDelta));
    }
}

// --- KHỞI TẠO GAME ---
function initGame() {
    players = [];
    const centerY = C.HEIGHT / 2;

    // Vị trí các thanh (Rods) chuẩn bi lắc
    const col1 = 60;  // Blue GK
    const col2 = 160; // Blue Def
    const col3 = 300; // Red Att
    const col4 = 400; // Blue Mid
    const col5 = 500; // Red Mid
    const col6 = 600; // Blue Att
    const col7 = 740; // Red Def
    const col8 = 840; // Red GK

    // --- BLUE ---
    players.push(new Player('blue', 'goalie', col1, centerY));
    players.push(new Player('blue', 'field', col2, centerY - 100));
    players.push(new Player('blue', 'field', col2, centerY + 100));
    for (let i = -2; i <= 2; i++) players.push(new Player('blue', 'field', col4, centerY + i * 85));
    for (let i = -1; i <= 1; i++) players.push(new Player('blue', 'field', col6, centerY + i * 110));

    // --- RED ---
    players.push(new Player('red', 'goalie', col8, centerY));
    players.push(new Player('red', 'field', col7, centerY - 100));
    players.push(new Player('red', 'field', col7, centerY + 100));
    for (let i = -2; i <= 2; i++) players.push(new Player('red', 'field', col5, centerY + i * 85));
    for (let i = -1; i <= 1; i++) players.push(new Player('red', 'field', col3, centerY + i * 110));

    ball.reset();
}

function drawField() {
    ctx.fillStyle = C.COLOR_BG;
    ctx.fillRect(0, 0, C.WIDTH, C.HEIGHT);

    // Vẽ thanh sắt
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 6;
    let rodsX = [...new Set(players.map(p => p.startX))];
    rodsX.forEach(x => { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, C.HEIGHT); ctx.stroke(); });

    // Sân cỏ nhân tạo
    ctx.strokeStyle = 'rgba(255,255,255,0.1)'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(C.WIDTH / 2, 0); ctx.lineTo(C.WIDTH / 2, C.HEIGHT); ctx.stroke();
    ctx.beginPath(); ctx.arc(C.WIDTH / 2, C.HEIGHT / 2, 70, 0, Math.PI * 2); ctx.stroke();

    // Khung thành
    ctx.fillStyle = 'rgba(0, 229, 255, 0.3)'; ctx.fillRect(0, C.GOAL_TOP, 15, C.GOAL_HEIGHT);
    ctx.fillStyle = 'rgba(255, 46, 99, 0.3)'; ctx.fillRect(C.WIDTH - 15, C.GOAL_TOP, 15, C.GOAL_HEIGHT);

    // Tường biên
    ctx.strokeStyle = '#555'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, C.GOAL_TOP); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, C.GOAL_BOTTOM); ctx.lineTo(0, C.HEIGHT); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(C.WIDTH, 0); ctx.lineTo(C.WIDTH, C.GOAL_TOP); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(C.WIDTH, C.GOAL_BOTTOM); ctx.lineTo(C.WIDTH, C.HEIGHT); ctx.stroke();
}

// --- GAME LOOP ---
function loop() {
    ctx.save();

    // Hiệu ứng rung màn hình
    if (shakeFrames > 0) {
        const intensity = shakeFrames * 0.5;
        ctx.translate((Math.random() - 0.5) * intensity, (Math.random() - 0.5) * intensity);
        shakeFrames--;
    }

    drawField();

    if (gameState === 'PLAYING' || gameState === 'GOAL') {
        if (gameState === 'PLAYING') {
            ball.update(frameCount, handleGoal, createParticles);
            handleTeamMovement(); // Xử lý di chuyển cả đội

            players.forEach(p => p.update(ball, keys, kickBall, createParticles));

            frameCount++;
            if (frameCount % 60 === 0) {
                gameTime++;
                let min = Math.floor(gameTime / 60).toString().padStart(2, 0);
                let sec = (gameTime % 60).toString().padStart(2, 0);
                timerEl.innerText = `${min}:${sec}`;
            }
            // Reset phím space để tránh sút liên tục
            if (keys.Space && ball.owner?.team === 'blue') keys.Space = false;
        }

        // Vẽ layer
        players.forEach(p => p.draw(ctx, ball.owner));
        ball.draw(ctx);
        particles.forEach((p, index) => { p.update(); p.draw(ctx); if (p.life <= 0) particles.splice(index, 1); });
    }
    ctx.restore();
    requestAnimationFrame(loop);
}

// --- START UP ---
function startGame() {
    resumeAudio();
    overlay.style.display = 'none';
    score = { blue: 0, red: 0 }; scoreBlueEl.innerText = 0; scoreRedEl.innerText = 0;
    gameTime = 0; gameState = 'PLAYING'; initGame();
}

// Input
window.addEventListener('keydown', e => {
    if (keys.hasOwnProperty(e.code)) {
        keys[e.code] = true;
        if (e.code === 'Space' || e.code.startsWith('Arrow')) e.preventDefault();
    }
});
window.addEventListener('keyup', e => { if (keys.hasOwnProperty(e.code)) keys[e.code] = false; });
btnAction.onclick = startGame;

// Khởi chạy vòng lặp ngay lập tức (để vẽ menu nền)
initGame();
loop();