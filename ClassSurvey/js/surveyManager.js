/**
 * SurveyManager
 * Manages and analyzes survey data from Google Forms/Sheets
 */
class SurveyManager {
    constructor() {
        this.rawData = null;
        this.questions = [];
        this.currentQuestionIndex = 0;
        this.totalResponses = 0;
    }

    /**
     * Load and process survey data
     * @param {Object} parsedData - Data from GoogleSheetsHandler
     * @returns {Object} - Processed survey data
     */
    loadData(parsedData) {
        this.rawData = parsedData.data;
        this.totalResponses = parsedData.rowCount;

        // Extract questions from headers
        // Typically: [Timestamp, (Email), Question1, Question2, ...]
        const headers = parsedData.headers;

        this.questions = [];

        // Skip first column (Timestamp) and optionally second (Email/Username)
        // Start from index 1 or 2
        let startIndex = 1;

        // Check if second column looks like an email
        if (headers.length > 1 && this.looksLikeEmailColumn(headers[1])) {
            startIndex = 2;
        }

        // Process each question column
        for (let i = startIndex; i < headers.length; i++) {
            const questionText = headers[i];

            if (!questionText || questionText.trim().length === 0) {
                continue;
            }

            const question = this.analyzeQuestion(questionText, i);
            this.questions.push(question);
        }

        return {
            totalQuestions: this.questions.length,
            totalResponses: this.totalResponses,
            questions: this.questions
        };
    }

    /**
     * Check if column name looks like email column
     * @param {string} columnName - Column header name
     * @returns {boolean}
     */
    looksLikeEmailColumn(columnName) {
        const emailPatterns = [
            /email/i,
            /e-mail/i,
            /địa chỉ/i,
            /username/i,
            /tên người dùng/i
        ];

        return emailPatterns.some(pattern => pattern.test(columnName));
    }

    /**
     * Analyze a single question and its responses
     * @param {string} questionText - The question text
     * @param {number} columnIndex - The column index in raw data
     * @returns {Object} - Question analysis object
     */
    analyzeQuestion(questionText, columnIndex) {
        // Collect all responses for this question
        const responses = [];
        const responseCounts = {};

        for (const row of this.rawData) {
            const response = row[questionText];

            if (!response || response.trim().length === 0) {
                continue; // Skip empty responses
            }

            const trimmedResponse = response.trim();
            responses.push(trimmedResponse);

            // Count occurrences
            responseCounts[trimmedResponse] = (responseCounts[trimmedResponse] || 0) + 1;
        }

        // Sort by count (descending)
        const sortedOptions = Object.entries(responseCounts)
            .sort((a, b) => b[1] - a[1])
            .map(([option, count]) => ({
                option,
                count,
                percentage: ((count / responses.length) * 100).toFixed(1)
            }));

        // Determine question type
        const questionType = this.detectQuestionType(responses, sortedOptions);

        // Find most popular answer
        const mostPopular = sortedOptions.length > 0 ? sortedOptions[0].option : 'N/A';

        return {
            id: columnIndex,
            text: questionText,
            type: questionType,
            totalResponses: responses.length,
            uniqueOptions: sortedOptions.length,
            options: sortedOptions,
            mostPopular: mostPopular,
            allResponses: responses
        };
    }

    /**
     * Detect question type based on responses
     * @param {Array} responses - All responses
     * @param {Array} options - Sorted options with counts
     * @returns {string} - Question type
     */
    detectQuestionType(responses, options) {
        const uniqueCount = options.length;
        const totalResponses = responses.length;

        // If very few unique values compared to responses, likely multiple choice
        if (uniqueCount <= 10 && totalResponses > uniqueCount * 2) {
            return 'multiple_choice';
        }

        // If responses look like numbers (scale/rating)
        const numericResponses = responses.filter(r => !isNaN(parseFloat(r)));
        if (numericResponses.length > totalResponses * 0.8) {
            return 'scale';
        }

        // If many unique values, likely short answer
        if (uniqueCount > totalResponses * 0.5) {
            return 'short_answer';
        }

        // Default to multiple choice
        return 'multiple_choice';
    }

    /**
     * Get a specific question by index
     * @param {number} index - Question index
     * @returns {Object|null} - Question object
     */
    getQuestion(index) {
        if (index < 0 || index >= this.questions.length) {
            return null;
        }
        return this.questions[index];
    }

    /**
     * Get current question
     * @returns {Object|null} - Current question object
     */
    getCurrentQuestion() {
        return this.getQuestion(this.currentQuestionIndex);
    }

    /**
     * Move to next question
     * @returns {Object|null} - Next question or null if at end
     */
    nextQuestion() {
        if (this.currentQuestionIndex < this.questions.length - 1) {
            this.currentQuestionIndex++;
            return this.getCurrentQuestion();
        }
        return null;
    }

    /**
     * Move to previous question
     * @returns {Object|null} - Previous question or null if at start
     */
    previousQuestion() {
        if (this.currentQuestionIndex > 0) {
            this.currentQuestionIndex--;
            return this.getCurrentQuestion();
        }
        return null;
    }

    /**
     * Set current question by index
     * @param {number} index - Question index
     * @returns {boolean} - Success status
     */
    setCurrentQuestion(index) {
        if (index >= 0 && index < this.questions.length) {
            this.currentQuestionIndex = index;
            return true;
        }
        return false;
    }

    /**
     * Get all questions
     * @returns {Array} - All questions
     */
    getAllQuestions() {
        return this.questions;
    }

    /**
     * Get summary statistics
     * @returns {Object} - Summary object
     */
    getSummary() {
        return {
            totalQuestions: this.questions.length,
            totalResponses: this.totalResponses,
            averageResponsesPerQuestion: this.questions.length > 0
                ? (this.questions.reduce((sum, q) => sum + q.totalResponses, 0) / this.questions.length).toFixed(1)
                : 0,
            questionTypes: this.getQuestionTypeCounts()
        };
    }

    /**
     * Get count of each question type
     * @returns {Object} - Type counts
     */
    getQuestionTypeCounts() {
        const counts = {};
        for (const question of this.questions) {
            counts[question.type] = (counts[question.type] || 0) + 1;
        }
        return counts;
    }

    /**
     * Export data as JSON
     * @returns {string} - JSON string
     */
    exportJSON() {
        return JSON.stringify({
            summary: this.getSummary(),
            questions: this.questions,
            exportedAt: new Date().toISOString()
        }, null, 2);
    }

    /**
     * Export data as CSV
     * @returns {string} - CSV string
     */
    exportCSV() {
        const rows = [];

        // Header
        rows.push(['Câu hỏi', 'Lựa chọn', 'Số lượng', 'Tỷ lệ %'].join(','));

        // Data
        for (const question of this.questions) {
            for (let i = 0; i < question.options.length; i++) {
                const option = question.options[i];
                const questionText = i === 0 ? `"${question.text}"` : '';
                rows.push([
                    questionText,
                    `"${option.option}"`,
                    option.count,
                    option.percentage
                ].join(','));
            }
            // Empty row between questions
            rows.push('');
        }

        return rows.join('\n');
    }

    /**
     * Clear all data
     */
    clear() {
        this.rawData = null;
        this.questions = [];
        this.currentQuestionIndex = 0;
        this.totalResponses = 0;
    }
}
