import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import { GuestProvider } from "./context/GuestContext";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <GuestProvider>
      <App />
    </GuestProvider>
  </React.StrictMode>,
);
