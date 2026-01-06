// Custom Hook to manage theme logic
import { useDarkStore } from "@/stores/dark-store";
import { useEffect, useState } from "react";

const useTheme = () => {
  const [systemTheme, setSystemTheme] = useState(false);
  const setDark = useDarkStore((state) => state.setDark);
  const dark = useDarkStore((state) => state.dark);

  const handleSystemTheme = () => {
    if (typeof window !== "undefined") {
      const systemDarkMode = window.matchMedia(
        "(prefers-color-scheme: dark)",
      ).matches;
      setDark(systemDarkMode);
    }
  };

  useEffect(() => {
    try {
      const themePreference = localStorage.getItem("themePreference");
      if (themePreference === "light") {
        setDark(false);
        setSystemTheme(false);
      } else if (themePreference === "dark") {
        setDark(true);
        setSystemTheme(false);
      } else {
        // Default to system theme
        setSystemTheme(true);
        handleSystemTheme();
      }
    } catch (error) {
      // 在无痕模式下默认使用系统主题
      setSystemTheme(true);
      handleSystemTheme();
    }
  }, []);

  useEffect(() => {
    if (systemTheme && typeof window !== "undefined") {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      const handleChange = (e: MediaQueryListEvent) => {
        setDark(e.matches);
      };
      mediaQuery.addEventListener("change", handleChange);
      return () => {
        mediaQuery.removeEventListener("change", handleChange);
      };
    }
  }, [systemTheme]);

  const setThemePreference = (theme: "light" | "dark" | "system") => {
    if (theme === "light") {
      setDark(false);
      setSystemTheme(false);
    } else if (theme === "dark") {
      setDark(true);
      setSystemTheme(false);
    } else {
      setSystemTheme(true);
      handleSystemTheme();
    }
    try {
      localStorage.setItem("themePreference", theme);
    } catch (error) {
      console.warn("无法保存主题设置到localStorage");
    }
  };

  return { systemTheme, dark, setThemePreference };
};

export default useTheme;
