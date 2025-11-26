// Rate Sheet Manager Component
// UI for managing hourly rates for equipment and labor

(function() {
    'use strict';

    const { useState, useEffect, useRef } = React;

    window.RateSheetManager = function RateSheetManager({ darkMode, onClose }) {
        const [rateService] = useState(() => new window.RateSheetService());
        const [activeTab, setActiveTab] = useState('equipment'); // equipment, labor, standby
        const [rateSheets, setRateSheets] = useState(rateService.rateSheets);

        // Initialize Firebase for real-time sync
        const firebase = window.useFirebase(true);
        const firebaseInitialized = useRef(false);
        const isUpdatingFromFirebase = useRef(false);

        // Toast notifications
        const { toast } = window.useToast();

        // Use modals for confirmations
        const { ConfirmModal, useModal } = window;
        const deleteRateModal = useModal();
        const resetRatesModal = useModal();

        // Form state for adding new rates
        const [newRate, setNewRate] = useState({
            name: '',
            rate: '',
            effectiveDate: new Date().toISOString().split('T')[0],
            description: ''
        });

        // Reload rate sheets
        const reloadRates = () => {
            rateService.loadRateSheets();
            setRateSheets({ ...rateService.rateSheets });
        };

        // PULL from Firebase on initial load (Firebase is source of truth)
        useEffect(() => {
            if (!firebase.isReady || firebaseInitialized.current) return;

            (async () => {
                try {
                    const firebaseRateSheets = await firebase.getFromFirebase('rateSheets');
                    if (firebaseRateSheets && Object.keys(firebaseRateSheets).length > 0) {
                        console.log('📥 Loading initial rate sheets from Firebase');
                        isUpdatingFromFirebase.current = true;
                        const storage = new window.StorageService();
                        storage.saveGlobal('rateSheets', firebaseRateSheets);
                        reloadRates();
                        setTimeout(() => { isUpdatingFromFirebase.current = false; }, 100);
                    } else if (rateSheets && Object.keys(rateSheets).length > 0) {
                        // Firebase is empty but we have local data - push to Firebase
                        console.log('📤 Syncing local rate sheets to Firebase');
                        await firebase.saveToFirebase('rateSheets', rateSheets);
                    }
                    firebaseInitialized.current = true;
                } catch (error) {
                    console.error('Error loading rate sheets from Firebase:', error);
                    firebaseInitialized.current = true;
                }
            })();
        }, [firebase.isReady]);

        // PUSH to Firebase when rate sheets change locally (not from Firebase)
        useEffect(() => {
            if (!firebase.isReady || !firebaseInitialized.current || isUpdatingFromFirebase.current) return;
            if (firebase.syncEnabled && rateSheets) {
                firebase.saveToFirebase('rateSheets', rateSheets);
            }
        }, [rateSheets, firebase.isReady, firebase.syncEnabled]);

        // Listen for real-time updates from Firebase
        useEffect(() => {
            if (!firebase.isReady) return;

            firebase.listenToFirebase('rateSheets', (firebaseRateSheets) => {
                if (firebaseRateSheets) {
                    console.log('📥 Received updated rate sheets from Firebase');
                    isUpdatingFromFirebase.current = true;
                    const storage = new window.StorageService();
                    storage.saveGlobal('rateSheets', firebaseRateSheets);
                    reloadRates();
                    setTimeout(() => { isUpdatingFromFirebase.current = false; }, 100);
                }
            });

            return () => {
                firebase.unlistenFromFirebase('rateSheets');
            };
        }, [firebase.isReady]);

        // Add new equipment rate
        const handleAddEquipmentRate = () => {
            if (!newRate.name || !newRate.rate) {
                toast.warning('Please enter equipment name and rate');
                return;
            }

            rateService.addEquipmentRate(
                newRate.name,
                newRate.rate,
                newRate.effectiveDate,
                newRate.description || newRate.name
            );

            reloadRates();
            setNewRate({ name: '', rate: '', effectiveDate: new Date().toISOString().split('T')[0], description: '' });
        };

        // Add new labor rate
        const handleAddLaborRate = () => {
            if (!newRate.name || !newRate.rate) {
                toast.warning('Please enter labor type and rate');
                return;
            }

            rateService.addLaborRate(
                newRate.name,
                newRate.rate,
                newRate.effectiveDate,
                newRate.description || newRate.name
            );

            reloadRates();
            setNewRate({ name: '', rate: '', effectiveDate: new Date().toISOString().split('T')[0], description: '' });
        };

        // Update standby rate
        const handleUpdateStandbyRate = () => {
            if (!newRate.rate) {
                toast.warning('Please enter a rate');
                return;
            }

            rateService.updateStandbyRate(newRate.rate, newRate.description);
            reloadRates();
        };

        // Delete a rate
        const handleDeleteRate = (category, name, effectiveDate) => {
            deleteRateModal.open({
                message: `Delete ${name} rate from ${effectiveDate}?`,
                onConfirm: () => {
                    rateService.deleteRate(category, name, effectiveDate);
                    reloadRates();
                    deleteRateModal.close();
                }
            });
        };

        // Reset to defaults
        const handleReset = () => {
            resetRatesModal.open({
                onConfirm: () => {
                    rateService.resetToDefaults();
                    reloadRates();
                    resetRatesModal.close();
                }
            });
        };

        // Export rates
        const handleExport = () => {
            const json = rateService.exportToJSON();
            const blob = new Blob([json], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `rate-sheets-${new Date().toISOString().split('T')[0]}.json`;
            a.click();
            URL.revokeObjectURL(url);
        };

        // Import rates
        const handleImport = (event) => {
            const file = event.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    if (rateService.importFromJSON(e.target.result)) {
                        reloadRates();
                        toast.success('Rate sheets imported successfully!');
                    } else {
                        toast.error('Error importing rate sheets. Invalid format.');
                    }
                };
                reader.readAsText(file);
            }
        };

        const bgColor = darkMode ? 'bg-gray-800' : 'bg-white';
        const textColor = darkMode ? 'text-gray-100' : 'text-gray-800';
        const borderColor = darkMode ? 'border-gray-700' : 'border-gray-300';
        const inputBg = darkMode ? 'bg-gray-700' : 'bg-white';

        return React.createElement('div', {
            className: 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4',
            onClick: onClose
        },
            React.createElement('div', {
                className: `${bgColor} rounded-lg shadow-xl max-w-5xl w-full max-h-[90vh] overflow-hidden`,
                onClick: (e) => e.stopPropagation()
            },
                // Header
                React.createElement('div', {
                    className: `${darkMode ? 'bg-gray-900' : 'bg-brand-green-600'} px-6 py-4 flex justify-between items-center`
                },
                    React.createElement('h2', {
                        className: 'text-2xl font-bold text-white'
                    }, '⚙️ Rate Sheet Manager'),
                    React.createElement('button', {
                        onClick: onClose,
                        className: 'text-white hover:text-gray-300 text-2xl font-bold'
                    }, '×')
                ),

                // Tabs
                React.createElement('div', {
                    className: `flex border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'} px-6`
                },
                    ['equipment', 'labor', 'standby'].map(tab =>
                        React.createElement('button', {
                            key: tab,
                            onClick: () => setActiveTab(tab),
                            className: `px-4 py-2 font-semibold ${activeTab === tab
                                ? 'border-b-2 border-brand-green-500 text-brand-green-600'
                                : darkMode ? 'text-gray-400' : 'text-gray-600'}`
                        }, tab.charAt(0).toUpperCase() + tab.slice(1))
                    )
                ),

                // Content
                React.createElement('div', {
                    className: 'p-6 overflow-y-auto max-h-[calc(90vh-200px)]'
                },
                    // Equipment Tab
                    activeTab === 'equipment' && React.createElement('div', null,
                        React.createElement('h3', {
                            className: `text-lg font-bold mb-4 ${textColor}`
                        }, 'Equipment Rates'),

                        // Add new equipment rate form
                        React.createElement('div', {
                            className: `grid grid-cols-4 gap-3 mb-6 p-4 rounded ${darkMode ? 'bg-gray-900' : 'bg-gray-100'}`
                        },
                            React.createElement('input', {
                                type: 'text',
                                placeholder: 'Equipment Name',
                                value: newRate.name,
                                onChange: (e) => setNewRate(prev => ({ ...prev, name: e.target.value })),
                                className: `px-3 py-2 border rounded ${borderColor} ${inputBg} ${textColor}`
                            }),
                            React.createElement('input', {
                                type: 'number',
                                placeholder: 'Hourly Rate ($)',
                                value: newRate.rate,
                                onChange: (e) => setNewRate(prev => ({ ...prev, rate: e.target.value })),
                                className: `px-3 py-2 border rounded ${borderColor} ${inputBg} ${textColor}`
                            }),
                            React.createElement('input', {
                                type: 'date',
                                value: newRate.effectiveDate,
                                onChange: (e) => setNewRate(prev => ({ ...prev, effectiveDate: e.target.value })),
                                className: `px-3 py-2 border rounded ${borderColor} ${inputBg} ${textColor}`
                            }),
                            React.createElement('button', {
                                onClick: handleAddEquipmentRate,
                                className: 'bg-brand-green-600 hover:bg-brand-green-700 text-white px-4 py-2 rounded font-semibold'
                            }, '+ Add Rate')
                        ),

                        // Equipment rates list
                        React.createElement('div', { className: 'space-y-4' },
                            Object.entries(rateSheets.equipment || {}).map(([name, rates]) =>
                                React.createElement('div', {
                                    key: name,
                                    className: `border ${borderColor} rounded p-4`
                                },
                                    React.createElement('h4', {
                                        className: `font-bold ${textColor} mb-2`
                                    }, name),
                                    React.createElement('table', {
                                        className: `w-full ${textColor}`
                                    },
                                        React.createElement('thead', null,
                                            React.createElement('tr', {
                                                className: `text-left ${darkMode ? 'bg-gray-900' : 'bg-gray-100'}`
                                            },
                                                React.createElement('th', { className: 'p-2' }, 'Effective Date'),
                                                React.createElement('th', { className: 'p-2' }, 'Rate/Hour'),
                                                React.createElement('th', { className: 'p-2' }, 'Description'),
                                                React.createElement('th', { className: 'p-2' }, 'Actions')
                                            )
                                        ),
                                        React.createElement('tbody', null,
                                            rates.sort((a, b) => new Date(b.effectiveDate) - new Date(a.effectiveDate)).map((rate, idx) =>
                                                React.createElement('tr', { key: idx },
                                                    React.createElement('td', { className: 'p-2' }, rate.effectiveDate),
                                                    React.createElement('td', { className: 'p-2' }, `$${rate.hourlyRate.toFixed(2)}`),
                                                    React.createElement('td', { className: 'p-2' }, rate.description),
                                                    React.createElement('td', { className: 'p-2' },
                                                        React.createElement('button', {
                                                            onClick: () => handleDeleteRate('equipment', name, rate.effectiveDate),
                                                            className: 'text-red-600 hover:text-red-800'
                                                        }, '🗑️')
                                                    )
                                                )
                                            )
                                        )
                                    )
                                )
                            )
                        )
                    ),

                    // Labor Tab (similar to equipment)
                    activeTab === 'labor' && React.createElement('div', null,
                        React.createElement('h3', {
                            className: `text-lg font-bold mb-4 ${textColor}`
                        }, 'Labor Rates'),

                        // Add new labor rate form
                        React.createElement('div', {
                            className: `grid grid-cols-4 gap-3 mb-6 p-4 rounded ${darkMode ? 'bg-gray-900' : 'bg-gray-100'}`
                        },
                            React.createElement('input', {
                                type: 'text',
                                placeholder: 'Labor Type',
                                value: newRate.name,
                                onChange: (e) => setNewRate(prev => ({ ...prev, name: e.target.value })),
                                className: `px-3 py-2 border rounded ${borderColor} ${inputBg} ${textColor}`
                            }),
                            React.createElement('input', {
                                type: 'number',
                                placeholder: 'Hourly Rate ($)',
                                value: newRate.rate,
                                onChange: (e) => setNewRate(prev => ({ ...prev, rate: e.target.value })),
                                className: `px-3 py-2 border rounded ${borderColor} ${inputBg} ${textColor}`
                            }),
                            React.createElement('input', {
                                type: 'date',
                                value: newRate.effectiveDate,
                                onChange: (e) => setNewRate(prev => ({ ...prev, effectiveDate: e.target.value })),
                                className: `px-3 py-2 border rounded ${borderColor} ${inputBg} ${textColor}`
                            }),
                            React.createElement('button', {
                                onClick: handleAddLaborRate,
                                className: 'bg-brand-green-600 hover:bg-brand-green-700 text-white px-4 py-2 rounded font-semibold'
                            }, '+ Add Rate')
                        ),

                        // Labor rates list
                        React.createElement('div', { className: 'space-y-4' },
                            Object.entries(rateSheets.labor || {}).map(([name, rates]) =>
                                React.createElement('div', {
                                    key: name,
                                    className: `border ${borderColor} rounded p-4`
                                },
                                    React.createElement('h4', {
                                        className: `font-bold ${textColor} mb-2`
                                    }, name),
                                    React.createElement('table', {
                                        className: `w-full ${textColor}`
                                    },
                                        React.createElement('thead', null,
                                            React.createElement('tr', {
                                                className: `text-left ${darkMode ? 'bg-gray-900' : 'bg-gray-100'}`
                                            },
                                                React.createElement('th', { className: 'p-2' }, 'Effective Date'),
                                                React.createElement('th', { className: 'p-2' }, 'Rate/Hour'),
                                                React.createElement('th', { className: 'p-2' }, 'Description'),
                                                React.createElement('th', { className: 'p-2' }, 'Actions')
                                            )
                                        ),
                                        React.createElement('tbody', null,
                                            rates.sort((a, b) => new Date(b.effectiveDate) - new Date(a.effectiveDate)).map((rate, idx) =>
                                                React.createElement('tr', { key: idx },
                                                    React.createElement('td', { className: 'p-2' }, rate.effectiveDate),
                                                    React.createElement('td', { className: 'p-2' }, `$${rate.hourlyRate.toFixed(2)}`),
                                                    React.createElement('td', { className: 'p-2' }, rate.description),
                                                    React.createElement('td', { className: 'p-2' },
                                                        React.createElement('button', {
                                                            onClick: () => handleDeleteRate('labor', name, rate.effectiveDate),
                                                            className: 'text-red-600 hover:text-red-800'
                                                        }, '🗑️')
                                                    )
                                                )
                                            )
                                        )
                                    )
                                )
                            )
                        )
                    ),

                    // Standby Tab
                    activeTab === 'standby' && React.createElement('div', null,
                        React.createElement('h3', {
                            className: `text-lg font-bold mb-4 ${textColor}`
                        }, 'Standby Rate'),

                        React.createElement('div', {
                            className: `p-6 rounded ${darkMode ? 'bg-gray-900' : 'bg-gray-100'}`
                        },
                            React.createElement('p', { className: `mb-4 ${textColor}` },
                                `Current standby rate: $${rateSheets.standby?.rate || 0}/hour`
                            ),
                            React.createElement('div', { className: 'flex gap-3' },
                                React.createElement('input', {
                                    type: 'number',
                                    placeholder: 'New Rate ($)',
                                    value: newRate.rate,
                                    onChange: (e) => setNewRate(prev => ({ ...prev, rate: e.target.value })),
                                    className: `px-3 py-2 border rounded ${borderColor} ${inputBg} ${textColor} flex-1`
                                }),
                                React.createElement('button', {
                                    onClick: handleUpdateStandbyRate,
                                    className: 'bg-brand-green-600 hover:bg-brand-green-700 text-white px-6 py-2 rounded font-semibold'
                                }, 'Update Rate')
                            )
                        )
                    )
                ),

                // Footer Actions
                React.createElement('div', {
                    className: `px-6 py-4 border-t ${borderColor} flex justify-between`
                },
                    React.createElement('div', { className: 'flex gap-2' },
                        React.createElement('button', {
                            onClick: handleExport,
                            className: `px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-semibold`
                        }, '📥 Export'),
                        React.createElement('label', {
                            className: `px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-semibold cursor-pointer`
                        },
                            '📤 Import',
                            React.createElement('input', {
                                type: 'file',
                                accept: '.json',
                                onChange: handleImport,
                                className: 'hidden'
                            })
                        ),
                        React.createElement('button', {
                            onClick: handleReset,
                            className: `px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded font-semibold`
                        }, '🔄 Reset to Defaults')
                    ),
                    React.createElement('button', {
                        onClick: onClose,
                        className: `px-6 py-2 ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-300 hover:bg-gray-400'} rounded font-semibold ${textColor}`
                    }, 'Close')
                ),
                // Confirmation Modals
                React.createElement(ConfirmModal, {
                    isOpen: deleteRateModal.isOpen,
                    onConfirm: () => deleteRateModal.config.onConfirm?.(),
                    onCancel: deleteRateModal.close,
                    title: 'Delete Rate',
                    message: deleteRateModal.config.message || 'Are you sure you want to delete this rate?',
                    confirmText: 'Delete',
                    variant: 'danger',
                    darkMode: darkMode
                }),
                React.createElement(ConfirmModal, {
                    isOpen: resetRatesModal.isOpen,
                    onConfirm: () => resetRatesModal.config.onConfirm?.(),
                    onCancel: resetRatesModal.close,
                    title: 'Reset to Defaults',
                    message: 'Reset all rates to defaults? This cannot be undone.',
                    confirmText: 'Reset',
                    variant: 'danger',
                    darkMode: darkMode
                })
            )
        );
    };

})();
