/**
 * UI Controller - v12.0 Excellence Edition
 * Handles collapsible sections and UI interactions
 */

export class UIController {
    constructor() {
        this.init();
    }

    init() {
        this.setupCollapsibleSections();
    }

    /**
     * Setup collapsible sections functionality
     */
    setupCollapsibleSections() {
        // Get all section headers
        const sectionHeaders = document.querySelectorAll('.section-header');

        sectionHeaders.forEach(header => {
            header.addEventListener('click', (e) => {
                // Get the parent section
                const section = header.closest('.section');
                const toggle = header.querySelector('.section-toggle');

                // Toggle collapsed class
                section.classList.toggle('collapsed');

                // Update toggle icon
                if (section.classList.contains('collapsed')) {
                    toggle.textContent = '+';
                } else {
                    toggle.textContent = '−';
                }
            });

            // Add hover effect cursor
            header.style.cursor = 'pointer';
        });

        console.log('✨ v12.0: Collapsible sections initialized');
    }

    /**
     * Collapse a specific section by selector
     * @param {string} selector - CSS selector for the section
     */
    collapseSection(selector) {
        const section = document.querySelector(selector);
        if (section) {
            section.classList.add('collapsed');
            const toggle = section.querySelector('.section-toggle');
            if (toggle) toggle.textContent = '+';
        }
    }

    /**
     * Expand a specific section by selector
     * @param {string} selector - CSS selector for the section
     */
    expandSection(selector) {
        const section = document.querySelector(selector);
        if (section) {
            section.classList.remove('collapsed');
            const toggle = section.querySelector('.section-toggle');
            if (toggle) toggle.textContent = '−';
        }
    }

    /**
     * Collapse all sections
     */
    collapseAll() {
        const sections = document.querySelectorAll('.section');
        sections.forEach(section => {
            section.classList.add('collapsed');
            const toggle = section.querySelector('.section-toggle');
            if (toggle) toggle.textContent = '+';
        });
    }

    /**
     * Expand all sections
     */
    expandAll() {
        const sections = document.querySelectorAll('.section');
        sections.forEach(section => {
            section.classList.remove('collapsed');
            const toggle = section.querySelector('.section-toggle');
            if (toggle) toggle.textContent = '−';
        });
    }
}
