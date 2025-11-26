/**
 * Contact Map v7.5 - Configuration
 * All constants and default configurations
 */

// Default layers/tags for categorizing contacts
export const DEFAULT_LAYERS = [
    { id: 'family', name: 'Gia đình', color: '#E53935' },
    { id: 'work', name: 'Công việc', color: '#1E88E5' },
    { id: 'friends', name: 'Bạn bè', color: '#43A047' },
    { id: 'acquaintances', name: 'Quen biết', color: '#FB8C00' },
    { id: 'others', name: 'Khác', color: '#757575' }
];

// Edge/relationship types with colors
export const EDGE_TYPES = {
    family: { color: '#E53935', label: 'Gia đình' },
    spouse: { color: '#D81B60', label: 'Vợ/Chồng' },
    friend: { color: '#3949AB', label: 'Bạn bè' },
    colleague: { color: '#1E88E5', label: 'Đồng nghiệp' },
    mentor: { color: '#8E24AA', label: 'Thầy/Trò' },
    partner: { color: '#00ACC1', label: 'Đối tác' },
    other: { color: '#757575', label: 'Khác' }
};

// Drag configuration for node interactions
export const DRAG_CONFIG = {
    MOVE_THRESHOLD: 5,
    TIME_THRESHOLD: 200
};

// Graph rendering settings
export const GRAPH_SETTINGS = {
    defaultNodeSize: 10,
    defaultEdgeSize: 2,
    minNodeSize: 5,
    maxNodeSize: 20,
    labelDensity: 0.07,
    labelGridCellSize: 60,
    labelRenderedSizeThreshold: 6
};

// Storage keys
export const STORAGE_KEYS = {
    GRAPH_DATA: 'sgraph-data',
    THEME: 'contactmap-theme',
    WELCOMED: 'contactmap-welcomed'
};

// App info
export const APP_INFO = {
    name: 'Contact Map',
    version: '7.5',
    description: 'Bản đồ Quan hệ'
};
