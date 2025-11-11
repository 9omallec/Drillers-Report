/**
 * useGoogleDrive Hook
 * React hook for Google Drive integration
 */

function useGoogleDrive(scopes) {
    const { useState, useEffect } = React;

    const [isSignedIn, setIsSignedIn] = useState(false);
    const [driveStatus, setDriveStatus] = useState('');
    const [isInitialized, setIsInitialized] = useState(false);
    const [driveService, setDriveService] = useState(null);

    useEffect(() => {
        const service = new window.GoogleDriveService(window.GOOGLE_DRIVE_CONFIG);

        // Set up event listeners
        service.on('onAuthChange', (data) => {
            setIsSignedIn(data.isSignedIn);
        });

        service.on('onStatusChange', (status) => {
            setDriveStatus(status);
        });

        service.on('onError', (error) => {
            alert(error);
        });

        // Initialize the service
        service.initialize(scopes)
            .then(() => {
                setIsInitialized(true);
                setDriveService(service);
            })
            .catch((error) => {
                console.error('Failed to initialize Google Drive:', error);
            });

        // Check if already signed in from saved token
        if (service.isSignedIn()) {
            setIsSignedIn(true);
        }

    }, []); // Only run once on mount

    const signIn = () => {
        if (driveService) {
            driveService.signIn();
        }
    };

    const signOut = () => {
        if (driveService) {
            driveService.signOut();
        }
    };

    const uploadFile = async (fileName, fileContent, mimeType) => {
        if (driveService) {
            return await driveService.uploadFile(fileName, fileContent, mimeType);
        }
        throw new Error('Drive service not initialized');
    };

    const listFiles = async (query) => {
        if (driveService) {
            return await driveService.listFiles(query);
        }
        throw new Error('Drive service not initialized');
    };

    const downloadFile = async (fileId) => {
        if (driveService) {
            return await driveService.downloadFile(fileId);
        }
        throw new Error('Drive service not initialized');
    };

    return {
        isSignedIn,
        driveStatus,
        isInitialized,
        signIn,
        signOut,
        uploadFile,
        listFiles,
        downloadFile,
        driveService
    };
}

// Export hook
window.useGoogleDrive = useGoogleDrive;
