/**
 * Contact Map v7.5 - Keyboard Shortcuts
 */

import { commandPaletteState, multiSelectState } from '../core/state.js';
import { toggleCommandPalette, closeCommandPalette } from './commandPalette.js';
import { selectAllNodes, clearSelection, bulkDelete } from './multiSelect.js';

/**
 * Setup global keyboard shortcuts
 */
export function setupKeyboardShortcuts(callbacks = {}) {
    document.addEventListener('keydown', (e) => {
        // Don't trigger when typing in inputs (except ESC)
        const isTyping = e.target.tagName === 'INPUT' ||
                         e.target.tagName === 'TEXTAREA' ||
                         e.target.tagName === 'SELECT';

        if (isTyping && e.key !== 'Escape') return;

        // Ctrl+K or Cmd+K - Command Palette
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            toggleCommandPalette();
            return;
        }

        // Don't process other shortcuts if command palette is open
        if (commandPaletteState.isOpen) return;

        // N - Add new person
        if (e.key === 'n' && !e.ctrlKey && !e.metaKey) {
            e.preventDefault();
            if (callbacks.onAddPerson) callbacks.onAddPerson();
            return;
        }

        // / - Focus search
        if (e.key === '/') {
            e.preventDefault();
            document.getElementById('search-input')?.focus();
            return;
        }

        // Ctrl+A - Select all
        if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
            e.preventDefault();
            selectAllNodes();
            return;
        }

        // ESC - Close/deselect
        if (e.key === 'Escape') {
            if (commandPaletteState.isOpen) {
                closeCommandPalette();
            } else if (multiSelectState.selectedNodes.size > 0) {
                clearSelection();
            } else if (callbacks.onEscape) {
                callbacks.onEscape();
            }
            return;
        }

        // Delete/Backspace - Delete selected
        if ((e.key === 'Delete' || e.key === 'Backspace') && multiSelectState.selectedNodes.size > 0) {
            e.preventDefault();
            const deleted = bulkDelete();
            if (deleted && callbacks.onDelete) {
                callbacks.onDelete(deleted);
            }
            return;
        }

        // ? - Show help
        if (e.key === '?' && e.shiftKey) {
            e.preventDefault();
            if (callbacks.onHelp) callbacks.onHelp();
            return;
        }
    });
}

/**
 * Get list of available keyboard shortcuts
 */
export function getKeyboardShortcuts() {
    return [
        { key: 'Ctrl+K', description: 'Mở Command Palette' },
        { key: 'N', description: 'Thêm người mới' },
        { key: '/', description: 'Tìm kiếm' },
        { key: 'Ctrl+A', description: 'Chọn tất cả' },
        { key: 'ESC', description: 'Đóng / Bỏ chọn' },
        { key: 'Delete', description: 'Xóa đã chọn' },
        { key: 'Ctrl+Click', description: 'Chọn nhiều nodes' },
        { key: 'Shift+Click', description: 'Thêm vào selection' }
    ];
}
