/**
 * Shared Data Sync Service
 * Syncs clients, rate sheets, and approval status to Google Drive
 * Includes version control to prevent overwrite conflicts
 */

(function() {
    'use strict';

    const SHARED_DATA_FILENAME = 'shared-data.json';

    class SharedDataSyncService {
        constructor() {
            this.lastSyncTime = null;
            this.lastKnownRemoteTimestamp = null;
        }

        /**
         * Get current shared data from localStorage
         * @returns {Object} Shared data with metadata
         */
        getLocalSharedData() {
            const storageService = window.StorageService;

            return {
                timestamp: Date.now(),
                version: '1.0',
                data: {
                    clients: storageService.loadGlobal('clients', []),
                    rateSheets: storageService.loadGlobal('rateSheets', null),
                    approvedReports: this.getApprovedReportIds()
                }
            };
        }

        /**
         * Get list of approved report IDs
         * @returns {Array} Array of approved report IDs
         */
        getApprovedReportIds() {
            const storageService = window.StorageService;
            const reports = storageService.loadGlobal('bossReports', []);
            return reports
                .filter(r => r.approvalStatus === 'Approved')
                .map(r => ({ id: r.id, approvedAt: r.approvedAt || null }));
        }

        /**
         * Upload shared data to Google Drive
         * @param {Object} driveService - Google Drive service instance
         * @param {Function} onProgress - Progress callback
         * @returns {Promise<Object>} Upload result
         */
        async uploadSharedData(driveService, onProgress = null) {
            try {
                if (onProgress) onProgress('Checking for conflicts...');

                // Get remote data first to check for conflicts
                const remoteData = await this.downloadSharedData(driveService, null, true);
                const localData = this.getLocalSharedData();

                // Check for conflicts
                if (remoteData && remoteData.timestamp > (this.lastKnownRemoteTimestamp || 0)) {
                    // Remote is newer than our last sync
                    const timeDiff = remoteData.timestamp - (this.lastKnownRemoteTimestamp || 0);
                    if (timeDiff > 60000) { // More than 1 minute difference
                        throw new Error('CONFLICT: Remote data is newer. Please download first to avoid overwriting changes.');
                    }
                }

                if (onProgress) onProgress('Uploading shared data...');

                // Prepare data for upload
                const uploadData = JSON.stringify(localData, null, 2);

                // Check if file exists
                const files = await driveService.listFiles(
                    `name='${SHARED_DATA_FILENAME}' and '${window.GOOGLE_DRIVE_CONFIG.FOLDER_ID}' in parents and trashed=false`
                );

                let result;
                if (files && files.length > 0) {
                    // Update existing file
                    result = await driveService.updateFile(
                        files[0].id,
                        SHARED_DATA_FILENAME,
                        uploadData,
                        'application/json'
                    );
                } else {
                    // Create new file
                    result = await driveService.uploadFile(
                        SHARED_DATA_FILENAME,
                        uploadData,
                        'application/json'
                    );
                }

                this.lastSyncTime = Date.now();
                this.lastKnownRemoteTimestamp = localData.timestamp;

                if (onProgress) onProgress('Upload complete!');

                return {
                    success: true,
                    timestamp: localData.timestamp,
                    itemsUploaded: {
                        clients: localData.data.clients.length,
                        rateSheets: localData.data.rateSheets ? 1 : 0,
                        approvedReports: localData.data.approvedReports.length
                    }
                };

            } catch (error) {
                console.error('Error uploading shared data:', error);
                throw error;
            }
        }

        /**
         * Download shared data from Google Drive
         * @param {Object} driveService - Google Drive service instance
         * @param {Function} onProgress - Progress callback
         * @param {boolean} silentCheck - If true, just check without applying changes
         * @returns {Promise<Object>} Download result
         */
        async downloadSharedData(driveService, onProgress = null, silentCheck = false) {
            try {
                if (onProgress) onProgress('Searching for shared data file...');

                // Find the shared data file
                const files = await driveService.listFiles(
                    `name='${SHARED_DATA_FILENAME}' and '${window.GOOGLE_DRIVE_CONFIG.FOLDER_ID}' in parents and trashed=false`
                );

                if (!files || files.length === 0) {
                    if (!silentCheck && onProgress) onProgress('No shared data file found');
                    return null;
                }

                if (onProgress) onProgress('Downloading shared data...');

                // Download the file
                const fileContent = await driveService.downloadFile(files[0].id);
                const remoteData = typeof fileContent === 'string' ? JSON.parse(fileContent) : fileContent;

                // Validate data structure
                if (!remoteData.timestamp || !remoteData.data) {
                    throw new Error('Invalid shared data format');
                }

                // If just checking, return the data without applying
                if (silentCheck) {
                    return remoteData;
                }

                // Check if remote is newer than local
                const localData = this.getLocalSharedData();
                if (remoteData.timestamp <= localData.timestamp) {
                    if (onProgress) onProgress('Local data is up to date');
                    return {
                        success: true,
                        applied: false,
                        message: 'Local data is already up to date'
                    };
                }

                if (onProgress) onProgress('Applying shared data...');

                // Apply the data
                const storageService = window.StorageService;
                let itemsUpdated = 0;

                // Update clients
                if (remoteData.data.clients && Array.isArray(remoteData.data.clients)) {
                    storageService.saveGlobal('clients', remoteData.data.clients);
                    itemsUpdated += remoteData.data.clients.length;
                }

                // Update rate sheets
                if (remoteData.data.rateSheets) {
                    storageService.saveGlobal('rateSheets', remoteData.data.rateSheets);
                    itemsUpdated++;
                }

                // Update approved reports
                if (remoteData.data.approvedReports && Array.isArray(remoteData.data.approvedReports)) {
                    this.applyApprovedReports(remoteData.data.approvedReports);
                    itemsUpdated += remoteData.data.approvedReports.length;
                }

                this.lastSyncTime = Date.now();
                this.lastKnownRemoteTimestamp = remoteData.timestamp;

                if (onProgress) onProgress('Download complete!');

                return {
                    success: true,
                    applied: true,
                    timestamp: remoteData.timestamp,
                    itemsDownloaded: {
                        clients: remoteData.data.clients?.length || 0,
                        rateSheets: remoteData.data.rateSheets ? 1 : 0,
                        approvedReports: remoteData.data.approvedReports?.length || 0
                    }
                };

            } catch (error) {
                console.error('Error downloading shared data:', error);
                throw error;
            }
        }

        /**
         * Apply approved report statuses from remote data
         * @param {Array} approvedReports - Array of approved report IDs
         */
        applyApprovedReports(approvedReports) {
            const storageService = window.StorageService;
            const reports = storageService.loadGlobal('bossReports', []);
            const approvedIds = new Set(approvedReports.map(r => r.id));

            let modified = false;
            reports.forEach(report => {
                const wasApproved = report.approvalStatus === 'Approved';
                const shouldBeApproved = approvedIds.has(report.id);

                if (!wasApproved && shouldBeApproved) {
                    report.approvalStatus = 'Approved';
                    const approvedData = approvedReports.find(r => r.id === report.id);
                    if (approvedData?.approvedAt) {
                        report.approvedAt = approvedData.approvedAt;
                    }
                    modified = true;
                }
            });

            if (modified) {
                storageService.saveGlobal('bossReports', reports);
            }
        }

        /**
         * Get sync status info
         * @returns {Object} Sync status
         */
        getSyncStatus() {
            return {
                lastSyncTime: this.lastSyncTime,
                lastKnownRemoteTimestamp: this.lastKnownRemoteTimestamp,
                lastSyncFormatted: this.lastSyncTime
                    ? new Date(this.lastSyncTime).toLocaleString()
                    : 'Never'
            };
        }
    }

    // Export service
    window.SharedDataSyncService = SharedDataSyncService;

})();
