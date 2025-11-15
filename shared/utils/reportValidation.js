/**
 * Report Validation Utility
 * Detects incomplete reports, missing data, and data quality issues
 */

(function() {
    'use strict';

    /**
     * Validation severity levels
     */
    const SEVERITY = {
        CRITICAL: 'critical',    // Missing essential data that makes report unusable
        WARNING: 'warning',      // Missing recommended data or potential issues
        INFO: 'info'            // Suggestions for improvement
    };

    /**
     * Validates a single report and returns list of issues
     * @param {Object} report - Report object to validate
     * @returns {Object} Validation result with issues array and summary
     */
    function validateReport(report) {
        const issues = [];

        // Critical: Missing basic report information
        if (!report.client && !report.customer) {
            issues.push({
                severity: SEVERITY.CRITICAL,
                field: 'client',
                message: 'Client/Customer name is missing',
                category: 'basic-info'
            });
        }

        if (!report.jobName && !report.job) {
            issues.push({
                severity: SEVERITY.CRITICAL,
                field: 'jobName',
                message: 'Job name is missing',
                category: 'basic-info'
            });
        }

        if (!report.driller) {
            issues.push({
                severity: SEVERITY.CRITICAL,
                field: 'driller',
                message: 'Driller name is missing',
                category: 'basic-info'
            });
        }

        if (!report.location) {
            issues.push({
                severity: SEVERITY.WARNING,
                field: 'location',
                message: 'Location is not specified',
                category: 'basic-info'
            });
        }

        if (!report.date && !report.importedAt) {
            issues.push({
                severity: SEVERITY.WARNING,
                field: 'date',
                message: 'Report date is missing',
                category: 'basic-info'
            });
        }

        // Critical: Missing work days
        if (!report.workDays || report.workDays.length === 0) {
            issues.push({
                severity: SEVERITY.CRITICAL,
                field: 'workDays',
                message: 'No work days recorded',
                category: 'work-data'
            });
        } else {
            // Validate individual work days
            report.workDays.forEach((day, index) => {
                if (!day.date) {
                    issues.push({
                        severity: SEVERITY.WARNING,
                        field: `workDays[${index}].date`,
                        message: `Work day ${index + 1} is missing a date`,
                        category: 'work-data'
                    });
                }

                const hoursOnSite = parseFloat(day.hoursOnSite) || 0;
                const hoursDriving = parseFloat(day.hoursDriving) || 0;

                if (hoursOnSite === 0 && hoursDriving === 0) {
                    issues.push({
                        severity: SEVERITY.WARNING,
                        field: `workDays[${index}].hours`,
                        message: `Work day ${index + 1} has no hours recorded`,
                        category: 'work-data'
                    });
                }

                // Missing time fields
                if (!day.timeLeftShop && !day.arrivedOnSite && !day.timeLeftSite && !day.arrivedAtShop) {
                    issues.push({
                        severity: SEVERITY.INFO,
                        field: `workDays[${index}].times`,
                        message: `Work day ${index + 1} has no time entries`,
                        category: 'work-data'
                    });
                }
            });
        }

        // Critical: Missing borings
        if (!report.borings || report.borings.length === 0) {
            issues.push({
                severity: SEVERITY.CRITICAL,
                field: 'borings',
                message: 'No borings recorded',
                category: 'boring-data'
            });
        } else {
            let totalFootage = 0;

            // Validate individual borings
            report.borings.forEach((boring, index) => {
                const footage = parseFloat(boring.footage) || 0;
                totalFootage += footage;

                if (footage === 0) {
                    issues.push({
                        severity: SEVERITY.WARNING,
                        field: `borings[${index}].footage`,
                        message: `Boring ${index + 1} has no footage recorded`,
                        category: 'boring-data'
                    });
                }

                if (footage < 0) {
                    issues.push({
                        severity: SEVERITY.WARNING,
                        field: `borings[${index}].footage`,
                        message: `Boring ${index + 1} has negative footage (${footage})`,
                        category: 'boring-data'
                    });
                }

                if (!boring.method) {
                    issues.push({
                        severity: SEVERITY.INFO,
                        field: `borings[${index}].method`,
                        message: `Boring ${index + 1} has no method specified`,
                        category: 'boring-data'
                    });
                }
            });

            if (totalFootage === 0) {
                issues.push({
                    severity: SEVERITY.CRITICAL,
                    field: 'borings.totalFootage',
                    message: 'Total footage is 0 across all borings',
                    category: 'boring-data'
                });
            }
        }

        // Warning: Missing equipment information
        if (report.equipment) {
            const hasEquipment = report.equipment.drillRig ||
                               report.equipment.truck ||
                               report.equipment.coreMachine ||
                               report.equipment.groutMachine;

            if (!hasEquipment) {
                issues.push({
                    severity: SEVERITY.INFO,
                    field: 'equipment',
                    message: 'No equipment information recorded',
                    category: 'equipment'
                });
            }
        }

        // Calculate summary
        const criticalCount = issues.filter(i => i.severity === SEVERITY.CRITICAL).length;
        const warningCount = issues.filter(i => i.severity === SEVERITY.WARNING).length;
        const infoCount = issues.filter(i => i.severity === SEVERITY.INFO).length;

        const isComplete = criticalCount === 0;
        const hasWarnings = warningCount > 0;

        return {
            isComplete,
            hasWarnings,
            issues,
            summary: {
                critical: criticalCount,
                warning: warningCount,
                info: infoCount,
                total: issues.length
            }
        };
    }

    /**
     * Validates multiple reports and returns summary
     * @param {Array} reports - Array of report objects
     * @returns {Object} Validation summary with incomplete reports list
     */
    function validateReports(reports) {
        const results = reports.map(report => ({
            report,
            validation: validateReport(report)
        }));

        const incompleteReports = results.filter(r => !r.validation.isComplete);
        const reportsWithWarnings = results.filter(r => r.validation.hasWarnings);

        return {
            totalReports: reports.length,
            incompleteReports: incompleteReports.map(r => r.report),
            reportsWithWarnings: reportsWithWarnings.map(r => r.report),
            incompleteCount: incompleteReports.length,
            warningCount: reportsWithWarnings.length,
            results
        };
    }

    /**
     * Find duplicate reports based on key fields
     * @param {Array} reports - Array of report objects
     * @param {Object} options - Options for duplicate detection
     * @returns {Array} Array of duplicate groups
     */
    function findDuplicates(reports, options = {}) {
        const {
            checkFields = ['client', 'jobName', 'date', 'driller'], // Fields to compare
            fuzzyMatch = false, // Use fuzzy matching for strings
            dateThreshold = 1 // Days threshold for date comparison
        } = options;

        const duplicateGroups = [];
        const processedIds = new Set();

        reports.forEach((report, index) => {
            if (processedIds.has(report.id)) return;

            const duplicates = [report];

            // Compare with remaining reports
            for (let i = index + 1; i < reports.length; i++) {
                const other = reports[i];
                if (processedIds.has(other.id)) continue;

                let isDuplicate = true;

                // Check each field
                for (const field of checkFields) {
                    const val1 = getReportValue(report, field);
                    const val2 = getReportValue(other, field);

                    if (field === 'date') {
                        // Date comparison with threshold
                        if (!compareDates(val1, val2, dateThreshold)) {
                            isDuplicate = false;
                            break;
                        }
                    } else if (typeof val1 === 'string' && typeof val2 === 'string') {
                        // String comparison (case-insensitive)
                        if (fuzzyMatch) {
                            if (calculateSimilarity(val1, val2) < 0.8) {
                                isDuplicate = false;
                                break;
                            }
                        } else {
                            if (val1.toLowerCase().trim() !== val2.toLowerCase().trim()) {
                                isDuplicate = false;
                                break;
                            }
                        }
                    } else {
                        // Direct comparison
                        if (val1 !== val2) {
                            isDuplicate = false;
                            break;
                        }
                    }
                }

                if (isDuplicate) {
                    duplicates.push(other);
                    processedIds.add(other.id);
                }
            }

            if (duplicates.length > 1) {
                duplicateGroups.push(duplicates);
                duplicates.forEach(d => processedIds.add(d.id));
            }
        });

        return duplicateGroups;
    }

    /**
     * Get value from report, handling field name variations
     */
    function getReportValue(report, field) {
        if (field === 'client') {
            return report.client || report.customer || '';
        }
        if (field === 'jobName') {
            return report.jobName || report.job || '';
        }
        if (field === 'date') {
            return report.date || report.importedAt || '';
        }
        return report[field] || '';
    }

    /**
     * Compare dates with threshold
     */
    function compareDates(date1, date2, thresholdDays) {
        if (!date1 || !date2) return date1 === date2;

        const d1 = new Date(date1);
        const d2 = new Date(date2);

        if (isNaN(d1) || isNaN(d2)) return date1 === date2;

        const diffMs = Math.abs(d1 - d2);
        const diffDays = diffMs / (1000 * 60 * 60 * 24);

        return diffDays <= thresholdDays;
    }

    /**
     * Calculate string similarity (simple Levenshtein-based)
     */
    function calculateSimilarity(str1, str2) {
        str1 = (str1 || '').toLowerCase().trim();
        str2 = (str2 || '').toLowerCase().trim();

        if (str1 === str2) return 1;
        if (!str1 || !str2) return 0;

        const longer = str1.length > str2.length ? str1 : str2;
        const shorter = str1.length > str2.length ? str2 : str1;

        if (longer.length === 0) return 1;

        // Simple containment check
        if (longer.includes(shorter)) {
            return shorter.length / longer.length;
        }

        // Count matching characters
        let matches = 0;
        for (let i = 0; i < shorter.length; i++) {
            if (longer.includes(shorter[i])) matches++;
        }

        return matches / longer.length;
    }

    /**
     * Check if a specific report has duplicates
     * @param {Object} report - Report to check
     * @param {Array} allReports - All reports to compare against
     * @returns {Object} Duplicate info
     */
    function checkForDuplicates(report, allReports) {
        const duplicateGroups = findDuplicates(allReports);
        const group = duplicateGroups.find(g => g.some(r => r.id === report.id));

        if (group) {
            return {
                hasDuplicates: true,
                count: group.length - 1, // Exclude the report itself
                duplicates: group.filter(r => r.id !== report.id)
            };
        }

        return {
            hasDuplicates: false,
            count: 0,
            duplicates: []
        };
    }

    /**
     * Get validation badge info for a report
     * @param {Object} report - Report object
     * @returns {Object} Badge info with color, text, and icon
     */
    function getValidationBadge(report) {
        const validation = validateReport(report);

        if (!validation.isComplete) {
            return {
                text: 'Incomplete',
                color: 'red',
                icon: '⚠',
                title: `${validation.summary.critical} critical issue(s)`,
                severity: 'critical'
            };
        }

        if (validation.hasWarnings) {
            return {
                text: 'Warnings',
                color: 'yellow',
                icon: '⚡',
                title: `${validation.summary.warning} warning(s)`,
                severity: 'warning'
            };
        }

        if (validation.summary.info > 0) {
            return {
                text: 'Info',
                color: 'blue',
                icon: 'ℹ',
                title: `${validation.summary.info} suggestion(s)`,
                severity: 'info'
            };
        }

        return {
            text: 'Complete',
            color: 'green',
            icon: '✓',
            title: 'No issues found',
            severity: 'ok'
        };
    }

    // Export to window
    window.ReportValidation = {
        validateReport,
        validateReports,
        getValidationBadge,
        findDuplicates,
        checkForDuplicates,
        SEVERITY
    };

})();
