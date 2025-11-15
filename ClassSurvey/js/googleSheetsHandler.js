/**
 * GoogleSheetsHandler
 * Handles fetching and parsing CSV data from Google Sheets
 */
class GoogleSheetsHandler {
    constructor() {
        this.csvUrl = null;
        this.rawData = null;
    }

    /**
     * Validate Google Sheets CSV URL
     * @param {string} url - The URL to validate
     * @returns {boolean} - Whether the URL is valid
     */
    validateUrl(url) {
        if (!url || typeof url !== 'string') {
            return false;
        }

        // Check if URL contains Google Sheets patterns
        const patterns = [
            /docs\.google\.com\/spreadsheets/,
            /\/export\?format=csv/,
            /\/pub\?.*output=csv/
        ];

        return patterns.some(pattern => pattern.test(url));
    }

    /**
     * Fetch CSV data from Google Sheets
     * @param {string} csvUrl - The published CSV URL
     * @returns {Promise<string>} - The raw CSV text
     */
    async fetchCSV(csvUrl) {
        this.csvUrl = csvUrl;

        try {
            const response = await fetch(csvUrl, {
                method: 'GET',
                cache: 'no-cache',
                headers: {
                    'Accept': 'text/csv'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const csvText = await response.text();

            if (!csvText || csvText.trim().length === 0) {
                throw new Error('CSV file is empty');
            }

            return csvText;

        } catch (error) {
            console.error('Error fetching CSV:', error);

            if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
                throw new Error('Không thể kết nối đến Google Sheets. Vui lòng kiểm tra:\n' +
                    '1. Link CSV đã được publish đúng chưa\n' +
                    '2. Kết nối internet của bạn\n' +
                    '3. Link có đúng định dạng không');
            }

            throw error;
        }
    }

    /**
     * Parse CSV text using PapaParse
     * @param {string} csvText - The raw CSV text
     * @returns {Promise<Object>} - Parsed data object
     */
    async parseCSV(csvText) {
        return new Promise((resolve, reject) => {
            if (typeof Papa === 'undefined') {
                reject(new Error('PapaParse library not loaded'));
                return;
            }

            Papa.parse(csvText, {
                header: true,
                skipEmptyLines: true,
                dynamicTyping: false, // Keep as strings for better control
                complete: (results) => {
                    if (results.errors && results.errors.length > 0) {
                        console.warn('CSV parsing warnings:', results.errors);
                    }

                    if (!results.data || results.data.length === 0) {
                        reject(new Error('No data found in CSV file'));
                        return;
                    }

                    this.rawData = results.data;
                    resolve({
                        data: results.data,
                        headers: results.meta.fields || [],
                        rowCount: results.data.length
                    });
                },
                error: (error) => {
                    reject(new Error(`CSV parsing error: ${error.message}`));
                }
            });
        });
    }

    /**
     * Fetch and parse CSV in one call
     * @param {string} csvUrl - The published CSV URL
     * @returns {Promise<Object>} - Parsed data object
     */
    async loadData(csvUrl) {
        const csvText = await this.fetchCSV(csvUrl);
        const parsedData = await this.parseCSV(csvText);
        return parsedData;
    }

    /**
     * Get the current CSV URL
     * @returns {string|null} - The current CSV URL
     */
    getCurrentUrl() {
        return this.csvUrl;
    }

    /**
     * Get the raw data
     * @returns {Array|null} - The raw data array
     */
    getRawData() {
        return this.rawData;
    }

    /**
     * Clear cached data
     */
    clear() {
        this.csvUrl = null;
        this.rawData = null;
    }
}
