import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState('light');
  const [systemTheme, setSystemTheme] = useState('light');

  // Detect system theme
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    setSystemTheme(mediaQuery.matches ? 'dark' : 'light');

    const handleChange = (e) => {
      setSystemTheme(e.matches ? 'dark' : 'light');
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Load saved theme
  useEffect(() => {
    const savedTheme = localStorage.getItem('videoDownloaderTheme');
    if (savedTheme) {
      setTheme(savedTheme);
    } else {
      setTheme(systemTheme);
    }
  }, [systemTheme]);

  // Apply theme to document
  useEffect(() => {
    const effectiveTheme = theme === 'system' ? systemTheme : theme;
    document.documentElement.classList.toggle('dark', effectiveTheme === 'dark');
  }, [theme, systemTheme]);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : theme === 'dark' ? 'system' : 'light';
    setTheme(newTheme);
    localStorage.setItem('videoDownloaderTheme', newTheme);
  };

  const setThemeMode = (newTheme) => {
    setTheme(newTheme);
    localStorage.setItem('videoDownloaderTheme', newTheme);
  };

  const getCurrentTheme = () => {
    return theme === 'system' ? systemTheme : theme;
  };

  return (
    <ThemeContext.Provider
      value={{
        theme,
        systemTheme,
        toggleTheme,
        setThemeMode,
        getCurrentTheme,
        isDark: getCurrentTheme() === 'dark',
        isSystem: theme === 'system'
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};