import { createContext, useContext, useEffect, useState } from "react";

type Theme = "day" | "night";

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("night");

  useEffect(() => {
    const root = document.documentElement;
    root.classList.add("dark");
    localStorage.setItem("storynest-theme", "night");
  }, []);

  const setTheme = (newTheme: Theme) => {
    setThemeState("night");
  };

  const toggleTheme = () => {
    // Night mode only - do nothing
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
}
