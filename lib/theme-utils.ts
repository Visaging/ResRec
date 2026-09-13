// Pure theme utilities safe for Server Components.

export type Theme = "light" | "dark";

export const THEME_STORAGE_KEY = "resrec-theme";
const SYSTEM_PREFERENCE_MEDIA = "(prefers-color-scheme: dark)";

/**
 * Resolve the theme from saved preference, then system preference.
 * Safe to call during SSR because it returns "light" when window is undefined.
 */
export function resolveTheme(): Theme {
  if (typeof window === "undefined") return "light";

  const savedTheme = localStorage.getItem(THEME_STORAGE_KEY) as Theme | null;
  if (savedTheme === "light" || savedTheme === "dark") {
    return savedTheme;
  }

  return window.matchMedia(SYSTEM_PREFERENCE_MEDIA).matches ? "dark" : "light";
}

/**
 * Apply the theme to the document element.
 */
export function applyTheme(theme: Theme) {
  document.documentElement.setAttribute("data-theme", theme);
}

/**
 * Inline script injected before paint so the correct theme is applied on the
 * very first frame. Without it the page renders light, then snaps to dark.
 * Kept in sync with resolveTheme() above.
 */
export const THEME_INIT_SCRIPT = `(function(){try{var t=localStorage.getItem(${JSON.stringify(
  THEME_STORAGE_KEY
)});if(t!=="light"&&t!=="dark"){t=window.matchMedia(${JSON.stringify(
  SYSTEM_PREFERENCE_MEDIA
)}).matches?"dark":"light";}document.documentElement.setAttribute("data-theme",t);}catch(e){document.documentElement.setAttribute("data-theme","light");}})();`;

/**
 * Read a CSS custom property off the document root, e.g.
 * getCssVariable("color-primary") -> "#1a56db"
 * Safe for SSR because it returns empty string when window is undefined.
 */
export function getCssVariable(variable: string): string {
  if (typeof window === "undefined") return "";

  const value = getComputedStyle(document.documentElement).getPropertyValue(
    `--${variable}`
  );
  return value ? value.trim() : "";
}