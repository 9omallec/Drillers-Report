/**
 * Calculation Utilities
 * Shared calculation functions for time, footage, and statistics
 */

const CalculationUtils = {
    /**
     * Calculate time difference between start and end time
     * @param {string} startTime - Start time in HH:MM format
     * @param {string} endTime - End time in HH:MM format
     * @returns {number} Time difference in hours
     */
    calculateTimeDiff(startTime, endTime) {
        if (!startTime || !endTime) return 0;
        const [startHour, startMin] = startTime.split(':').map(Number);
        const [endHour, endMin] = endTime.split(':').map(Number);
        const startMinutes = startHour * 60 + startMin;
        const endMinutes = endHour * 60 + endMin;
        const diff = endMinutes - startMinutes;
        return diff / 60;
    },

    /**
     * Calculate total hours from work days
     * @param {Array} workDays - Array of work day objects
     * @returns {Object} Object with driving, onSite, standby, pitStop, and total hours
     */
    getTotalHours(workDays) {
        const totalDriving = workDays.reduce((sum, day) => sum + (parseFloat(day.hoursDriving) || 0), 0);
        const totalOnSite = workDays.reduce((sum, day) => sum + (parseFloat(day.hoursOnSite) || 0), 0);
        const totalStandby = workDays.reduce((sum, day) => {
            const hours = parseFloat(day.standbyHours) || 0;
            const minutes = parseFloat(day.standbyMinutes) || 0;
            return sum + hours + (minutes / 60);
        }, 0);
        const totalPitStop = workDays.reduce((sum, day) => {
            const hours = parseFloat(day.pitStopHours) || 0;
            const minutes = parseFloat(day.pitStopMinutes) || 0;
            return sum + hours + (minutes / 60);
        }, 0);

        return {
            driving: totalDriving.toFixed(2),
            onSite: totalOnSite.toFixed(2),
            standby: totalStandby.toFixed(2),
            pitStop: totalPitStop.toFixed(2),
            total: (totalDriving + totalOnSite + totalStandby).toFixed(2)
        };
    },

    /**
     * Calculate boring statistics
     * @param {Array} borings - Array of boring objects
     * @returns {Object} Object with totalFootage, numBorings, and depths
     */
    getBoringStats(borings) {
        const totalFootage = borings.reduce((sum, b) => sum + (parseFloat(b.footage) || 0), 0);
        const numBorings = borings.filter(b => b.footage && parseFloat(b.footage) > 0).length;
        const depths = borings
            .filter(b => b.footage && parseFloat(b.footage) > 0)
            .map(b => b.footage)
            .join(', ');

        return {
            totalFootage: totalFootage.toFixed(1),
            numBorings: numBorings,
            depths: depths
        };
    },

    /**
     * Convert hours and minutes to decimal hours
     * @param {number} hours - Whole hours
     * @param {number} minutes - Minutes
     * @returns {number} Decimal hours
     */
    hoursMinutesToDecimal(hours, minutes) {
        const h = parseFloat(hours) || 0;
        const m = parseFloat(minutes) || 0;
        return h + (m / 60);
    },

    /**
     * Convert decimal hours to hours and minutes
     * @param {number} decimalHours - Decimal hours
     * @returns {Object} Object with hours and minutes
     */
    decimalToHoursMinutes(decimalHours) {
        const hours = Math.floor(decimalHours);
        const minutes = Math.round((decimalHours - hours) * 60);
        return { hours, minutes };
    }
};

// Export utilities
window.CalculationUtils = CalculationUtils;
