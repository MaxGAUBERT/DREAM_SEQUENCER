import React, { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import "./index.css"
import App from './App'
import { HistoryProvider } from './Contexts/HistoryProvider'


createRoot(document.getElementById('root')).render(
  <StrictMode>
    <HistoryProvider>
    <App />
    </HistoryProvider>
  </StrictMode>
);
