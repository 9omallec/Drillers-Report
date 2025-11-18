// Loading Spinner Component
// Reusable loading indicator for async operations

(function() {
    'use strict';

    /**
     * LoadingSpinner Component - Shows a spinner during loading states
     * @param {Object} props - Component props
     * @param {boolean} props.darkMode - Dark mode flag
     * @param {string} props.message - Optional loading message
     * @param {string} props.size - Size: 'sm', 'md', 'lg' (default: 'md')
     */
    window.LoadingSpinner = function LoadingSpinner({ darkMode = false, message = 'Loading...', size = 'md' }) {
        const sizeClasses = {
            sm: 'w-6 h-6 border-2',
            md: 'w-10 h-10 border-3',
            lg: 'w-16 h-16 border-4'
        };

        const spinnerSize = sizeClasses[size] || sizeClasses.md;

        return React.createElement('div', {
            className: 'flex flex-col items-center justify-center p-8'
        },
            React.createElement('div', {
                className: `${spinnerSize} border-green-600 border-t-transparent rounded-full animate-spin`,
                style: { animation: 'spin 0.8s linear infinite' }
            }),
            message && React.createElement('p', {
                className: `mt-4 text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`
            }, message)
        );
    };

    /**
     * LoadingOverlay Component - Full-screen loading overlay
     */
    window.LoadingOverlay = function LoadingOverlay({ darkMode = false, message = 'Loading...' }) {
        return React.createElement('div', {
            className: `fixed inset-0 z-50 flex items-center justify-center ${
                darkMode ? 'bg-gray-900 bg-opacity-90' : 'bg-white bg-opacity-90'
            }`
        },
            React.createElement(window.LoadingSpinner, { darkMode, message, size: 'lg' })
        );
    };

    // Add spin animation to document if not already present
    if (!document.getElementById('spinner-animation-styles')) {
        const style = document.createElement('style');
        style.id = 'spinner-animation-styles';
        style.textContent = `
            @keyframes spin {
                from { transform: rotate(0deg); }
                to { transform: rotate(360deg); }
            }
        `;
        document.head.appendChild(style);
    }

    console.log('✓ LoadingSpinner components initialized');

})();
