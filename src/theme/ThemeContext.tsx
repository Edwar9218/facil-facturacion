import React, { createContext, useContext } from "react";
import { lightTheme, Theme } from "./theme";

const ThemeContext = createContext<Theme>(lightTheme);

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  // Por ahora siempre light — después puedes conectar useColorScheme()
  return (
    <ThemeContext.Provider value={lightTheme}>{children}</ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
