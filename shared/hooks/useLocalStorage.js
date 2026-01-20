/**
 * useLocalStorage Hook
 * React hook for localStorage with project scoping
 */

function useLocalStorage(key, defaultValue, projectId = null) {
    const { useState, useEffect, useMemo } = React;

    // Create storage instance once using useMemo to prevent memory leak
    const storage = useMemo(() => new window.StorageService(), []);

    // Initialize state with value from localStorage
    const [storedValue, setStoredValue] = useState(() => {
        return storage.load(key, defaultValue, projectId);
    });

    // Update localStorage when state changes
    useEffect(() => {
        storage.save(key, storedValue, projectId);
    }, [storedValue, key, projectId, storage]);

    return [storedValue, setStoredValue];
}

// Export hook
window.useLocalStorage = useLocalStorage;
