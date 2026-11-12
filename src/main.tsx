import React, { lazy, Suspense } from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import { GuestProvider } from "./context/GuestContext";
import { loadContent } from "./lib/content";

// ?edit opens the editor instead of the invitation (loaded only when needed)
const EditPanel = lazy(() => import("./components/Edit/EditPanel"));
const editing = new URLSearchParams(window.location.search).has("edit");

// saved names, dates, photos and illustrations are merged in before anything renders
loadContent().finally(() => {
  ReactDOM.createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
      {editing ? (
        <Suspense fallback={null}>
          <EditPanel />
        </Suspense>
      ) : (
        <GuestProvider>
          <App />
        </GuestProvider>
      )}
    </React.StrictMode>,
  );
});
