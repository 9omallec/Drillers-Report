// useFirebase Hook
// React hook for Firebase real-time sync integration

(function() {
    'use strict';

    const { useState, useEffect, useCallback, useRef } = React;

    /**
     * Firebase sync hook for React components
     * @param {boolean} autoInit - Auto-initialize Firebase on mount
     * @returns {Object} Firebase methods and state
     */
    window.useFirebase = function useFirebase(autoInit = true) {
        const [isReady, setIsReady] = useState(false);
        const [syncEnabled, setSyncEnabled] = useState(true);
        const [lastSyncTime, setLastSyncTime] = useState(null);
        const [error, setError] = useState(null);
        const firebaseRef = useRef(null);
        const listenersRef = useRef(new Map());

        // Initialize Firebase service
        const initialize = useCallback(async () => {
            try {
                if (!firebaseRef.current) {
                    firebaseRef.current = new window.FirebaseService();
                }

                if (!firebaseRef.current.isReady()) {
                    await firebaseRef.current.initialize();
                    setIsReady(true);
                    setError(null);
                    console.log('✓ Firebase ready via useFirebase hook');
                }
            } catch (err) {
                console.error('Firebase initialization error:', err);
                setError(err.message);
                setIsReady(false);
            }
        }, []);

        // Auto-initialize on mount if enabled
        useEffect(() => {
            if (autoInit) {
                initialize();
            }

            // Cleanup listeners on unmount
            return () => {
                listenersRef.current.forEach((listenerId) => {
                    if (firebaseRef.current) {
                        firebaseRef.current.unlisten(listenerId);
                    }
                });
                listenersRef.current.clear();
            };
        }, [autoInit, initialize]);

        /**
         * Save data to Firebase
         * @param {string} path - Firebase path
         * @param {any} data - Data to save
         */
        const saveToFirebase = useCallback(async (path, data) => {
            if (!isReady || !syncEnabled) {
                console.warn('Firebase not ready or sync disabled');
                return false;
            }

            try {
                await firebaseRef.current.save(path, data);
                setLastSyncTime(new Date());
                return true;
            } catch (err) {
                console.error('Error saving to Firebase:', err);
                setError(err.message);
                return false;
            }
        }, [isReady, syncEnabled]);

        /**
         * Update data in Firebase
         * @param {string} path - Firebase path
         * @param {Object} updates - Fields to update
         */
        const updateFirebase = useCallback(async (path, updates) => {
            if (!isReady || !syncEnabled) {
                console.warn('Firebase not ready or sync disabled');
                return false;
            }

            try {
                await firebaseRef.current.update(path, updates);
                setLastSyncTime(new Date());
                return true;
            } catch (err) {
                console.error('Error updating Firebase:', err);
                setError(err.message);
                return false;
            }
        }, [isReady, syncEnabled]);

        /**
         * Get data from Firebase
         * @param {string} path - Firebase path
         * @returns {Promise<any>} Data from Firebase
         */
        const getFromFirebase = useCallback(async (path) => {
            if (!isReady) {
                console.warn('Firebase not ready');
                return null;
            }

            try {
                const data = await firebaseRef.current.get(path);
                return data;
            } catch (err) {
                console.error('Error getting from Firebase:', err);
                setError(err.message);
                return null;
            }
        }, [isReady]);

        /**
         * Delete data from Firebase
         * @param {string} path - Firebase path
         */
        const deleteFromFirebase = useCallback(async (path) => {
            if (!isReady || !syncEnabled) {
                console.warn('Firebase not ready or sync disabled');
                return false;
            }

            try {
                await firebaseRef.current.delete(path);
                setLastSyncTime(new Date());
                return true;
            } catch (err) {
                console.error('Error deleting from Firebase:', err);
                setError(err.message);
                return false;
            }
        }, [isReady, syncEnabled]);

        /**
         * Listen for real-time changes
         * @param {string} path - Firebase path
         * @param {Function} callback - Called when data changes
         */
        const listenToFirebase = useCallback((path, callback) => {
            if (!isReady) {
                console.warn('Firebase not ready, cannot listen');
                return;
            }

            // Remove old listener if exists for this path
            const existingListenerId = Array.from(listenersRef.current.entries())
                .find(([id, p]) => p === path)?.[0];

            if (existingListenerId) {
                firebaseRef.current.unlisten(existingListenerId);
                listenersRef.current.delete(existingListenerId);
            }

            // Add new listener
            const listenerId = firebaseRef.current.listen(path, callback);
            if (listenerId) {
                listenersRef.current.set(listenerId, path);
            }
        }, [isReady]);

        /**
         * Stop listening to a path
         * @param {string} path - Firebase path to stop listening to
         */
        const unlistenFromFirebase = useCallback((path) => {
            const listenerId = Array.from(listenersRef.current.entries())
                .find(([id, p]) => p === path)?.[0];

            if (listenerId && firebaseRef.current) {
                firebaseRef.current.unlisten(listenerId);
                listenersRef.current.delete(listenerId);
            }
        }, []);

        /**
         * Sync localStorage to Firebase
         * @param {string} localKey - localStorage key
         * @param {string} firebasePath - Firebase path
         */
        const syncLocalToFirebase = useCallback(async (localKey, firebasePath) => {
            if (!isReady || !syncEnabled) return false;

            try {
                await firebaseRef.current.syncToFirebase(localKey, firebasePath);
                setLastSyncTime(new Date());
                return true;
            } catch (err) {
                console.error('Error syncing to Firebase:', err);
                setError(err.message);
                return false;
            }
        }, [isReady, syncEnabled]);

        /**
         * Sync Firebase to localStorage
         * @param {string} firebasePath - Firebase path
         * @param {string} localKey - localStorage key
         */
        const syncFirebaseToLocal = useCallback(async (firebasePath, localKey) => {
            if (!isReady) return false;

            try {
                await firebaseRef.current.syncFromFirebase(firebasePath, localKey);
                setLastSyncTime(new Date());
                return true;
            } catch (err) {
                console.error('Error syncing from Firebase:', err);
                setError(err.message);
                return false;
            }
        }, [isReady]);

        /**
         * Toggle Firebase sync on/off
         * @param {boolean} enabled - Whether sync is enabled
         */
        const toggleSync = useCallback((enabled) => {
            setSyncEnabled(enabled);
            if (firebaseRef.current) {
                firebaseRef.current.setSyncEnabled(enabled);
            }
        }, []);

        /**
         * Get current Firebase user info
         */
        const getCurrentUser = useCallback(() => {
            return firebaseRef.current?.getCurrentUser() || null;
        }, [isReady]);

        return {
            // State
            isReady,
            syncEnabled,
            lastSyncTime,
            error,

            // Methods
            initialize,
            saveToFirebase,
            updateFirebase,
            getFromFirebase,
            deleteFromFirebase,
            listenToFirebase,
            unlistenFromFirebase,
            syncLocalToFirebase,
            syncFirebaseToLocal,
            toggleSync,
            getCurrentUser
        };
    };

    console.log('✓ useFirebase hook initialized');

})();
