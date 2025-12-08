// Ball.js
import { WIDTH, HEIGHT, BALL_RADIUS, BALL_FRICTION, GOAL_TOP, GOAL_BOTTOM, PLAYER_RADIUS } from './constants.js';
import { sfx } from './audio.js';

export default class Ball {
    constructor() {
        this.reset();
        this.trail = [];
    }

    reset() {
        // GIAO BÓNG KIỂU BI LẮC
        // Bóng xuất phát từ mép trên hoặc dưới (giống lỗ thả bóng)
        const startFromTop = Math.random() > 0.5;

        this.x = WIDTH / 2; // Giữa sân theo trục X
        this.y = startFromTop ? BALL_RADIUS + 5 : HEIGHT - BALL_RADIUS - 5;

        // Vận tốc: Bắn mạnh về phía đối diện + góc ngẫu nhiên
        this.vy = startFromTop ? (Math.random() * 5 + 8) : -(Math.random() * 5 + 8);
        this.vx = (Math.random() - 0.5) * 10; // Lệch trái phải ngẫu nhiên

        this.owner = null;
        this.cooldown = 0;
        this.trail = [];
    }

    update(frameCount, onGoal, onCreateParticles) {
        if (this.cooldown > 0) this.cooldown--;

        // Hiệu ứng đuôi bóng
        if (frameCount % 3 === 0) {
            this.trail.push({ x: this.x, y: this.y });
            if (this.trail.length > 8) this.trail.shift();
        }

        // KHI CÓ NGƯỜI CẦM BÓNG
        if (this.owner) {
            let dist = PLAYER_RADIUS + BALL_RADIUS;
            this.x = this.owner.x + Math.cos(this.owner.holdAngle) * dist;
            this.y = this.owner.y + Math.sin(this.owner.holdAngle) * dist;
            this.vx = 0; this.vy = 0;
            return;
        }

        // VẬT LÝ TỰ DO
        this.x += this.vx;
        this.y += this.vy;

        // Ma sát (rất ít)
        this.vx *= BALL_FRICTION;
        this.vy *= BALL_FRICTION;

        // Va chạm tường Trên/Dưới
        if (this.y < BALL_RADIUS) {
            this.y = BALL_RADIUS;
            this.vy *= -1;
            sfx.wall();
        }
        if (this.y > HEIGHT - BALL_RADIUS) {
            this.y = HEIGHT - BALL_RADIUS;
            this.vy *= -1;
            sfx.wall();
        }

        // Ghi bàn / Nảy tường biên (Gần gôn)
        if (this.x < BALL_RADIUS) {
            if (this.y > GOAL_TOP && this.y < GOAL_BOTTOM) onGoal('red');
            else {
                this.x = BALL_RADIUS; this.vx *= -1; sfx.wall();
                onCreateParticles(this.x, this.y, '#fff', 3);
            }
        }
        else if (this.x > WIDTH - BALL_RADIUS) {
            if (this.y > GOAL_TOP && this.y < GOAL_BOTTOM) onGoal('blue');
            else {
                this.x = WIDTH - BALL_RADIUS; this.vx *= -1; sfx.wall();
                onCreateParticles(this.x, this.y, '#fff', 3);
            }
        }
    }

    draw(ctx) {
        if (!this.owner && (Math.abs(this.vx) > 2 || Math.abs(this.vy) > 2)) {
            for (let i = 0; i < this.trail.length; i++) {
                let point = this.trail[i];
                let alpha = i / this.trail.length;
                ctx.globalAlpha = alpha * 0.4;
                ctx.fillStyle = '#fff';
                let size = BALL_RADIUS * (i / this.trail.length);
                ctx.beginPath();
                ctx.arc(point.x, point.y, size, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.globalAlpha = 1.0;
        }
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(this.x, this.y, BALL_RADIUS, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 10;
        ctx.shadowColor = 'white';
        ctx.stroke();
        ctx.shadowBlur = 0;
    }
}