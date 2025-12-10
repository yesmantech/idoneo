import React from "react";
import ReactDOM from "react-dom/client";
import "./src/index.css";
import App from "./src/App";

const rootElement = document.getElementById("root") as HTMLElement;

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
