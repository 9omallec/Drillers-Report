/**
 * Toast Notification Component
 * Replaces alert() with modern toast notifications
 */

(function() {
    'use strict';

    const { useState, useEffect } = React;

    // Toast Item Component
    function ToastItem({ toast, onClose, darkMode }) {
        useEffect(() => {
            if (toast.duration && toast.duration > 0) {
                const timer = setTimeout(() => {
                    onClose(toast.id);
                }, toast.duration);

                return () => clearTimeout(timer);
            }
        }, [toast.id, toast.duration]);

        const typeStyles = {
            success: 'bg-green-600 text-white',
            error: 'bg-red-600 text-white',
            warning: 'bg-yellow-600 text-white',
            info: darkMode ? 'bg-blue-600 text-white' : 'bg-blue-500 text-white'
        };

        const icons = {
            success: '✓',
            error: '✗',
            warning: '⚠',
            info: 'ℹ'
        };

        return React.createElement(
            'div',
            {
                className: `${typeStyles[toast.type || 'info']} px-4 py-3 rounded-lg shadow-lg flex items-center justify-between gap-3 min-w-[300px] max-w-md animate-slide-in`,
                role: 'alert'
            },
            React.createElement('div', { className: 'flex items-center gap-3' },
                React.createElement('span', { className: 'text-xl font-bold' }, icons[toast.type || 'info']),
                React.createElement('div', {},
                    toast.title && React.createElement('div', { className: 'font-bold' }, toast.title),
                    React.createElement('div', { className: toast.title ? 'text-sm' : '' }, toast.message)
                )
            ),
            React.createElement('button', {
                onClick: () => onClose(toast.id),
                className: 'text-white hover:text-gray-200 font-bold text-xl',
                'aria-label': 'Close'
            }, '×')
        );
    }

    // Toast Container Component
    function ToastContainer({ toasts, removeToast, position = 'top-right', darkMode }) {
        const positionClasses = {
            'top-right': 'top-4 right-4',
            'top-left': 'top-4 left-4',
            'top-center': 'top-4 left-1/2 -translate-x-1/2',
            'bottom-right': 'bottom-4 right-4',
            'bottom-left': 'bottom-4 left-4',
            'bottom-center': 'bottom-4 left-1/2 -translate-x-1/2'
        };

        return React.createElement(
            'div',
            {
                className: `fixed ${positionClasses[position]} z-[9999] flex flex-col gap-2`,
                'aria-live': 'polite'
            },
            toasts.map(toast =>
                React.createElement(ToastItem, {
                    key: toast.id,
                    toast,
                    onClose: removeToast,
                    darkMode
                })
            )
        );
    }

    // Export components
    window.ToastComponents = {
        ToastContainer,
        ToastItem
    };

})();

// Add CSS animation for toast slide-in
if (!document.getElementById('toast-styles')) {
    const style = document.createElement('style');
    style.id = 'toast-styles';
    style.textContent = `
        @keyframes slide-in {
            from {
                transform: translateX(100%);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
        .animate-slide-in {
            animation: slide-in 0.3s ease-out;
        }
    `;
    document.head.appendChild(style);
}
