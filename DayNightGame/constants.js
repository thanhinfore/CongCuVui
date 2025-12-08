// constants.js
export const WIDTH = 900;
export const HEIGHT = 600;

// Game Parameters
export const PLAYER_RADIUS = 12;
export const BALL_RADIUS = 8;
// Ma sát = 1.0 nghĩa là không có ma sát. 
// Để bóng nảy liên tục như bi lắc, ta để ma sát cực thấp (gần 1)
export const BALL_FRICTION = 0.999;
export const KICK_POWER = 20;       // Sút mạnh hơn
export const SLIDE_SPEED = 8;       // Tốc độ trượt thanh nhanh
export const ROTATION_SPEED = 0.15;
export const BOUNCE_FORCE = 1.6;    // Bóng nảy tưng bừng

// Luật chơi
export const MAX_HOLD_TIME = 180;   // 3 giây

// Khung thành
export const GOAL_HEIGHT = 180;
export const GOAL_TOP = (HEIGHT - GOAL_HEIGHT) / 2;
export const GOAL_BOTTOM = (HEIGHT + GOAL_HEIGHT) / 2;

// Màu sắc
export const COLOR_BG = '#1a1a1a'; // Màu bàn tối hơn
export const COLOR_BLUE = '#00E5FF';
export const COLOR_RED = '#FF2E63';
export const COLOR_BLUE_GOALIE = '#00B0FF';
export const COLOR_RED_GOALIE = '#D50000';