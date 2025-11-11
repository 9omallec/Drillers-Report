/**
 * useLocalStorage Hook
 * React hook for localStorage with project scoping
 */

function useLocalStorage(key, defaultValue, projectId = null) {
    const { useState, useEffect } = React;
    const storage = new window.StorageService();

    // Initialize state with value from localStorage
    const [storedValue, setStoredValue] = useState(() => {
        return storage.load(key, defaultValue, projectId);
    });

    // Update localStorage when state changes
    useEffect(() => {
        storage.save(key, storedValue, projectId);
    }, [storedValue, key, projectId]);

    return [storedValue, setStoredValue];
}

// Export hook
window.useLocalStorage = useLocalStorage;
