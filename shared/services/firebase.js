// Firebase Service
// Handles real-time data sync across devices using Firebase Realtime Database

(function() {
    'use strict';

    // Firebase Configuration
    const firebaseConfig = {
        apiKey: "AIzaSyDO5_MGerquFgAyXSnuSkOr0Kj222rRN8I",
        authDomain: "drillers-report-dashboar-8e0a8.firebaseapp.com",
        databaseURL: "https://drillers-report-dashboar-8e0a8-default-rtdb.firebaseio.com",
        projectId: "drillers-report-dashboar-8e0a8",
        storageBucket: "drillers-report-dashboar-8e0a8.firebasestorage.app",
        messagingSenderId: "13123140890",
        appId: "1:13123140890:web:52c661d800e3e3e23ec0a3",
        measurementId: "G-3SQ58FJRJM"
    };

    // Allowed email domain for Google Sign-In
    const ALLOWED_DOMAIN = 'omalleydrilling.com';

    class FirebaseService {
        constructor() {
            this.db = null;
            this.auth = null;
            this.currentUser = null;
            this.isInitialized = false;
            this.listeners = new Map();
            this.syncEnabled = true;
            this.isOnline = true;
            this.lastSyncTime = null;
            this.connectionListeners = [];
            this.authStateListeners = [];
        }

        /**
         * Initialize Firebase (without auto sign-in)
         * @returns {Promise<void>}
         */
        async initialize() {
            if (this.isInitialized) {
                console.log('Firebase already initialized');
                return;
            }

            try {
                // Wait for Firebase SDK to load
                if (typeof firebase === 'undefined') {
                    throw new Error('Firebase SDK not loaded');
                }

                // Initialize Firebase
                firebase.initializeApp(firebaseConfig);
                this.db = firebase.database();
                this.auth = firebase.auth();

                // Set up connection state monitoring
                this.setupConnectionMonitoring();

                // Set up auth state listener
                this.auth.onAuthStateChanged((user) => {
                    this.currentUser = user;
                    this.notifyAuthStateListeners(user);
                    if (user) {
                        console.log('✓ User signed in:', user.email);
                    } else {
                        console.log('User signed out');
                    }
                });

                this.isInitialized = true;
                console.log('✓ Firebase initialized successfully');
            } catch (error) {
                console.error('Firebase initialization error:', error);
                throw error;
            }
        }

        /**
         * Set up connection state monitoring
         */
        setupConnectionMonitoring() {
            const connectedRef = this.db.ref('.info/connected');
            connectedRef.on('value', (snap) => {
                this.isOnline = snap.val() === true;
                this.notifyConnectionListeners(this.isOnline);
                console.log(this.isOnline ? '🟢 Connected to Firebase' : '🔴 Disconnected from Firebase');
            });
        }

        /**
         * Sign in with Google (restricted to allowed domain)
         * @returns {Promise<Object>} - User object
         */
        async signInWithGoogle() {
            try {
                const provider = new firebase.auth.GoogleAuthProvider();
                // Force account selection
                provider.setCustomParameters({ prompt: 'select_account' });

                const result = await this.auth.signInWithPopup(provider);
                const user = result.user;

                // Check email domain
                if (!user.email.endsWith('@' + ALLOWED_DOMAIN)) {
                    await this.signOut();
                    throw new Error(`Access restricted to @${ALLOWED_DOMAIN} email addresses`);
                }

                this.currentUser = user;
                console.log('✓ Signed in with Google:', user.email);
                return user;
            } catch (error) {
                console.error('Google sign-in error:', error);
                throw error;
            }
        }

        /**
         * Add listener for connection state changes
         * @param {Function} callback - Called with boolean (isOnline)
         */
        onConnectionChange(callback) {
            this.connectionListeners.push(callback);
            // Immediately notify with current state
            callback(this.isOnline);
        }

        /**
         * Add listener for auth state changes
         * @param {Function} callback - Called with user object or null
         */
        onAuthStateChange(callback) {
            this.authStateListeners.push(callback);
            // Immediately notify with current state
            callback(this.currentUser);
        }

        /**
         * Notify all connection listeners
         */
        notifyConnectionListeners(isOnline) {
            this.connectionListeners.forEach(cb => cb(isOnline));
        }

        /**
         * Notify all auth state listeners
         */
        notifyAuthStateListeners(user) {
            this.authStateListeners.forEach(cb => cb(user));
        }

        /**
         * Update last sync time
         */
        updateLastSyncTime() {
            this.lastSyncTime = new Date();
        }

        /**
         * Get last sync time
         * @returns {Date|null}
         */
        getLastSyncTime() {
            return this.lastSyncTime;
        }

        /**
         * Save data to Firebase
         * @param {string} path - Database path (e.g., 'reports', 'clients')
         * @param {any} data - Data to save
         * @returns {Promise<void>}
         */
        async save(path, data) {
            if (!this.isInitialized || !this.syncEnabled) {
                console.warn('Firebase not initialized or sync disabled');
                return;
            }

            if (!this.currentUser) {
                console.warn('Not signed in - cannot save to Firebase');
                return;
            }

            try {
                const ref = this.db.ref(path);
                await ref.set(data);
                this.updateLastSyncTime();
                console.log(`✓ Saved to Firebase: ${path}`);
            } catch (error) {
                console.error(`Error saving to Firebase (${path}):`, error);
                throw error;
            }
        }

        /**
         * Update specific fields in Firebase
         * @param {string} path - Database path
         * @param {Object} updates - Fields to update
         * @returns {Promise<void>}
         */
        async update(path, updates) {
            if (!this.isInitialized || !this.syncEnabled) {
                console.warn('Firebase not initialized or sync disabled');
                return;
            }

            try {
                const ref = this.db.ref(path);
                await ref.update(updates);
                console.log(`✓ Updated Firebase: ${path}`);
            } catch (error) {
                console.error(`Error updating Firebase (${path}):`, error);
                throw error;
            }
        }

        /**
         * Get data from Firebase
         * @param {string} path - Database path
         * @returns {Promise<any>} - Data from Firebase
         */
        async get(path) {
            if (!this.isInitialized) {
                console.warn('Firebase not initialized');
                return null;
            }

            try {
                const ref = this.db.ref(path);
                const snapshot = await ref.once('value');
                return snapshot.val();
            } catch (error) {
                console.error(`Error getting from Firebase (${path}):`, error);
                throw error;
            }
        }

        /**
         * Delete data from Firebase
         * @param {string} path - Database path
         * @returns {Promise<void>}
         */
        async delete(path) {
            if (!this.isInitialized || !this.syncEnabled) {
                console.warn('Firebase not initialized or sync disabled');
                return;
            }

            try {
                const ref = this.db.ref(path);
                await ref.remove();
                console.log(`✓ Deleted from Firebase: ${path}`);
            } catch (error) {
                console.error(`Error deleting from Firebase (${path}):`, error);
                throw error;
            }
        }

        /**
         * Listen for real-time changes on a path
         * @param {string} path - Database path
         * @param {Function} callback - Called when data changes
         * @returns {string} - Listener ID for unsubscribing
         */
        listen(path, callback) {
            if (!this.isInitialized) {
                console.warn('Firebase not initialized');
                return null;
            }

            try {
                const ref = this.db.ref(path);
                const listenerId = `${path}_${Date.now()}`;

                ref.on('value', (snapshot) => {
                    const data = snapshot.val();
                    callback(data);
                });

                this.listeners.set(listenerId, { path, ref });
                console.log(`✓ Listening to Firebase: ${path}`);
                return listenerId;
            } catch (error) {
                console.error(`Error setting up listener (${path}):`, error);
                return null;
            }
        }

        /**
         * Stop listening to a path
         * @param {string} listenerId - Listener ID from listen()
         */
        unlisten(listenerId) {
            const listener = this.listeners.get(listenerId);
            if (listener) {
                listener.ref.off('value');
                this.listeners.delete(listenerId);
                console.log(`✓ Stopped listening to Firebase: ${listener.path}`);
            }
        }

        /**
         * Sync localStorage data to Firebase
         * @param {string} localKey - localStorage key
         * @param {string} firebasePath - Firebase path
         */
        async syncToFirebase(localKey, firebasePath) {
            if (!this.syncEnabled) return;

            try {
                const localData = localStorage.getItem(localKey);
                if (localData) {
                    const parsed = JSON.parse(localData);
                    await this.save(firebasePath, parsed);
                }
            } catch (error) {
                console.error(`Error syncing ${localKey} to Firebase:`, error);
            }
        }

        /**
         * Sync Firebase data to localStorage
         * @param {string} firebasePath - Firebase path
         * @param {string} localKey - localStorage key
         */
        async syncFromFirebase(firebasePath, localKey) {
            try {
                const firebaseData = await this.get(firebasePath);
                if (firebaseData) {
                    localStorage.setItem(localKey, JSON.stringify(firebaseData));
                }
            } catch (error) {
                console.error(`Error syncing ${firebasePath} from Firebase:`, error);
            }
        }

        /**
         * Enable or disable Firebase sync
         * @param {boolean} enabled - Whether sync is enabled
         */
        setSyncEnabled(enabled) {
            this.syncEnabled = enabled;
            console.log(`Firebase sync ${enabled ? 'enabled' : 'disabled'}`);
        }

        /**
         * Get current sync status
         * @returns {boolean}
         */
        isSyncEnabled() {
            return this.syncEnabled;
        }

        /**
         * Check if Firebase is initialized
         * @returns {boolean}
         */
        isReady() {
            return this.isInitialized;
        }

        /**
         * Get current user info
         * @returns {Object|null}
         */
        getCurrentUser() {
            return this.currentUser ? {
                uid: this.currentUser.uid,
                email: this.currentUser.email,
                displayName: this.currentUser.displayName,
                photoURL: this.currentUser.photoURL,
                isAnonymous: this.currentUser.isAnonymous || false
            } : null;
        }

        /**
         * Check if user is signed in
         * @returns {boolean}
         */
        isSignedIn() {
            return this.currentUser !== null;
        }

        /**
         * Get connection status
         * @returns {boolean}
         */
        getConnectionStatus() {
            return this.isOnline;
        }

        /**
         * Sign out current user
         * @returns {Promise<void>}
         */
        async signOut() {
            if (this.auth) {
                await this.auth.signOut();
                this.currentUser = null;
                console.log('✓ Signed out from Firebase');
            }
        }
    }

    // Export service
    window.FirebaseService = FirebaseService;

    console.log('✓ FirebaseService class loaded');

})();
