// Error Boundary Component
// Catches JavaScript errors in child components and displays fallback UI

(function() {
    'use strict';

    class ErrorBoundary extends React.Component {
        constructor(props) {
            super(props);
            this.state = {
                hasError: false,
                error: null,
                errorInfo: null
            };
        }

        static getDerivedStateFromError(error) {
            // Update state so next render shows fallback UI
            return { hasError: true };
        }

        componentDidCatch(error, errorInfo) {
            // Log error details
            this.setState({
                error: error,
                errorInfo: errorInfo
            });

            // Log to console for debugging (can be sent to error reporting service)
            console.error('Error Boundary caught an error:', error, errorInfo);
        }

        handleReload = () => {
            window.location.reload();
        };

        handleReset = () => {
            this.setState({
                hasError: false,
                error: null,
                errorInfo: null
            });
        };

        render() {
            if (this.state.hasError) {
                // Check if custom fallback provided
                if (this.props.fallback) {
                    return this.props.fallback;
                }

                // Default error UI
                return React.createElement('div', {
                    className: 'min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 p-4'
                },
                    React.createElement('div', {
                        className: 'max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 text-center'
                    },
                        // Error icon
                        React.createElement('div', {
                            className: 'mx-auto w-16 h-16 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mb-4'
                        },
                            React.createElement('svg', {
                                className: 'w-8 h-8 text-red-600 dark:text-red-400',
                                fill: 'none',
                                stroke: 'currentColor',
                                viewBox: '0 0 24 24',
                                'aria-hidden': 'true'
                            },
                                React.createElement('path', {
                                    strokeLinecap: 'round',
                                    strokeLinejoin: 'round',
                                    strokeWidth: '2',
                                    d: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z'
                                })
                            )
                        ),
                        // Title
                        React.createElement('h2', {
                            className: 'text-xl font-semibold text-gray-900 dark:text-white mb-2'
                        }, 'Something went wrong'),
                        // Description
                        React.createElement('p', {
                            className: 'text-gray-600 dark:text-gray-400 mb-4'
                        }, 'An unexpected error occurred. Your data has been saved locally.'),
                        // Error details (collapsible in dev)
                        this.state.error && React.createElement('details', {
                            className: 'mb-4 text-left'
                        },
                            React.createElement('summary', {
                                className: 'text-sm text-gray-500 dark:text-gray-400 cursor-pointer hover:text-gray-700 dark:hover:text-gray-300'
                            }, 'Error details'),
                            React.createElement('pre', {
                                className: 'mt-2 p-2 bg-gray-100 dark:bg-gray-700 rounded text-xs overflow-auto max-h-32 text-red-600 dark:text-red-400'
                            }, this.state.error.toString())
                        ),
                        // Action buttons
                        React.createElement('div', {
                            className: 'flex gap-3 justify-center'
                        },
                            React.createElement('button', {
                                onClick: this.handleReset,
                                className: 'px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors',
                                'aria-label': 'Try again without reloading'
                            }, 'Try Again'),
                            React.createElement('button', {
                                onClick: this.handleReload,
                                className: 'px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors',
                                'aria-label': 'Reload the page'
                            }, 'Reload Page')
                        )
                    )
                );
            }

            return this.props.children;
        }
    }

    // Export component
    window.ErrorBoundary = ErrorBoundary;

})();
