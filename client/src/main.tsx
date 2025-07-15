import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import "./utils/consoleManager";

// Global error handlers for unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
  // Silently prevent unhandled promise rejections and avoid console spam
  event.preventDefault();
  // Only log in development mode
  if (process.env.NODE_ENV === 'development') {
    console.warn('Unhandled promise rejection prevented:', event.reason);
  }
});

window.addEventListener('error', (event) => {
  // Only log critical errors, not debug info
  if (event.error && event.error.name !== 'ChunkLoadError') {
    console.error('Critical error:', event.error);
  }
});

createRoot(document.getElementById("root")!).render(<App />);
