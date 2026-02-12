// src/utils/theme.js
const THEME_KEY = 'newsapp_theme';
const DEFAULT_THEME = 'dark';

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
}

/**
 * Ensure <meta name="theme-color"> exists and reflects the current theme.
 * This avoids static HTML compatibility warnings while preserving the effect
 * on supporting browsers (Chrome Android, Safari 15+, etc.).
 */
export function applyThemeColorForBrowserUI() {
  let tag = document.querySelector('meta[name="theme-color"]');
  if (!tag) {
    tag = document.createElement('meta');
    tag.setAttribute('name', 'theme-color');
    document.head.appendChild(tag);
  }
  const isLight = document.documentElement.getAttribute('data-theme') === 'light';
  // Match your tokens: dark background #222831, light background #ffffff
  tag.setAttribute('content', isLight ? '#ffffff' : '#222831');
}

export function initTheme() {
  try {
    const saved = localStorage.getItem(THEME_KEY);
    const theme = saved || DEFAULT_THEME;
    applyTheme(theme);
    applyThemeColorForBrowserUI();
    return theme;
  } catch (e) {
    // Storage may be disabled (e.g., private mode). Fall back to default.
    applyTheme(DEFAULT_THEME);
    applyThemeColorForBrowserUI();
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
  applyThemeColorForBrowserUI();
  return next;
}

export function getTheme() {
  return document.documentElement.getAttribute('data-theme') || DEFAULT_THEME;
}