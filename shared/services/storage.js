/**
 * Storage Service
 * Handles localStorage operations with project scoping
 * Shared between Report and Dashboard apps
 */

class StorageService {
    constructor() {
        this.projectId = this.getCurrentProjectId();
    }

    // Get current project ID
    getCurrentProjectId() {
        return localStorage.getItem('currentProjectId') || '';
    }

    // Set current project ID
    setCurrentProjectId(projectId) {
        this.projectId = projectId;
        if (projectId) {
            localStorage.setItem('currentProjectId', projectId);
        }
    }

    // Create storage key with project ID
    makeStorageKey(key, projectId = null) {
        const projId = projectId !== null ? projectId : this.projectId;
        return projId ? `${projId}_${key}` : key;
    }

    // Load from localStorage with project scoping
    load(key, defaultValue = null, projectId = null) {
        try {
            const storageKey = this.makeStorageKey(key, projectId);
            const item = localStorage.getItem(storageKey);
            return item ? JSON.parse(item) : defaultValue;
        } catch (error) {
            console.error('Error loading from storage:', error);
            return defaultValue;
        }
    }

    // Save to localStorage with project scoping
    save(key, value, projectId = null) {
        try {
            const storageKey = this.makeStorageKey(key, projectId);
            localStorage.setItem(storageKey, JSON.stringify(value));
            return true;
        } catch (error) {
            console.error('Error saving to storage:', error);

            // Check if quota exceeded
            if (error.name === 'QuotaExceededError' || error.code === 22) {
                console.warn('localStorage quota exceeded. Consider clearing old data.');
                this.handleQuotaExceeded();
            }
            return false;
        }
    }

    // Handle quota exceeded - try to free up space
    handleQuotaExceeded() {
        // Calculate current usage
        const usage = this.getStorageUsage();
        console.warn(`Storage usage: ${usage.usedMB.toFixed(2)}MB / ~5MB limit`);

        // Alert user
        if (window.useToast) {
            const toast = window.useToast();
            toast.error('Storage limit reached! Consider exporting and deleting old reports.');
        }
    }

    // Get storage usage information
    getStorageUsage() {
        let totalBytes = 0;

        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            const value = localStorage.getItem(key);
            if (key && value) {
                totalBytes += key.length + value.length;
            }
        }

        return {
            usedBytes: totalBytes,
            usedKB: totalBytes / 1024,
            usedMB: totalBytes / (1024 * 1024)
        };
    }

    // Remove from localStorage
    remove(key, projectId = null) {
        try {
            const storageKey = this.makeStorageKey(key, projectId);
            localStorage.removeItem(storageKey);
            return true;
        } catch (error) {
            console.error('Error removing from storage:', error);
            return false;
        }
    }

    // Load without project scoping (global storage)
    loadGlobal(key, defaultValue = null) {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : defaultValue;
        } catch (error) {
            console.error('Error loading from global storage:', error);
            return defaultValue;
        }
    }

    // Save without project scoping (global storage)
    saveGlobal(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (error) {
            console.error('Error saving to global storage:', error);

            // Check if quota exceeded
            if (error.name === 'QuotaExceededError' || error.code === 22) {
                console.warn('localStorage quota exceeded. Consider clearing old data.');
                this.handleQuotaExceeded();
            }
            return false;
        }
    }

    // Clear all project-specific data
    clearProjectData(projectId = null) {
        const projId = projectId !== null ? projectId : this.projectId;
        if (!projId) return;

        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith(`${projId}_`)) {
                keysToRemove.push(key);
            }
        }

        keysToRemove.forEach(key => localStorage.removeItem(key));
    }

    // Get all keys for current project
    getProjectKeys(projectId = null) {
        const projId = projectId !== null ? projectId : this.projectId;
        const keys = [];

        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith(`${projId}_`)) {
                keys.push(key.substring(projId.length + 1));
            }
        }

        return keys;
    }

    // Export all project data
    exportProjectData(projectId = null) {
        const projId = projectId !== null ? projectId : this.projectId;
        const data = {};
        const keys = this.getProjectKeys(projId);

        keys.forEach(key => {
            data[key] = this.load(key, null, projId);
        });

        return data;
    }

    // Import project data
    importProjectData(data, projectId = null) {
        const projId = projectId !== null ? projectId : this.projectId;

        Object.keys(data).forEach(key => {
            this.save(key, data[key], projId);
        });
    }
}

// Export service
window.StorageService = StorageService;
