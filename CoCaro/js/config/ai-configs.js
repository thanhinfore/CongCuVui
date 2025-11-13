// ================================
// CỜ CARO 10.0 - AI CONFIGURATIONS
// Version: 10.0.0
// AI Difficulty & Personality Settings
// ================================

/**
 * AI Difficulty Configuration
 * Defines search depth, think time, and features for each difficulty level
 */
export const AI_CONFIGS = {
    easy: {
        depth: 1,
        searchWidth: 5,
        randomness: 0.3,
        evaluationMultiplier: 0.3,
        thinkTime: 500
    },
    medium: {
        depth: 2,
        searchWidth: 10,
        randomness: 0.15,
        evaluationMultiplier: 0.6,
        thinkTime: 800
    },
    hard: {
        depth: 3,
        searchWidth: 15,
        randomness: 0.05,
        evaluationMultiplier: 0.85,
        thinkTime: 1200
    },
    grandmaster: {
        depth: 4,
        vctDepth: 12,  // VCT search depth
        vcfDepth: 10,  // VCF search depth
        searchWidth: 25,
        randomness: 0,
        evaluationMultiplier: 1.0,
        thinkTime: 1500
    },
    supreme: {
        // Core search parameters
        depth: 5,           // V9.0: Increased for Grandmaster level
        vctDepth: 14,       // V9.0: Enhanced threat search
        vcfDepth: 12,       // V9.0: Stronger forcing
        searchWidth: 25,    // V9.0: Wider for better tactics
        randomness: 0,
        evaluationMultiplier: 1.0,

        // Performance settings
        useGPU: true,       // Smart GPU usage
        useNeuralNet: true, // Neural network with caching
        progressiveDeepening: true,
        maxThinkTime: 5000, // V9.1: Extended for MCTS (from 4000ms)
        earlyGameDepth: 4,  // V9.0: Professional opening

        // V8.0 features
        multiThreatDetection: true,
        criticalMoveDetection: true,
        advancedPatterns: true,

        // V9.0 features
        useOpeningBook: true,        // Professional opening database
        useThreatSpaceSearch: true,  // Renju threat space search
        useEndgameTablebase: true,   // Perfect endgame play
        useRenjuCombinations: true,  // 3-3, 4-4, 4-3 detection
        usePatternsV9: true,         // 53 professional patterns

        // V9.1 ADVANCED features
        useRealNN: true,             // V9.1: Real neural network training
        useMCTS: true,               // V9.1: Monte Carlo Tree Search
        mctsSimulations: 100,        // V9.1: MCTS simulation count
        usePersistentLearning: true, // V9.1: IndexedDB learning
        useAdaptiveStrategy: true,   // V9.1: Adapt to player style

        thinkTime: 1500
    }
};

/**
 * AI Personality Configuration
 * Defines how aggressive/defensive the AI plays
 */
export const AI_PERSONALITIES = {
    aggressive: {
        name: 'Tấn công',
        attackMultiplier: 1.5,
        defenseMultiplier: 0.7,
        riskTaking: 0.8,
        preferOpenings: true
    },
    defensive: {
        name: 'Phòng thủ',
        attackMultiplier: 0.7,
        defenseMultiplier: 1.8,
        riskTaking: 0.2,
        preferOpenings: false
    },
    balanced: {
        name: 'Cân bằng',
        attackMultiplier: 1.0,
        defenseMultiplier: 1.0,
        riskTaking: 0.5,
        preferOpenings: true
    }
};

/**
 * Search Control Parameters
 * Fine-tune AI search behavior based on game state
 */
export const SEARCH_CONTROL = {
    maxEmptyCellsForVCT: 150,   // Run VCT if board has < 150 empty cells (67% full)
    maxEmptyCellsForVCF: 175,   // Run VCF if board has < 175 empty cells (78% full)
    earlyGameMoveLimit: 6,      // Use opening book for first 6 moves only
    minThreatsForVCT: 1,        // Minimum threats needed to trigger VCT
    useSmartOpeningBook: true   // Use intelligent opening book with tactical evaluation
};

/**
 * Cache Configuration
 * AI performance optimization settings
 */
export const AI_CACHE = {
    evaluationCache: new Map(),    // Cache board evaluations
    patternCache: new Map(),       // Cache detected patterns
    moveOrderingCache: new Map(),  // Cache move ordering
    lastBoardHash: null,           // Track board changes
    lastEvaluation: null,          // Last evaluation result
    cacheHits: 0,                  // Statistics
    cacheMisses: 0
};
