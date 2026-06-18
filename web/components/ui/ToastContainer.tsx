"use client";

import { AnimatePresence, motion } from "motion/react";
import { useToasts, useStore } from "@/store/useStore";

export function ToastContainer() {
  const toasts = useToasts();
  const removeToast = useStore((s) => s.removeToast);

  return (
    <div
      aria-live="polite"
      style={{
        position: "fixed",
        bottom: "calc(var(--space-6) + var(--safe-bottom))",
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 9999,
        display: "flex",
        flexDirection: "column",
        gap: "var(--space-2)",
        alignItems: "center",
        pointerEvents: "none",
        width: "min(360px, 90vw)",
      }}
    >
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.97 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            style={{
              background: "var(--color-surface)",
              border: "1px solid var(--color-border)",
              borderRadius: "var(--radius-full)",
              padding: "var(--space-3) var(--space-4)",
              display: "flex",
              alignItems: "center",
              gap: "var(--space-3)",
              pointerEvents: "auto",
              boxShadow: "0 4px 24px rgba(0,0,0,0.15)",
              width: "100%",
            }}
          >
            <span
              style={{
                flex: 1,
                fontSize: "var(--text-sm)",
                color: "var(--color-text-primary)",
                fontFamily: "var(--font-sans)",
              }}
            >
              {toast.message}
            </span>
            {toast.action && (
              <button
                onClick={() => {
                  toast.action!.fn();
                  removeToast(toast.id);
                }}
                style={{
                  fontSize: "var(--text-sm)",
                  fontWeight: 600,
                  color: "var(--color-pending)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontFamily: "var(--font-sans)",
                  padding: "0 var(--space-1)",
                  whiteSpace: "nowrap",
                }}
              >
                {toast.action.label}
              </button>
            )}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
