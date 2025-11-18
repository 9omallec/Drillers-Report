/**
 * Client Service
 * Manages client/customer database
 * Stores contact info, billing rates, preferences, and notes
 */

class ClientService {
    constructor(storageService) {
        this.storage = storageService;
        this.STORAGE_KEY = 'clients';
    }

    // Generate unique ID for new clients
    generateId() {
        return 'client_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    // Get all clients
    getAllClients() {
        return this.storage.loadGlobal(this.STORAGE_KEY, []);
    }

    // Get client by ID
    getClientById(id) {
        const clients = this.getAllClients();
        return clients.find(client => client.id === id);
    }

    // Get client by name (case-insensitive)
    getClientByName(name) {
        const clients = this.getAllClients();
        return clients.find(client =>
            client.name.toLowerCase() === name.toLowerCase()
        );
    }

    // Search clients by name or contact info
    searchClients(searchTerm) {
        if (!searchTerm) return this.getAllClients();

        const clients = this.getAllClients();
        const term = searchTerm.toLowerCase();

        return clients.filter(client => {
            // Search in client name
            if (client.name.toLowerCase().includes(term)) return true;

            // Search in old single contact fields (backward compatibility)
            if (client.contactName?.toLowerCase().includes(term)) return true;
            if (client.email?.toLowerCase().includes(term)) return true;
            if (client.phone?.includes(term)) return true;

            // Search in new contacts array
            if (client.contacts && Array.isArray(client.contacts)) {
                return client.contacts.some(contact =>
                    contact.name?.toLowerCase().includes(term) ||
                    contact.email?.toLowerCase().includes(term) ||
                    contact.phone?.includes(term)
                );
            }

            return false;
        });
    }

    // Create new client
    createClient(clientData) {
        const clients = this.getAllClients();

        // Check for duplicate name
        const existingClient = this.getClientByName(clientData.name);
        if (existingClient) {
            throw new Error(`Client with name "${clientData.name}" already exists`);
        }

        const newClient = {
            id: this.generateId(),
            name: clientData.name || '',
            address: clientData.address || '',
            billingRate: parseFloat(clientData.billingRate) || 0,
            rateType: clientData.rateType || 'per_foot', // 'per_foot' or 'per_hour'
            notes: clientData.notes || '',
            contacts: clientData.contacts || [], // Array of contacts
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        // Backward compatibility: if old fields provided, create first contact
        if (clientData.contactName || clientData.email || clientData.phone) {
            newClient.contacts.push({
                id: this.generateId(),
                name: clientData.contactName || '',
                email: clientData.email || '',
                phone: clientData.phone || '',
                isPrimary: true
            });
        }

        clients.push(newClient);
        this.storage.saveGlobal(this.STORAGE_KEY, clients);

        return newClient;
    }

    // Update existing client
    updateClient(id, updates) {
        const clients = this.getAllClients();
        const index = clients.findIndex(client => client.id === id);

        if (index === -1) {
            throw new Error(`Client with ID "${id}" not found`);
        }

        // Check if name changed and if new name is duplicate
        if (updates.name && updates.name !== clients[index].name) {
            const existingClient = this.getClientByName(updates.name);
            if (existingClient && existingClient.id !== id) {
                throw new Error(`Client with name "${updates.name}" already exists`);
            }
        }

        clients[index] = {
            ...clients[index],
            ...updates,
            id: clients[index].id, // Preserve ID
            createdAt: clients[index].createdAt, // Preserve creation date
            updatedAt: new Date().toISOString()
        };

        this.storage.saveGlobal(this.STORAGE_KEY, clients);

        return clients[index];
    }

    // Delete client
    deleteClient(id) {
        const clients = this.getAllClients();
        const filteredClients = clients.filter(client => client.id !== id);

        if (filteredClients.length === clients.length) {
            throw new Error(`Client with ID "${id}" not found`);
        }

        this.storage.saveGlobal(this.STORAGE_KEY, filteredClients);

        return true;
    }

    // Add contact to client
    addContact(clientId, contactData) {
        const clients = this.getAllClients();
        const clientIndex = clients.findIndex(c => c.id === clientId);

        if (clientIndex === -1) {
            throw new Error(`Client with ID "${clientId}" not found`);
        }

        // Ensure contacts array exists
        if (!clients[clientIndex].contacts) {
            clients[clientIndex].contacts = [];
        }

        const newContact = {
            id: this.generateId(),
            name: contactData.name || '',
            email: contactData.email || '',
            phone: contactData.phone || '',
            title: contactData.title || '',
            isPrimary: contactData.isPrimary || false
        };

        // If this is marked as primary, unmark all others
        if (newContact.isPrimary) {
            clients[clientIndex].contacts.forEach(c => c.isPrimary = false);
        }

        clients[clientIndex].contacts.push(newContact);
        clients[clientIndex].updatedAt = new Date().toISOString();

        this.storage.saveGlobal(this.STORAGE_KEY, clients);

        return newContact;
    }

    // Update contact for client
    updateContact(clientId, contactId, updates) {
        const clients = this.getAllClients();
        const clientIndex = clients.findIndex(c => c.id === clientId);

        if (clientIndex === -1) {
            throw new Error(`Client with ID "${clientId}" not found`);
        }

        if (!clients[clientIndex].contacts) {
            clients[clientIndex].contacts = [];
        }

        const contactIndex = clients[clientIndex].contacts.findIndex(c => c.id === contactId);

        if (contactIndex === -1) {
            throw new Error(`Contact with ID "${contactId}" not found`);
        }

        // If marking as primary, unmark all others
        if (updates.isPrimary) {
            clients[clientIndex].contacts.forEach(c => c.isPrimary = false);
        }

        clients[clientIndex].contacts[contactIndex] = {
            ...clients[clientIndex].contacts[contactIndex],
            ...updates,
            id: contactId // Preserve ID
        };

        clients[clientIndex].updatedAt = new Date().toISOString();

        this.storage.saveGlobal(this.STORAGE_KEY, clients);

        return clients[clientIndex].contacts[contactIndex];
    }

    // Delete contact from client
    deleteContact(clientId, contactId) {
        const clients = this.getAllClients();
        const clientIndex = clients.findIndex(c => c.id === clientId);

        if (clientIndex === -1) {
            throw new Error(`Client with ID "${clientId}" not found`);
        }

        if (!clients[clientIndex].contacts) {
            return true;
        }

        const originalLength = clients[clientIndex].contacts.length;
        clients[clientIndex].contacts = clients[clientIndex].contacts.filter(c => c.id !== contactId);

        if (clients[clientIndex].contacts.length === originalLength) {
            throw new Error(`Contact with ID "${contactId}" not found`);
        }

        clients[clientIndex].updatedAt = new Date().toISOString();

        this.storage.saveGlobal(this.STORAGE_KEY, clients);

        return true;
    }

    // Get primary contact for a client
    getPrimaryContact(client) {
        // Backward compatibility: check old single contact fields first
        if (client.contactName || client.email || client.phone) {
            return {
                name: client.contactName || '',
                email: client.email || '',
                phone: client.phone || ''
            };
        }

        // New contacts array
        if (client.contacts && client.contacts.length > 0) {
            const primary = client.contacts.find(c => c.isPrimary);
            return primary || client.contacts[0];
        }

        return null;
    }

    // Migrate old client format to new contacts array
    migrateClientToNewFormat(clientId) {
        const clients = this.getAllClients();
        const clientIndex = clients.findIndex(c => c.id === clientId);

        if (clientIndex === -1) {
            throw new Error(`Client with ID "${clientId}" not found`);
        }

        const client = clients[clientIndex];

        // Skip if already migrated or nothing to migrate
        if (!client.contactName && !client.email && !client.phone) {
            return client;
        }

        // Create contacts array if doesn't exist
        if (!client.contacts) {
            client.contacts = [];
        }

        // Add old contact info as first contact if not already there
        if (client.contactName || client.email || client.phone) {
            client.contacts.push({
                id: this.generateId(),
                name: client.contactName || '',
                email: client.email || '',
                phone: client.phone || '',
                isPrimary: true
            });

            // Remove old fields
            delete client.contactName;
            delete client.email;
            delete client.phone;

            client.updatedAt = new Date().toISOString();

            this.storage.saveGlobal(this.STORAGE_KEY, clients);
        }

        return client;
    }

    // Get client statistics (number of reports, total revenue, etc.)
    getClientStats(clientName, reports) {
        const clientReports = reports.filter(report =>
            (report.client || report.customer) === clientName
        );

        const client = this.getClientByName(clientName);

        const totalReports = clientReports.length;

        const totalFootage = clientReports.reduce((sum, report) => {
            return sum + (report.borings?.reduce((s, b) =>
                s + (parseFloat(b.footage) || 0), 0) || 0);
        }, 0);

        const totalHours = clientReports.reduce((sum, report) => {
            return sum + (report.workDays?.reduce((s, day) =>
                s + (parseFloat(day.hoursOnSite) || 0), 0) || 0);
        }, 0);

        let estimatedRevenue = 0;
        if (client) {
            if (client.rateType === 'per_foot') {
                estimatedRevenue = totalFootage * client.billingRate;
            } else if (client.rateType === 'per_hour') {
                estimatedRevenue = totalHours * client.billingRate;
            }
        }

        return {
            totalReports,
            totalFootage: parseFloat(totalFootage.toFixed(1)),
            totalHours: parseFloat(totalHours.toFixed(1)),
            estimatedRevenue: parseFloat(estimatedRevenue.toFixed(2)),
            avgFootagePerReport: totalReports > 0 ? parseFloat((totalFootage / totalReports).toFixed(1)) : 0,
            avgHoursPerReport: totalReports > 0 ? parseFloat((totalHours / totalReports).toFixed(1)) : 0
        };
    }

    // Import clients from CSV or JSON
    importClients(clientsData, mergeStrategy = 'skip') {
        // mergeStrategy: 'skip' (skip duplicates), 'overwrite' (update existing), 'rename' (create with new name)
        const results = {
            imported: 0,
            skipped: 0,
            updated: 0,
            errors: []
        };

        clientsData.forEach(clientData => {
            try {
                const existing = this.getClientByName(clientData.name);

                if (existing) {
                    if (mergeStrategy === 'overwrite') {
                        this.updateClient(existing.id, clientData);
                        results.updated++;
                    } else if (mergeStrategy === 'rename') {
                        clientData.name = `${clientData.name} (${Date.now()})`;
                        this.createClient(clientData);
                        results.imported++;
                    } else {
                        results.skipped++;
                    }
                } else {
                    this.createClient(clientData);
                    results.imported++;
                }
            } catch (error) {
                results.errors.push({ client: clientData.name, error: error.message });
            }
        });

        return results;
    }

    // Export all clients
    exportClients() {
        return this.getAllClients();
    }

    // Get clients sorted by various criteria
    getSortedClients(sortBy = 'name', sortOrder = 'asc') {
        const clients = this.getAllClients();

        clients.sort((a, b) => {
            let aVal = a[sortBy];
            let bVal = b[sortBy];

            // Handle string comparison
            if (typeof aVal === 'string') {
                aVal = aVal.toLowerCase();
                bVal = bVal?.toLowerCase() || '';
            }

            if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
            if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
            return 0;
        });

        return clients;
    }
}

// Export service
window.ClientService = ClientService;
