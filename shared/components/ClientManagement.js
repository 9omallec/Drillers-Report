/**
 * Client Management Component - WITH MULTIPLE CONTACTS SUPPORT
 * Manages client database with multiple contact persons per company
 */

(function() {
    'use strict';

    const { useState, useEffect, useMemo, useRef } = React;

    // Client Form Component
    function ClientForm({ client, onSave, onCancel, darkMode }) {
        const [formData, setFormData] = useState(client || {
            name: '',
            address: '',
            billingRate: '',
            rateType: 'per_foot',
            notes: '',
            contacts: []
        });

        const [contacts, setContacts] = useState(client?.contacts || []);
        const [newContact, setNewContact] = useState({ name: '', email: '', phone: '', title: '', isPrimary: false });
        const [editingContactId, setEditingContactId] = useState(null);
        const [errors, setErrors] = useState({});

        // Toast notifications
        const { toast } = window.useToast();

        // Use modals for confirmations
        const deleteContactModal = window.useModal();

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

            setErrors(newErrors);
            return Object.keys(newErrors).length === 0;
        };

        const handleSubmit = (e) => {
            e.preventDefault();
            if (validate()) {
                onSave({ ...formData, contacts });
            }
        };

        const handleAddContact = () => {
            if (!newContact.name && !newContact.email && !newContact.phone) {
                toast.warning('Please enter at least a name, email, or phone for the contact');
                return;
            }

            if (newContact.email && !newContact.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
                toast.warning('Invalid email format');
                return;
            }

            const contactToAdd = {
                id: 'temp_' + Date.now(),
                ...newContact,
                isPrimary: contacts.length === 0 ? true : newContact.isPrimary
            };

            // If marking as primary, unmark all others
            if (contactToAdd.isPrimary) {
                setContacts(prev => prev.map(c => ({ ...c, isPrimary: false })));
            }

            setContacts(prev => [...prev, contactToAdd]);
            setNewContact({ name: '', email: '', phone: '', title: '', isPrimary: false });
        };

        const handleEditContact = (contact) => {
            setEditingContactId(contact.id);
            setNewContact(contact);
        };

        const handleUpdateContact = () => {
            if (!newContact.name && !newContact.email && !newContact.phone) {
                toast.warning('Please enter at least a name, email, or phone for the contact');
                return;
            }

            if (newContact.email && !newContact.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
                toast.warning('Invalid email format');
                return;
            }

            // If marking as primary, unmark all others
            if (newContact.isPrimary) {
                setContacts(prev => prev.map(c => ({ ...c, isPrimary: false })));
            }

            setContacts(prev => prev.map(c =>
                c.id === editingContactId ? { ...newContact, id: editingContactId } : c
            ));

            setNewContact({ name: '', email: '', phone: '', title: '', isPrimary: false });
            setEditingContactId(null);
        };

        const handleDeleteContact = (contactId) => {
            deleteContactModal.open({
                onConfirm: () => {
                    setContacts(prev => prev.filter(c => c.id !== contactId));
                    deleteContactModal.close();
                }
            });
        };

        const handleCancelEdit = () => {
            setEditingContactId(null);
            setNewContact({ name: '', email: '', phone: '', title: '', isPrimary: false });
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

            // Contacts Section
            React.createElement('div', { className: 'mb-4' },
                React.createElement('h4', {
                    className: `text-base font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-800'}`
                }, '👥 Contacts'),

                // Existing contacts list
                contacts.length > 0 && React.createElement('div', { className: 'mb-3 space-y-2' },
                    contacts.map(contact =>
                        React.createElement('div', {
                            key: contact.id,
                            className: `p-3 rounded border ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'}`
                        },
                            React.createElement('div', { className: 'flex justify-between items-start' },
                                React.createElement('div', { className: 'flex-1' },
                                    React.createElement('div', { className: 'flex items-center gap-2' },
                                        React.createElement('span', {
                                            className: `font-semibold ${darkMode ? 'text-white' : 'text-gray-800'}`
                                        }, contact.name || 'Unnamed Contact'),
                                        contact.isPrimary && React.createElement('span', {
                                            className: 'px-2 py-0.5 text-xs bg-green-600 text-white rounded'
                                        }, 'Primary')
                                    ),
                                    contact.title && React.createElement('p', {
                                        className: `text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`
                                    }, contact.title),
                                    React.createElement('p', {
                                        className: `text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`
                                    }, [contact.email, contact.phone].filter(Boolean).join(' • '))
                                ),
                                React.createElement('div', { className: 'flex gap-1' },
                                    React.createElement('button', {
                                        type: 'button',
                                        onClick: () => handleEditContact(contact),
                                        className: 'px-2 py-1 text-sm bg-blue-500 hover:bg-blue-600 text-white rounded'
                                    }, '✏️'),
                                    React.createElement('button', {
                                        type: 'button',
                                        onClick: () => handleDeleteContact(contact.id),
                                        className: 'px-2 py-1 text-sm bg-red-600 hover:bg-red-700 text-white rounded'
                                    }, '🗑️')
                                )
                            )
                        )
                    )
                ),

                // Add/Edit contact form
                React.createElement('div', {
                    className: `p-3 rounded border ${darkMode ? 'bg-gray-900 border-gray-600' : 'bg-gray-100 border-gray-300'}`
                },
                    React.createElement('h5', {
                        className: `text-sm font-semibold mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`
                    }, editingContactId ? 'Edit Contact' : 'Add Contact'),

                    React.createElement('div', { className: 'grid grid-cols-1 md:grid-cols-2 gap-3 mb-3' },
                        React.createElement('div', {},
                            React.createElement('label', {
                                className: `block text-xs font-medium mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`
                            }, 'Contact Name'),
                            React.createElement('input', {
                                type: 'text',
                                value: newContact.name,
                                onChange: (e) => setNewContact(prev => ({ ...prev, name: e.target.value })),
                                className: `w-full px-2 py-1.5 text-sm border rounded ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`,
                                placeholder: 'John Smith'
                            })
                        ),
                        React.createElement('div', {},
                            React.createElement('label', {
                                className: `block text-xs font-medium mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`
                            }, 'Title'),
                            React.createElement('input', {
                                type: 'text',
                                value: newContact.title,
                                onChange: (e) => setNewContact(prev => ({ ...prev, title: e.target.value })),
                                className: `w-full px-2 py-1.5 text-sm border rounded ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`,
                                placeholder: 'Project Manager'
                            })
                        )
                    ),

                    React.createElement('div', { className: 'grid grid-cols-1 md:grid-cols-2 gap-3 mb-3' },
                        React.createElement('div', {},
                            React.createElement('label', {
                                className: `block text-xs font-medium mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`
                            }, 'Email'),
                            React.createElement('input', {
                                type: 'email',
                                value: newContact.email,
                                onChange: (e) => setNewContact(prev => ({ ...prev, email: e.target.value })),
                                className: `w-full px-2 py-1.5 text-sm border rounded ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`,
                                placeholder: 'john@example.com'
                            })
                        ),
                        React.createElement('div', {},
                            React.createElement('label', {
                                className: `block text-xs font-medium mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`
                            }, 'Phone'),
                            React.createElement('input', {
                                type: 'tel',
                                value: newContact.phone,
                                onChange: (e) => setNewContact(prev => ({ ...prev, phone: e.target.value })),
                                className: `w-full px-2 py-1.5 text-sm border rounded ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`,
                                placeholder: '(555) 123-4567'
                            })
                        )
                    ),

                    React.createElement('div', { className: 'flex items-center gap-3' },
                        React.createElement('label', { className: 'flex items-center gap-2 cursor-pointer' },
                            React.createElement('input', {
                                type: 'checkbox',
                                checked: newContact.isPrimary,
                                onChange: (e) => setNewContact(prev => ({ ...prev, isPrimary: e.target.checked })),
                                className: 'cursor-pointer'
                            }),
                            React.createElement('span', {
                                className: `text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`
                            }, 'Primary Contact')
                        ),
                        React.createElement('div', { className: 'flex-1' }),
                        editingContactId && React.createElement('button', {
                            type: 'button',
                            onClick: handleCancelEdit,
                            className: `px-3 py-1.5 text-sm rounded ${darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-300 text-gray-700'}`
                        }, 'Cancel'),
                        React.createElement('button', {
                            type: 'button',
                            onClick: editingContactId ? handleUpdateContact : handleAddContact,
                            className: 'px-3 py-1.5 text-sm bg-green-600 hover:bg-green-700 text-white rounded'
                        }, editingContactId ? 'Update Contact' : '+ Add Contact')
                    )
                )
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
            ),

            // Confirmation Modal
            window.ConfirmModal && React.createElement(window.ConfirmModal, {
                isOpen: deleteContactModal.isOpen,
                onConfirm: () => deleteContactModal.modalData?.onConfirm?.(),
                onCancel: deleteContactModal.close,
                title: 'Delete Contact',
                message: 'Delete this contact?',
                confirmText: 'Delete',
                variant: 'danger',
                darkMode: darkMode
            })
        );
    }

    // Client List Item Component
    function ClientListItem({ client, onEdit, onDelete, onViewHistory, darkMode, reports }) {
        const [showDetails, setShowDetails] = useState(false);
        const [selectedContactId, setSelectedContactId] = useState(null);

        const clientService = useMemo(() => new window.ClientService(new window.StorageService()), []);

        // Get primary contact for display
        const primaryContact = useMemo(() => {
            return clientService.getPrimaryContact(client);
        }, [client]);

        // Get selected contact or primary
        const displayContact = useMemo(() => {
            if (selectedContactId && client.contacts) {
                return client.contacts.find(c => c.id === selectedContactId) || primaryContact;
            }
            return primaryContact;
        }, [client, selectedContactId, primaryContact]);

        // Calculate client stats if reports are provided
        const stats = useMemo(() => {
            if (!reports) return null;
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

                    // Contact selector dropdown (if multiple contacts)
                    client.contacts && client.contacts.length > 1 ?
                        React.createElement('div', { className: 'mt-2 mb-1' },
                            React.createElement('select', {
                                value: selectedContactId || (primaryContact?.id || ''),
                                onChange: (e) => setSelectedContactId(e.target.value),
                                className: `text-sm px-2 py-1 border rounded ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`
                            },
                                client.contacts.map(contact =>
                                    React.createElement('option', { key: contact.id, value: contact.id },
                                        `${contact.name}${contact.isPrimary ? ' (Primary)' : ''}${contact.title ? ' - ' + contact.title : ''}`
                                    )
                                )
                            )
                        ) : null,

                    // Display selected/primary contact info
                    displayContact && React.createElement('div', { className: 'mt-1' },
                        displayContact.name && React.createElement('p', {
                            className: `text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`
                        }, `Contact: ${displayContact.name}${displayContact.title ? ' - ' + displayContact.title : ''}`),
                        (displayContact.email || displayContact.phone) && React.createElement('p', {
                            className: `text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`
                        }, [displayContact.email, displayContact.phone].filter(Boolean).join(' • '))
                    ),

                    client.contacts && client.contacts.length > 0 && React.createElement('p', {
                        className: `text-xs ${darkMode ? 'text-gray-500' : 'text-gray-500'} mt-1`
                    }, `${client.contacts.length} contact${client.contacts.length !== 1 ? 's' : ''}`),

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
                        className: `px-3 py-1.5 text-sm rounded-lg ${darkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'} text-white`,
                        title: 'Edit client'
                    }, '✏️'),
                    React.createElement('button', {
                        onClick: () => onDelete(client.id),
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

                // Show all contacts if multiple
                client.contacts && client.contacts.length > 0 && React.createElement('div', { className: 'mb-2' },
                    React.createElement('p', {
                        className: `text-sm font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`
                    }, 'All Contacts:'),
                    React.createElement('div', { className: 'space-y-1' },
                        client.contacts.map(contact =>
                            React.createElement('div', {
                                key: contact.id,
                                className: `text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'} pl-2`
                            }, `• ${contact.name}${contact.title ? ' (' + contact.title + ')' : ''}${contact.isPrimary ? ' [Primary]' : ''} - ${[contact.email, contact.phone].filter(Boolean).join(', ')}`)
                        )
                    )
                ),

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
                        React.createElement('div', { className: 'font-bold text-green-600' }, `$${stats.estimatedRevenue}`),
                        React.createElement('div', { className: `text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}` }, 'Est. Revenue')
                    )
                )
            )
        );
    }

    // Client History Modal Component (unchanged from original - showing reports for this client)
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

        const primaryContact = clientService.getPrimaryContact(client);

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
                        primaryContact && primaryContact.name && React.createElement('p', {
                            className: `text-xs sm:text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`
                        }, `Primary Contact: ${primaryContact.name}`)
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

        // Initialize Firebase for real-time sync
        const firebase = window.useFirebase(true);
        const firebaseInitialized = useRef(false);
        const isUpdatingFromFirebase = useRef(false);

        // Toast notifications
        const { toast } = window.useToast();

        // Use modals for confirmations
        const deleteClientModal = window.useModal();

        // Load clients on mount
        useEffect(() => {
            loadClients();
        }, [sortBy, sortOrder]);

        const loadClients = () => {
            const allClients = clientService.getSortedClients(sortBy, sortOrder);
            setClients(allClients);
        };

        // PULL from Firebase on initial load (Firebase is source of truth)
        useEffect(() => {
            if (!firebase.isReady || firebaseInitialized.current) return;

            (async () => {
                try {
                    const firebaseClients = await firebase.getFromFirebase('clients');
                    if (firebaseClients && Array.isArray(firebaseClients) && firebaseClients.length > 0) {
                        console.log('📥 Loading initial clients from Firebase:', firebaseClients.length);
                        isUpdatingFromFirebase.current = true;
                        const storage = new window.StorageService();
                        storage.saveGlobal('clientsList', firebaseClients);
                        loadClients();
                        setTimeout(() => { isUpdatingFromFirebase.current = false; }, 100);
                    } else if (clients.length > 0) {
                        // Firebase is empty but we have local data - push to Firebase
                        console.log('📤 Syncing local clients to Firebase:', clients.length);
                        await firebase.saveToFirebase('clients', clients);
                    }
                    firebaseInitialized.current = true;
                } catch (error) {
                    console.error('Error loading clients from Firebase:', error);
                    firebaseInitialized.current = true;
                }
            })();
        }, [firebase.isReady]);

        // PUSH to Firebase when clients change locally (not from Firebase)
        useEffect(() => {
            if (!firebase.isReady || !firebaseInitialized.current || isUpdatingFromFirebase.current) return;
            if (firebase.syncEnabled && clients.length > 0) {
                firebase.saveToFirebase('clients', clients);
            }
        }, [clients, firebase.isReady, firebase.syncEnabled]);

        // Listen for real-time updates from Firebase
        useEffect(() => {
            if (!firebase.isReady) return;

            firebase.listenToFirebase('clients', (firebaseClients) => {
                if (firebaseClients && Array.isArray(firebaseClients)) {
                    const currentIds = new Set(clients.map(c => c.id));
                    const firebaseIds = new Set(firebaseClients.map(c => c.id));
                    const isDifferent = currentIds.size !== firebaseIds.size ||
                        [...currentIds].some(id => !firebaseIds.has(id));

                    if (isDifferent) {
                        console.log('📥 Received updated clients from Firebase:', firebaseClients.length);
                        isUpdatingFromFirebase.current = true;
                        const storage = new window.StorageService();
                        storage.saveGlobal('clientsList', firebaseClients);
                        loadClients();
                        setTimeout(() => { isUpdatingFromFirebase.current = false; }, 100);
                    }
                }
            });

            return () => {
                firebase.unlistenFromFirebase('clients');
            };
        }, [firebase.isReady]);

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
                toast.error(error.message);
            }
        };

        const handleEdit = (client) => {
            setEditingClient(client);
            setShowForm(true);
        };

        const handleDelete = (clientId) => {
            const client = clients.find(c => c.id === clientId);
            deleteClientModal.open({
                message: `Delete client "${client?.name}"? This cannot be undone.`,
                onConfirm: () => {
                    try {
                        clientService.deleteClient(clientId);
                        loadClients();
                        deleteClientModal.close();
                    } catch (error) {
                        toast.error(error.message);
                        deleteClientModal.close();
                    }
                }
            });
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
                }),

                // Confirmation Modal
                window.ConfirmModal && React.createElement(window.ConfirmModal, {
                    isOpen: deleteClientModal.isOpen,
                    onConfirm: () => deleteClientModal.modalData?.onConfirm?.(),
                    onCancel: deleteClientModal.close,
                    title: 'Delete Client',
                    message: deleteClientModal.modalData?.message || 'Are you sure you want to delete this client?',
                    confirmText: 'Delete',
                    variant: 'danger',
                    darkMode: darkMode
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
