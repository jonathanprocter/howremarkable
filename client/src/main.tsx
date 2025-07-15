import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Global error handlers for unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
  // Silently prevent unhandled promise rejections
  event.preventDefault();
});

window.addEventListener('error', (event) => {
  console.error('Global error:', event.error);
});

createRoot(document.getElementById("root")!).render(<App />);
