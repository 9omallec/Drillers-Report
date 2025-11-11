/**
 * useDarkMode Hook
 * React hook for dark mode management
 */

function useDarkMode() {
    const { useState, useEffect } = React;

    const [darkMode, setDarkMode] = useState(() => {
        const saved = localStorage.getItem('darkMode');
        return saved === 'true';
    });

    useEffect(() => {
        if (darkMode) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
        localStorage.setItem('darkMode', darkMode);
    }, [darkMode]);

    const toggleDarkMode = () => setDarkMode(prev => !prev);

    return [darkMode, setDarkMode, toggleDarkMode];
}

// Export hook
window.useDarkMode = useDarkMode;
