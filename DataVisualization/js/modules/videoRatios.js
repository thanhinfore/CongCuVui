// ========================================
// Video Ratios Module - v3.0
// Platform-specific video dimensions and presets
// ========================================

export const VIDEO_RATIOS = {
    // YouTube Standard
    youtube_hd: {
        name: 'YouTube HD (16:9)',
        width: 1920,
        height: 1080,
        ratio: '16:9',
        platform: 'YouTube',
        icon: '📺',
        description: 'Standard YouTube video, desktop viewing',
        padding: { top: 180, right: 120, bottom: 120, left: 80 }
    },

    youtube_4k: {
        name: 'YouTube 4K (16:9)',
        width: 3840,
        height: 2160,
        ratio: '16:9',
        platform: 'YouTube',
        icon: '🎬',
        description: 'Ultra HD YouTube, maximum quality',
        padding: { top: 360, right: 240, bottom: 240, left: 160 }
    },

    // TikTok / Shorts
    tiktok: {
        name: 'TikTok/Shorts (9:16)',
        width: 1080,
        height: 1920,
        ratio: '9:16',
        platform: 'TikTok',
        icon: '📱',
        description: 'Vertical video for TikTok, YouTube Shorts, Reels',
        padding: { top: 200, right: 60, bottom: 200, left: 60 }
    },

    tiktok_hd: {
        name: 'TikTok HD (9:16)',
        width: 1440,
        height: 2560,
        ratio: '9:16',
        platform: 'TikTok',
        icon: '📱',
        description: 'Higher quality vertical video',
        padding: { top: 280, right: 80, bottom: 280, left: 80 }
    },

    // Instagram
    instagram_square: {
        name: 'Instagram Square (1:1)',
        width: 1080,
        height: 1080,
        ratio: '1:1',
        platform: 'Instagram',
        icon: '📷',
        description: 'Instagram feed posts',
        padding: { top: 120, right: 80, bottom: 120, left: 80 }
    },

    instagram_portrait: {
        name: 'Instagram Portrait (4:5)',
        width: 1080,
        height: 1350,
        ratio: '4:5',
        platform: 'Instagram',
        icon: '📸',
        description: 'Instagram vertical feed posts',
        padding: { top: 150, right: 80, bottom: 150, left: 80 }
    },

    instagram_story: {
        name: 'Instagram Story (9:16)',
        width: 1080,
        height: 1920,
        ratio: '9:16',
        platform: 'Instagram',
        icon: '📲',
        description: 'Instagram Stories and Reels',
        padding: { top: 200, right: 60, bottom: 200, left: 60 }
    },

    // Facebook
    facebook_landscape: {
        name: 'Facebook Landscape (16:9)',
        width: 1280,
        height: 720,
        ratio: '16:9',
        platform: 'Facebook',
        icon: '👥',
        description: 'Facebook video posts',
        padding: { top: 100, right: 80, bottom: 100, left: 60 }
    },

    facebook_square: {
        name: 'Facebook Square (1:1)',
        width: 1080,
        height: 1080,
        ratio: '1:1',
        platform: 'Facebook',
        icon: '👥',
        description: 'Facebook feed square video',
        padding: { top: 120, right: 80, bottom: 120, left: 80 }
    },

    // Twitter
    twitter_landscape: {
        name: 'Twitter Landscape (16:9)',
        width: 1280,
        height: 720,
        ratio: '16:9',
        platform: 'Twitter',
        icon: '🐦',
        description: 'Twitter/X video posts',
        padding: { top: 100, right: 80, bottom: 100, left: 60 }
    },

    // LinkedIn
    linkedin_landscape: {
        name: 'LinkedIn Landscape (16:9)',
        width: 1280,
        height: 720,
        ratio: '16:9',
        platform: 'LinkedIn',
        icon: '💼',
        description: 'Professional LinkedIn videos',
        padding: { top: 100, right: 80, bottom: 100, left: 60 }
    },

    linkedin_square: {
        name: 'LinkedIn Square (1:1)',
        width: 1080,
        height: 1080,
        ratio: '1:1',
        platform: 'LinkedIn',
        icon: '💼',
        description: 'LinkedIn feed square video',
        padding: { top: 120, right: 80, bottom: 120, left: 80 }
    },

    // Cinema / Ultra-wide
    cinema_21_9: {
        name: 'Cinema (21:9)',
        width: 2560,
        height: 1080,
        ratio: '21:9',
        platform: 'Cinema',
        icon: '🎥',
        description: 'Cinematic ultra-wide format',
        padding: { top: 120, right: 200, bottom: 120, left: 200 }
    },

    // Presentation
    presentation_4_3: {
        name: 'Presentation (4:3)',
        width: 1024,
        height: 768,
        ratio: '4:3',
        platform: 'Presentation',
        icon: '📊',
        description: 'Classic presentation/slide format',
        padding: { top: 100, right: 80, bottom: 100, left: 80 }
    },

    presentation_16_9: {
        name: 'Presentation (16:9)',
        width: 1920,
        height: 1080,
        ratio: '16:9',
        platform: 'Presentation',
        icon: '📊',
        description: 'Modern presentation format',
        padding: { top: 120, right: 100, bottom: 120, left: 100 }
    }
};

/**
 * Get ratio config by key
 * @param {string} key - Ratio key
 * @returns {Object} Ratio configuration
 */
export function getRatioConfig(key) {
    return VIDEO_RATIOS[key] || VIDEO_RATIOS.youtube_hd;
}

/**
 * Get all ratios grouped by platform
 * @returns {Object} Ratios grouped by platform
 */
export function getRatiosByPlatform() {
    const grouped = {};

    Object.entries(VIDEO_RATIOS).forEach(([key, config]) => {
        const platform = config.platform;
        if (!grouped[platform]) {
            grouped[platform] = [];
        }
        grouped[platform].push({ key, ...config });
    });

    return grouped;
}

/**
 * Calculate responsive font sizes based on resolution
 * @param {Object} ratioConfig - Ratio configuration
 * @returns {Object} Font size multipliers
 */
export function calculateFontSizes(ratioConfig) {
    const baseWidth = 1920; // Reference width (YouTube HD)
    const scale = ratioConfig.width / baseWidth;

    // Adjust for very tall/narrow formats
    const aspectScale = ratioConfig.width / ratioConfig.height;
    const aspectAdjustment = aspectScale > 1 ? 1 : aspectScale * 0.7 + 0.3;

    const finalScale = scale * aspectAdjustment;

    return {
        title: Math.max(28, 56 * finalScale),
        subtitle: Math.max(16, 28 * finalScale),
        entityLabel: Math.max(14, 26 * finalScale),
        axisTick: Math.max(12, 20 * finalScale),
        valueLabel: Math.max(14, 24 * finalScale),
        statsLabel: Math.max(10, 16 * finalScale),
        statsValue: Math.max(16, 28 * finalScale),
        periodLabel: Math.max(40, 80 * finalScale),
        rankIndicator: Math.max(16, 28 * finalScale),
        growthRate: Math.max(12, 20 * finalScale)
    };
}

/**
 * Calculate optimal layout for ratio
 * @param {Object} ratioConfig - Ratio configuration
 * @returns {Object} Layout configuration
 */
export function calculateLayout(ratioConfig) {
    const isVertical = ratioConfig.height > ratioConfig.width;
    const isSquare = Math.abs(ratioConfig.width - ratioConfig.height) < 100;
    const isUltraWide = ratioConfig.width / ratioConfig.height > 2;

    return {
        showStatsPanel: !isVertical || ratioConfig.height > 1600,
        statsPanelPosition: isVertical ? 'compact' : 'full',
        showGrowthRate: !isVertical && !isUltraWide,
        showRankIndicators: true,
        showValueLabels: true,
        periodLabelPosition: isVertical ? 'top' : 'bottom',
        barSpacing: isVertical ? 'compact' : 'normal',
        topNRecommended: isVertical ? 6 : (isUltraWide ? 12 : 8)
    };
}

/**
 * Platform-specific presets
 */
export const PLATFORM_PRESETS = {
    youtube: {
        name: 'YouTube Optimized',
        ratio: 'youtube_hd',
        fps: 60,
        periodLength: 1000,
        palette: 'vibrant',
        barStyle: 'gradient',
        showStatsPanel: true,
        showValueLabels: true,
        showRankIndicators: true,
        showGrowthRate: true,
        enableShadows: true
    },

    tiktok: {
        name: 'TikTok/Shorts Optimized',
        ratio: 'tiktok',
        fps: 30,
        periodLength: 800,
        palette: 'neon',
        barStyle: 'gradient',
        showStatsPanel: false, // Too cramped
        showValueLabels: true,
        showRankIndicators: true,
        showGrowthRate: false,
        enableShadows: true
    },

    instagram: {
        name: 'Instagram Feed',
        ratio: 'instagram_square',
        fps: 30,
        periodLength: 1000,
        palette: 'pastel',
        barStyle: 'gradient',
        showStatsPanel: true,
        showValueLabels: true,
        showRankIndicators: true,
        showGrowthRate: false,
        enableShadows: true
    },

    instagram_story: {
        name: 'Instagram Story/Reels',
        ratio: 'instagram_story',
        fps: 30,
        periodLength: 800,
        palette: 'sunset',
        barStyle: 'gradient',
        showStatsPanel: false,
        showValueLabels: true,
        showRankIndicators: true,
        showGrowthRate: false,
        enableShadows: true
    },

    presentation: {
        name: 'Professional Presentation',
        ratio: 'presentation_16_9',
        fps: 30,
        periodLength: 1500,
        palette: 'professional',
        barStyle: 'solid',
        showStatsPanel: true,
        showValueLabels: true,
        showRankIndicators: true,
        showGrowthRate: true,
        enableShadows: false
    }
};

/**
 * Get preset configuration
 * @param {string} presetKey - Preset key
 * @returns {Object} Complete configuration
 */
export function getPresetConfig(presetKey) {
    const preset = PLATFORM_PRESETS[presetKey];
    if (!preset) return null;

    const ratioConfig = getRatioConfig(preset.ratio);
    const fontSizes = calculateFontSizes(ratioConfig);
    const layout = calculateLayout(ratioConfig);

    return {
        ...preset,
        ...ratioConfig,
        fontSizes,
        layout
    };
}
