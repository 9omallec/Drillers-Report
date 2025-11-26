// Modal Component
// Custom modal dialogs to replace native confirm() and prompt()

(function() {
    'use strict';

    const { useState, useEffect, useRef } = React;

    /**
     * ConfirmModal Component - For confirmation dialogs
     */
    function ConfirmModal({ isOpen, onConfirm, onCancel, title, message, confirmText = 'OK', cancelText = 'Cancel', variant = 'primary', darkMode = false }) {
        if (!isOpen) return null;

        const variantClasses = {
            primary: 'bg-blue-600 hover:bg-blue-700',
            danger: 'bg-red-600 hover:bg-red-700',
            success: 'bg-green-600 hover:bg-green-700'
        };

        return React.createElement('div',
            { className: 'fixed inset-0 z-50 flex items-center justify-center p-4' },
            // Backdrop
            React.createElement('div', {
                className: 'absolute inset-0 bg-black bg-opacity-50',
                onClick: onCancel
            }),
            // Modal
            React.createElement('div', {
                className: `relative w-full max-w-md ${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-xl p-6`
            },
                // Title
                title && React.createElement('h3', {
                    className: `text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`
                }, title),
                // Message
                React.createElement('p', {
                    className: `mb-6 ${darkMode ? 'text-gray-300' : 'text-gray-600'} whitespace-pre-line`
                }, message),
                // Buttons
                React.createElement('div', {
                    className: 'flex gap-3 justify-end'
                },
                    React.createElement('button', {
                        onClick: onCancel,
                        className: `px-4 py-2 rounded-lg font-medium ${darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`
                    }, cancelText),
                    React.createElement('button', {
                        onClick: onConfirm,
                        className: `px-4 py-2 rounded-lg font-medium text-white ${variantClasses[variant]}`
                    }, confirmText)
                )
            )
        );
    }

    /**
     * PromptModal Component - For input dialogs
     */
    function PromptModal({ isOpen, onSubmit, onCancel, title, message, placeholder = '', defaultValue = '', darkMode = false, multiline = false }) {
        const [value, setValue] = useState(defaultValue);

        useEffect(() => {
            setValue(defaultValue);
        }, [defaultValue, isOpen]);

        if (!isOpen) return null;

        const handleSubmit = (e) => {
            e.preventDefault();
            onSubmit(value);
        };

        return React.createElement('div',
            { className: 'fixed inset-0 z-50 flex items-center justify-center p-4' },
            // Backdrop
            React.createElement('div', {
                className: 'absolute inset-0 bg-black bg-opacity-50',
                onClick: onCancel
            }),
            // Modal
            React.createElement('div', {
                className: `relative w-full max-w-md ${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-xl p-6`
            },
                React.createElement('form', { onSubmit: handleSubmit },
                    // Title
                    title && React.createElement('h3', {
                        className: `text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`
                    }, title),
                    // Message
                    message && React.createElement('p', {
                        className: `mb-4 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`
                    }, message),
                    // Input
                    React.createElement(multiline ? 'textarea' : 'input', {
                        type: multiline ? undefined : 'text',
                        value: value,
                        onChange: (e) => setValue(e.target.value),
                        placeholder: placeholder,
                        className: `w-full px-3 py-2 border rounded-lg mb-6 ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`,
                        rows: multiline ? 4 : undefined,
                        autoFocus: true
                    }),
                    // Buttons
                    React.createElement('div', {
                        className: 'flex gap-3 justify-end'
                    },
                        React.createElement('button', {
                            type: 'button',
                            onClick: onCancel,
                            className: `px-4 py-2 rounded-lg font-medium ${darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`
                        }, 'Cancel'),
                        React.createElement('button', {
                            type: 'submit',
                            className: 'px-4 py-2 rounded-lg font-medium text-white bg-blue-600 hover:bg-blue-700'
                        }, 'Submit')
                    )
                )
            )
        );
    }

    /**
     * useModal Hook - Provides modal state management
     */
    function useModal() {
        const [isOpen, setIsOpen] = useState(false);
        const [modalData, setModalData] = useState(null);

        const open = (data = null) => {
            setModalData(data);
            setIsOpen(true);
        };

        const close = () => {
            setIsOpen(false);
            setModalData(null);
        };

        return {
            isOpen,
            modalData,
            open,
            close
        };
    }

    // Export components
    window.ConfirmModal = ConfirmModal;
    window.PromptModal = PromptModal;
    window.useModal = useModal;

    console.log('✓ Modal components initialized');

})();
