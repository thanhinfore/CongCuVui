// ========================================
// Data Handler Module
// Handles CSV parsing, format detection, and data normalization
// ========================================

export class DataHandler {
    constructor() {
        this.rawData = null;
        this.normalizedData = null;
        this.format = null;
    }

    /**
     * Parse CSV file using PapaParse
     * @param {File} file - CSV file object
     * @returns {Promise<Object>} Parsed and normalized data
     */
    async parseCSV(file) {
        return new Promise((resolve, reject) => {
            Papa.parse(file, {
                header: true,
                dynamicTyping: true,
                skipEmptyLines: true,
                complete: (results) => {
                    try {
                        this.rawData = results.data;
                        this.format = this.detectFormat(this.rawData);
                        this.normalizedData = this.normalizeData(this.rawData, this.format);
                        resolve(this.normalizedData);
                    } catch (error) {
                        reject(error);
                    }
                },
                error: (error) => {
                    reject(new Error(`CSV parsing failed: ${error.message}`));
                }
            });
        });
    }

    /**
     * Detect data format (LONG or WIDE)
     * @param {Array} data - Raw CSV data
     * @returns {String} 'LONG' or 'WIDE'
     */
    detectFormat(data) {
        if (!data || data.length === 0) {
            throw new Error('No data to analyze');
        }

        const columns = Object.keys(data[0]);
        const numericColumns = columns.filter(col => {
            const value = data[0][col];
            return typeof value === 'number';
        });

        // LONG format: typically 3 columns (time, entity, value)
        // WIDE format: multiple numeric columns (time, entity1, entity2, ...)
        if (columns.length === 3 || numericColumns.length === 1) {
            return 'LONG';
        } else if (numericColumns.length > 1) {
            return 'WIDE';
        }

        // Default to LONG if uncertain
        return 'LONG';
    }

    /**
     * Normalize data to standard format
     * @param {Array} data - Raw CSV data
     * @param {String} format - 'LONG' or 'WIDE'
     * @returns {Object} Normalized data structure
     */
    normalizeData(data, format) {
        if (format === 'LONG') {
            return this.normalizeLongFormat(data);
        } else {
            return this.normalizeWideFormat(data);
        }
    }

    /**
     * Normalize LONG format data (year, entity, value)
     * @param {Array} data - Raw data
     * @returns {Object} Normalized data
     */
    normalizeLongFormat(data) {
        const columns = Object.keys(data[0]);

        // Auto-detect column names
        const timeCol = this.detectTimeColumn(columns);
        const entityCol = this.detectEntityColumn(columns, timeCol);
        const valueCol = this.detectValueColumn(columns, timeCol, entityCol);

        if (!timeCol || !entityCol || !valueCol) {
            throw new Error('Could not detect required columns (time, entity, value)');
        }

        // Group data by time period
        const grouped = {};
        const entitiesSet = new Set();

        data.forEach(row => {
            const time = this.normalizeTimeValue(row[timeCol]);
            const entity = String(row[entityCol]).trim();
            const value = Number(row[valueCol]) || 0;

            if (!grouped[time]) {
                grouped[time] = {};
            }
            grouped[time][entity] = value;
            entitiesSet.add(entity);
        });

        // Convert to arrays
        const periods = Object.keys(grouped).sort((a, b) => {
            const aNum = parseFloat(a);
            const bNum = parseFloat(b);
            if (!isNaN(aNum) && !isNaN(bNum)) {
                return aNum - bNum;
            }
            return a.localeCompare(b);
        });

        const entities = Array.from(entitiesSet).sort();
        const values = periods.map(period => {
            return entities.map(entity => grouped[period][entity] || 0);
        });

        return {
            periods,
            entities,
            values,
            format: 'LONG',
            metadata: {
                timeColumn: timeCol,
                entityColumn: entityCol,
                valueColumn: valueCol,
                totalPeriods: periods.length,
                totalEntities: entities.length
            }
        };
    }

    /**
     * Normalize WIDE format data (year, entity1, entity2, entity3, ...)
     * @param {Array} data - Raw data
     * @returns {Object} Normalized data
     */
    normalizeWideFormat(data) {
        const columns = Object.keys(data[0]);
        const timeCol = this.detectTimeColumn(columns);

        if (!timeCol) {
            throw new Error('Could not detect time column');
        }

        const entityColumns = columns.filter(col => col !== timeCol);
        const periods = data.map(row => this.normalizeTimeValue(row[timeCol])).sort();
        const entities = entityColumns;
        const values = data.map(row => {
            return entityColumns.map(col => Number(row[col]) || 0);
        });

        return {
            periods,
            entities,
            values,
            format: 'WIDE',
            metadata: {
                timeColumn: timeCol,
                totalPeriods: periods.length,
                totalEntities: entities.length
            }
        };
    }

    /**
     * Detect time/date column
     * @param {Array} columns - Column names
     * @returns {String} Time column name
     */
    detectTimeColumn(columns) {
        const timeKeywords = ['year', 'date', 'time', 'period', 'month', 'day', 'năm', 'ngày', 'tháng', 'timestamp'];
        return columns.find(col =>
            timeKeywords.some(keyword => col.toLowerCase().includes(keyword))
        ) || columns[0]; // Default to first column
    }

    /**
     * Detect entity column
     * @param {Array} columns - Column names
     * @param {String} timeCol - Time column name
     * @returns {String} Entity column name
     */
    detectEntityColumn(columns, timeCol) {
        const entityKeywords = ['entity', 'name', 'category', 'label', 'item', 'country', 'language'];
        return columns.find(col =>
            col !== timeCol && entityKeywords.some(keyword => col.toLowerCase().includes(keyword))
        ) || columns.find(col => col !== timeCol);
    }

    /**
     * Detect value column
     * @param {Array} columns - Column names
     * @param {String} timeCol - Time column name
     * @param {String} entityCol - Entity column name
     * @returns {String} Value column name
     */
    detectValueColumn(columns, timeCol, entityCol) {
        return columns.find(col => col !== timeCol && col !== entityCol);
    }

    /**
     * Normalize time value (convert to string, handle various formats)
     * @param {*} value - Time value
     * @returns {String} Normalized time string
     */
    normalizeTimeValue(value) {
        if (value instanceof Date) {
            return value.toISOString().split('T')[0];
        }
        return String(value).trim();
    }

    /**
     * Generate sample data for demo
     * @returns {Object} Sample normalized data
     */
    static generateSampleData() {
        return {
            periods: ['1990', '1995', '2000', '2005', '2010', '2015', '2020'],
            entities: ['Python', 'JavaScript', 'Java', 'C++', 'C#', 'Ruby', 'Go', 'Rust'],
            values: [
                [5, 0, 80, 90, 0, 10, 0, 0],      // 1990
                [15, 5, 85, 80, 10, 30, 0, 0],    // 1995
                [30, 20, 90, 70, 40, 50, 0, 0],   // 2000
                [50, 60, 85, 60, 60, 55, 5, 0],   // 2005
                [80, 85, 80, 50, 65, 45, 15, 0],  // 2010
                [95, 95, 75, 45, 60, 35, 35, 10], // 2015
                [100, 100, 70, 40, 55, 25, 60, 45] // 2020
            ],
            format: 'SAMPLE',
            metadata: {
                totalPeriods: 7,
                totalEntities: 8,
                description: 'Programming Languages Popularity (1990-2020)'
            }
        };
    }

    /**
     * Validate normalized data
     * @param {Object} data - Normalized data
     * @returns {Boolean} True if valid
     */
    static validateData(data) {
        if (!data || !data.periods || !data.entities || !data.values) {
            throw new Error('Invalid data structure');
        }

        if (data.periods.length < 2) {
            throw new Error('Need at least 2 time periods');
        }

        if (data.entities.length < 1) {
            throw new Error('Need at least 1 entity');
        }

        if (data.values.length !== data.periods.length) {
            throw new Error('Values array length must match periods length');
        }

        data.values.forEach((valueArray, index) => {
            if (valueArray.length !== data.entities.length) {
                throw new Error(`Values at period ${index} length must match entities length`);
            }
        });

        return true;
    }

    /**
     * Get data preview for display
     * @param {Object} data - Normalized data
     * @param {Number} maxRows - Maximum rows to return
     * @returns {Object} Preview data with HTML table
     */
    static getDataPreview(data, maxRows = 10) {
        const periods = data.periods.slice(0, maxRows);
        const entities = data.entities.slice(0, 10); // Show max 10 entities

        let html = '<table>';
        html += '<thead><tr><th>Period</th>';
        entities.forEach(entity => {
            html += `<th>${entity}</th>`;
        });
        html += '</tr></thead>';

        html += '<tbody>';
        periods.forEach((period, i) => {
            html += `<tr><td><strong>${period}</strong></td>`;
            entities.forEach((entity, j) => {
                const value = data.values[i][data.entities.indexOf(entity)] || 0;
                html += `<td>${value.toFixed(1)}</td>`;
            });
            html += '</tr>';
        });
        html += '</tbody></table>';

        if (data.periods.length > maxRows || data.entities.length > 10) {
            html += `<p style="margin-top: 10px; color: #666; font-size: 0.9rem;">`;
            html += `Showing ${Math.min(maxRows, data.periods.length)} of ${data.periods.length} periods `;
            html += `and ${Math.min(10, data.entities.length)} of ${data.entities.length} entities`;
            html += `</p>`;
        }

        return html;
    }
}
