// Invoice Service - Manages invoicing for reports
// Tracks invoice status, amounts, payment dates, and client billing

(function() {
    'use strict';

    class InvoiceService {
        constructor(storageService) {
            this.storage = storageService;
            this.STORAGE_KEY = 'invoices';
        }

        // Generate unique ID for new invoices
        generateId() {
            return 'inv_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        }

        // Get all invoices
        getAllInvoices() {
            return this.storage.loadGlobal(this.STORAGE_KEY, []);
        }

        // Get invoice by ID
        getInvoiceById(id) {
            const invoices = this.getAllInvoices();
            return invoices.find(invoice => invoice.id === id);
        }

        // Get invoices for a specific client
        getInvoicesByClient(clientName) {
            const invoices = this.getAllInvoices();
            return invoices.filter(invoice =>
                invoice.clientName.toLowerCase() === clientName.toLowerCase()
            );
        }

        // Get invoices for a specific report
        getInvoicesByReport(reportId) {
            const invoices = this.getAllInvoices();
            return invoices.filter(invoice =>
                invoice.reportIds && invoice.reportIds.includes(reportId)
            );
        }

        // Get invoices by status
        getInvoicesByStatus(status) {
            const invoices = this.getAllInvoices();
            return invoices.filter(invoice => invoice.status === status);
        }

        // Get overdue invoices
        getOverdueInvoices() {
            const invoices = this.getAllInvoices();
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            return invoices.filter(invoice => {
                if (invoice.status === 'paid') return false;
                if (!invoice.dueDate) return false;

                const dueDate = new Date(invoice.dueDate);
                dueDate.setHours(0, 0, 0, 0);
                return dueDate < today;
            });
        }

        // Create new invoice
        createInvoice(invoiceData) {
            const invoices = this.getAllInvoices();

            const newInvoice = {
                id: this.generateId(),
                invoiceNumber: invoiceData.invoiceNumber || this.generateInvoiceNumber(),
                clientName: invoiceData.clientName || '',
                reportIds: invoiceData.reportIds || [],
                amount: parseFloat(invoiceData.amount) || 0,
                status: invoiceData.status || 'draft', // draft, sent, paid, overdue
                issueDate: invoiceData.issueDate || new Date().toISOString().split('T')[0],
                dueDate: invoiceData.dueDate || '',
                paidDate: invoiceData.paidDate || null,
                paymentMethod: invoiceData.paymentMethod || '',
                notes: invoiceData.notes || '',
                lineItems: invoiceData.lineItems || [],
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };

            invoices.push(newInvoice);
            this.storage.saveGlobal(this.STORAGE_KEY, invoices);

            return newInvoice;
        }

        // Update existing invoice
        updateInvoice(id, updates) {
            const invoices = this.getAllInvoices();
            const index = invoices.findIndex(invoice => invoice.id === id);

            if (index === -1) {
                throw new Error(`Invoice with ID "${id}" not found`);
            }

            invoices[index] = {
                ...invoices[index],
                ...updates,
                id: invoices[index].id, // Preserve ID
                invoiceNumber: invoices[index].invoiceNumber, // Preserve invoice number
                createdAt: invoices[index].createdAt, // Preserve creation date
                updatedAt: new Date().toISOString()
            };

            this.storage.saveGlobal(this.STORAGE_KEY, invoices);

            return invoices[index];
        }

        // Delete invoice
        deleteInvoice(id) {
            const invoices = this.getAllInvoices();
            const filteredInvoices = invoices.filter(invoice => invoice.id !== id);

            if (filteredInvoices.length === invoices.length) {
                throw new Error(`Invoice with ID "${id}" not found`);
            }

            this.storage.saveGlobal(this.STORAGE_KEY, filteredInvoices);

            return true;
        }

        // Mark invoice as sent
        markAsSent(id, sentDate) {
            return this.updateInvoice(id, {
                status: 'sent',
                sentDate: sentDate || new Date().toISOString().split('T')[0]
            });
        }

        // Mark invoice as paid
        markAsPaid(id, paidDate, paymentMethod) {
            return this.updateInvoice(id, {
                status: 'paid',
                paidDate: paidDate || new Date().toISOString().split('T')[0],
                paymentMethod: paymentMethod || ''
            });
        }

        // Generate invoice number (auto-increment)
        generateInvoiceNumber() {
            const invoices = this.getAllInvoices();
            const currentYear = new Date().getFullYear();

            // Find highest number for current year
            const yearInvoices = invoices.filter(inv =>
                inv.invoiceNumber && inv.invoiceNumber.startsWith(currentYear.toString())
            );

            let maxNum = 0;
            yearInvoices.forEach(inv => {
                const match = inv.invoiceNumber.match(/(\d+)$/);
                if (match) {
                    const num = parseInt(match[1]);
                    if (num > maxNum) maxNum = num;
                }
            });

            return `${currentYear}-${String(maxNum + 1).padStart(4, '0')}`;
        }

        // Calculate invoice statistics
        getInvoiceStats() {
            const invoices = this.getAllInvoices();

            const stats = {
                total: invoices.length,
                draft: 0,
                sent: 0,
                paid: 0,
                overdue: 0,
                totalAmount: 0,
                paidAmount: 0,
                unpaidAmount: 0,
                overdueAmount: 0
            };

            const today = new Date();
            today.setHours(0, 0, 0, 0);

            invoices.forEach(invoice => {
                stats[invoice.status] = (stats[invoice.status] || 0) + 1;
                stats.totalAmount += invoice.amount;

                if (invoice.status === 'paid') {
                    stats.paidAmount += invoice.amount;
                } else {
                    stats.unpaidAmount += invoice.amount;

                    if (invoice.dueDate) {
                        const dueDate = new Date(invoice.dueDate);
                        dueDate.setHours(0, 0, 0, 0);
                        if (dueDate < today) {
                            stats.overdue++;
                            stats.overdueAmount += invoice.amount;
                        }
                    }
                }
            });

            return stats;
        }

        // Export invoices to CSV
        exportToCSV() {
            const invoices = this.getAllInvoices();
            const headers = ['Invoice #', 'Client', 'Amount', 'Status', 'Issue Date', 'Due Date', 'Paid Date', 'Payment Method', 'Notes'];

            const rows = invoices.map(inv => [
                inv.invoiceNumber,
                inv.clientName,
                `$${inv.amount.toFixed(2)}`,
                inv.status,
                inv.issueDate,
                inv.dueDate || '',
                inv.paidDate || '',
                inv.paymentMethod || '',
                inv.notes || ''
            ]);

            return [headers, ...rows].map(row => row.join(',')).join('\n');
        }

        // Import invoices from CSV
        importFromCSV(csvText) {
            const lines = csvText.split('\n').filter(line => line.trim());
            const imported = [];

            // Skip header row
            for (let i = 1; i < lines.length; i++) {
                const parts = lines[i].split(',');
                if (parts.length < 5) continue;

                try {
                    const invoice = this.createInvoice({
                        invoiceNumber: parts[0],
                        clientName: parts[1],
                        amount: parseFloat(parts[2].replace('$', '')),
                        status: parts[3],
                        issueDate: parts[4],
                        dueDate: parts[5] || '',
                        paidDate: parts[6] || null,
                        paymentMethod: parts[7] || '',
                        notes: parts[8] || ''
                    });
                    imported.push(invoice);
                } catch (error) {
                    console.error('Error importing invoice:', error);
                }
            }

            return imported;
        }
    }

    // Export service
    window.InvoiceService = InvoiceService;

})();
