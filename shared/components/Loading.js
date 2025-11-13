/**
 * Loading Components
 * Shared loading indicators, spinners, and skeleton screens
 */

(function() {
    'use strict';

    /**
     * Spinner Component - Simple animated spinner
     * @param {string} size - 'sm', 'md', 'lg'
     * @param {string} color - Color class (e.g., 'text-green-600')
     */
    function Spinner({ size = 'md', color = 'text-green-600' }) {
        const sizeClasses = {
            sm: 'w-4 h-4',
            md: 'w-8 h-8',
            lg: 'w-12 h-12'
        };

        return React.createElement(
            'div',
            { className: `inline-block ${sizeClasses[size]} ${color} animate-spin` },
            React.createElement(
                'svg',
                {
                    className: 'w-full h-full',
                    xmlns: 'http://www.w3.org/2000/svg',
                    fill: 'none',
                    viewBox: '0 0 24 24'
                },
                React.createElement('circle', {
                    className: 'opacity-25',
                    cx: '12',
                    cy: '12',
                    r: '10',
                    stroke: 'currentColor',
                    strokeWidth: '4'
                }),
                React.createElement('path', {
                    className: 'opacity-75',
                    fill: 'currentColor',
                    d: 'M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
                })
            )
        );
    }

    /**
     * Loading Overlay - Full screen loading overlay
     */
    function LoadingOverlay({ message = 'Loading...', show = false }) {
        if (!show) return null;

        return React.createElement(
            'div',
            {
                className: 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50',
                style: { backdropFilter: 'blur(2px)' }
            },
            React.createElement(
                'div',
                { className: 'bg-white dark:bg-gray-800 rounded-lg p-6 shadow-xl flex flex-col items-center gap-4' },
                React.createElement(Spinner, { size: 'lg', color: 'text-green-600' }),
                React.createElement(
                    'p',
                    { className: 'text-lg font-medium text-gray-700 dark:text-gray-200' },
                    message
                )
            )
        );
    }

    /**
     * Progress Bar Component
     */
    function ProgressBar({ progress = 0, message = '' }) {
        return React.createElement(
            'div',
            { className: 'w-full' },
            message && React.createElement(
                'p',
                { className: 'text-sm text-gray-600 dark:text-gray-300 mb-2' },
                message
            ),
            React.createElement(
                'div',
                { className: 'w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5' },
                React.createElement('div', {
                    className: 'bg-green-600 h-2.5 rounded-full transition-all duration-300',
                    style: { width: `${Math.min(100, Math.max(0, progress))}%` }
                })
            )
        );
    }

    /**
     * Skeleton Screen - For loading placeholders
     */
    function Skeleton({ className = '', count = 1 }) {
        return React.createElement(
            React.Fragment,
            null,
            ...Array(count).fill(null).map((_, i) =>
                React.createElement('div', {
                    key: i,
                    className: `${className} bg-gray-200 dark:bg-gray-700 animate-pulse rounded`
                })
            )
        );
    }

    /**
     * Report Card Skeleton - For Dashboard loading state
     */
    function ReportCardSkeleton({ count = 3 }) {
        return React.createElement(
            React.Fragment,
            null,
            ...Array(count).fill(null).map((_, i) =>
                React.createElement(
                    'div',
                    {
                        key: i,
                        className: 'bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm'
                    },
                    React.createElement(Skeleton, { className: 'h-6 w-3/4 mb-3' }),
                    React.createElement(Skeleton, { className: 'h-4 w-1/2 mb-2' }),
                    React.createElement(Skeleton, { className: 'h-4 w-2/3 mb-4' }),
                    React.createElement(
                        'div',
                        { className: 'flex gap-2' },
                        React.createElement(Skeleton, { className: 'h-10 w-24' }),
                        React.createElement(Skeleton, { className: 'h-10 w-24' })
                    )
                )
            )
        );
    }

    /**
     * Inline Loader - Small inline loading indicator
     */
    function InlineLoader({ message = 'Loading...' }) {
        return React.createElement(
            'div',
            { className: 'flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300' },
            React.createElement(Spinner, { size: 'sm' }),
            React.createElement('span', null, message)
        );
    }

    // Export components
    window.LoadingComponents = {
        Spinner,
        LoadingOverlay,
        ProgressBar,
        Skeleton,
        ReportCardSkeleton,
        InlineLoader
    };

    console.log('✓ Loading components initialized');

})();
