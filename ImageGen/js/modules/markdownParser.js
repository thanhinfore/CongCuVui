/* =====================================================
   MARKDOWNPARSER.JS - Advanced Markdown Parser for Canvas Text
   ===================================================== */

/**
 * Advanced Markdown Parser with full support for:
 * - **Bold**, *Italic*, ***Bold+Italic***
 * - # Headings (H1-H6)
 * - `inline code`
 * - [links](url)
 * - > Blockquotes
 * - Lists: - item, * item, 1. item
 * - ~~Strikethrough~~
 * - ==Highlight==
 * - Emojis support
 */
export class MarkdownParser {
    constructor() {
        this.patterns = {
            // Bold: **text** or __text__
            boldDouble: /\*\*(.+?)\*\*/g,
            boldUnderscore: /__(.+?)__/g,

            // Italic: *text* or _text_
            italicSingle: /\*(.+?)\*/g,
            italicUnderscore: /_(.+?)_/g,

            // Inline code: `code`
            inlineCode: /`([^`]+)`/g,

            // Strikethrough: ~~text~~
            strikethrough: /~~(.+?)~~/g,

            // Highlight: ==text==
            highlight: /==(.+?)==/g,

            // Links: [text](url)
            link: /\[([^\]]+)\]\(([^)]+)\)/g,

            // Headings: # H1, ## H2, etc.
            heading: /^(#{1,6})\s+(.+)$/,

            // Lists: - item, * item, 1. item
            unorderedList: /^[*-]\s+(.+)$/,
            orderedList: /^\d+\.\s+(.+)$/,

            // Blockquote: > text
            blockquote: /^>\s+(.+)$/
        };
    }

    /**
     * Parse a line of text and return segments with styles
     * @param {string} text - The text to parse
     * @returns {Object} - Parsed result with type and segments
     */
    parseLine(text) {
        // Check for special line types first
        const trimmedText = text.trim();

        // Heading
        const headingMatch = trimmedText.match(this.patterns.heading);
        if (headingMatch) {
            const level = headingMatch[1].length;
            const content = headingMatch[2];
            return {
                type: 'heading',
                level: level,
                segments: this.parseInlineStyles(content)
            };
        }

        // Blockquote
        const blockquoteMatch = trimmedText.match(this.patterns.blockquote);
        if (blockquoteMatch) {
            return {
                type: 'blockquote',
                segments: this.parseInlineStyles(blockquoteMatch[1])
            };
        }

        // Unordered list
        const unorderedMatch = trimmedText.match(this.patterns.unorderedList);
        if (unorderedMatch) {
            return {
                type: 'list',
                listType: 'unordered',
                segments: this.parseInlineStyles(unorderedMatch[1])
            };
        }

        // Ordered list
        const orderedMatch = trimmedText.match(this.patterns.orderedList);
        if (orderedMatch) {
            return {
                type: 'list',
                listType: 'ordered',
                segments: this.parseInlineStyles(orderedMatch[1])
            };
        }

        // Normal paragraph
        return {
            type: 'paragraph',
            segments: this.parseInlineStyles(text)
        };
    }

    /**
     * Parse inline markdown styles in text
     * @param {string} text - Text to parse
     * @returns {Array} - Array of segments with styles
     */
    parseInlineStyles(text) {
        const segments = [];
        let remaining = text;

        // Create a list of all matches with their positions
        const matches = [];

        // Find all bold+italic (***text***)
        const boldItalicPattern = /\*\*\*(.+?)\*\*\*/g;
        let match;
        while ((match = boldItalicPattern.exec(text)) !== null) {
            matches.push({
                start: match.index,
                end: match.index + match[0].length,
                text: match[1],
                styles: { bold: true, italic: true },
                priority: 4 // Highest priority
            });
        }

        // Find all bold (**text** or __text__)
        const boldPattern = /(\*\*|__)(.+?)\1/g;
        while ((match = boldPattern.exec(text)) !== null) {
            // Skip if already matched as bold+italic
            if (!this.overlapsWith(match.index, match.index + match[0].length, matches)) {
                matches.push({
                    start: match.index,
                    end: match.index + match[0].length,
                    text: match[2],
                    styles: { bold: true },
                    priority: 3
                });
            }
        }

        // Find all italic (*text* or _text_)
        const italicPattern = /(?<!\*)\*(?!\*)(.+?)\*(?!\*)|(?<!_)_(?!_)(.+?)_(?!_)/g;
        while ((match = italicPattern.exec(text)) !== null) {
            const matchedText = match[1] || match[2];
            if (!this.overlapsWith(match.index, match.index + match[0].length, matches)) {
                matches.push({
                    start: match.index,
                    end: match.index + match[0].length,
                    text: matchedText,
                    styles: { italic: true },
                    priority: 2
                });
            }
        }

        // Find all inline code (`code`)
        const codePattern = /`([^`]+)`/g;
        while ((match = codePattern.exec(text)) !== null) {
            if (!this.overlapsWith(match.index, match.index + match[0].length, matches)) {
                matches.push({
                    start: match.index,
                    end: match.index + match[0].length,
                    text: match[1],
                    styles: { code: true },
                    priority: 5 // Code has highest priority
                });
            }
        }

        // Find all strikethrough (~~text~~)
        const strikePattern = /~~(.+?)~~/g;
        while ((match = strikePattern.exec(text)) !== null) {
            if (!this.overlapsWith(match.index, match.index + match[0].length, matches)) {
                matches.push({
                    start: match.index,
                    end: match.index + match[0].length,
                    text: match[1],
                    styles: { strikethrough: true },
                    priority: 2
                });
            }
        }

        // Find all highlight (==text==)
        const highlightPattern = /==(.+?)==/g;
        while ((match = highlightPattern.exec(text)) !== null) {
            if (!this.overlapsWith(match.index, match.index + match[0].length, matches)) {
                matches.push({
                    start: match.index,
                    end: match.index + match[0].length,
                    text: match[1],
                    styles: { highlight: true },
                    priority: 2
                });
            }
        }

        // Find all links ([text](url))
        const linkPattern = /\[([^\]]+)\]\(([^)]+)\)/g;
        while ((match = linkPattern.exec(text)) !== null) {
            if (!this.overlapsWith(match.index, match.index + match[0].length, matches)) {
                matches.push({
                    start: match.index,
                    end: match.index + match[0].length,
                    text: match[1],
                    url: match[2],
                    styles: { link: true },
                    priority: 3
                });
            }
        }

        // Sort matches by position and priority
        matches.sort((a, b) => {
            if (a.start !== b.start) return a.start - b.start;
            return b.priority - a.priority;
        });

        // Build segments
        let lastIndex = 0;
        const processedMatches = [];

        for (const match of matches) {
            // Skip overlapping matches
            if (processedMatches.some(pm => this.rangesOverlap(pm.start, pm.end, match.start, match.end))) {
                continue;
            }

            // Add plain text before this match
            if (match.start > lastIndex) {
                const plainText = text.substring(lastIndex, match.start);
                if (plainText) {
                    segments.push({
                        text: plainText,
                        styles: {}
                    });
                }
            }

            // Add styled segment
            segments.push({
                text: match.text,
                styles: match.styles,
                url: match.url
            });

            lastIndex = match.end;
            processedMatches.push(match);
        }

        // Add remaining plain text
        if (lastIndex < text.length) {
            const plainText = text.substring(lastIndex);
            if (plainText) {
                segments.push({
                    text: plainText,
                    styles: {}
                });
            }
        }

        return segments.length > 0 ? segments : [{ text: text, styles: {} }];
    }

    /**
     * Check if a range overlaps with any existing matches
     */
    overlapsWith(start, end, matches) {
        return matches.some(m => this.rangesOverlap(m.start, m.end, start, end));
    }

    /**
     * Check if two ranges overlap
     */
    rangesOverlap(start1, end1, start2, end2) {
        return start1 < end2 && start2 < end1;
    }

    /**
     * Parse multiple lines with title:subtitle support
     * @param {string} text - Full text with potential title:subtitle
     * @returns {Object} - Parsed text with main and subtitle
     */
    parseText(text) {
        const lines = text.split(':');

        if (lines.length >= 2) {
            // Has subtitle
            const mainText = lines[0].trim();
            const subtitle = lines.slice(1).join(':').trim();

            return {
                main: this.parseMultipleLines(mainText),
                subtitle: this.parseMultipleLines(subtitle)
            };
        } else {
            // No subtitle
            return {
                main: this.parseMultipleLines(text),
                subtitle: []
            };
        }
    }

    /**
     * Parse text that may contain \\n line breaks
     */
    parseMultipleLines(text) {
        const lines = text.split('\\n').map(line => line.trim()).filter(line => line);
        return lines.map(line => this.parseLine(line));
    }

    /**
     * Get preview HTML for markdown text
     * @param {string} text - Markdown text
     * @returns {string} - HTML preview
     */
    getPreviewHTML(text) {
        const parsed = this.parseText(text);
        let html = '<div class="markdown-preview">';

        // Render main text
        if (parsed.main.length > 0) {
            html += '<div class="main-text">';
            parsed.main.forEach(line => {
                html += this.lineToHTML(line);
            });
            html += '</div>';
        }

        // Render subtitle
        if (parsed.subtitle.length > 0) {
            html += '<div class="subtitle-text">';
            parsed.subtitle.forEach(line => {
                html += this.lineToHTML(line);
            });
            html += '</div>';
        }

        html += '</div>';
        return html;
    }

    /**
     * Convert parsed line to HTML
     */
    lineToHTML(line) {
        let html = '';

        switch (line.type) {
            case 'heading':
                html += `<h${line.level}>`;
                break;
            case 'blockquote':
                html += '<blockquote>';
                break;
            case 'list':
                html += line.listType === 'ordered' ? '<li>' : '<li style="list-style-type: disc;">';
                break;
            default:
                html += '<p>';
        }

        // Render segments
        line.segments.forEach(segment => {
            html += this.segmentToHTML(segment);
        });

        switch (line.type) {
            case 'heading':
                html += `</h${line.level}>`;
                break;
            case 'blockquote':
                html += '</blockquote>';
                break;
            case 'list':
                html += '</li>';
                break;
            default:
                html += '</p>';
        }

        return html;
    }

    /**
     * Convert segment to HTML
     */
    segmentToHTML(segment) {
        let html = segment.text;
        const styles = segment.styles;

        if (styles.code) {
            html = `<code>${html}</code>`;
        }
        if (styles.bold) {
            html = `<strong>${html}</strong>`;
        }
        if (styles.italic) {
            html = `<em>${html}</em>`;
        }
        if (styles.strikethrough) {
            html = `<del>${html}</del>`;
        }
        if (styles.highlight) {
            html = `<mark>${html}</mark>`;
        }
        if (styles.link) {
            html = `<a href="${segment.url}" target="_blank">${html}</a>`;
        }

        return html;
    }
}

// Export singleton instance
export const markdownParser = new MarkdownParser();
