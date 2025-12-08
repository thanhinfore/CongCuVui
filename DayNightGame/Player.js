// Player.js
import { WIDTH, HEIGHT, PLAYER_RADIUS, BALL_RADIUS, MAX_HOLD_TIME, COLOR_BLUE, COLOR_RED, COLOR_BLUE_GOALIE, COLOR_RED_GOALIE } from './constants.js';
import { sfx } from './audio.js';

export default class Player {
    constructor(team, role, x, y) {
        this.team = team;
        this.role = role;

        this.startX = x;
        this.x = x;
        this.y = y;

        this.mass = 1;
        this.holdAngle = (team === 'blue') ? 0 : Math.PI;
        this.holdTimer = 0;

        // AI Brain: Thời gian quyết định sút (sẽ random mỗi lần nhận bóng)
        this.aiDecisionDelay = 0;
    }

    update(ball, keys, kickBallCallback, onCreateParticles) {
        // --- 1. CHỈ XỬ LÝ SÚT ---
        this.x = this.startX;

        if (this.team === 'blue') {
            // BLUE: Sút bằng Space
            if (ball.owner === this && keys.Space) {
                kickBallCallback(this, Math.cos(this.holdAngle), Math.sin(this.holdAngle));
                this.holdTimer = 0;
            }
        } else {
            // RED AI: Logic Sút Thông Minh
            if (ball.owner === this) {
                // Nếu vừa mới nhận bóng, hãy quyết định xem nên giữ bao lâu
                if (this.holdTimer === 1) {
                    // Random từ 20 frame (sút nhanh) đến 80 frame (giữ lâu để lừa)
                    this.aiDecisionDelay = 20 + Math.random() * 60;
                }

                // Khi đã đủ thời gian suy nghĩ -> SÚT
                if (this.holdTimer > this.aiDecisionDelay) {
                    kickBallCallback(this, Math.cos(this.holdAngle), Math.sin(this.holdAngle));
                    this.holdTimer = 0;
                }
            }
        }

        // --- 2. LUẬT 3 GIÂY ---
        if (ball.owner === this) {
            this.holdTimer++;

            // Rung lắc khi sắp hết giờ
            if (this.holdTimer > MAX_HOLD_TIME * 0.7) {
                this.x = this.startX + (Math.random() - 0.5) * 2;
            } else {
                this.x = this.startX;
            }

            // Hết giờ -> Tự sút phạt
            if (this.holdTimer > MAX_HOLD_TIME) {
                kickBallCallback(this, Math.cos(this.holdAngle), Math.sin(this.holdAngle));
                this.holdTimer = 0;
                onCreateParticles(this.x, this.y, '#ffff00', 5);
            }
        } else {
            this.holdTimer = 0;
            this.x = this.startX;
        }

        // --- 3. TƯƠNG TÁC BÓNG ---
        let dx = ball.x - this.x;
        let dy = ball.y - this.y;
        let dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < PLAYER_RADIUS + BALL_RADIUS + 2) {
            if (ball.cooldown === 0 && (!ball.owner || ball.owner.team !== this.team)) {

                if (this.role === 'goalie') {
                    // Thủ môn phá bóng mạnh
                    sfx.save();
                    let nx = dx / dist; let ny = dy / dist;
                    ball.vx = nx * 20 * 0.8;
                    ball.vy = ny * 20 * 0.8;
                    ball.cooldown = 10;
                    ball.owner = null;
                    onCreateParticles(ball.x, ball.y, '#fff', 5);
                } else {
                    // Cầu thủ bắt bóng
                    ball.owner = this;
                    sfx.bounce();
                    if (this.team === 'blue') this.holdAngle = 0;
                    else this.holdAngle = Math.PI;
                }
            }
        }
    }

    moveY(delta) {
        this.y += delta;
    }

    draw(ctx, ballOwner) {
        let baseColor = (this.team === 'blue') ? COLOR_BLUE : COLOR_RED;
        if (this.role === 'goalie') baseColor = (this.team === 'blue') ? COLOR_BLUE_GOALIE : COLOR_RED_GOALIE;

        if (ballOwner === this && this.holdTimer > MAX_HOLD_TIME * 0.7) {
            if (Math.floor(Date.now() / 50) % 2 === 0) baseColor = '#FFFF00';
        }

        ctx.fillStyle = baseColor;
        ctx.shadowBlur = 10;
        ctx.shadowColor = ctx.fillStyle;

        ctx.beginPath();
        ctx.arc(this.x, this.y, PLAYER_RADIUS, 0, Math.PI * 2);
        ctx.fill();

        if (this.role === 'goalie') { ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.stroke(); }
        ctx.shadowBlur = 0;

        ctx.fillStyle = '#fff';
        let eyeX = this.x + Math.cos(this.holdAngle) * 6;
        let eyeY = this.y + Math.sin(this.holdAngle) * 6;
        ctx.beginPath(); ctx.arc(eyeX, eyeY, 3, 0, Math.PI * 2); ctx.fill();

        if (ballOwner === this) {
            let pct = this.holdTimer / MAX_HOLD_TIME;
            ctx.fillStyle = (pct > 0.7) ? '#FF0000' : '#00FF00';
            ctx.fillRect(this.x - 15, this.y - 25, 30 * (1 - pct), 4);
        }

        if (this.team === 'blue' && ballOwner === this) {
            ctx.beginPath();
            ctx.strokeStyle = '#FFD700';
            ctx.lineWidth = 3;
            let sx = this.x + Math.cos(this.holdAngle) * PLAYER_RADIUS;
            let sy = this.y + Math.sin(this.holdAngle) * PLAYER_RADIUS;
            let ex = this.x + Math.cos(this.holdAngle) * (PLAYER_RADIUS + 60);
            let ey = this.y + Math.sin(this.holdAngle) * (PLAYER_RADIUS + 60);
            ctx.moveTo(sx, sy); ctx.lineTo(ex, ey); ctx.stroke();
        }
    }
}