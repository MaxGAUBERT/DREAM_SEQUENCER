import React, { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";
import { HistoryProvider } from "./Contexts/HistoryProvider";
import { SettingsProvider } from "./Contexts/SettingsContexts";
import { ThemeProvider } from "../src/Contexts/ThemeContext";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <ThemeProvider>
        <SettingsProvider>
          <HistoryProvider>
            <App />
          </HistoryProvider>
        </SettingsProvider>
    </ThemeProvider>
  </StrictMode>
);
