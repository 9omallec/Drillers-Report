// Debounce Hook - Delays updating a value until after a delay period
// Useful for search inputs to avoid expensive operations on every keystroke

(function() {
    'use strict';

    const { useState, useEffect } = React;

    /**
     * Debounces a value by delaying its update until after the specified delay
     * @param {*} value - The value to debounce
     * @param {number} delay - The delay in milliseconds (default: 300ms)
     * @returns {*} The debounced value
     */
    window.useDebounce = function useDebounce(value, delay = 300) {
        const [debouncedValue, setDebouncedValue] = useState(value);

        useEffect(() => {
            // Set up a timer to update the debounced value after the delay
            const handler = setTimeout(() => {
                setDebouncedValue(value);
            }, delay);

            // Clean up the timer if value changes before delay is up
            return () => {
                clearTimeout(handler);
            };
        }, [value, delay]);

        return debouncedValue;
    };

})();
