/**
 * Contact Map v7.5 - Command Palette UI
 */

import { commandPaletteState, refs } from '../core/state.js';
import { getLayerById } from '../core/graph.js';
import { getInitials, highlightMatch } from '../utils/helpers.js';
import { showToast } from '../utils/toast.js';

/**
 * Open command palette
 */
export function openCommandPalette() {
    const palette = document.getElementById('command-palette');
    const input = document.getElementById('command-input');
    if (!palette) return;

    commandPaletteState.isOpen = true;
    commandPaletteState.selectedIndex = 0;
    palette.classList.remove('hidden');
    input.value = '';
    input.focus();
    updateCommandResults('');
}

/**
 * Close command palette
 */
export function closeCommandPalette() {
    const palette = document.getElementById('command-palette');
    if (palette) {
        palette.classList.add('hidden');
        commandPaletteState.isOpen = false;
    }
}

/**
 * Toggle command palette
 */
export function toggleCommandPalette() {
    if (commandPaletteState.isOpen) {
        closeCommandPalette();
    } else {
        openCommandPalette();
    }
}

/**
 * Update command results based on query
 */
export function updateCommandResults(query) {
    const graph = refs.graph;
    const contactsSection = document.querySelector('.command-contacts-section');
    const contactsList = document.getElementById('command-contacts-list');
    const actionsSection = document.querySelector('.command-section:not(.command-contacts-section)');

    if (!query.trim()) {
        if (actionsSection) actionsSection.style.display = 'block';
        if (contactsSection) contactsSection.classList.add('hidden');
        commandPaletteState.items = Array.from(document.querySelectorAll('.command-item[data-action]'));
        updateCommandSelection();
        return;
    }

    // Search contacts
    const lowerQuery = query.toLowerCase();
    const matchingNodes = [];

    graph.forEachNode((nodeId, attrs) => {
        const label = (attrs.label || '').toLowerCase();
        const contact = attrs.contact || {};
        const company = (contact.company || '').toLowerCase();
        const phone = (contact.phone || '').toLowerCase();

        if (label.includes(lowerQuery) || company.includes(lowerQuery) || phone.includes(lowerQuery)) {
            matchingNodes.push({
                nodeId,
                attrs,
                score: label.startsWith(lowerQuery) ? 1 : 0
            });
        }
    });

    matchingNodes.sort((a, b) => b.score - a.score);
    const topResults = matchingNodes.slice(0, 8);

    if (topResults.length > 0) {
        if (actionsSection) actionsSection.style.display = 'none';
        if (contactsSection) contactsSection.classList.remove('hidden');

        contactsList.innerHTML = topResults.map(({ nodeId, attrs }) => {
            const layer = getLayerById(attrs.layer);
            const contact = attrs.contact || {};
            const meta = contact.company || contact.phone || layer.name;
            return `
                <div class="command-item" data-node-id="${nodeId}">
                    <div class="command-contact">
                        <div class="avatar" style="background:${layer.color}">${getInitials(attrs.label)}</div>
                        <div class="info">
                            <div class="name">${highlightMatch(attrs.label, query)}</div>
                            <div class="meta">${meta}</div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        commandPaletteState.items = Array.from(contactsList.querySelectorAll('.command-item'));
    } else {
        if (actionsSection) actionsSection.style.display = 'block';
        if (contactsSection) contactsSection.classList.add('hidden');
        commandPaletteState.items = Array.from(document.querySelectorAll('.command-item[data-action]'));
    }

    commandPaletteState.selectedIndex = 0;
    updateCommandSelection();
}

/**
 * Update visual selection in command palette
 */
export function updateCommandSelection() {
    commandPaletteState.items.forEach((item, i) => {
        item.classList.toggle('selected', i === commandPaletteState.selectedIndex);
    });

    const selected = commandPaletteState.items[commandPaletteState.selectedIndex];
    if (selected) {
        selected.scrollIntoView({ block: 'nearest' });
    }
}

/**
 * Execute selected command item
 */
export function executeCommandItem(item, callbacks = {}) {
    if (!item) return;

    const action = item.dataset.action;
    const nodeId = item.dataset.nodeId;

    closeCommandPalette();

    if (nodeId && callbacks.onSelectNode) {
        callbacks.onSelectNode(nodeId);
    } else if (action && callbacks.onAction) {
        callbacks.onAction(action);
    }
}

/**
 * Navigate command palette with keyboard
 */
export function navigateCommand(direction) {
    const items = commandPaletteState.items;
    if (direction === 'down') {
        commandPaletteState.selectedIndex = Math.min(
            commandPaletteState.selectedIndex + 1,
            items.length - 1
        );
    } else if (direction === 'up') {
        commandPaletteState.selectedIndex = Math.max(
            commandPaletteState.selectedIndex - 1,
            0
        );
    }
    updateCommandSelection();
}

/**
 * Setup command palette event handlers
 */
export function setupCommandPalette(callbacks = {}) {
    const palette = document.getElementById('command-palette');
    const input = document.getElementById('command-input');
    const backdrop = document.querySelector('.command-palette-backdrop');

    if (!palette) return;

    input?.addEventListener('input', (e) => {
        updateCommandResults(e.target.value);
    });

    input?.addEventListener('keydown', (e) => {
        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                navigateCommand('down');
                break;
            case 'ArrowUp':
                e.preventDefault();
                navigateCommand('up');
                break;
            case 'Enter':
                e.preventDefault();
                executeCommandItem(commandPaletteState.items[commandPaletteState.selectedIndex], callbacks);
                break;
            case 'Escape':
                closeCommandPalette();
                break;
        }
    });

    backdrop?.addEventListener('click', closeCommandPalette);

    document.getElementById('command-results')?.addEventListener('click', (e) => {
        const item = e.target.closest('.command-item');
        if (item) executeCommandItem(item, callbacks);
    });
}
