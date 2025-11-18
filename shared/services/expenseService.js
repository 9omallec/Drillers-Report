// Expense Service - Manages job-related expenses
// Tracks expenses by category, links to reports, and provides summaries

(function() {
    'use strict';

    class ExpenseService {
        constructor(storageService) {
            this.storage = storageService;
            this.STORAGE_KEY = 'expenses';
        }

        // Default expense categories
        getDefaultCategories() {
            return [
                'Fuel',
                'Lodging',
                'Meals',
                'Supplies',
                'Equipment Rental',
                'Subcontractor',
                'Permits/Fees',
                'Repairs/Maintenance',
                'Travel',
                'Other'
            ];
        }

        // Generate unique ID for new expenses
        generateId() {
            return 'exp_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        }

        // Get all expenses
        getAllExpenses() {
            return this.storage.loadGlobal(this.STORAGE_KEY, []);
        }

        // Get expense by ID
        getExpenseById(id) {
            const expenses = this.getAllExpenses();
            return expenses.find(expense => expense.id === id);
        }

        // Get expenses for a specific report
        getExpensesByReport(reportId) {
            const expenses = this.getAllExpenses();
            return expenses.filter(expense => expense.reportId === reportId);
        }

        // Get expenses by client
        getExpensesByClient(clientName) {
            const expenses = this.getAllExpenses();
            return expenses.filter(expense =>
                expense.clientName && expense.clientName.toLowerCase() === clientName.toLowerCase()
            );
        }

        // Get expenses by category
        getExpensesByCategory(category) {
            const expenses = this.getAllExpenses();
            return expenses.filter(expense => expense.category === category);
        }

        // Get expenses by date range
        getExpensesByDateRange(startDate, endDate) {
            const expenses = this.getAllExpenses();
            const start = new Date(startDate);
            const end = new Date(endDate);

            return expenses.filter(expense => {
                const expenseDate = new Date(expense.date);
                return expenseDate >= start && expenseDate <= end;
            });
        }

        // Create new expense
        createExpense(expenseData) {
            const expenses = this.getAllExpenses();

            const newExpense = {
                id: this.generateId(),
                category: expenseData.category || 'Other',
                amount: parseFloat(expenseData.amount) || 0,
                date: expenseData.date || new Date().toISOString().split('T')[0],
                description: expenseData.description || '',
                vendor: expenseData.vendor || '',
                paymentMethod: expenseData.paymentMethod || '',
                reportId: expenseData.reportId || null,
                jobName: expenseData.jobName || '',
                clientName: expenseData.clientName || '',
                receiptUrl: expenseData.receiptUrl || null,
                billable: expenseData.billable !== undefined ? expenseData.billable : true,
                reimbursed: expenseData.reimbursed || false,
                notes: expenseData.notes || '',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };

            expenses.push(newExpense);
            this.storage.saveGlobal(this.STORAGE_KEY, expenses);

            return newExpense;
        }

        // Update existing expense
        updateExpense(id, updates) {
            const expenses = this.getAllExpenses();
            const index = expenses.findIndex(expense => expense.id === id);

            if (index === -1) {
                throw new Error(`Expense with ID "${id}" not found`);
            }

            expenses[index] = {
                ...expenses[index],
                ...updates,
                id: expenses[index].id, // Preserve ID
                createdAt: expenses[index].createdAt, // Preserve creation date
                updatedAt: new Date().toISOString()
            };

            this.storage.saveGlobal(this.STORAGE_KEY, expenses);

            return expenses[index];
        }

        // Delete expense
        deleteExpense(id) {
            const expenses = this.getAllExpenses();
            const filteredExpenses = expenses.filter(expense => expense.id !== id);

            if (filteredExpenses.length === expenses.length) {
                throw new Error(`Expense with ID "${id}" not found`);
            }

            this.storage.saveGlobal(this.STORAGE_KEY, filteredExpenses);

            return true;
        }

        // Mark expense as reimbursed
        markAsReimbursed(id, reimbursedDate) {
            return this.updateExpense(id, {
                reimbursed: true,
                reimbursedDate: reimbursedDate || new Date().toISOString().split('T')[0]
            });
        }

        // Calculate expense statistics
        getExpenseStats(filters = {}) {
            let expenses = this.getAllExpenses();

            // Apply filters
            if (filters.reportId) {
                expenses = expenses.filter(e => e.reportId === filters.reportId);
            }
            if (filters.clientName) {
                expenses = expenses.filter(e => e.clientName === filters.clientName);
            }
            if (filters.category) {
                expenses = expenses.filter(e => e.category === filters.category);
            }
            if (filters.startDate && filters.endDate) {
                const start = new Date(filters.startDate);
                const end = new Date(filters.endDate);
                expenses = expenses.filter(e => {
                    const date = new Date(e.date);
                    return date >= start && date <= end;
                });
            }

            const stats = {
                total: expenses.length,
                totalAmount: 0,
                billableAmount: 0,
                nonBillableAmount: 0,
                reimbursedAmount: 0,
                pendingReimbursement: 0,
                byCategory: {}
            };

            expenses.forEach(expense => {
                stats.totalAmount += expense.amount;

                if (expense.billable) {
                    stats.billableAmount += expense.amount;
                } else {
                    stats.nonBillableAmount += expense.amount;
                }

                if (expense.reimbursed) {
                    stats.reimbursedAmount += expense.amount;
                } else {
                    stats.pendingReimbursement += expense.amount;
                }

                // By category
                if (!stats.byCategory[expense.category]) {
                    stats.byCategory[expense.category] = {
                        count: 0,
                        amount: 0
                    };
                }
                stats.byCategory[expense.category].count++;
                stats.byCategory[expense.category].amount += expense.amount;
            });

            return stats;
        }

        // Get monthly expense summary
        getMonthlyExpenses(year, month) {
            const expenses = this.getAllExpenses();
            const startDate = new Date(year, month - 1, 1);
            const endDate = new Date(year, month, 0);

            return expenses.filter(expense => {
                const expenseDate = new Date(expense.date);
                return expenseDate >= startDate && expenseDate <= endDate;
            });
        }

        // Export expenses to CSV
        exportToCSV(filters = {}) {
            let expenses = this.getAllExpenses();

            // Apply filters
            if (filters.startDate && filters.endDate) {
                expenses = this.getExpensesByDateRange(filters.startDate, filters.endDate);
            }
            if (filters.category) {
                expenses = expenses.filter(e => e.category === filters.category);
            }
            if (filters.clientName) {
                expenses = expenses.filter(e => e.clientName === filters.clientName);
            }

            const headers = ['Date', 'Category', 'Amount', 'Description', 'Vendor', 'Client', 'Job', 'Billable', 'Reimbursed', 'Notes'];

            const rows = expenses.map(exp => [
                exp.date,
                exp.category,
                `$${exp.amount.toFixed(2)}`,
                exp.description,
                exp.vendor || '',
                exp.clientName || '',
                exp.jobName || '',
                exp.billable ? 'Yes' : 'No',
                exp.reimbursed ? 'Yes' : 'No',
                exp.notes || ''
            ]);

            return [headers, ...rows].map(row => row.join(',')).join('\n');
        }
    }

    // Export service
    window.ExpenseService = ExpenseService;

})();
