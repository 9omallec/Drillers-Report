// Keyboard Shortcuts Hook
// Provides keyboard shortcuts for common actions

(function() {
    'use strict';

    const { useEffect, useState } = React;

    window.useKeyboardShortcuts = function useKeyboardShortcuts(callbacks = {}) {
        const [showShortcutsHelp, setShowShortcutsHelp] = useState(false);

        useEffect(() => {
            const handleKeyPress = (e) => {
                // Ignore if user is typing in an input/textarea
                if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') {
                    // Except for Escape key
                    if (e.key !== 'Escape') return;
                }

                // Cmd/Ctrl + K: Search
                if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                    e.preventDefault();
                    callbacks.onSearch?.();
                }

                // Cmd/Ctrl + N: New Report/Item
                if ((e.metaKey || e.ctrlKey) && e.key === 'n') {
                    e.preventDefault();
                    callbacks.onNew?.();
                }

                // Cmd/Ctrl + S: Save (prevent browser save)
                if ((e.metaKey || e.ctrlKey) && e.key === 's') {
                    e.preventDefault();
                    callbacks.onSave?.();
                }

                // Cmd/Ctrl + P: Print
                if ((e.metaKey || e.ctrlKey) && e.key === 'p') {
                    e.preventDefault();
                    callbacks.onPrint?.();
                }

                // Cmd/Ctrl + /: Show shortcuts help
                if ((e.metaKey || e.ctrlKey) && e.key === '/') {
                    e.preventDefault();
                    setShowShortcutsHelp(prev => !prev);
                }

                // Escape: Close modals/cancel
                if (e.key === 'Escape') {
                    callbacks.onEscape?.();
                }

                // Cmd/Ctrl + D: Toggle dark mode
                if ((e.metaKey || e.ctrlKey) && e.key === 'd') {
                    e.preventDefault();
                    callbacks.onToggleDarkMode?.();
                }

                // Cmd/Ctrl + 1-5: Switch views
                if ((e.metaKey || e.ctrlKey) && ['1', '2', '3', '4', '5'].includes(e.key)) {
                    e.preventDefault();
                    callbacks.onSwitchView?.(parseInt(e.key) - 1);
                }

                // Arrow keys for navigation (only when not in input)
                if (!['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) {
                    if (e.key === 'ArrowUp') {
                        callbacks.onNavigateUp?.();
                    }
                    if (e.key === 'ArrowDown') {
                        callbacks.onNavigateDown?.();
                    }
                    if (e.key === 'Enter') {
                        callbacks.onEnter?.();
                    }
                }

                // Cmd/Ctrl + E: Export
                if ((e.metaKey || e.ctrlKey) && e.key === 'e') {
                    e.preventDefault();
                    callbacks.onExport?.();
                }

                // Cmd/Ctrl + F: Filter/Search
                if ((e.metaKey || e.ctrlKey) && e.key === 'f') {
                    e.preventDefault();
                    callbacks.onFilter?.();
                }

                // Cmd/Ctrl + R: Refresh/Sync
                if ((e.metaKey || e.ctrlKey) && e.key === 'r') {
                    e.preventDefault();
                    callbacks.onRefresh?.();
                }
            };

            window.addEventListener('keydown', handleKeyPress);

            return () => {
                window.removeEventListener('keydown', handleKeyPress);
            };
        }, [callbacks]);

        return {
            showShortcutsHelp,
            setShowShortcutsHelp
        };
    };

    // Shortcuts Help Component
    window.KeyboardShortcutsHelp = function KeyboardShortcutsHelp({ onClose, darkMode }) {
        const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
        const modKey = isMac ? '⌘' : 'Ctrl';

        const shortcuts = [
            { keys: `${modKey} + K`, description: 'Search reports' },
            { keys: `${modKey} + N`, description: 'New report/item' },
            { keys: `${modKey} + S`, description: 'Save current work' },
            { keys: `${modKey} + P`, description: 'Print' },
            { keys: `${modKey} + E`, description: 'Export' },
            { keys: `${modKey} + F`, description: 'Filter/Advanced search' },
            { keys: `${modKey} + R`, description: 'Refresh/Sync' },
            { keys: `${modKey} + D`, description: 'Toggle dark mode' },
            { keys: `${modKey} + 1-5`, description: 'Switch between views' },
            { keys: `${modKey} + /`, description: 'Show this help' },
            { keys: 'Esc', description: 'Close modal/Cancel' },
            { keys: '↑ / ↓', description: 'Navigate list' },
            { keys: 'Enter', description: 'Select/Open item' }
        ];

        return React.createElement(
            'div',
            {
                className: 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4',
                onClick: onClose
            },
            React.createElement(
                'div',
                {
                    className: `max-w-2xl w-full rounded-lg shadow-2xl ${darkMode ? 'bg-gray-800' : 'bg-white'}`,
                    onClick: (e) => e.stopPropagation()
                },
                // Header
                React.createElement('div', {
                    className: `flex justify-between items-center p-6 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`
                },
                    React.createElement('h2', {
                        className: `text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`
                    }, '⌨️ Keyboard Shortcuts'),
                    React.createElement('button', {
                        onClick: onClose,
                        className: 'text-2xl font-bold text-gray-500 hover:text-gray-700'
                    }, '×')
                ),

                // Content
                React.createElement('div', {
                    className: 'p-6 max-h-[70vh] overflow-y-auto'
                },
                    React.createElement('table', {
                        className: 'w-full'
                    },
                        React.createElement('tbody', {},
                            shortcuts.map((shortcut, index) =>
                                React.createElement('tr', {
                                    key: index,
                                    className: `border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`
                                },
                                    React.createElement('td', {
                                        className: `py-3 pr-6 font-mono text-sm ${darkMode ? 'bg-gray-900 text-green-400' : 'bg-gray-100 text-green-700'} rounded px-3`
                                    }, shortcut.keys),
                                    React.createElement('td', {
                                        className: `py-3 pl-6 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`
                                    }, shortcut.description)
                                )
                            )
                        )
                    )
                ),

                // Footer
                React.createElement('div', {
                    className: `p-4 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'} text-center`
                },
                    React.createElement('p', {
                        className: `text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`
                    }, `Press ${modKey} + / to toggle this help anytime`)
                )
            )
        );
    };

})();
