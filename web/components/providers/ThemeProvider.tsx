"use client";

import { createContext, useContext, useEffect } from "react";
import { useStore, useTheme } from "@/store/useStore";

type ThemeContextType = {
  theme: "dark" | "light" | "auto";
  setTheme: (t: "dark" | "light" | "auto") => void;
};

const ThemeContext = createContext<ThemeContextType>({
  theme: "dark",
  setTheme: () => {},
});

export function useThemeContext() {
  return useContext(ThemeContext);
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = useTheme();
  const setTheme = useStore((s) => s.setTheme);

  // Initialize from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("echo-theme") as
      | "dark"
      | "light"
      | "auto"
      | null;
    if (saved) setTheme(saved);
  }, [setTheme]);

  // Apply theme to document
  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute("data-theme", theme);

    if (theme === "dark") {
      root.classList.add("dark");
    } else if (theme === "light") {
      root.classList.remove("dark");
    } else {
      // Auto: follow system
      const mq = window.matchMedia("(prefers-color-scheme: dark)");
      if (mq.matches) {
        root.classList.add("dark");
      } else {
        root.classList.remove("dark");
      }

      const handler = (e: MediaQueryListEvent) => {
        if (e.matches) root.classList.add("dark");
        else root.classList.remove("dark");
      };
      mq.addEventListener("change", handler);
      return () => mq.removeEventListener("change", handler);
    }
  }, [theme]);

  // Persist to localStorage
  useEffect(() => {
    localStorage.setItem("echo-theme", theme);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
