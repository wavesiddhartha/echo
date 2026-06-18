"use client";

import { useEffect } from "react";

export function ServiceWorkerRegistrar() {
  useEffect(() => {
    if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") {
      navigator.serviceWorker
        .register("/sw.js", { scope: "/" })
        .then((reg) => {
          console.log("[Echo] SW registered:", reg.scope);
        })
        .catch((err) => {
          console.warn("[Echo] SW registration failed:", err);
        });
    }
  }, []);

  return null;
}
