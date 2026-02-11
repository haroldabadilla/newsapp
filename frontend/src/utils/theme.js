// src/utils/theme.js
const THEME_KEY = 'newsapp_theme';
const DEFAULT_THEME = 'dark';

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
}

export function initTheme() {
  try {
    const saved = localStorage.getItem(THEME_KEY);
    const theme = saved || DEFAULT_THEME;
    applyTheme(theme);
    return theme;
  } catch (e) {
    // Storage may be disabled (e.g., private mode). Fall back to default.
    applyTheme(DEFAULT_THEME);
    if (import.meta.env.DEV) {
      console.warn('[theme] localStorage unavailable; using default theme.', e);
    }
    return DEFAULT_THEME;
  }
}

export function toggleTheme() {
  const current =
    document.documentElement.getAttribute('data-theme') || DEFAULT_THEME;
  const next = current === 'dark' ? 'light' : 'dark';
  try {
    localStorage.setItem(THEME_KEY, next);
  } catch (e) {
    if (import.meta.env.DEV) {
      console.warn('[theme] Failed to persist theme preference.', e);
    }
  }
  applyTheme(next);
  return next;
}

export function getTheme() {
  return document.documentElement.getAttribute('data-theme') || DEFAULT_THEME;
}
