/**
 * Contact Map v7.5 - Theme Module
 */

import { STORAGE_KEYS } from '../core/config.js';
import { showToast } from '../utils/toast.js';

/**
 * Initialize theme from storage or system preference
 */
export function initTheme() {
    const savedTheme = localStorage.getItem(STORAGE_KEYS.THEME);
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const theme = savedTheme || (prefersDark ? 'dark' : 'light');

    setTheme(theme);

    // Listen for system theme changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        if (!localStorage.getItem(STORAGE_KEYS.THEME)) {
            setTheme(e.matches ? 'dark' : 'light');
        }
    });
}

/**
 * Set the current theme
 */
export function setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    updateThemeIcon(theme);
}

/**
 * Toggle between light and dark theme
 */
export function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

    localStorage.setItem(STORAGE_KEYS.THEME, newTheme);
    setTheme(newTheme);
    showToast(`Chế độ ${newTheme === 'dark' ? 'tối' : 'sáng'}`, 'info');
}

/**
 * Update theme toggle icon
 */
export function updateThemeIcon(theme) {
    const themeIcon = document.getElementById('theme-icon');
    if (themeIcon) {
        themeIcon.className = theme === 'dark' ? 'fas fa-moon' : 'fas fa-sun';
    }
}

/**
 * Get current theme
 */
export function getCurrentTheme() {
    return document.documentElement.getAttribute('data-theme') || 'light';
}

/**
 * Setup theme toggle button
 */
export function setupThemeToggle() {
    const btnThemeToggle = document.getElementById('btn-theme-toggle');
    if (btnThemeToggle) {
        btnThemeToggle.addEventListener('click', toggleTheme);
    }
}
