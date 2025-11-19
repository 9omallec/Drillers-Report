// Profitability Dashboard Component
// Shows revenue, expenses, profit margins, and financial analytics

(function() {
    'use strict';

    const { useState, useEffect, useMemo } = React;

    window.ProfitabilityDashboard = function ProfitabilityDashboard({ reports, darkMode }) {
        const [storageService] = useState(() => new window.StorageService());
        const [invoiceService] = useState(() => new window.InvoiceService(storageService));
        const [expenseService] = useState(() => new window.ExpenseService(storageService));
        const [rateService] = useState(() => new window.RateSheetService());
        const [clientService] = useState(() => new window.ClientService(storageService));

        // Initialize Firebase for real-time sync
        const firebase = window.useFirebase(true);

        const [timeframe, setTimeframe] = useState('all'); // all, month, quarter, year
        const [selectedClient, setSelectedClient] = useState('all');

        // Sync invoices and expenses to Firebase
        useEffect(() => {
            if (firebase.isReady && firebase.syncEnabled) {
                const invoices = invoiceService.getAllInvoices();
                const expenses = expenseService.getAllExpenses();

                if (invoices.length > 0) {
                    firebase.saveToFirebase('invoices', invoices);
                }
                if (expenses.length > 0) {
                    firebase.saveToFirebase('expenses', expenses);
                }
            }
        }, [firebase.isReady, firebase.syncEnabled, invoiceService, expenseService]);

        // Listen for real-time updates from Firebase
        useEffect(() => {
            if (!firebase.isReady) return;

            // Listen to invoices
            firebase.listenToFirebase('invoices', (firebaseInvoices) => {
                if (firebaseInvoices && Array.isArray(firebaseInvoices)) {
                    console.log('📥 Received updated invoices from Firebase');
                    storageService.saveGlobal('invoices', firebaseInvoices);
                }
            });

            // Listen to expenses
            firebase.listenToFirebase('expenses', (firebaseExpenses) => {
                if (firebaseExpenses && Array.isArray(firebaseExpenses)) {
                    console.log('📥 Received updated expenses from Firebase');
                    storageService.saveGlobal('expenses', firebaseExpenses);
                }
            });

            return () => {
                firebase.unlistenFromFirebase('invoices');
                firebase.unlistenFromFirebase('expenses');
            };
        }, [firebase.isReady]);

        // Calculate profitability metrics
        const metrics = useMemo(() => {
            // Filter reports by selected client
            const filteredReports = selectedClient === 'all'
                ? reports
                : reports.filter(report => {
                    const clientName = report.customer || report.client;
                    return clientName === selectedClient;
                });

            // Get invoice and expense stats filtered by client
            const invoiceStats = selectedClient === 'all'
                ? invoiceService.getInvoiceStats()
                : invoiceService.getInvoiceStats({ clientName: selectedClient });

            const expenseStats = selectedClient === 'all'
                ? expenseService.getExpenseStats()
                : expenseService.getExpenseStats({ clientName: selectedClient });

            // Calculate estimated revenue from filtered reports
            let estimatedRevenue = 0;
            let totalHours = 0;
            let totalFootage = 0;

            filteredReports.forEach(report => {
                // Get client
                const clientName = report.customer || report.client;
                const client = clientService.getClientByName(clientName);

                if (client) {
                    // Calculate based on client's rate type
                    if (client.rateType === 'per_foot') {
                        const footage = report.borings?.reduce((sum, boring) =>
                            sum + (parseFloat(boring.footage) || 0), 0) || 0;
                        totalFootage += footage;
                        estimatedRevenue += footage * client.billingRate;
                    } else if (client.rateType === 'per_hour') {
                        const hours = report.workDays?.reduce((sum, day) =>
                            sum + (parseFloat(day.hoursOnSite) || 0), 0) || 0;
                        totalHours += hours;
                        estimatedRevenue += hours * client.billingRate;
                    }
                }
            });

            const totalRevenue = invoiceStats.paidAmount + estimatedRevenue;
            const totalExpenses = expenseStats.totalAmount;
            const grossProfit = totalRevenue - totalExpenses;
            const profitMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;

            return {
                totalRevenue,
                invoicedRevenue: invoiceStats.totalAmount,
                paidRevenue: invoiceStats.paidAmount,
                pendingRevenue: invoiceStats.unpaidAmount,
                estimatedRevenue,
                totalExpenses,
                billableExpenses: expenseStats.billableAmount,
                nonBillableExpenses: expenseStats.nonBillableAmount,
                grossProfit,
                profitMargin,
                totalHours,
                totalFootage,
                avgHourlyRate: totalHours > 0 ? totalRevenue / totalHours : 0,
                avgFootageRate: totalFootage > 0 ? totalRevenue / totalFootage : 0,
                overdueAmount: invoiceStats.overdueAmount,
                expensesByCategory: expenseStats.byCategory
            };
        }, [reports, selectedClient, invoiceService, expenseService, clientService]);

        // Get unique clients from reports
        const clients = useMemo(() => {
            const clientNames = new Set();
            reports.forEach(report => {
                const name = report.customer || report.client;
                if (name) clientNames.add(name);
            });
            return Array.from(clientNames).sort();
        }, [reports]);

        const bgColor = darkMode ? 'bg-gray-800' : 'bg-white';
        const textColor = darkMode ? 'text-gray-100' : 'text-gray-800';
        const borderColor = darkMode ? 'border-gray-700' : 'border-gray-300';

        return React.createElement('div', {
            className: `rounded-xl p-6 shadow-lg ${bgColor} ${textColor}`
        },
            // Header
            React.createElement('div', {
                className: 'flex justify-between items-center mb-6'
            },
                React.createElement('h2', {
                    className: 'text-2xl font-bold'
                }, '💰 Profitability Dashboard'),
                React.createElement('div', {
                    className: 'flex gap-3'
                },
                    React.createElement('select', {
                        value: selectedClient,
                        onChange: (e) => setSelectedClient(e.target.value),
                        className: `px-4 py-2 border rounded-lg ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`
                    },
                        React.createElement('option', { value: 'all' }, 'All Clients'),
                        clients.map(client =>
                            React.createElement('option', { key: client, value: client }, client)
                        )
                    )
                )
            ),

            // Key Metrics Cards
            React.createElement('div', {
                className: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6'
            },
                // Total Revenue
                React.createElement('div', {
                    className: `p-4 rounded-lg border ${borderColor} ${darkMode ? 'bg-gray-900' : 'bg-blue-50'}`
                },
                    React.createElement('div', { className: 'text-sm text-gray-500 mb-1' }, 'Total Revenue'),
                    React.createElement('div', { className: 'text-2xl font-bold text-blue-600' },
                        `$${metrics.totalRevenue.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`
                    ),
                    React.createElement('div', { className: 'text-xs text-gray-500 mt-1' },
                        `Paid: $${metrics.paidRevenue.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`
                    )
                ),

                // Total Expenses
                React.createElement('div', {
                    className: `p-4 rounded-lg border ${borderColor} ${darkMode ? 'bg-gray-900' : 'bg-red-50'}`
                },
                    React.createElement('div', { className: 'text-sm text-gray-500 mb-1' }, 'Total Expenses'),
                    React.createElement('div', { className: 'text-2xl font-bold text-red-600' },
                        `$${metrics.totalExpenses.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`
                    ),
                    React.createElement('div', { className: 'text-xs text-gray-500 mt-1' },
                        `Billable: $${metrics.billableExpenses.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`
                    )
                ),

                // Gross Profit
                React.createElement('div', {
                    className: `p-4 rounded-lg border ${borderColor} ${darkMode ? 'bg-gray-900' : 'bg-green-50'}`
                },
                    React.createElement('div', { className: 'text-sm text-gray-500 mb-1' }, 'Gross Profit'),
                    React.createElement('div', {
                        className: `text-2xl font-bold ${metrics.grossProfit >= 0 ? 'text-green-600' : 'text-red-600'}`
                    },
                        `$${Math.abs(metrics.grossProfit).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`
                    ),
                    React.createElement('div', { className: 'text-xs text-gray-500 mt-1' },
                        `${metrics.profitMargin >= 0 ? '+' : ''}${metrics.profitMargin.toFixed(1)}% margin`
                    )
                ),

                // Pending Revenue
                React.createElement('div', {
                    className: `p-4 rounded-lg border ${borderColor} ${darkMode ? 'bg-gray-900' : 'bg-yellow-50'}`
                },
                    React.createElement('div', { className: 'text-sm text-gray-500 mb-1' }, 'Pending Revenue'),
                    React.createElement('div', { className: 'text-2xl font-bold text-yellow-600' },
                        `$${metrics.pendingRevenue.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`
                    ),
                    metrics.overdueAmount > 0 && React.createElement('div', { className: 'text-xs text-red-500 mt-1' },
                        `Overdue: $${metrics.overdueAmount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`
                    )
                )
            ),

            // Expenses by Category
            Object.keys(metrics.expensesByCategory).length > 0 && React.createElement('div', {
                className: `p-4 rounded-lg border ${borderColor} mt-4`
            },
                React.createElement('h3', {
                    className: 'text-lg font-bold mb-3'
                }, '📊 Expenses by Category'),
                React.createElement('div', {
                    className: 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3'
                },
                    Object.entries(metrics.expensesByCategory)
                        .sort(([, a], [, b]) => b.amount - a.amount)
                        .map(([category, data]) =>
                            React.createElement('div', {
                                key: category,
                                className: `p-3 rounded ${darkMode ? 'bg-gray-900' : 'bg-gray-100'}`
                            },
                                React.createElement('div', { className: 'text-xs text-gray-500' }, category),
                                React.createElement('div', { className: 'text-sm font-bold' },
                                    `$${data.amount.toFixed(2)}`
                                ),
                                React.createElement('div', { className: 'text-xs text-gray-500' },
                                    `${data.count} expense${data.count !== 1 ? 's' : ''}`
                                )
                            )
                        )
                )
            )
        );
    };

})();
