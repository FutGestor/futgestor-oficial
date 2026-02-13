
import { useEffect, useState } from "react";

type Theme = "dark" | "light" | "champions" | "copa" | "minimalist";

export function useThemes() {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem("futgestor_theme") as Theme) || "dark";
    }
    return "dark";
  });

  useEffect(() => {
    const root = window.document.documentElement;
    
    // Remove old themes
    root.classList.remove("light", "dark", "champions", "copa", "minimalist");
    
    // Add new theme
    root.classList.add(theme);
    
    // Persist
    localStorage.setItem("futgestor_theme", theme);
  }, [theme]);

  return { theme, setTheme };
}
