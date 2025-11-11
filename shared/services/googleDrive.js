/**
 * Google Drive API Service
 * Handles authentication, file uploads, and synchronization
 * Shared between Report and Dashboard apps
 */

class GoogleDriveService {
    constructor(config) {
        this.config = config;
        this.accessToken = null;
        this.tokenClient = null;
        this.isInitialized = false;
        this.currentScopes = null;
        this.listeners = {
            onAuthChange: [],
            onStatusChange: [],
            onError: []
        };

        // Don't load saved token yet - wait for initialize() to know the required scopes
    }

    // Event listener management
    on(event, callback) {
        if (this.listeners[event]) {
            this.listeners[event].push(callback);
        }
    }

    emit(event, data) {
        if (this.listeners[event]) {
            this.listeners[event].forEach(callback => callback(data));
        }
    }

    // Load saved token from localStorage (only if scopes match)
    loadSavedToken(requiredScopes) {
        const savedToken = localStorage.getItem('google_access_token');
        const tokenExpiry = localStorage.getItem('google_token_expiry');
        const savedScopes = localStorage.getItem('google_token_scopes');

        if (savedToken && tokenExpiry && savedScopes) {
            const now = Date.now();
            // Check if token is not expired AND scopes match
            if (now < parseInt(tokenExpiry) && savedScopes === requiredScopes) {
                this.accessToken = savedToken;
                this.currentScopes = savedScopes;
                this.emit('onAuthChange', { isSignedIn: true, token: savedToken });
                console.log('✓ Restored saved Google session');
                return true;
            } else {
                if (savedScopes !== requiredScopes) {
                    console.log('⚠️ Saved token has different scopes, clearing...');
                }
                this.clearToken();
            }
        }
        return false;
    }

    // Clear token from memory and storage
    clearToken() {
        localStorage.removeItem('google_access_token');
        localStorage.removeItem('google_token_expiry');
        localStorage.removeItem('google_token_scopes');
        this.accessToken = null;
        this.currentScopes = null;
    }

    // Save token to localStorage with scopes
    saveToken(token, scopes) {
        this.accessToken = token;
        this.currentScopes = scopes;
        localStorage.setItem('google_access_token', token);
        localStorage.setItem('google_token_expiry', (Date.now() + this.config.TOKEN_EXPIRY_MS).toString());
        localStorage.setItem('google_token_scopes', scopes);
    }

    // Initialize Google Drive API
    async initialize(scopes = this.config.SCOPES_FULL) {
        this.currentScopes = scopes;

        // Try to load saved token with matching scopes
        this.loadSavedToken(scopes);

        return new Promise((resolve, reject) => {
            const init = () => {
                if (!window.gapi || !window.google?.accounts?.oauth2) {
                    console.log('Waiting for Google libraries...');
                    setTimeout(init, 500);
                    return;
                }

                console.log('✓ Google libraries loaded');
                this.emit('onStatusChange', '🔄 Initializing Google Drive...');

                window.gapi.load('client', async () => {
                    try {
                        await window.gapi.client.init({
                            discoveryDocs: this.config.DISCOVERY_DOCS,
                        });
                        console.log('✓ gapi client initialized');

                        this.tokenClient = window.google.accounts.oauth2.initTokenClient({
                            client_id: this.config.CLIENT_ID,
                            scope: scopes,
                            callback: (response) => {
                                if (response.error) {
                                    console.error('❌ Token error:', response);
                                    this.emit('onStatusChange', '❌ Sign-in failed');
                                    this.emit('onAuthChange', { isSignedIn: false });

                                    let errorMsg = '❌ Sign In Failed\n\n';
                                    if (response.error === 'popup_closed_by_user') {
                                        errorMsg += 'You closed the sign-in popup.\n\nPlease try again.';
                                    } else {
                                        errorMsg += 'Error: ' + response.error + '\n\n';
                                        errorMsg += 'Check that:\n';
                                        errorMsg += '1. Your email is in the test users list\n';
                                        errorMsg += '2. Third-party cookies are enabled\n';
                                        errorMsg += '3. Pop-ups are not blocked';
                                    }
                                    this.emit('onError', errorMsg);
                                    return;
                                }

                                console.log('✓ Access token received');
                                this.saveToken(response.access_token, scopes);
                                this.emit('onAuthChange', { isSignedIn: true, token: response.access_token });
                                this.emit('onStatusChange', '✓ Signed in to Google Drive');
                            },
                        });

                        this.isInitialized = true;
                        this.emit('onStatusChange', '');
                        console.log('✓ Google Drive ready!');
                        resolve();

                    } catch (error) {
                        console.error('❌ Error initializing Google Drive:', error);
                        this.emit('onStatusChange', '❌ Error initializing');

                        let errorMsg = '❌ Google Drive Connection Error\n\n';
                        errorMsg += 'Error: ' + (error.message || 'Unknown error') + '\n\n';
                        errorMsg += 'Common causes:\n';
                        errorMsg += '1. OAuth not configured correctly\n';
                        errorMsg += '2. Third-party cookies blocked\n';
                        errorMsg += '3. Network issues\n\n';
                        errorMsg += 'Try refreshing the page or check browser console (F12)';

                        this.emit('onError', errorMsg);
                        reject(error);
                    }
                });
            };

            init();
        });
    }

    // Sign in to Google Drive
    signIn() {
        if (!this.isInitialized || !this.tokenClient) {
            const msg = '⚠️ Google Drive is still loading...\n\nPlease wait a moment and try again.';
            this.emit('onError', msg);
            return;
        }

        try {
            console.log('Requesting access token...');
            this.emit('onStatusChange', '🔄 Opening sign-in...');
            this.tokenClient.requestAccessToken({ prompt: 'consent' });
        } catch (error) {
            console.error('❌ Sign in error:', error);
            this.emit('onStatusChange', '');
            this.emit('onError', '❌ Error signing in\n\n' + error.message + '\n\nPlease refresh the page and try again.');
        }
    }

    // Sign out from Google Drive
    signOut() {
        try {
            if (this.accessToken) {
                window.google.accounts.oauth2.revoke(this.accessToken, () => {
                    console.log('Token revoked');
                });
            }
            this.clearToken();
            this.emit('onAuthChange', { isSignedIn: false });
            this.emit('onStatusChange', 'Signed out from Google Drive');
            setTimeout(() => this.emit('onStatusChange', ''), 2000);
        } catch (error) {
            console.error('Sign out error:', error);
            this.emit('onError', 'Error signing out: ' + error.message);
        }
    }

    // Upload file to Google Drive
    async uploadFile(fileName, fileContent, mimeType = 'application/json') {
        try {
            if (!this.accessToken) {
                throw new Error('Not signed in to Google Drive');
            }

            window.gapi.client.setToken({ access_token: this.accessToken });
            this.emit('onStatusChange', 'Uploading to Google Drive...');

            const metadata = {
                name: fileName,
                mimeType: mimeType,
                parents: [this.config.FOLDER_ID]
            };

            const boundary = '-------314159265358979323846';
            const delimiter = "\r\n--" + boundary + "\r\n";
            const close_delim = "\r\n--" + boundary + "--";

            const multipartRequestBody =
                delimiter +
                'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
                JSON.stringify(metadata) +
                delimiter +
                `Content-Type: ${mimeType}\r\n\r\n` +
                fileContent +
                close_delim;

            const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&supportsAllDrives=true', {
                method: 'POST',
                headers: {
                    'Authorization': 'Bearer ' + this.accessToken,
                    'Content-Type': 'multipart/related; boundary="' + boundary + '"'
                },
                body: multipartRequestBody
            });

            if (response.ok) {
                const result = await response.json();
                console.log('✓ Upload successful:', result);
                this.emit('onStatusChange', '✓ Successfully uploaded to Google Drive!');
                setTimeout(() => this.emit('onStatusChange', ''), 3000);
                return result;
            } else {
                const errorText = await response.text();
                console.error('Upload failed:', response.status, errorText);
                throw new Error('Upload failed with status: ' + response.status);
            }
        } catch (error) {
            console.error('Error uploading to Drive:', error);
            this.emit('onStatusChange', '❌ Error uploading to Google Drive');
            this.emit('onError', 'Upload failed:\n\n' + error.message + '\n\nPlease try again or check console (F12) for details.');
            throw error;
        }
    }

    // List files from Google Drive folder
    async listFiles(query = null) {
        try {
            if (!this.accessToken) {
                throw new Error('Not signed in to Google Drive');
            }

            window.gapi.client.setToken({ access_token: this.accessToken });

            const defaultQuery = `'${this.config.FOLDER_ID}' in parents and mimeType='application/json' and trashed=false`;
            const finalQuery = query || defaultQuery;

            const response = await window.gapi.client.drive.files.list({
                q: finalQuery,
                fields: 'files(id, name, createdTime, modifiedTime)',
                orderBy: 'createdTime desc',
                supportsAllDrives: true,
                includeItemsFromAllDrives: true
            });

            return response.result.files || [];
        } catch (error) {
            console.error('Error listing files:', error);
            this.emit('onError', 'Error listing files: ' + error.message);
            throw error;
        }
    }

    // Download file content from Google Drive
    async downloadFile(fileId) {
        try {
            if (!this.accessToken) {
                throw new Error('Not signed in to Google Drive');
            }

            window.gapi.client.setToken({ access_token: this.accessToken });

            const response = await window.gapi.client.drive.files.get({
                fileId: fileId,
                alt: 'media',
                supportsAllDrives: true
            });

            return response.result;
        } catch (error) {
            console.error('Error downloading file:', error);
            this.emit('onError', 'Error downloading file: ' + error.message);
            throw error;
        }
    }

    // Check if signed in
    isSignedIn() {
        return !!this.accessToken;
    }

    // Get access token
    getAccessToken() {
        return this.accessToken;
    }
}

// Export service
window.GoogleDriveService = GoogleDriveService;
