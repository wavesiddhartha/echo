"use client";

import { motion, AnimatePresence } from "motion/react";
import { useStore } from "@/store/useStore";
import { snoozeReply } from "@/lib/db";

interface SnoozeSheetProps {
  replyId: string;
  onConfirm: (id: string, until: Date) => void;
  onClose: () => void;
}

const SNOOZE_OPTIONS = [
  { label: "+1 hour", getDate: () => { const d = new Date(); d.setHours(d.getHours() + 1); return d; } },
  { label: "Tonight 9 PM", getDate: () => { const d = new Date(); d.setHours(21, 0, 0, 0); if (d <= new Date()) d.setDate(d.getDate() + 1); return d; } },
  { label: "Tomorrow 9 AM", getDate: () => { const d = new Date(); d.setDate(d.getDate() + 1); d.setHours(9, 0, 0, 0); return d; } },
  { label: "In 3 days", getDate: () => { const d = new Date(); d.setDate(d.getDate() + 3); d.setHours(9, 0, 0, 0); return d; } },
];

export function SnoozeSheet({ replyId, onConfirm, onClose }: SnoozeSheetProps) {
  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.5)",
          backdropFilter: "blur(4px)",
          zIndex: 100,
        }}
        aria-hidden="true"
      />

      {/* Sheet */}
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", stiffness: 350, damping: 35 }}
        drag="y"
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={{ top: 0, bottom: 0.8 }}
        onDragEnd={(_, info) => {
          if (info.offset.y > 120) {
            onClose();
          }
        }}
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          background: "var(--color-surface)",
          borderTop: "1px solid var(--color-border)",
          borderRadius: "var(--radius-lg) var(--radius-lg) 0 0",
          padding: "var(--space-4) var(--space-6) calc(var(--space-8) + var(--safe-bottom))",
          zIndex: 101,
          maxWidth: 480,
          margin: "0 auto",
        }}
        role="dialog"
        aria-modal="true"
        aria-label="Snooze reminder"
      >
        {/* Drag handle */}
        <div
          aria-hidden="true"
          style={{
            width: 36,
            height: 4,
            borderRadius: "var(--radius-full)",
            background: "var(--color-border)",
            margin: "0 auto var(--space-4)",
          }}
        />

        <h2 style={{ fontSize: "var(--text-lg)", fontFamily: "var(--font-serif)", marginBottom: "var(--space-4)", color: "var(--color-text-primary)" }}>
          Snooze until
        </h2>

        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
          {SNOOZE_OPTIONS.map((opt) => (
            <button
              key={opt.label}
              className="btn btn-secondary btn-full"
              style={{ justifyContent: "flex-start", padding: "var(--space-3) var(--space-4)" }}
              onClick={() => onConfirm(replyId, opt.getDate())}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <button
          className="btn btn-ghost btn-full"
          style={{ marginTop: "var(--space-3)" }}
          onClick={onClose}
          id="snooze-cancel-btn"
        >
          Cancel
        </button>
      </motion.div>
    </>
  );
}
