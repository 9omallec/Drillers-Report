// Modal Component
// Custom modal dialogs to replace native confirm() and prompt()

(function() {
    'use strict';

    const { useState, useEffect, useRef } = React;

    /**
     * Modal Component
     * @param {Object} props
     * @param {boolean} props.isOpen - Whether modal is visible
     * @param {Function} props.onClose - Called when modal closes
     * @param {string} props.title - Modal title
     * @param {React.ReactNode} props.children - Modal content
     * @param {boolean} props.darkMode - Dark mode styling
     * @param {string} props.size - Modal size: 'sm', 'md', 'lg'
     */
    function Modal({ isOpen, onClose, title, children, darkMode, size = 'md' }) {
        const modalRef = useRef(null);

        // Handle escape key
        useEffect(() => {
            const handleEscape = (e) => {
                if (e.key === 'Escape' && isOpen) {
                    onClose();
                }
            };

            document.addEventListener('keydown', handleEscape);
            return () => document.removeEventListener('keydown', handleEscape);
        }, [isOpen, onClose]);

        // Focus trap
        useEffect(() => {
            if (isOpen && modalRef.current) {
                const focusableElements = modalRef.current.querySelectorAll(
                    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
                );
                if (focusableElements.length > 0) {
                    focusableElements[0].focus();
                }
            }
        }, [isOpen]);

        if (!isOpen) return null;

        const sizeClasses = {
            sm: 'max-w-sm',
            md: 'max-w-md',
            lg: 'max-w-lg'
        };

        return (
            <div
                className="fixed inset-0 z-50 flex items-center justify-center p-4"
                role="dialog"
                aria-modal="true"
                aria-labelledby="modal-title"
            >
                {/* Backdrop */}
                <div
                    className="absolute inset-0 bg-black bg-opacity-50"
                    onClick={onClose}
                    aria-hidden="true"
                />

                {/* Modal Content */}
                <div
                    ref={modalRef}
                    className={`relative w-full ${sizeClasses[size]} ${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-xl`}
                >
                    {/* Header */}
                    {title && (
                        <div className={`px-4 py-3 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                            <h3
                                id="modal-title"
                                className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}
                            >
                                {title}
                            </h3>
                        </div>
                    )}

                    {/* Body */}
                    <div className="p-4">
                        {children}
                    </div>
                </div>
            </div>
        );
    }

    /**
     * Confirm Modal Component
     * @param {Object} props
     * @param {boolean} props.isOpen - Whether modal is visible
     * @param {Function} props.onConfirm - Called when confirmed
     * @param {Function} props.onCancel - Called when cancelled
     * @param {string} props.title - Modal title
     * @param {string} props.message - Confirmation message
     * @param {boolean} props.darkMode - Dark mode styling
     * @param {string} props.confirmText - Confirm button text
     * @param {string} props.cancelText - Cancel button text
     * @param {string} props.variant - Button variant: 'danger', 'primary'
     */
    function ConfirmModal({
        isOpen,
        onConfirm,
        onCancel,
        title = 'Confirm',
        message,
        darkMode,
        confirmText = 'Confirm',
        cancelText = 'Cancel',
        variant = 'primary'
    }) {
        const confirmButtonClass = variant === 'danger'
            ? 'bg-red-600 hover:bg-red-700 text-white'
            : 'bg-blue-600 hover:bg-blue-700 text-white';

        return (
            <Modal isOpen={isOpen} onClose={onCancel} title={title} darkMode={darkMode} size="sm">
                <p className={`mb-4 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    {message}
                </p>
                <div className="flex gap-3 justify-end">
                    <button
                        onClick={onCancel}
                        className={`px-4 py-2 rounded-lg font-medium ${
                            darkMode
                                ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                        aria-label={cancelText}
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={onConfirm}
                        className={`px-4 py-2 rounded-lg font-medium ${confirmButtonClass}`}
                        aria-label={confirmText}
                    >
                        {confirmText}
                    </button>
                </div>
            </Modal>
        );
    }

    /**
     * Prompt Modal Component
     * @param {Object} props
     * @param {boolean} props.isOpen - Whether modal is visible
     * @param {Function} props.onSubmit - Called with input value
     * @param {Function} props.onCancel - Called when cancelled
     * @param {string} props.title - Modal title
     * @param {string} props.message - Prompt message
     * @param {string} props.placeholder - Input placeholder
     * @param {string} props.defaultValue - Default input value
     * @param {boolean} props.darkMode - Dark mode styling
     * @param {boolean} props.multiline - Use textarea instead of input
     */
    function PromptModal({
        isOpen,
        onSubmit,
        onCancel,
        title = 'Input',
        message,
        placeholder = '',
        defaultValue = '',
        darkMode,
        multiline = false,
        submitText = 'Submit',
        cancelText = 'Cancel'
    }) {
        const [value, setValue] = useState(defaultValue);

        // Reset value when modal opens
        useEffect(() => {
            if (isOpen) {
                setValue(defaultValue);
            }
        }, [isOpen, defaultValue]);

        const handleSubmit = (e) => {
            e.preventDefault();
            onSubmit(value);
        };

        const inputClass = `w-full px-3 py-2 rounded-lg border ${
            darkMode
                ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
        } focus:outline-none focus:ring-2 focus:ring-blue-500`;

        return (
            <Modal isOpen={isOpen} onClose={onCancel} title={title} darkMode={darkMode} size="md">
                <form onSubmit={handleSubmit}>
                    {message && (
                        <p className={`mb-3 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                            {message}
                        </p>
                    )}

                    {multiline ? (
                        <textarea
                            value={value}
                            onChange={(e) => setValue(e.target.value)}
                            placeholder={placeholder}
                            className={`${inputClass} min-h-[100px] resize-y`}
                            autoFocus
                            aria-label={message || title}
                        />
                    ) : (
                        <input
                            type="text"
                            value={value}
                            onChange={(e) => setValue(e.target.value)}
                            placeholder={placeholder}
                            className={inputClass}
                            autoFocus
                            aria-label={message || title}
                        />
                    )}

                    <div className="flex gap-3 justify-end mt-4">
                        <button
                            type="button"
                            onClick={onCancel}
                            className={`px-4 py-2 rounded-lg font-medium ${
                                darkMode
                                    ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                            }`}
                            aria-label={cancelText}
                        >
                            {cancelText}
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 rounded-lg font-medium bg-blue-600 hover:bg-blue-700 text-white"
                            aria-label={submitText}
                        >
                            {submitText}
                        </button>
                    </div>
                </form>
            </Modal>
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
    window.Modal = Modal;
    window.ConfirmModal = ConfirmModal;
    window.PromptModal = PromptModal;
    window.useModal = useModal;

})();
