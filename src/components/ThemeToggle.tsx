import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface ThemeToggleProps {
  className?: string;
  size?: 'sm' | 'md';
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ className = '', size = 'md' }) => {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';
  const tooltipText = isDark ? 'Switch to light mode' : 'Switch to dark mode';

  const sizeClasses = size === 'sm' ? 'w-8 h-8 p-1.5' : 'w-9 h-9 p-2';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      title={tooltipText}
      aria-label={tooltipText}
      className={`relative inline-flex items-center justify-center rounded-xl text-gray-500 hover:text-gray-900 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-gray-100 dark:hover:bg-slate-800 transition-all duration-200 active:scale-95 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${sizeClasses} ${className}`}
    >
      {isDark ? (
        <Sun className="w-4 h-4 text-amber-400 transition-transform duration-200 rotate-0 hover:rotate-45" />
      ) : (
        <Moon className="w-4 h-4 text-slate-700 transition-transform duration-200 -rotate-12 hover:rotate-0" />
      )}
      <span className="sr-only">{tooltipText}</span>
    </button>
  );
};
