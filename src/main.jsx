import React, { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";
import { HistoryProvider } from "./Contexts/HistoryProvider";
import { SettingsProvider } from "./Contexts/SettingsContexts";
import { ThemeProvider } from "next-themes";
import { ThemeProviderContext } from "./Contexts/ThemeContext";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <ThemeProvider attribute="class" defaultTheme="dark">
      <ThemeProviderContext>
        <SettingsProvider>
          <HistoryProvider>
            <App />
          </HistoryProvider>
        </SettingsProvider>
      </ThemeProviderContext>
    </ThemeProvider>
  </StrictMode>
);
