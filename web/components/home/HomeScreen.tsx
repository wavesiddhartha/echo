"use client";

import { useState, useEffect, useCallback } from "react";
import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { useLiveQuery } from "dexie-react-hooks";
import { db, markDone, deleteReply, addReply, snoozeReply, getWeeklyStreak, type PendingReply } from "@/lib/db";
import { useStore } from "@/store/useStore";
import { ReplyCard } from "@/components/home/ReplyCard";
import { EmptyState } from "@/components/home/EmptyState";
import { AddReminderSheet } from "@/components/add/AddReminderSheet";
import { SnoozeSheet } from "@/components/home/SnoozeSheet";
import { cancelNotification } from "@/hooks/useNotifications";

export function HomeScreen() {
  const [mounted, setMounted] = useState(false);
  const [snoozeTarget, setSnoozeTarget] = useState<string | null>(null);
  const [weeklyStreak, setWeeklyStreak] = useState(0);
  const [showBanner, setShowBanner] = useState(true);
  const openAddSheet = useStore((s) => s.openAddSheet);
  const isAddSheetOpen = useStore((s) => s.isAddSheetOpen);
  const addToast = useStore((s) => s.addToast);

  useEffect(() => {
    setMounted(true);
    // Schedule weekly summary notification
    import("@/hooks/useNotifications").then(({ scheduleWeeklySummaryNotification }) => {
      scheduleWeeklySummaryNotification().catch(console.error);
    });
    // Seed demo data if database is empty
    import("@/lib/db").then(({ seedDemoData }) => {
      seedDemoData().catch(console.error);
    });
  }, []);

  const replies = useLiveQuery(
    () =>
      mounted
        ? db.pendingReplies
            .where("status")
            .equals("pending")
            .sortBy("remindAt")
        : [],
    [mounted]
  );

  useEffect(() => {
    if (mounted && replies) {
      getWeeklyStreak().then(setWeeklyStreak);
    }
  }, [mounted, replies]);

  const handleDone = useCallback(
    async (id: string) => {
      const reply = replies?.find((r) => r.id === id);
      if (!reply) return;
      await markDone(id);
      await cancelNotification(id);
      if ("vibrate" in navigator) navigator.vibrate([10, 5, 20]);
      addToast({ message: `✓ Replied to ${reply.contactName}` });
    },
    [replies, addToast]
  );

  const handleDelete = useCallback(
    async (id: string) => {
      const reply = replies?.find((r) => r.id === id);
      if (!reply) return;

      // Optimistic: save a copy for undo
      const saved = { ...reply };
      await deleteReply(id);
      await cancelNotification(id);

      addToast({
        message: `Removed ${reply.contactName}`,
        action: {
          label: "Undo",
          fn: async () => {
            await addReply(saved);
          },
        },
      });
    },
    [replies, addToast]
  );

  const handleSnooze = useCallback((id: string) => {
    setSnoozeTarget(id);
  }, []);

  const handleSnoozeConfirm = useCallback(
    async (id: string, until: Date) => {
      await snoozeReply(id, until);
      const reply = replies?.find((r) => r.id === id);
      addToast({ message: `Snoozed ${reply?.contactName ?? "reminder"}` });
      setSnoozeTarget(null);
    },
    [replies, addToast]
  );

  if (!mounted || replies === undefined) {
    return (
      <div className="page" style={{ justifyContent: "center", alignItems: "center" }}>
        <motion.div
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          style={{ fontSize: "var(--text-sm)", color: "var(--color-text-muted)", fontFamily: "var(--font-mono)" }}
        >
          echo
        </motion.div>
      </div>
    );
  }

  return (
    <>
      <div className="page">
        {/* Top bar matching Screenshot 1 */}
        <header
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "var(--space-6) var(--space-4) var(--space-4)",
            position: "sticky",
            top: 0,
            background: "var(--color-bg)",
            zIndex: 10,
          }}
        >
          <h1
            style={{
              fontSize: "24px",
              fontFamily: "var(--font-serif)",
              fontStyle: "italic",
              color: "var(--color-text-primary)",
              fontWeight: "normal",
            }}
          >
            echo
          </h1>
        </header>

        {/* Content */}
        <main
          style={{
            flex: 1,
            padding: "0 var(--space-4)",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* Weekly summary banner matching Screenshot 1 */}
          {showBanner && weeklyStreak > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                background: "var(--color-surface)",
                border: "1px solid var(--color-border)",
                borderRadius: "var(--radius-md)",
                padding: "var(--space-4)",
                marginBottom: "var(--space-4)",
                position: "relative",
              }}
            >
              <button
                onClick={() => setShowBanner(false)}
                style={{
                  position: "absolute",
                  top: "var(--space-2)",
                  right: "var(--space-2)",
                  background: "none",
                  border: "none",
                  color: "var(--color-text-muted)",
                  cursor: "pointer",
                  fontSize: 16,
                  lineHeight: 1,
                }}
              >
                ×
              </button>
              <p
                style={{
                  fontSize: "var(--text-xs)",
                  fontFamily: "var(--font-serif)",
                  fontStyle: "italic",
                  color: "var(--color-text-muted)",
                  marginBottom: 2,
                }}
              >
                this week
              </p>
              <div style={{ display: "flex", alignItems: "baseline", gap: "var(--space-2)" }}>
                <span
                  style={{
                    fontSize: "var(--text-2xl)",
                    fontFamily: "var(--font-serif)",
                    color: "var(--color-pending)",
                    fontWeight: "bold",
                    lineHeight: 1,
                  }}
                >
                  {weeklyStreak}
                </span>
                <Link
                  href="/done?weekly=true"
                  style={{
                    fontSize: "var(--text-sm)",
                    color: "var(--color-text-primary)",
                    textDecoration: "none",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4,
                  }}
                >
                  people you showed up for <span style={{ fontSize: 11 }}>↗</span>
                </Link>
              </div>
            </motion.div>
          )}

          {replies.length === 0 ? (
            <EmptyState />
          ) : (
            <>
              {/* Count label — uppercase monospace matching Screenshot 1 */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                style={{
                  fontSize: "var(--text-xs)",
                  fontFamily: "var(--font-mono)",
                  color: "var(--color-text-muted)",
                  marginBottom: "var(--space-4)",
                  letterSpacing: "0.05em",
                  textTransform: "uppercase",
                }}
                aria-live="polite"
              >
                {replies.length} PENDING
              </motion.div>

              {/* Reply list */}
              <AnimatePresence mode="popLayout">
                {replies.map((reply) => (
                  <ReplyCard
                    key={reply.id}
                    reply={reply}
                    onDone={handleDone}
                    onDelete={handleDelete}
                    onSnooze={handleSnooze}
                  />
                ))}
              </AnimatePresence>

              {/* Notification Preview block matching Screenshot 1 */}
              {replies.length > 0 && (
                <div style={{ marginTop: "var(--space-8)", marginBottom: "var(--space-4)" }}>
                  <p
                    style={{
                      fontSize: "var(--text-xs)",
                      fontFamily: "var(--font-mono)",
                      color: "var(--color-text-muted)",
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                      marginBottom: "var(--space-3)",
                    }}
                  >
                    Notification Preview
                  </p>
                  <div
                    style={{
                      background: "var(--color-surface)",
                      border: "1px solid var(--color-border)",
                      borderRadius: "var(--radius-md)",
                      padding: "var(--space-4)",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "var(--space-2)", fontSize: "var(--text-xs)", fontFamily: "var(--font-mono)", color: "var(--color-text-muted)" }}>
                      <span>~ ECHO</span>
                      <span>now</span>
                    </div>
                    <p style={{ fontSize: "var(--text-sm)", color: "var(--color-text-primary)", marginBottom: "var(--space-4)", fontWeight: 500 }}>
                      Reply to {replies[0].contactName} — {replies[0].note || "checking in"}
                    </p>
                    <div style={{ display: "flex", gap: "var(--space-2)" }}>
                      <button
                        onClick={() => handleDone(replies[0].id)}
                        className="btn btn-secondary"
                        style={{ flex: 1, padding: "var(--space-2) 0", fontSize: "var(--text-sm)", background: "rgba(90,158,122,0.1)", border: "1px solid rgba(90,158,122,0.3)", color: "var(--color-done)", borderRadius: "var(--radius-sm)" }}
                      >
                        Replied ✓
                      </button>
                      <button
                        onClick={() => {
                          const oneHourLater = new Date();
                          oneHourLater.setHours(oneHourLater.getHours() + 1);
                          handleSnoozeConfirm(replies[0].id, oneHourLater);
                        }}
                        className="btn btn-secondary"
                        style={{ flex: 1, padding: "var(--space-2) 0", fontSize: "var(--text-sm)", background: "rgba(255,255,255,0.03)", color: "var(--color-text-primary)", borderRadius: "var(--radius-sm)" }}
                      >
                        Snooze 1h
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* See Done link */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                style={{
                  textAlign: "center",
                  marginTop: "var(--space-6)",
                }}
              >
                <Link
                  href="/done"
                  style={{
                    fontSize: "var(--text-sm)",
                    color: "var(--color-text-muted)",
                    textDecoration: "none",
                    fontFamily: "var(--font-sans)",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "var(--space-1)",
                  }}
                  id="see-done-link"
                >
                  See done →
                </Link>
              </motion.div>
            </>
          )}
        </main>
      </div>



      {/* Snooze Sheet */}
      <AnimatePresence>
        {snoozeTarget && (
          <SnoozeSheet
            replyId={snoozeTarget}
            onConfirm={handleSnoozeConfirm}
            onClose={() => setSnoozeTarget(null)}
          />
        )}
      </AnimatePresence>
    </>
  );
}
