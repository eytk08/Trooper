import { useState, useEffect, useCallback } from 'react';

const KEY = 'trooper-theme';

const readSaved = () => {
  try {
    const v = localStorage.getItem(KEY);
    return v === 'light' || v === 'dark' ? v : null;
  } catch {
    return null; // storage blocked (private mode etc.)
  }
};

const systemTheme = () =>
  window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';

/**
 * Light/dark theme. Starts from the visitor's saved choice, otherwise their OS setting,
 * and keeps following the OS until they press the toggle once.
 */
export function useTheme() {
  const [theme, setTheme] = useState(() => readSaved() || systemTheme());

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    document.documentElement.style.colorScheme = theme;
  }, [theme]);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = (e) => {
      if (!readSaved()) setTheme(e.matches ? 'dark' : 'light');
    };
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  const toggle = useCallback(() => {
    const next = theme === 'dark' ? 'light' : 'dark';
    try {
      localStorage.setItem(KEY, next);
    } catch {
      /* ignore */
    }
    setTheme(next);
  }, [theme]);

  return { theme, toggle };
}
