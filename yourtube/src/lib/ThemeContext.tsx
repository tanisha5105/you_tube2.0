"use client";
import React, { createContext, useContext, useEffect, useState } from "react";

const SOUTH_INDIA_STATES = [
  "Tamil Nadu", "Kerala", "Karnataka", "Andhra Pradesh", "Telangana",
  "TN", "KL", "KA", "AP", "TS",
];

interface ThemeContextType {
  isDark: boolean;
  theme: "light" | "dark";
}

const ThemeContext = createContext<ThemeContextType>({ isDark: false, theme: "light" });

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const applyTheme = async () => {
      try {
        const now = new Date();
        const hours = now.getHours();
        const isTimeWindow = hours >= 10 && hours < 12; // 10AM - 12PM IST

        // Get location
        const res = await fetch("https://ipapi.co/json/");
        const data = await res.json();
        const region = data.region || "";
        const isSouthIndia = SOUTH_INDIA_STATES.some((s) =>
          region.toLowerCase().includes(s.toLowerCase())
        );

        // Light if: 10AM-12PM AND South India; Dark otherwise
        const shouldBeDark = !(isTimeWindow && isSouthIndia);
        setIsDark(shouldBeDark);
      } catch {
        // Default: check time only
        const hours = new Date().getHours();
        setIsDark(!(hours >= 10 && hours < 12));
      }
    };

    applyTheme();
  }, []);

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [isDark]);

  return (
    <ThemeContext.Provider value={{ isDark, theme: isDark ? "dark" : "light" }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
