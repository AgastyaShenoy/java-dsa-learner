// Theme (design language §3.2): a saved choice wins, then the OS setting, else dark.
// The choice is a per-browser convenience, so it lives in localStorage, not in the backup.

export type ThemeChoice = 'system' | 'dark' | 'light';
const KEY = 'sde-tracker-theme';

export const THEME_BOOT_SCRIPT = `(function(){try{var c=localStorage.getItem('${KEY}');var t=c==='light'||c==='dark'?c:(matchMedia('(prefers-color-scheme: light)').matches?'light':'dark');document.documentElement.setAttribute('data-theme',t);}catch(e){}})();`;

export function getThemeChoice(): ThemeChoice {
  try {
    const c = localStorage.getItem(KEY);
    return c === 'light' || c === 'dark' ? c : 'system';
  } catch {
    return 'system';
  }
}

export function resolveTheme(choice: ThemeChoice): 'dark' | 'light' {
  if (choice !== 'system') return choice;
  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
}

export function setThemeChoice(choice: ThemeChoice) {
  try {
    if (choice === 'system') localStorage.removeItem(KEY);
    else localStorage.setItem(KEY, choice);
  } catch { /* storage blocked: still apply for this page */ }
  document.documentElement.setAttribute('data-theme', resolveTheme(choice));
}
