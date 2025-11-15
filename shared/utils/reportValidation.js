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
        SEVERITY
    };

})();
