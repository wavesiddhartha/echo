"use client";

import { motion } from "motion/react";
import { useStore } from "@/store/useStore";

export function EmptyState() {
  const openAddSheet = useStore((s) => s.openAddSheet);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6, delay: 0.2 }}
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "var(--space-8) var(--space-6)",
        textAlign: "center",
        gap: "var(--space-3)",
      }}
    >
      {/* Golden Wave Logo */}
      <WaveformAnimation />

      <div style={{ marginTop: "var(--space-2)" }}>
        <h2
          style={{
            fontSize: "26px",
            fontFamily: "var(--font-serif)",
            fontStyle: "italic",
            color: "var(--color-text-primary)",
            lineHeight: 1.25,
            marginBottom: "6px",
            fontWeight: "normal",
          }}
        >
          You&apos;re all caught up.
        </h2>
        <p
          style={{
            fontSize: "var(--text-sm)",
            color: "var(--color-text-muted)",
            lineHeight: 1.6,
          }}
        >
          No pending replies.
        </p>
      </div>

      <button
        onClick={openAddSheet}
        style={{
          marginTop: "var(--space-4)",
          background: "none",
          border: "none",
          cursor: "pointer",
          fontSize: "var(--text-sm)",
          color: "var(--color-text-primary)",
          fontFamily: "var(--font-sans)",
          opacity: 0.85,
          transition: "opacity var(--transition-fast)",
        }}
        id="empty-state-add-btn"
        aria-label="Add a reply reminder"
      >
        + Add one
      </button>
    </motion.div>
  );
}

function WaveformAnimation() {
  return (
    <div
      aria-hidden="true"
      style={{
        width: 48,
        height: 12,
        display: "flex",
        justifyContent: "center",
        marginBottom: "var(--space-2)",
      }}
    >
      <svg
        width="48"
        height="12"
        viewBox="0 0 48 12"
        fill="none"
        stroke="var(--color-pending)"
        strokeWidth="1.5"
        strokeLinecap="round"
      >
        <path d="M2 6C6 2 10 2 14 6C18 10 22 10 26 6C30 2 34 2 38 6C42 10 46 10 48 8" />
      </svg>
    </div>
  );
}
