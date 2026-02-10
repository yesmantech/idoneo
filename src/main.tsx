import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";

/**
 * IDONEO ENTRY POINT
 * 
 * Standard Vite entry point moved to src/main.tsx for better compatibility.
 * Removes the HTML boot-loader once React is ready to take over.
 */

// Global console log for production verification
console.log("🚀 IDONEO: App Booting...");

// Function to remove the boot loader (moved to domUtils.ts)


const rootElement = document.getElementById("root") as HTMLElement;

if (!rootElement) {
  console.error("CRITICAL: Root element #root not found in DOM");
} else {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}
