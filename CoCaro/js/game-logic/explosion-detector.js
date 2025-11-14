/**
 * Cờ Caro Nổ 5 Khóa - Explosion Detection Module
 * Version: 12.0.0
 *
 * Phát hiện và xử lý:
 * - 5 Mở (Open Five): Ít nhất 1 đầu không bị chặn → THẮNG
 * - 5 Khóa (Locked Five): Cả 2 đầu bị chặn → NỔ
 */

import { BOARD_SIZE } from '../config/constants.js';

const DIRECTIONS = [
    { dr: 0, dc: 1, name: 'horizontal' },  // Ngang →
    { dr: 1, dc: 0, name: 'vertical' },    // Dọc ↓
    { dr: 1, dc: 1, name: 'diagonal1' },   // Chéo ↘
    { dr: 1, dc: -1, name: 'diagonal2' }   // Chéo ↙
];

/**
 * Kiểm tra xem một ô có nằm trong biên không
 */
function isInBounds(row, col) {
    return row >= 0 && row < BOARD_SIZE && col >= 0 && col < BOARD_SIZE;
}

/**
 * Kiểm tra xem một đầu của dãy 5 có bị khóa không
 * Khóa = Có quân đối thủ HOẶC ngoài biên
 */
function isEndLocked(board, row, col, player) {
    // Ngoài biên = khóa
    if (!isInBounds(row, col)) {
        return true;
    }

    const cell = board[row][col];
    const opponent = player === 'X' ? 'O' : 'X';

    // Có quân đối thủ = khóa
    if (cell === opponent) {
        return true;
    }

    // Trống hoặc quân của mình = không khóa
    return false;
}

/**
 * Tìm tất cả các dãy 5 liên tiếp từ một vị trí
 * Trả về mảng các dãy 5 với thông tin về trạng thái mở/khóa
 */
export function findAllFiveSequences(board, row, col, player) {
    const sequences = [];

    for (const dir of DIRECTIONS) {
        // Đi ngược lại để tìm điểm bắt đầu xa nhất
        let startRow = row;
        let startCol = col;
        let count = 0;

        // Đếm ngược về phía trước
        while (count < 4) {
            const prevRow = startRow - dir.dr;
            const prevCol = startCol - dir.dc;

            if (!isInBounds(prevRow, prevCol) || board[prevRow][prevCol] !== player) {
                break;
            }

            startRow = prevRow;
            startCol = prevCol;
            count++;
        }

        // Từ điểm bắt đầu, đếm về phía trước để tìm tất cả dãy 5
        let curRow = startRow;
        let curCol = startCol;
        const cells = [];

        // Thu thập tất cả các ô liên tiếp cùng màu
        while (isInBounds(curRow, curCol) && board[curRow][curCol] === player) {
            cells.push({ row: curRow, col: curCol });
            curRow += dir.dr;
            curCol += dir.dc;
        }

        // Tìm tất cả các dãy 5 con trong chuỗi này
        if (cells.length >= 5) {
            for (let i = 0; i <= cells.length - 5; i++) {
                const fiveCells = cells.slice(i, i + 5);

                // Kiểm tra 2 đầu
                const startCell = fiveCells[0];
                const endCell = fiveCells[4];

                const beforeRow = startCell.row - dir.dr;
                const beforeCol = startCell.col - dir.dc;
                const afterRow = endCell.row + dir.dr;
                const afterCol = endCell.col + dir.dc;

                const startLocked = isEndLocked(board, beforeRow, beforeCol, player);
                const endLocked = isEndLocked(board, afterRow, afterCol, player);

                // Xác định loại
                let type;
                let isOpen = false;

                if (!startLocked || !endLocked) {
                    type = 'OPEN_FIVE';  // 5 MỞ → THẮNG
                    isOpen = true;
                } else {
                    type = 'LOCKED_FIVE'; // 5 KHÓA → NỔ
                    isOpen = false;
                }

                sequences.push({
                    type,
                    isOpen,
                    isLocked: !isOpen,
                    cells: fiveCells,
                    direction: dir.name,
                    startLocked,
                    endLocked,
                    player
                });
            }
        }
    }

    return sequences;
}

/**
 * Kiểm tra và xử lý sau mỗi nước đi
 * Trả về kết quả:
 * - win: true nếu có 5 mở (thắng)
 * - explosions: mảng các dãy 5 khóa cần nổ
 * - explosionCount: số lượng dãy nổ
 */
export function checkAfterMove(board, row, col, player) {
    const sequences = findAllFiveSequences(board, row, col, player);

    // Phân loại
    const openFives = sequences.filter(seq => seq.isOpen);
    const lockedFives = sequences.filter(seq => seq.isLocked);

    // Nếu có 5 mở → THẮNG LUÔN
    if (openFives.length > 0) {
        return {
            win: true,
            winType: 'OPEN_FIVE',
            winningSequence: openFives[0], // Lấy dãy đầu tiên
            explosions: [],
            explosionCount: 0
        };
    }

    // Nếu chỉ có 5 khóa → NỔ
    if (lockedFives.length > 0) {
        return {
            win: false,
            winType: null,
            winningSequence: null,
            explosions: lockedFives,
            explosionCount: lockedFives.length
        };
    }

    // Không có 5 nào cả
    return {
        win: false,
        winType: null,
        winningSequence: null,
        explosions: [],
        explosionCount: 0
    };
}

/**
 * Thực hiện nổ: Xóa các quân trong các dãy 5 khóa
 * Trả về số lượng quân bị xóa và các vị trí
 */
export function executeExplosions(board, explosions) {
    const explodedCells = new Set();

    for (const explosion of explosions) {
        for (const cell of explosion.cells) {
            const key = `${cell.row},${cell.col}`;
            explodedCells.add(key);
        }
    }

    // Xóa các quân
    const positions = [];
    for (const key of explodedCells) {
        const [row, col] = key.split(',').map(Number);
        board[row][col] = null;
        positions.push({ row, col });
    }

    return {
        count: positions.length,
        positions,
        explosionCount: explosions.length
    };
}

/**
 * Tính điểm thưởng cho combo nổ
 * 1 dãy = 1 điểm
 * 2+ dãy = 3 điểm (combo bonus)
 */
export function calculateExplosionScore(explosionCount) {
    if (explosionCount === 0) return 0;
    if (explosionCount === 1) return 1;
    return 3; // Combo bonus!
}

/**
 * Kiểm tra điều kiện thắng bằng điểm nổ
 * (Tùy chọn: 5 điểm nổ = thắng)
 */
export function checkExplosionWin(xExplosionScore, oExplosionScore, threshold = 5) {
    if (xExplosionScore >= threshold) {
        return { win: true, winner: 'X', winType: 'EXPLOSION_SCORE' };
    }
    if (oExplosionScore >= threshold) {
        return { win: true, winner: 'O', winType: 'EXPLOSION_SCORE' };
    }
    return { win: false, winner: null, winType: null };
}

/**
 * Kiểm tra điều kiện hòa (hết chỗ đi)
 * Người nào nhiều điểm nổ hơn sẽ thắng
 */
export function checkDrawWithExplosionScore(board, xExplosionScore, oExplosionScore) {
    // Kiểm tra còn ô trống không
    let hasEmptyCell = false;
    for (let row = 0; row < BOARD_SIZE; row++) {
        for (let col = 0; col < BOARD_SIZE; col++) {
            if (board[row][col] === null) {
                hasEmptyCell = true;
                break;
            }
        }
        if (hasEmptyCell) break;
    }

    // Nếu hết chỗ
    if (!hasEmptyCell) {
        if (xExplosionScore > oExplosionScore) {
            return { draw: false, winner: 'X', winType: 'EXPLOSION_TIEBREAKER' };
        } else if (oExplosionScore > xExplosionScore) {
            return { draw: false, winner: 'O', winType: 'EXPLOSION_TIEBREAKER' };
        } else {
            return { draw: true, winner: null, winType: 'DRAW' };
        }
    }

    return { draw: false, winner: null, winType: null };
}
