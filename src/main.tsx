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

// Remove the boot loader when React starts
const bootLoader = document.getElementById('boot-loader');
if (bootLoader) {
  bootLoader.style.opacity = '0';
  setTimeout(() => {
    if (bootLoader.parentNode) {
      bootLoader.parentNode.removeChild(bootLoader);
    }
  }, 500);
}

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
