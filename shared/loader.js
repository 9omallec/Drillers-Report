/**
 * Shared Module Loader
 * Loads all shared modules in the correct order
 * Include this script before your app's main script
 */

(function() {
    'use strict';

    const SHARED_BASE_PATH = '../shared/';

    // List of modules to load in order (order matters for dependencies)
    const modules = [
        // Constants first
        'constants/config.js',
        'constants/defaultStates.js',

        // Components (before everything else so they're available)
        'components/Loading.js',
        'components/LoadingSpinner.js',
        'components/PhotoGallery.js',
        'components/Analytics.js',
        'components/AdvancedAnalytics.js',
        'components/ClientManagement.js',
        'components/Toast.js',
        'components/Modal.js',
        'components/ErrorBoundary.js',
        'components/RateSheetManager.js',
        'components/ProfitabilityDashboard.js',
        'components/CalendarView.js',

        // Services
        'services/storage.js',
        'services/firebase.js',
        'services/dataExportImport.js',
        'services/clientService.js',
        'services/googleDrive.js',
        'services/sharedDataSync.js',
        'services/rateSheets.js',
        'services/invoiceService.js',
        'services/expenseService.js',

        // Utilities
        'utils/calculations.js',
        'utils/dateTime.js',
        'utils/imageProcessing.js',
        'utils/geolocation.js',
        'utils/reportValidation.js',

        // Hooks (depend on services and utilities)
        'hooks/useDarkMode.js',
        'hooks/useLocalStorage.js',
        'hooks/useGoogleDrive.js',
        'hooks/useFirebase.js',
        'hooks/useToast.js',
        'hooks/useKeyboardShortcuts.js',
        'hooks/useDebounce.js'
    ];

    // Function to load a single script
    function loadScript(src) {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            // Add cache-busting for consistent loading
            script.src = src + '?v=' + Date.now();
            script.onload = () => {
                resolve();
            };
            script.onerror = () => {
                console.error('✗ Failed to load:', src);
                reject(new Error(`Failed to load script: ${src}`));
            };
            document.head.appendChild(script);
        });
    }

    // Load all modules sequentially
    async function loadAllModules() {
        try {
            for (const module of modules) {
                await loadScript(SHARED_BASE_PATH + module);
            }

            // Dispatch event to notify app that modules are ready
            window.dispatchEvent(new Event('sharedModulesLoaded'));

        } catch (error) {
            console.error('Failed to load shared modules:', error);
            alert('Error loading application modules. Please refresh the page.');
        }
    }

    // Start loading when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', loadAllModules);
    } else {
        loadAllModules();
    }

})();
