/**
 * useToast Hook
 * Provides toast notification functionality
 */

(function() {
    'use strict';

    const { useState, useCallback } = React;

    function useToast() {
        const [toasts, setToasts] = useState([]);

        // Add a new toast
        const showToast = useCallback((message, options = {}) => {
            const id = Date.now() + Math.random();
            const toast = {
                id,
                message,
                title: options.title || null,
                type: options.type || 'info', // 'success', 'error', 'warning', 'info'
                duration: options.duration !== undefined ? options.duration : 4000, // 0 = no auto-dismiss
                ...options
            };

            setToasts(prev => [...prev, toast]);

            // Return the toast ID in case caller wants to manually remove it
            return id;
        }, []);

        // Shorthand methods for different types
        const success = useCallback((message, options = {}) => {
            return showToast(message, { ...options, type: 'success' });
        }, [showToast]);

        const error = useCallback((message, options = {}) => {
            return showToast(message, { ...options, type: 'error' });
        }, [showToast]);

        const warning = useCallback((message, options = {}) => {
            return showToast(message, { ...options, type: 'warning' });
        }, [showToast]);

        const info = useCallback((message, options = {}) => {
            return showToast(message, { ...options, type: 'info' });
        }, [showToast]);

        // Remove a toast
        const removeToast = useCallback((id) => {
            setToasts(prev => prev.filter(toast => toast.id !== id));
        }, []);

        // Remove all toasts
        const clearAll = useCallback(() => {
            setToasts([]);
        }, []);

        return {
            toasts,
            showToast,
            success,
            error,
            warning,
            info,
            removeToast,
            clearAll
        };
    }

    // Export hook
    window.useToast = useToast;

})();
