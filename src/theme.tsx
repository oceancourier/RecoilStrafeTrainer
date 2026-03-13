import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type UiTheme = "dark" | "light";

const THEME_STORAGE_KEY = "recoil_strafe_trainer_ui_theme";
const LEGACY_THEME_SUFFIX = "_ui_theme";

type ThemeContextValue = {
  theme: UiTheme;
  setTheme: (theme: UiTheme) => void;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function getSystemTheme(): UiTheme {
  if (typeof window === "undefined") {
    return "dark";
  }

  return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
}

function readInitialTheme(): UiTheme {
  if (typeof window === "undefined") {
    return "dark";
  }

  const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
  if (storedTheme === "dark" || storedTheme === "light") {
    return storedTheme;
  }

  for (let index = 0; index < window.localStorage.length; index += 1) {
    const key = window.localStorage.key(index);
    if (!key || !key.endsWith(LEGACY_THEME_SUFFIX)) {
      continue;
    }

    const legacyTheme = window.localStorage.getItem(key);
    if (legacyTheme === "dark" || legacyTheme === "light") {
      return legacyTheme;
    }
  }

  return getSystemTheme();
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<UiTheme>(() => readInitialTheme());

  useEffect(() => {
    document.documentElement.dataset.uiTheme = theme;
    document.documentElement.style.colorScheme = theme;
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: light)");
    const onMediaChange = () => {
      const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
      const hasSavedTheme = storedTheme === "dark" || storedTheme === "light";
      const hasLegacyTheme = Array.from({ length: window.localStorage.length }).some((_, index) => {
        const key = window.localStorage.key(index);
        if (!key || !key.endsWith(LEGACY_THEME_SUFFIX)) {
          return false;
        }

        const value = window.localStorage.getItem(key);
        return value === "dark" || value === "light";
      });

      if (!hasSavedTheme && !hasLegacyTheme) {
        setTheme(getSystemTheme());
      }
    };

    const onStorage = (event: StorageEvent) => {
      if (event.key !== THEME_STORAGE_KEY) {
        return;
      }

      if (event.newValue === "dark" || event.newValue === "light") {
        setTheme(event.newValue);
      }
    };

    mediaQuery.addEventListener("change", onMediaChange);
    window.addEventListener("storage", onStorage);

    return () => {
      mediaQuery.removeEventListener("change", onMediaChange);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme,
      setTheme,
      toggleTheme: () => setTheme((currentTheme) => (currentTheme === "dark" ? "light" : "dark")),
    }),
    [theme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }

  return context;
}
