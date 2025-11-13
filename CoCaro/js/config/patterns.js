// ================================
// CỜ CARO 10.0 - PATTERN DATABASE
// Version: 10.0.0
// Professional Gomoku/Renju Patterns & Opening Book
// ================================

/**
 * V9.0 Professional Pattern Database (53 Patterns)
 * Patterns from professional Gomoku/Renju games with optimized scoring
 */
export const PATTERNS_V9 = {
    // ========== WINNING PATTERNS (10M+) ==========
    FIVE: { score: 10000000, pattern: [1,1,1,1,1], name: 'Five in a row' },

    // ========== CRITICAL THREATS (1M-6M) - Must respond immediately ==========
    OPEN_FOUR: { score: 5000000, pattern: [0,1,1,1,1,0], name: 'Open Four' },
    FOUR: { score: 2500000, pattern: [1,1,1,1], name: 'Four' },
    BROKEN_FOUR_A: { score: 2200000, pattern: [0,1,1,0,1,1,0], name: 'Broken Four A' },
    BROKEN_FOUR_B: { score: 2000000, pattern: [0,1,0,1,1,1,0], name: 'Broken Four B' },
    BROKEN_FOUR_C: { score: 1800000, pattern: [0,1,1,1,0,1,0], name: 'Broken Four C' },

    // ========== DOUBLE THREATS (800K-1.5M) - Very strong ==========
    DOUBLE_OPEN_THREE: { score: 1500000, name: 'Double Open Three' },
    DOUBLE_THREE: { score: 1200000, name: 'Double Three' },
    FOUR_THREE: { score: 1800000, name: 'Four-Three Combination' },
    THREE_THREE: { score: 900000, name: 'Three-Three (Renju forbidden)' },

    // ========== OPEN THREES (400K-600K) - Strong attacks ==========
    OPEN_THREE: { score: 500000, pattern: [0,1,1,1,0], name: 'Open Three' },
    BROKEN_THREE_A: { score: 450000, pattern: [0,1,1,0,1,0], name: 'Broken Three A' },
    BROKEN_THREE_B: { score: 420000, pattern: [0,1,0,1,1,0], name: 'Broken Three B' },
    BROKEN_THREE_C: { score: 400000, pattern: [0,1,0,1,0,1,0], name: 'Broken Three C' },
    BROKEN_THREE_D: { score: 380000, pattern: [0,1,1,0,0,1,0], name: 'Broken Three D' },

    // ========== SEMI-OPEN THREES (80K-200K) - Medium threats ==========
    SEMI_OPEN_THREE: { score: 150000, pattern: [1,1,1,0], name: 'Semi-open Three' },
    SEMI_OPEN_THREE_REV: { score: 150000, pattern: [0,1,1,1], name: 'Semi-open Three Rev' },
    SEMI_BROKEN_THREE_A: { score: 120000, pattern: [1,1,0,1,0], name: 'Semi-broken Three A' },
    SEMI_BROKEN_THREE_B: { score: 100000, pattern: [1,0,1,1,0], name: 'Semi-broken Three B' },
    SEMI_BROKEN_THREE_C: { score: 90000, pattern: [0,1,0,1,1], name: 'Semi-broken Three C' },

    // ========== OPEN TWOS (30K-60K) - Building attacks ==========
    OPEN_TWO: { score: 50000, pattern: [0,1,1,0], name: 'Open Two' },
    BROKEN_TWO_A: { score: 40000, pattern: [0,1,0,1,0], name: 'Broken Two A' },
    BROKEN_TWO_B: { score: 35000, pattern: [0,1,0,0,1,0], name: 'Broken Two B' },
    BROKEN_TWO_C: { score: 30000, pattern: [0,0,1,1,0,0], name: 'Broken Two C' },
    STRETCHED_TWO: { score: 38000, pattern: [0,1,0,0,0,1,0], name: 'Stretched Two' },

    // ========== SEMI-OPEN TWOS (8K-20K) - Early development ==========
    SEMI_OPEN_TWO: { score: 18000, pattern: [1,1,0], name: 'Semi-open Two' },
    SEMI_OPEN_TWO_REV: { score: 18000, pattern: [0,1,1], name: 'Semi-open Two Rev' },
    SEMI_BROKEN_TWO_A: { score: 12000, pattern: [1,0,1,0], name: 'Semi-broken Two A' },
    SEMI_BROKEN_TWO_B: { score: 10000, pattern: [0,1,0,1], name: 'Semi-broken Two B' },

    // ========== ADVANCED TACTICAL PATTERNS ==========
    // Renju-specific patterns
    SWORD: { score: 650000, name: 'Sword (VCT pattern)' },
    BROKEN_SWORD: { score: 550000, name: 'Broken Sword' },
    FLOWER_FOUR: { score: 480000, name: 'Flower Four' },
    DOUBLE_SWORD: { score: 1300000, name: 'Double Sword (deadly)' },

    // VCF patterns
    VCF_CHAIN_4: { score: 2800000, name: 'VCF Chain (4 moves)' },
    VCF_CHAIN_3: { score: 1600000, name: 'VCF Chain (3 moves)' },
    VCF_POTENTIAL: { score: 700000, name: 'VCF Potential' },

    // Combination patterns
    OPEN_TWO_PLUS_THREE: { score: 600000, name: 'Open Two + Three' },
    DOUBLE_BROKEN_THREE: { score: 850000, name: 'Double Broken Three' },
    TRIPLE_TWO: { score: 320000, name: 'Triple Two' },

    // Defensive patterns
    BLOCK_OPEN_FOUR: { score: 6000000, name: 'Block Open Four' },
    BLOCK_FOUR: { score: 3000000, name: 'Block Four' },
    BLOCK_DOUBLE_THREE: { score: 1800000, name: 'Block Double Three' },
    BLOCK_OPEN_THREE: { score: 800000, name: 'Block Open Three' },
    BLOCK_SWORD: { score: 900000, name: 'Block Sword' },

    // Positional patterns
    CENTER_CONTROL: { score: 5000, name: 'Center Control' },
    CORNER_CONTROL: { score: 3000, name: 'Corner Control' },
    EDGE_CONTROL: { score: 2000, name: 'Edge Control' },
    FORK_POSITION: { score: 400000, name: 'Fork Position' },
    PIN_POSITION: { score: 350000, name: 'Pin Position' },

    // Connection patterns
    CONNECTED_THREE: { score: 280000, name: 'Connected Three' },
    CONNECTED_TWO: { score: 45000, name: 'Connected Two' },
    BRIDGE: { score: 60000, name: 'Bridge Connection' },
    JUMP: { score: 35000, name: 'Jump Connection' },

    // ========== EARLY GAME PATTERNS ==========
    DIAGONAL_START: { score: 8000, name: 'Diagonal Opening' },
    STRAIGHT_START: { score: 7000, name: 'Straight Opening' },
    STAR_POINT: { score: 10000, name: 'Star Point (Tengen)' },
};

/**
 * V9.0 Professional Opening Book Database (24 Openings)
 * Categorized by personality: aggressive, balanced, defensive
 */
export const OPENING_BOOK_V9 = {
    // Opening book enabled moves (first 5-7 moves)
    enabled: true,
    maxDepth: 7, // Use opening book for first 7 moves

    // AGGRESSIVE OPENINGS (Tấn công) - 8 openings
    aggressive: [
        // Direct Center Attack (most aggressive)
        { name: 'Direct Center', moves: [
            {row: 7, col: 7}, {row: 6, col: 6}, {row: 8, col: 8}, {row: 5, col: 5}, {row: 9, col: 9}
        ], score: 1000 },
        // Diagonal Sword
        { name: 'Diagonal Sword', moves: [
            {row: 7, col: 7}, {row: 6, col: 8}, {row: 5, col: 9}, {row: 6, col: 7}, {row: 8, col: 6}
        ], score: 950 },
        // Double Wing Attack
        { name: 'Double Wing', moves: [
            {row: 7, col: 7}, {row: 6, col: 6}, {row: 8, col: 7}, {row: 7, col: 6}, {row: 7, col: 9}
        ], score: 920 },
        // Diagonal Assault
        { name: 'Diagonal Assault', moves: [
            {row: 7, col: 7}, {row: 8, col: 8}, {row: 6, col: 6}, {row: 9, col: 9}, {row: 5, col: 5}
        ], score: 900 },
        // Corner Expansion
        { name: 'Corner Expansion', moves: [
            {row: 7, col: 7}, {row: 6, col: 8}, {row: 8, col: 6}, {row: 9, col: 5}, {row: 5, col: 9}
        ], score: 880 },
        // Lightning Strike
        { name: 'Lightning Strike', moves: [
            {row: 7, col: 7}, {row: 7, col: 8}, {row: 7, col: 6}, {row: 7, col: 9}, {row: 7, col: 5}
        ], score: 860 },
        // Cross Attack
        { name: 'Cross Attack', moves: [
            {row: 7, col: 7}, {row: 8, col: 7}, {row: 6, col: 7}, {row: 7, col: 8}, {row: 7, col: 6}
        ], score: 840 },
        // Flower Formation
        { name: 'Flower Formation', moves: [
            {row: 7, col: 7}, {row: 6, col: 7}, {row: 7, col: 8}, {row: 8, col: 7}, {row: 7, col: 6}
        ], score: 820 }
    ],

    // BALANCED OPENINGS (Cân bằng) - 8 openings
    balanced: [
        // Standard Center
        { name: 'Standard Center', moves: [
            {row: 7, col: 7}, {row: 6, col: 6}, {row: 7, col: 8}, {row: 8, col: 7}, {row: 6, col: 8}
        ], score: 1000 },
        // Symmetrical Development
        { name: 'Symmetrical Dev', moves: [
            {row: 7, col: 7}, {row: 6, col: 7}, {row: 8, col: 7}, {row: 7, col: 6}, {row: 7, col: 8}
        ], score: 980 },
        // Star Formation
        { name: 'Star Formation', moves: [
            {row: 7, col: 7}, {row: 6, col: 6}, {row: 8, col: 8}, {row: 6, col: 8}, {row: 8, col: 6}
        ], score: 960 },
        // Box Control
        { name: 'Box Control', moves: [
            {row: 7, col: 7}, {row: 6, col: 7}, {row: 7, col: 6}, {row: 8, col: 7}, {row: 7, col: 8}
        ], score: 940 },
        // Knight's Move
        { name: "Knight's Move", moves: [
            {row: 7, col: 7}, {row: 6, col: 8}, {row: 8, col: 6}, {row: 7, col: 9}, {row: 7, col: 5}
        ], score: 920 },
        // Diamond Shape
        { name: 'Diamond Shape', moves: [
            {row: 7, col: 7}, {row: 6, col: 7}, {row: 8, col: 7}, {row: 7, col: 6}, {row: 7, col: 8}
        ], score: 900 },
        // Windmill
        { name: 'Windmill', moves: [
            {row: 7, col: 7}, {row: 6, col: 8}, {row: 8, col: 8}, {row: 8, col: 6}, {row: 6, col: 6}
        ], score: 880 },
        // Central Control
        { name: 'Central Control', moves: [
            {row: 7, col: 7}, {row: 7, col: 8}, {row: 7, col: 6}, {row: 8, col: 7}, {row: 6, col: 7}
        ], score: 860 }
    ],

    // DEFENSIVE OPENINGS (Phòng thủ) - 8 openings
    defensive: [
        // Solid Wall
        { name: 'Solid Wall', moves: [
            {row: 7, col: 7}, {row: 7, col: 8}, {row: 7, col: 6}, {row: 6, col: 7}, {row: 8, col: 7}
        ], score: 1000 },
        // Fortress
        { name: 'Fortress', moves: [
            {row: 7, col: 7}, {row: 6, col: 6}, {row: 6, col: 7}, {row: 6, col: 8}, {row: 7, col: 6}
        ], score: 980 },
        // Turtle Defense
        { name: 'Turtle Defense', moves: [
            {row: 7, col: 7}, {row: 6, col: 7}, {row: 7, col: 6}, {row: 6, col: 6}, {row: 7, col: 8}
        ], score: 960 },
        // Shield Formation
        { name: 'Shield Formation', moves: [
            {row: 7, col: 7}, {row: 7, col: 8}, {row: 7, col: 6}, {row: 8, col: 7}, {row: 6, col: 7}
        ], score: 940 },
        // Iron Defense
        { name: 'Iron Defense', moves: [
            {row: 7, col: 7}, {row: 8, col: 7}, {row: 6, col: 7}, {row: 7, col: 8}, {row: 7, col: 6}
        ], score: 920 },
        // Defensive Box
        { name: 'Defensive Box', moves: [
            {row: 7, col: 7}, {row: 6, col: 6}, {row: 7, col: 6}, {row: 6, col: 7}, {row: 7, col: 8}
        ], score: 900 },
        // Corner Guard
        { name: 'Corner Guard', moves: [
            {row: 7, col: 7}, {row: 6, col: 6}, {row: 6, col: 7}, {row: 7, col: 6}, {row: 8, col: 8}
        ], score: 880 },
        // Protective Circle
        { name: 'Protective Circle', moves: [
            {row: 7, col: 7}, {row: 6, col: 7}, {row: 8, col: 7}, {row: 7, col: 6}, {row: 7, col: 8}
        ], score: 860 }
    ],

    // Response database: best responses to opponent's moves
    responses: new Map([
        // If opponent plays near center, respond with counter-control
        ['7,6', [{row: 7, col: 8}, {row: 6, col: 6}, {row: 8, col: 6}]],
        ['7,8', [{row: 7, col: 6}, {row: 6, col: 8}, {row: 8, col: 8}]],
        ['6,7', [{row: 8, col: 7}, {row: 6, col: 6}, {row: 6, col: 8}]],
        ['8,7', [{row: 6, col: 7}, {row: 8, col: 6}, {row: 8, col: 8}]],
        // Diagonal responses
        ['6,6', [{row: 8, col: 8}, {row: 7, col: 6}, {row: 6, col: 7}]],
        ['8,8', [{row: 6, col: 6}, {row: 7, col: 8}, {row: 8, col: 7}]],
        ['6,8', [{row: 8, col: 6}, {row: 7, col: 8}, {row: 6, col: 7}]],
        ['8,6', [{row: 6, col: 8}, {row: 7, col: 6}, {row: 8, col: 7}]]
    ])
};
