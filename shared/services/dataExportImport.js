// Data Export/Import Service
// Handles full app data backup and restore across devices

(function() {
    'use strict';

    class DataExportImportService {
        constructor(storageService) {
            this.storage = storageService;
        }

        /**
         * Export all app data to a downloadable JSON file
         * @returns {Object} Complete app data backup
         */
        exportAllData() {
            const backup = {
                version: '1.0',
                exportDate: new Date().toISOString(),
                appName: 'Drillers Report',
                data: {}
            };

            // Get all localStorage keys
            const allKeys = [];
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key) allKeys.push(key);
            }

            // Export everything from localStorage
            allKeys.forEach(key => {
                try {
                    const value = localStorage.getItem(key);
                    if (value) {
                        backup.data[key] = JSON.parse(value);
                    }
                } catch (error) {
                    console.warn(`Could not parse key: ${key}`, error);
                    // Store as string if can't parse as JSON
                    backup.data[key] = localStorage.getItem(key);
                }
            });

            return backup;
        }

        /**
         * Download backup file
         * @param {Object} backup - Backup data object
         */
        downloadBackup(backup) {
            const filename = `driller-backup-${new Date().toISOString().split('T')[0]}.json`;
            const json = JSON.stringify(backup, null, 2);
            const blob = new Blob([json], { type: 'application/json' });
            const url = URL.createObjectURL(blob);

            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            a.click();

            URL.revokeObjectURL(url);
        }

        /**
         * Parse and validate backup file
         * @param {File} file - Uploaded backup file
         * @returns {Promise<Object>} Parsed backup data
         */
        async parseBackupFile(file) {
            return new Promise((resolve, reject) => {
                const reader = new FileReader();

                reader.onload = (e) => {
                    try {
                        const backup = JSON.parse(e.target.result);

                        // Validate backup structure
                        if (!backup.version || !backup.data) {
                            reject(new Error('Invalid backup file format'));
                            return;
                        }

                        resolve(backup);
                    } catch (error) {
                        reject(new Error('Failed to parse backup file: ' + error.message));
                    }
                };

                reader.onerror = () => {
                    reject(new Error('Failed to read file'));
                };

                reader.readAsText(file);
            });
        }

        /**
         * Get statistics about backup data
         * @param {Object} backup - Backup data
         * @returns {Object} Statistics
         */
        getBackupStats(backup) {
            const stats = {
                exportDate: backup.exportDate,
                totalKeys: Object.keys(backup.data).length,
                reports: 0,
                clients: 0,
                invoices: 0,
                expenses: 0,
                rateSheets: 0,
                projects: 0
            };

            Object.keys(backup.data).forEach(key => {
                if (key.includes('bossReports') || key.includes('reportData')) {
                    const data = backup.data[key];
                    if (Array.isArray(data)) {
                        stats.reports += data.length;
                    }
                }
                if (key.includes('clients')) {
                    const data = backup.data[key];
                    if (Array.isArray(data)) {
                        stats.clients += data.length;
                    }
                }
                if (key.includes('invoices')) {
                    const data = backup.data[key];
                    if (Array.isArray(data)) {
                        stats.invoices += data.length;
                    }
                }
                if (key.includes('expenses')) {
                    const data = backup.data[key];
                    if (Array.isArray(data)) {
                        stats.expenses += data.length;
                    }
                }
                if (key.includes('rateSheets')) {
                    const data = backup.data[key];
                    if (Array.isArray(data)) {
                        stats.rateSheets += data.length;
                    }
                }
                if (key.includes('projectsList')) {
                    const data = backup.data[key];
                    if (Array.isArray(data)) {
                        stats.projects += data.length;
                    }
                }
            });

            return stats;
        }

        /**
         * Import backup data (replace all existing data)
         * @param {Object} backup - Backup data to import
         * @returns {Object} Import results
         */
        importDataReplace(backup) {
            const results = {
                success: false,
                keysImported: 0,
                errors: []
            };

            try {
                // Clear all existing data first
                localStorage.clear();

                // Import all data from backup
                Object.keys(backup.data).forEach(key => {
                    try {
                        const value = backup.data[key];
                        const jsonValue = typeof value === 'string' ? value : JSON.stringify(value);
                        localStorage.setItem(key, jsonValue);
                        results.keysImported++;
                    } catch (error) {
                        results.errors.push(`Failed to import key "${key}": ${error.message}`);
                    }
                });

                results.success = results.errors.length === 0;
            } catch (error) {
                results.errors.push(`Import failed: ${error.message}`);
            }

            return results;
        }

        /**
         * Import backup data (merge with existing data)
         * @param {Object} backup - Backup data to merge
         * @returns {Object} Import results
         */
        importDataMerge(backup) {
            const results = {
                success: false,
                keysImported: 0,
                keysUpdated: 0,
                keysSkipped: 0,
                errors: []
            };

            try {
                Object.keys(backup.data).forEach(key => {
                    try {
                        const existingValue = localStorage.getItem(key);
                        const newValue = backup.data[key];

                        if (!existingValue) {
                            // New key - add it
                            const jsonValue = typeof newValue === 'string' ? newValue : JSON.stringify(newValue);
                            localStorage.setItem(key, jsonValue);
                            results.keysImported++;
                        } else {
                            // Key exists - merge arrays, replace other types
                            try {
                                const existing = JSON.parse(existingValue);

                                if (Array.isArray(existing) && Array.isArray(newValue)) {
                                    // Merge arrays by ID if possible
                                    const merged = this.mergeArrays(existing, newValue);
                                    localStorage.setItem(key, JSON.stringify(merged));
                                    results.keysUpdated++;
                                } else {
                                    // Replace non-array values
                                    const jsonValue = typeof newValue === 'string' ? newValue : JSON.stringify(newValue);
                                    localStorage.setItem(key, jsonValue);
                                    results.keysUpdated++;
                                }
                            } catch (parseError) {
                                // If can't parse, just replace
                                const jsonValue = typeof newValue === 'string' ? newValue : JSON.stringify(newValue);
                                localStorage.setItem(key, jsonValue);
                                results.keysUpdated++;
                            }
                        }
                    } catch (error) {
                        results.errors.push(`Failed to merge key "${key}": ${error.message}`);
                        results.keysSkipped++;
                    }
                });

                results.success = results.errors.length === 0;
            } catch (error) {
                results.errors.push(`Merge failed: ${error.message}`);
            }

            return results;
        }

        /**
         * Merge two arrays intelligently
         * @param {Array} existing - Existing array
         * @param {Array} incoming - Incoming array
         * @returns {Array} Merged array
         */
        mergeArrays(existing, incoming) {
            const merged = [...existing];
            const existingIds = new Set(existing.map(item => item.id).filter(id => id !== undefined));

            incoming.forEach(item => {
                if (item.id && existingIds.has(item.id)) {
                    // Update existing item
                    const index = merged.findIndex(e => e.id === item.id);
                    if (index !== -1) {
                        merged[index] = { ...merged[index], ...item };
                    }
                } else {
                    // Add new item
                    merged.push(item);
                }
            });

            return merged;
        }
    }

    // Export service
    window.DataExportImportService = DataExportImportService;

    console.log('✓ DataExportImportService initialized');

})();
