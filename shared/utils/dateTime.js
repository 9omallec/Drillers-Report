/**
 * Date and Time Utilities
 * Shared date/time formatting and parsing functions
 */

const DateTimeUtils = {
    /**
     * Format date to YYYY-MM-DD
     * @param {Date|string} date - Date to format
     * @returns {string} Formatted date string
     */
    formatDate(date) {
        const d = new Date(date);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    },

    /**
     * Format date to readable string (e.g., "January 1, 2024")
     * @param {Date|string} date - Date to format
     * @returns {string} Formatted date string
     */
    formatDateReadable(date) {
        const d = new Date(date);
        return d.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    },

    /**
     * Format time to HH:MM
     * @param {Date|string} time - Time to format
     * @returns {string} Formatted time string
     */
    formatTime(time) {
        const d = new Date(time);
        const hours = String(d.getHours()).padStart(2, '0');
        const minutes = String(d.getMinutes()).padStart(2, '0');
        return `${hours}:${minutes}`;
    },

    /**
     * Get current date in YYYY-MM-DD format
     * @returns {string} Current date
     */
    getCurrentDate() {
        return this.formatDate(new Date());
    },

    /**
     * Get current time in HH:MM format
     * @returns {string} Current time
     */
    getCurrentTime() {
        return this.formatTime(new Date());
    },

    /**
     * Parse date string to Date object
     * @param {string} dateString - Date string to parse
     * @returns {Date} Date object
     */
    parseDate(dateString) {
        return new Date(dateString);
    },

    /**
     * Check if date is valid
     * @param {Date|string} date - Date to check
     * @returns {boolean} True if valid
     */
    isValidDate(date) {
        const d = new Date(date);
        return d instanceof Date && !isNaN(d);
    },

    /**
     * Get day of week from date
     * @param {Date|string} date - Date
     * @returns {string} Day of week (e.g., "Monday")
     */
    getDayOfWeek(date) {
        const d = new Date(date);
        return d.toLocaleDateString('en-US', { weekday: 'long' });
    },

    /**
     * Calculate days between two dates
     * @param {Date|string} date1 - First date
     * @param {Date|string} date2 - Second date
     * @returns {number} Number of days
     */
    daysBetween(date1, date2) {
        const d1 = new Date(date1);
        const d2 = new Date(date2);
        const diffTime = Math.abs(d2 - d1);
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    },

    /**
     * Format ISO date string to local date
     * @param {string} isoString - ISO date string
     * @returns {string} Local date string
     */
    isoToLocal(isoString) {
        const date = new Date(isoString);
        return this.formatDate(date);
    },

    /**
     * Get relative time string (e.g., "2 days ago")
     * @param {Date|string} date - Date to compare
     * @returns {string} Relative time string
     */
    getRelativeTime(date) {
        const d = new Date(date);
        const now = new Date();
        const diffMs = now - d;
        const diffSecs = Math.floor(diffMs / 1000);
        const diffMins = Math.floor(diffSecs / 60);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffDays > 7) {
            return this.formatDateReadable(d);
        } else if (diffDays > 0) {
            return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
        } else if (diffHours > 0) {
            return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
        } else if (diffMins > 0) {
            return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
        } else {
            return 'Just now';
        }
    }
};

// Export utilities
window.DateTimeUtils = DateTimeUtils;
