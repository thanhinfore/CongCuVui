/* =====================================================
   FIND & REPLACE MODULE - V10.1
   Text editor find and replace functionality
   ===================================================== */

export class FindReplace {
    constructor() {
        this.modal = null;
        this.textInput = null;
        this.currentMatches = [];
        this.currentMatchIndex = -1;
        this.initialize();
    }

    initialize() {
        this.modal = document.getElementById('findReplaceModal');
        this.textInput = document.getElementById('textInput');

        // Get all elements
        this.elements = {
            openButton: document.getElementById('openFindReplace'),
            closeButton: document.getElementById('closeFindReplace'),
            findInput: document.getElementById('findText'),
            replaceInput: document.getElementById('replaceText'),
            caseSensitive: document.getElementById('caseSensitive'),
            wholeWord: document.getElementById('wholeWord'),
            findNext: document.getElementById('findNext'),
            replaceOne: document.getElementById('replaceOne'),
            replaceAll: document.getElementById('replaceAll'),
            matchCount: document.getElementById('matchCount'),
            findStats: document.getElementById('findStats')
        };

        this.setupEventListeners();
        console.log('Find & Replace initialized');
    }

    setupEventListeners() {
        // Open modal
        if (this.elements.openButton) {
            this.elements.openButton.addEventListener('click', () => this.open());
        }

        // Close modal
        if (this.elements.closeButton) {
            this.elements.closeButton.addEventListener('click', () => this.close());
        }

        // Close on overlay click
        if (this.modal) {
            this.modal.addEventListener('click', (e) => {
                if (e.target === this.modal) {
                    this.close();
                }
            });
        }

        // Close on Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.modal.style.display !== 'none') {
                this.close();
            }
        });

        // Find input change
        if (this.elements.findInput) {
            this.elements.findInput.addEventListener('input', () => this.updateMatches());
        }

        // Options change
        if (this.elements.caseSensitive) {
            this.elements.caseSensitive.addEventListener('change', () => this.updateMatches());
        }
        if (this.elements.wholeWord) {
            this.elements.wholeWord.addEventListener('change', () => this.updateMatches());
        }

        // Buttons
        if (this.elements.findNext) {
            this.elements.findNext.addEventListener('click', () => this.findNext());
        }
        if (this.elements.replaceOne) {
            this.elements.replaceOne.addEventListener('click', () => this.replaceOne());
        }
        if (this.elements.replaceAll) {
            this.elements.replaceAll.addEventListener('click', () => this.replaceAll());
        }

        // Enter key handling
        if (this.elements.findInput) {
            this.elements.findInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    this.findNext();
                }
            });
        }
        if (this.elements.replaceInput) {
            this.elements.replaceInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    if (e.ctrlKey || e.metaKey) {
                        this.replaceAll();
                    } else {
                        this.replaceOne();
                    }
                }
            });
        }
    }

    open() {
        if (!this.modal) return;

        this.modal.style.display = 'flex';

        // Select current selection in textarea if any
        const selection = this.textInput.value.substring(
            this.textInput.selectionStart,
            this.textInput.selectionEnd
        );

        if (selection) {
            this.elements.findInput.value = selection;
        }

        // Focus find input
        setTimeout(() => {
            this.elements.findInput.focus();
            this.elements.findInput.select();
            this.updateMatches();
        }, 50);
    }

    close() {
        if (!this.modal) return;
        this.modal.style.display = 'none';
        this.currentMatches = [];
        this.currentMatchIndex = -1;
    }

    updateMatches() {
        const findText = this.elements.findInput.value;
        if (!findText) {
            this.elements.findStats.style.display = 'none';
            this.currentMatches = [];
            return;
        }

        const text = this.textInput.value;
        const caseSensitive = this.elements.caseSensitive.checked;
        const wholeWord = this.elements.wholeWord.checked;

        // Build regex
        let pattern = findText;

        // Escape special regex characters
        pattern = pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

        // Add word boundary if whole word
        if (wholeWord) {
            pattern = `\\b${pattern}\\b`;
        }

        const flags = caseSensitive ? 'g' : 'gi';
        const regex = new RegExp(pattern, flags);

        // Find all matches
        this.currentMatches = [];
        let match;
        while ((match = regex.exec(text)) !== null) {
            this.currentMatches.push({
                index: match.index,
                length: match[0].length,
                text: match[0]
            });
        }

        // Update UI
        this.elements.findStats.style.display = 'block';
        const count = this.currentMatches.length;
        this.elements.matchCount.textContent = `${count} match${count !== 1 ? 'es' : ''} found`;

        // Reset current index
        this.currentMatchIndex = -1;
    }

    findNext() {
        if (this.currentMatches.length === 0) {
            this.updateMatches();
            if (this.currentMatches.length === 0) {
                this.showToast('No matches found', 'info');
                return;
            }
        }

        // Move to next match
        this.currentMatchIndex = (this.currentMatchIndex + 1) % this.currentMatches.length;
        const match = this.currentMatches[this.currentMatchIndex];

        // Select text in textarea
        this.textInput.focus();
        this.textInput.setSelectionRange(match.index, match.index + match.length);

        // Scroll into view
        this.textInput.scrollTop = this.textInput.scrollHeight * (match.index / this.textInput.value.length);

        // Update count display
        const current = this.currentMatchIndex + 1;
        const total = this.currentMatches.length;
        this.elements.matchCount.textContent = `Match ${current} of ${total}`;
    }

    replaceOne() {
        if (this.currentMatches.length === 0) {
            this.showToast('No matches to replace', 'warning');
            return;
        }

        if (this.currentMatchIndex === -1) {
            this.findNext();
            return;
        }

        const replaceText = this.elements.replaceInput.value;
        const match = this.currentMatches[this.currentMatchIndex];

        // Replace text
        const before = this.textInput.value.substring(0, match.index);
        const after = this.textInput.value.substring(match.index + match.length);
        this.textInput.value = before + replaceText + after;

        // Trigger input event to update app
        this.textInput.dispatchEvent(new Event('input', { bubbles: true }));

        // Update matches and find next
        this.updateMatches();
        if (this.currentMatches.length > 0) {
            // Stay at same position (which now points to next occurrence)
            this.currentMatchIndex = Math.min(this.currentMatchIndex, this.currentMatches.length - 1);
            if (this.currentMatchIndex >= 0) {
                const nextMatch = this.currentMatches[this.currentMatchIndex];
                this.textInput.setSelectionRange(nextMatch.index, nextMatch.index + nextMatch.length);
            }
        } else {
            this.showToast('All matches replaced', 'success');
        }
    }

    replaceAll() {
        const findText = this.elements.findInput.value;
        if (!findText) {
            this.showToast('Please enter text to find', 'warning');
            return;
        }

        this.updateMatches();
        const count = this.currentMatches.length;

        if (count === 0) {
            this.showToast('No matches found', 'info');
            return;
        }

        const replaceText = this.elements.replaceInput.value;
        const caseSensitive = this.elements.caseSensitive.checked;
        const wholeWord = this.elements.wholeWord.checked;

        // Build regex
        let pattern = findText;
        pattern = pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

        if (wholeWord) {
            pattern = `\\b${pattern}\\b`;
        }

        const flags = caseSensitive ? 'g' : 'gi';
        const regex = new RegExp(pattern, flags);

        // Replace all
        const newText = this.textInput.value.replace(regex, replaceText);
        this.textInput.value = newText;

        // Trigger input event
        this.textInput.dispatchEvent(new Event('input', { bubbles: true }));

        // Update UI
        this.updateMatches();
        this.showToast(`Replaced ${count} occurrence${count !== 1 ? 's' : ''}`, 'success');
    }

    showToast(message, type = 'info') {
        // Use existing toast system if available
        if (window.imageTextApp && window.imageTextApp.components.controls) {
            window.imageTextApp.components.controls.showNotification(message, type);
        } else {
            // Fallback
            console.log(`[Find & Replace] ${message}`);
        }
    }
}

// Export singleton
let findReplaceInstance = null;

export function getFindReplace() {
    if (!findReplaceInstance) {
        findReplaceInstance = new FindReplace();
    }
    return findReplaceInstance;
}
