// Google Drive API Configuration
const GOOGLE_DRIVE_CONFIG = {
    CLIENT_ID: '13192191935-5bcljariebng92efk6u78f9vf0jqfu4q.apps.googleusercontent.com',
    FOLDER_ID: '0AKDyjXFIoWspUk9PVA',
    SCOPES_READONLY: 'https://www.googleapis.com/auth/drive.readonly',
    SCOPES_FULL: 'https://www.googleapis.com/auth/drive',
    DISCOVERY_DOCS: ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'],
    TOKEN_EXPIRY_MS: 2592000000 // 30 days
};

// Export for use in other modules
window.GOOGLE_DRIVE_CONFIG = GOOGLE_DRIVE_CONFIG;
