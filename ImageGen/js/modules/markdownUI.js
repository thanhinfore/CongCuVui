/* =====================================================
   MARKDOWNUI.JS - Markdown Editor UI Handler
   ===================================================== */

import { markdownParser } from './markdownParser.js';
import { utils } from './utils.js';

export class MarkdownUI {
    constructor(DOM) {
        this.DOM = DOM;
        this.currentTab = 'edit';
        this.debounceTimer = null;
        this.init();
    }

    init() {
        this.setupEditorTabs();
        this.setupMarkdownHelp();
        this.setupPreviewUpdater();
        console.log('Markdown UI initialized');
    }

    setupEditorTabs() {
        const tabs = document.querySelectorAll('.editor-tab');
        const textarea = this.DOM.textInput;
        const previewPanel = document.getElementById('markdownPreview');

        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const tabName = tab.dataset.tab;
                this.switchTab(tabName, tabs, textarea, previewPanel);
            });
        });
    }

    switchTab(tabName, tabs, textarea, previewPanel) {
        this.currentTab = tabName;

        // Update tab buttons
        tabs.forEach(t => {
            if (t.dataset.tab === tabName) {
                t.classList.add('active');
            } else {
                t.classList.remove('active');
            }
        });

        // Show/hide panels
        if (tabName === 'edit') {
            textarea.style.display = 'block';
            previewPanel.style.display = 'none';
        } else if (tabName === 'preview') {
            textarea.style.display = 'none';
            previewPanel.style.display = 'block';
            this.updatePreview();
        }
    }

    setupMarkdownHelp() {
        const helpBtn = document.getElementById('markdownHelpBtn');
        const modal = document.getElementById('markdownHelpModal');

        if (helpBtn && modal) {
            helpBtn.addEventListener('click', () => {
                modal.style.display = 'flex';
            });

            // Close on background click
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.style.display = 'none';
                }
            });

            // ESC key to close
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && modal.style.display === 'flex') {
                    modal.style.display = 'none';
                }
            });
        }
    }

    setupPreviewUpdater() {
        const textarea = this.DOM.textInput;

        if (textarea) {
            textarea.addEventListener('input', () => {
                // Debounce preview update
                clearTimeout(this.debounceTimer);
                this.debounceTimer = setTimeout(() => {
                    if (this.currentTab === 'preview') {
                        this.updatePreview();
                    }
                }, 300);
            });
        }
    }

    updatePreview() {
        const textarea = this.DOM.textInput;
        const previewPanel = document.getElementById('markdownPreview');

        if (!textarea || !previewPanel) return;

        const text = textarea.value.trim();
        const previewContent = previewPanel.querySelector('.preview-content');

        if (!text) {
            previewContent.innerHTML = '<p style="color: var(--color-text-secondary); font-style: italic;">Your preview will appear here...</p>';
            return;
        }

        // Parse text with title:subtitle support
        const html = this.renderMarkdownToHTML(text);
        previewContent.innerHTML = html;
    }

    renderMarkdownToHTML(text) {
        let html = '<div class="markdown-preview-result">';

        // Split by colon for title:subtitle
        const parts = text.split(':');

        if (parts.length >= 2) {
            // Has subtitle
            const mainText = parts[0].trim();
            const subtitle = parts.slice(1).join(':').trim();

            html += '<div class="preview-main">';
            html += this.renderTextSection(mainText, 'main');
            html += '</div>';

            html += '<div class="preview-subtitle">';
            html += this.renderTextSection(subtitle, 'subtitle');
            html += '</div>';
        } else {
            // No subtitle
            html += '<div class="preview-main">';
            html += this.renderTextSection(text, 'main');
            html += '</div>';
        }

        html += '</div>';
        return html;
    }

    renderTextSection(text, type) {
        let html = '';
        const lines = text.split('\\n').filter(line => line.trim());

        const fontSize = type === 'main' ? '18px' : '14px';
        const fontWeight = type === 'main' ? '600' : '500';

        lines.forEach(line => {
            const parsed = markdownParser.parseLine(line.trim());
            html += `<p style="font-size: ${fontSize}; font-weight: ${fontWeight}; margin: 8px 0;">`;
            html += this.renderSegments(parsed.segments);
            html += '</p>';
        });

        return html;
    }

    renderSegments(segments) {
        let html = '';

        segments.forEach(segment => {
            let text = this.escapeHtml(segment.text);
            const styles = segment.styles;

            // Apply styles
            let styleAttr = '';
            let classes = [];

            if (styles.code) {
                classes.push('inline-code');
                styleAttr += 'background: rgba(231, 76, 60, 0.1); color: #e74c3c; padding: 3px 8px; border-radius: 4px; font-family: Monaco, monospace; font-size: 0.9em;';
            }

            if (styles.highlight) {
                styleAttr += 'background: rgba(255, 255, 0, 0.3); padding: 2px 4px; border-radius: 3px;';
            }

            if (styles.link) {
                styleAttr += 'color: #3498db; text-decoration: underline; cursor: pointer;';
            }

            // Build HTML
            if (styles.bold && styles.italic) {
                html += `<strong><em style="${styleAttr}">${text}</em></strong>`;
            } else if (styles.bold) {
                html += `<strong style="${styleAttr}">${text}</strong>`;
            } else if (styles.italic) {
                html += `<em style="${styleAttr}">${text}</em>`;
            } else if (styles.strikethrough) {
                html += `<del style="${styleAttr}">${text}</del>`;
            } else if (styles.code || styles.highlight || styles.link) {
                html += `<span style="${styleAttr}">${text}</span>`;
            } else {
                html += text;
            }
        });

        return html;
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Quick insert helpers
    insertMarkdown(before, after = '') {
        const textarea = this.DOM.textInput;
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const selectedText = textarea.value.substring(start, end);
        const replacement = before + selectedText + after;

        textarea.value = textarea.value.substring(0, start) + replacement + textarea.value.substring(end);
        textarea.selectionStart = start + before.length;
        textarea.selectionEnd = start + before.length + selectedText.length;
        textarea.focus();

        // Trigger input event to update preview
        textarea.dispatchEvent(new Event('input', { bubbles: true }));
    }

    // Public API for quick insertions
    makeBold() {
        this.insertMarkdown('**', '**');
    }

    makeItalic() {
        this.insertMarkdown('*', '*');
    }

    makeCode() {
        this.insertMarkdown('`', '`');
    }

    makeStrikethrough() {
        this.insertMarkdown('~~', '~~');
    }

    makeHighlight() {
        this.insertMarkdown('==', '==');
    }
}

// Export helper functions
export function setupMarkdownKeyboardShortcuts(markdownUI) {
    document.addEventListener('keydown', (e) => {
        // Only when textarea is focused
        if (document.activeElement?.id !== 'textInput') return;

        // Ctrl/Cmd + B for bold
        if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
            e.preventDefault();
            markdownUI.makeBold();
        }

        // Ctrl/Cmd + I for italic
        if ((e.ctrlKey || e.metaKey) && e.key === 'i') {
            e.preventDefault();
            markdownUI.makeItalic();
        }

        // Ctrl/Cmd + K for code
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            markdownUI.makeCode();
        }
    });
}
