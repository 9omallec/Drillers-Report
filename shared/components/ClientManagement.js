/**
 * Client Management Component
 * Manages client database with contact info, billing rates, and preferences
 */

(function() {
    'use strict';

    const { useState, useEffect, useMemo } = React;

    // Client Form Component
    function ClientForm({ client, onSave, onCancel, darkMode }) {
        const [formData, setFormData] = useState(client || {
            name: '',
            contactName: '',
            email: '',
            phone: '',
            address: '',
            billingRate: '',
            rateType: 'per_foot',
            notes: ''
        });

        const [errors, setErrors] = useState({});

        const handleChange = (field, value) => {
            setFormData(prev => ({ ...prev, [field]: value }));
            // Clear error when user starts typing
            if (errors[field]) {
                setErrors(prev => ({ ...prev, [field]: null }));
            }
        };

        const validate = () => {
            const newErrors = {};

            if (!formData.name || formData.name.trim() === '') {
                newErrors.name = 'Client name is required';
            }

            if (formData.billingRate && isNaN(parseFloat(formData.billingRate))) {
                newErrors.billingRate = 'Billing rate must be a number';
            }

            if (formData.email && !formData.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
                newErrors.email = 'Invalid email format';
            }

            setErrors(newErrors);
            return Object.keys(newErrors).length === 0;
        };

        const handleSubmit = (e) => {
            e.preventDefault();
            if (validate()) {
                onSave(formData);
            }
        };

        return React.createElement(
            'form',
            { onSubmit: handleSubmit, className: `p-4 sm:p-6 ${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg` },
            React.createElement('h3', {
                className: `text-lg sm:text-xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-800'}`
            }, client ? 'Edit Client' : 'New Client'),

            // Name
            React.createElement('div', { className: 'mb-4' },
                React.createElement('label', {
                    className: `block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`
                }, 'Client Name *'),
                React.createElement('input', {
                    type: 'text',
                    value: formData.name,
                    onChange: (e) => handleChange('name', e.target.value),
                    className: `w-full px-3 py-2 border rounded-lg ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'} ${errors.name ? 'border-red-500' : ''}`,
                    placeholder: 'ABC Construction Company'
                }),
                errors.name && React.createElement('p', { className: 'text-red-500 text-sm mt-1' }, errors.name)
            ),

            // Contact Name
            React.createElement('div', { className: 'mb-4' },
                React.createElement('label', {
                    className: `block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`
                }, 'Contact Person'),
                React.createElement('input', {
                    type: 'text',
                    value: formData.contactName,
                    onChange: (e) => handleChange('contactName', e.target.value),
                    className: `w-full px-3 py-2 border rounded-lg ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`,
                    placeholder: 'John Smith'
                })
            ),

            // Email and Phone (side by side)
            React.createElement('div', { className: 'grid grid-cols-1 md:grid-cols-2 gap-4 mb-4' },
                React.createElement('div', {},
                    React.createElement('label', {
                        className: `block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`
                    }, 'Email'),
                    React.createElement('input', {
                        type: 'email',
                        value: formData.email,
                        onChange: (e) => handleChange('email', e.target.value),
                        className: `w-full px-3 py-2 border rounded-lg ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'} ${errors.email ? 'border-red-500' : ''}`,
                        placeholder: 'john@example.com'
                    }),
                    errors.email && React.createElement('p', { className: 'text-red-500 text-sm mt-1' }, errors.email)
                ),
                React.createElement('div', {},
                    React.createElement('label', {
                        className: `block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`
                    }, 'Phone'),
                    React.createElement('input', {
                        type: 'tel',
                        value: formData.phone,
                        onChange: (e) => handleChange('phone', e.target.value),
                        className: `w-full px-3 py-2 border rounded-lg ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`,
                        placeholder: '(555) 123-4567'
                    })
                )
            ),

            // Address
            React.createElement('div', { className: 'mb-4' },
                React.createElement('label', {
                    className: `block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`
                }, 'Address'),
                React.createElement('input', {
                    type: 'text',
                    value: formData.address,
                    onChange: (e) => handleChange('address', e.target.value),
                    className: `w-full px-3 py-2 border rounded-lg ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`,
                    placeholder: '123 Main St, City, State ZIP'
                })
            ),

            // Billing Rate and Type
            React.createElement('div', { className: 'grid grid-cols-1 md:grid-cols-2 gap-4 mb-4' },
                React.createElement('div', {},
                    React.createElement('label', {
                        className: `block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`
                    }, 'Billing Rate ($)'),
                    React.createElement('input', {
                        type: 'number',
                        step: '0.01',
                        value: formData.billingRate,
                        onChange: (e) => handleChange('billingRate', e.target.value),
                        className: `w-full px-3 py-2 border rounded-lg ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'} ${errors.billingRate ? 'border-red-500' : ''}`,
                        placeholder: '25.00'
                    }),
                    errors.billingRate && React.createElement('p', { className: 'text-red-500 text-sm mt-1' }, errors.billingRate)
                ),
                React.createElement('div', {},
                    React.createElement('label', {
                        className: `block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`
                    }, 'Rate Type'),
                    React.createElement('select', {
                        value: formData.rateType,
                        onChange: (e) => handleChange('rateType', e.target.value),
                        className: `w-full px-3 py-2 border rounded-lg ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`
                    },
                        React.createElement('option', { value: 'per_foot' }, 'Per Foot'),
                        React.createElement('option', { value: 'per_hour' }, 'Per Hour')
                    )
                )
            ),

            // Notes
            React.createElement('div', { className: 'mb-4' },
                React.createElement('label', {
                    className: `block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`
                }, 'Notes'),
                React.createElement('textarea', {
                    value: formData.notes,
                    onChange: (e) => handleChange('notes', e.target.value),
                    rows: 3,
                    className: `w-full px-3 py-2 border rounded-lg ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`,
                    placeholder: 'Special instructions, preferences, etc.'
                })
            ),

            // Buttons
            React.createElement('div', { className: 'flex gap-3 justify-end' },
                React.createElement('button', {
                    type: 'button',
                    onClick: onCancel,
                    className: `px-4 py-2 rounded-lg font-medium ${darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`
                }, 'Cancel'),
                React.createElement('button', {
                    type: 'submit',
                    className: 'px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700'
                }, client ? 'Update Client' : 'Create Client')
            )
        );
    }

    // Client List Item Component
    function ClientListItem({ client, onEdit, onDelete, onViewHistory, darkMode, reports }) {
        const [showDetails, setShowDetails] = useState(false);

        // Calculate client stats if reports are provided
        const stats = useMemo(() => {
            if (!reports) return null;

            const clientService = new window.ClientService(new window.StorageService());
            return clientService.getClientStats(client.name, reports);
        }, [client.name, reports]);

        return React.createElement(
            'div',
            { className: `p-4 rounded-lg border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} hover:shadow-md transition-shadow` },
            React.createElement('div', { className: 'flex justify-between items-start' },
                // Left: Client Info
                React.createElement('div', { className: 'flex-1' },
                    React.createElement('h4', {
                        className: `text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`
                    }, client.name),
                    client.contactName && React.createElement('p', {
                        className: `text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`
                    }, `Contact: ${client.contactName}`),
                    (client.email || client.phone) && React.createElement('p', {
                        className: `text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`
                    }, [client.email, client.phone].filter(Boolean).join(' • ')),
                    client.billingRate > 0 && React.createElement('p', {
                        className: `text-sm font-semibold text-green-600 mt-1`
                    }, `$${client.billingRate} ${client.rateType === 'per_foot' ? 'per foot' : 'per hour'}`)
                ),
                // Right: Actions
                React.createElement('div', { className: 'flex gap-2' },
                    reports && React.createElement('button', {
                        onClick: () => onViewHistory(client),
                        className: `px-3 py-1.5 text-sm rounded-lg ${darkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'} text-white`,
                        title: 'View client history'
                    }, '📊'),
                    React.createElement('button', {
                        onClick: () => setShowDetails(!showDetails),
                        className: `px-3 py-1.5 text-sm rounded-lg ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'} ${darkMode ? 'text-white' : 'text-gray-700'}`,
                        title: showDetails ? 'Hide details' : 'Show details'
                    }, showDetails ? '▲' : '▼'),
                    React.createElement('button', {
                        onClick: () => onEdit(client),
                        className: `px-3 py-1.5 text-sm rounded-lg ${darkMode ? 'bg-yellow-600 hover:bg-yellow-700' : 'bg-yellow-500 hover:bg-yellow-600'} text-white`,
                        title: 'Edit client'
                    }, '✏️'),
                    React.createElement('button', {
                        onClick: () => {
                            if (confirm(`Delete client "${client.name}"? This cannot be undone.`)) {
                                onDelete(client.id);
                            }
                        },
                        className: 'px-3 py-1.5 text-sm rounded-lg bg-red-600 hover:bg-red-700 text-white',
                        title: 'Delete client'
                    }, '🗑️')
                )
            ),

            // Expandable Details
            showDetails && React.createElement('div', {
                className: `mt-3 pt-3 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'}`
            },
                client.address && React.createElement('p', {
                    className: `text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`
                }, `📍 ${client.address}`),
                client.notes && React.createElement('p', {
                    className: `text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'} italic`
                }, `"${client.notes}"`),

                // Stats if available
                stats && React.createElement('div', {
                    className: `mt-3 grid grid-cols-2 md:grid-cols-4 gap-3`
                },
                    React.createElement('div', { className: `text-center p-2 rounded ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}` },
                        React.createElement('div', { className: `font-bold ${darkMode ? 'text-white' : 'text-gray-800'}` }, stats.totalReports),
                        React.createElement('div', { className: `text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}` }, 'Reports')
                    ),
                    React.createElement('div', { className: `text-center p-2 rounded ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}` },
                        React.createElement('div', { className: `font-bold ${darkMode ? 'text-white' : 'text-gray-800'}` }, stats.totalFootage),
                        React.createElement('div', { className: `text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}` }, 'Total Footage')
                    ),
                    React.createElement('div', { className: `text-center p-2 rounded ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}` },
                        React.createElement('div', { className: `font-bold ${darkMode ? 'text-white' : 'text-gray-800'}` }, stats.totalHours),
                        React.createElement('div', { className: `text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}` }, 'Total Hours')
                    ),
                    React.createElement('div', { className: `text-center p-2 rounded ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}` },
                        React.createElement('div', { className: `font-bold text-green-600` }, `$${stats.estimatedRevenue}`),
                        React.createElement('div', { className: `text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}` }, 'Est. Revenue')
                    )
                )
            )
        );
    }

    // Client History Modal Component
    function ClientHistory({ client, reports, onClose, onViewReport, darkMode }) {
        const clientService = useMemo(() => {
            return new window.ClientService(new window.StorageService());
        }, []);

        // Get all reports for this client
        const clientReports = useMemo(() => {
            return reports.filter(report =>
                (report.client || report.customer) === client.name
            ).sort((a, b) => {
                const dateA = new Date(a.date || a.importedAt || 0);
                const dateB = new Date(b.date || b.importedAt || 0);
                return dateB - dateA; // Newest first
            });
        }, [reports, client.name]);

        // Get client stats
        const stats = useMemo(() => {
            return clientService.getClientStats(client.name, reports);
        }, [client.name, reports]);

        return React.createElement(
            'div',
            {
                className: 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4 z-50',
                onClick: (e) => {
                    if (e.target === e.currentTarget) onClose();
                }
            },
            React.createElement('div', {
                className: `max-w-3xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-y-auto rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-white'} p-4 sm:p-6`
            },
                // Header
                React.createElement('div', { className: 'flex justify-between items-start mb-4' },
                    React.createElement('div', {},
                        React.createElement('h2', {
                            className: `text-lg sm:text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`
                        }, `${client.name} - History`),
                        client.contactName && React.createElement('p', {
                            className: `text-xs sm:text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`
                        }, `Contact: ${client.contactName}`)
                    ),
                    React.createElement('button', {
                        onClick: onClose,
                        className: `text-xl sm:text-2xl font-bold ${darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-800'} ml-2`
                    }, '×')
                ),

                // Stats Cards
                React.createElement('div', { className: 'grid grid-cols-2 md:grid-cols-4 gap-4 mb-6' },
                    React.createElement('div', { className: `rounded-lg p-4 ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}` },
                        React.createElement('div', { className: `text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}` }, stats.totalReports),
                        React.createElement('div', { className: `text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}` }, 'Total Reports')
                    ),
                    React.createElement('div', { className: `rounded-lg p-4 ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}` },
                        React.createElement('div', { className: `text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}` }, `${stats.totalFootage} ft`),
                        React.createElement('div', { className: `text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}` }, 'Total Footage')
                    ),
                    React.createElement('div', { className: `rounded-lg p-4 ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}` },
                        React.createElement('div', { className: `text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}` }, `${stats.totalHours} hrs`),
                        React.createElement('div', { className: `text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}` }, 'Total Hours')
                    ),
                    React.createElement('div', { className: `rounded-lg p-4 ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}` },
                        React.createElement('div', { className: 'text-2xl font-bold text-green-600' }, `$${stats.estimatedRevenue}`),
                        React.createElement('div', { className: `text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}` }, 'Est. Revenue')
                    )
                ),

                // Reports List
                React.createElement('div', {},
                    React.createElement('h3', {
                        className: `text-lg font-bold mb-3 ${darkMode ? 'text-white' : 'text-gray-800'}`
                    }, `Reports (${clientReports.length})`),

                    clientReports.length === 0 ?
                        React.createElement('p', {
                            className: `text-center py-8 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`
                        }, 'No reports found for this client') :

                        React.createElement('div', { className: 'space-y-3' },
                            clientReports.map(report =>
                                React.createElement('div', {
                                    key: report.id,
                                    className: `p-4 rounded-lg border ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'} hover:shadow-md transition-shadow`
                                },
                                    React.createElement('div', { className: 'flex justify-between items-start' },
                                        React.createElement('div', { className: 'flex-1' },
                                            React.createElement('div', { className: 'flex items-center gap-3 mb-2' },
                                                React.createElement('h4', {
                                                    className: `font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`
                                                }, report.jobName || 'Untitled Job'),
                                                React.createElement('span', {
                                                    className: `px-2 py-1 rounded text-xs ${
                                                        report.status === 'approved' ? 'bg-green-600 text-white' :
                                                        report.status === 'changes_requested' ? 'bg-yellow-600 text-white' :
                                                        'bg-gray-500 text-white'
                                                    }`
                                                }, report.status === 'changes_requested' ? 'Changes Requested' :
                                                   report.status === 'approved' ? 'Approved' : 'Pending')
                                            ),
                                            React.createElement('div', {
                                                className: `text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'} grid grid-cols-2 md:grid-cols-4 gap-2`
                                            },
                                                React.createElement('div', {}, `Date: ${new Date(report.date || report.importedAt).toLocaleDateString()}`),
                                                React.createElement('div', {}, `Driller: ${report.driller || 'Unknown'}`),
                                                React.createElement('div', {}, `Footage: ${report.borings?.reduce((sum, b) => sum + (parseFloat(b.footage) || 0), 0).toFixed(1) || 0} ft`),
                                                React.createElement('div', {}, (() => {
                                                    const totalHours = report.workDays?.reduce((sum, day) => {
                                                        const drive = parseFloat(day.hoursDriving) || 0;
                                                        const onSite = parseFloat(day.hoursOnSite) || 0;
                                                        return sum + drive + onSite;
                                                    }, 0).toFixed(1) || 0;
                                                    const totalStandby = report.workDays?.reduce((sum, day) => {
                                                        const hours = parseFloat(day.standbyHours) || 0;
                                                        const minutes = parseFloat(day.standbyMinutes) || 0;
                                                        return sum + hours + (minutes / 60);
                                                    }, 0) || 0;
                                                    return `Hours: ${totalHours}${totalStandby > 0 ? ` (+${totalStandby.toFixed(1)} SB)` : ''} hrs`;
                                                })())
                                            )
                                        ),
                                        onViewReport && React.createElement('button', {
                                            onClick: () => onViewReport(report),
                                            className: `ml-4 px-3 py-1.5 text-sm rounded-lg ${darkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'} text-white`
                                        }, 'View')
                                    )
                                )
                            )
                        )
                )
            )
        );
    }

    // Main Client Management Component
    function ClientManagement({ darkMode, reports, onViewReport }) {
        const [clients, setClients] = useState([]);
        const [searchTerm, setSearchTerm] = useState('');
        const [showForm, setShowForm] = useState(false);
        const [editingClient, setEditingClient] = useState(null);
        const [viewingHistory, setViewingHistory] = useState(null);
        const [sortBy, setSortBy] = useState('name');
        const [sortOrder, setSortOrder] = useState('asc');

        const clientService = useMemo(() => {
            return new window.ClientService(new window.StorageService());
        }, []);

        // Load clients on mount
        useEffect(() => {
            loadClients();
        }, [sortBy, sortOrder]);

        const loadClients = () => {
            const allClients = clientService.getSortedClients(sortBy, sortOrder);
            setClients(allClients);
        };

        const handleSave = (clientData) => {
            try {
                if (editingClient) {
                    clientService.updateClient(editingClient.id, clientData);
                } else {
                    clientService.createClient(clientData);
                }
                loadClients();
                setShowForm(false);
                setEditingClient(null);
            } catch (error) {
                alert(error.message);
            }
        };

        const handleEdit = (client) => {
            setEditingClient(client);
            setShowForm(true);
        };

        const handleDelete = (clientId) => {
            try {
                clientService.deleteClient(clientId);
                loadClients();
            } catch (error) {
                alert(error.message);
            }
        };

        const handleViewHistory = (client) => {
            setViewingHistory(client);
        };

        const handleCancel = () => {
            setShowForm(false);
            setEditingClient(null);
        };

        const filteredClients = useMemo(() => {
            return clientService.searchClients(searchTerm);
        }, [searchTerm, clients]);

        return React.createElement(
            'div',
            { className: 'max-w-6xl mx-auto' },
            // Header
            React.createElement('div', { className: 'mb-6' },
                React.createElement('h2', {
                    className: `text-2xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-800'}`
                }, '👥 Client Management'),

                // Search and Add
                React.createElement('div', { className: 'flex flex-col md:flex-row gap-3 mb-4' },
                    React.createElement('input', {
                        type: 'text',
                        placeholder: '🔍 Search clients...',
                        value: searchTerm,
                        onChange: (e) => setSearchTerm(e.target.value),
                        className: `flex-1 px-4 py-2.5 border rounded-lg ${darkMode ? 'bg-gray-700 text-white border-gray-600' : 'bg-white border-gray-300'}`
                    }),
                    React.createElement('select', {
                        value: sortBy,
                        onChange: (e) => setSortBy(e.target.value),
                        className: `px-4 py-2.5 border rounded-lg ${darkMode ? 'bg-gray-700 text-white border-gray-600' : 'bg-white border-gray-300'}`
                    },
                        React.createElement('option', { value: 'name' }, 'Sort by Name'),
                        React.createElement('option', { value: 'billingRate' }, 'Sort by Rate'),
                        React.createElement('option', { value: 'createdAt' }, 'Sort by Date Added')
                    ),
                    React.createElement('button', {
                        onClick: () => setShowForm(true),
                        className: 'px-5 py-2.5 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700'
                    }, '➕ Add Client')
                ),

                React.createElement('p', {
                    className: `text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`
                }, `${filteredClients.length} client${filteredClients.length !== 1 ? 's' : ''}`)
            ),

            // Form Modal
            showForm && React.createElement('div', {
                className: 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4 z-50',
                onClick: (e) => {
                    if (e.target === e.currentTarget) handleCancel();
                }
            },
                React.createElement('div', {
                    className: 'max-w-2xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-y-auto'
                },
                    React.createElement(ClientForm, {
                        client: editingClient,
                        onSave: handleSave,
                        onCancel: handleCancel,
                        darkMode
                    })
                )
            ),

            // Client List
            filteredClients.length === 0 ?
                React.createElement('div', {
                    className: `text-center py-12 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`
                },
                    React.createElement('p', { className: 'text-lg' }, searchTerm ? 'No clients found matching your search' : 'No clients yet'),
                    !searchTerm && React.createElement('button', {
                        onClick: () => setShowForm(true),
                        className: 'mt-4 px-5 py-2.5 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700'
                    }, 'Add Your First Client')
                ) :
                React.createElement('div', { className: 'space-y-3' },
                    filteredClients.map(client =>
                        React.createElement(ClientListItem, {
                            key: client.id,
                            client,
                            onEdit: handleEdit,
                            onDelete: handleDelete,
                            onViewHistory: handleViewHistory,
                            darkMode,
                            reports
                        })
                    )
                ),

                // Client History Modal
                viewingHistory && React.createElement(ClientHistory, {
                    client: viewingHistory,
                    reports,
                    onClose: () => setViewingHistory(null),
                    onViewReport,
                    darkMode
                })
        );
    }

    // Export component
    window.ClientManagementComponents = {
        ClientManagement,
        ClientForm,
        ClientListItem
    };

})();
