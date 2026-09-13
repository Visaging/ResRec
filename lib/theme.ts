// Theme management utilities for light/dark mode

import { useEffect, useState } from "react";

import type { Theme } from "@/lib/theme-utils";
import {
  resolveTheme,
  applyTheme,
} from "@/lib/theme-utils";

/**
 * Hook to manage theme state.
 *
 * Initial state is always "light" so SSR and the first client render agree.
 * The real preference
 * is read in an effect and applied immediately after mount (the pre-paint script has
 * already set the attribute, so there is no flash). `isMounted` lets callers defer
 * rendering theme-dependent UI until the real value is known.
 */
export function useTheme() {
  const [theme, setTheme] = useState<Theme>("light");
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setTheme(resolveTheme());
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted) return;
    applyTheme(theme);
    try {
      localStorage.setItem("resrec-theme", theme);
    } catch {
      // Storage can be unavailable (private mode, blocked cookies).
      // The theme still applies for this session.
    }
  }, [theme, isMounted]);

  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === "light" ? "dark" : "light"));
  };

  return { theme, toggleTheme, isMounted };
}