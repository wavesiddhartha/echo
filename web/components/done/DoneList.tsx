"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useLiveQuery } from "dexie-react-hooks";
import Link from "next/link";
import { db, type PendingReply } from "@/lib/db";
import { useStore } from "@/store/useStore";

function formatDoneDate(date?: Date): string {
  if (!date) return "";
  return date.toLocaleDateString("en", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function DoneList() {
  const [mounted, setMounted] = useState(false);
  const [isWeekly, setIsWeekly] = useState(false);
  const addToast = useStore((s) => s.addToast);

  useEffect(() => {
    setMounted(true);
    setIsWeekly(window.location.search.includes("weekly=true"));
  }, []);

  const replies = useLiveQuery(
    () =>
      mounted
        ? db.pendingReplies
            .orderBy("doneAt")
            .reverse()
            .filter((r) => r.status === "done")
            .toArray()
        : [],
    [mounted]
  );

  if (!mounted || replies === undefined) return null;

  // Filter for weekly summary (last 7 days)
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  const weeklyReplies = replies.filter((r) => r.doneAt && r.doneAt >= oneWeekAgo);

  const displayedReplies = isWeekly ? weeklyReplies : replies;

  async function handleShare() {
    const count = weeklyReplies.length;
    const shareText = `I replied to ${count} ${
      count === 1 ? "person" : "people"
    } this week using Echo. Reply before they wonder. 🤍`;

    const nav = typeof navigator !== "undefined" ? (navigator as any) : null;
    if (!nav) return;

    if (nav.share) {
      try {
        await nav.share({
          title: "My Echo Weekly Summary",
          text: shareText,
          url: window.location.origin,
        });
      } catch (e) {
        console.error("Share failed", e);
      }
    } else if (nav.clipboard) {
      try {
        await nav.clipboard.writeText(shareText);
        addToast({ message: "Summary copied to clipboard ✓" });
      } catch (e) {
        console.error("Clipboard failed", e);
      }
    }
  }

  return (
    <div className="page">
      {/* Header matching Screenshot 3 */}
      <header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "var(--space-6) var(--space-4) var(--space-4)",
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

      <main style={{ flex: 1, padding: "0 var(--space-4) var(--space-8)" }}>
        {displayedReplies.length > 0 && !isWeekly && (
          <div
            style={{
              fontSize: "var(--text-xs)",
              fontFamily: "var(--font-mono)",
              color: "var(--color-text-muted)",
              letterSpacing: "0.05em",
              textTransform: "uppercase",
              marginBottom: "var(--space-4)",
              paddingLeft: "var(--space-1)",
            }}
          >
            {displayedReplies.length} REPLIED THIS WEEK
          </div>
        )}
        {/* Weekly Summary Card */}
        {isWeekly && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              background: "linear-gradient(135deg, rgba(90, 158, 122, 0.12) 0%, rgba(200, 169, 110, 0.06) 100%)",
              border: "1px solid rgba(90, 158, 122, 0.25)",
              borderRadius: "var(--radius-lg)",
              padding: "var(--space-6)",
              marginBottom: "var(--space-6)",
              textAlign: "center",
              boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
            }}
          >
            <p
              style={{
                fontSize: "var(--text-xs)",
                fontFamily: "var(--font-mono)",
                color: "var(--color-pending)",
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                marginBottom: "var(--space-2)",
              }}
            >
              Weekly Recap
            </p>
            <h2
              style={{
                fontSize: "var(--text-2xl)",
                fontFamily: "var(--font-serif)",
                color: "var(--color-text-primary)",
                marginBottom: "var(--space-3)",
                fontWeight: 300,
                lineHeight: 1.2,
              }}
            >
              You showed up.
            </h2>
            <p
              style={{
                fontSize: "var(--text-base)",
                color: "var(--color-text-primary)",
                marginBottom: "var(--space-5)",
                lineHeight: 1.5,
              }}
            >
              You replied to <strong>{weeklyReplies.length} {weeklyReplies.length === 1 ? "person" : "people"}</strong> this week. That matters. 🙌
            </p>

            <div style={{ display: "flex", justifyContent: "center", gap: "var(--space-2)" }}>
              <button
                className="btn btn-primary"
                onClick={handleShare}
                style={{ padding: "var(--space-2) var(--space-4)", fontSize: "var(--text-sm)" }}
                id="share-summary-btn"
              >
                Share Card
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => setIsWeekly(false)}
                style={{ padding: "var(--space-2) var(--space-4)", fontSize: "var(--text-sm)" }}
                id="see-all-done-btn"
              >
                See All
              </button>
            </div>
          </motion.div>
        )}

        {displayedReplies.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: "var(--space-12) var(--space-6)",
              textAlign: "center",
              gap: "var(--space-3)",
              minHeight: "50dvh",
            }}
          >
            <p
              style={{
                fontSize: "var(--text-2xl)",
                fontFamily: "var(--font-serif)",
                color: "var(--color-text-primary)",
              }}
            >
              Nothing here.
            </p>
            <p style={{ fontSize: "var(--text-sm)", color: "var(--color-text-muted)" }}>
              {isWeekly ? "No replies recorded this week." : "Replies you mark done will appear here."}
            </p>
          </motion.div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
            <AnimatePresence mode="popLayout">
              {displayedReplies.map((reply, i) => (
                <motion.div
                  key={reply.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: Math.min(i * 0.03, 0.3) }}
                  style={{
                    background: "var(--color-surface)",
                    border: "1px solid var(--color-border)",
                    borderRadius: "var(--radius-md)",
                    padding: "var(--space-4)",
                    display: "flex",
                    alignItems: "center",
                    gap: "var(--space-3)",
                  }}
                >
                  {/* Green check */}
                  <div
                    aria-hidden="true"
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: "50%",
                      background: "rgba(90,158,122,0.15)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      color: "var(--color-done)",
                      fontSize: 14,
                    }}
                  >
                    ✓
                  </div>

                  {/* Content */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: "var(--text-lg)",
                        fontFamily: "var(--font-serif)",
                        color: "var(--color-text-primary)",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {reply.contactName}
                    </div>
                    <div
                      style={{
                        fontSize: "var(--text-sm)",
                        color: "var(--color-text-muted)",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {reply.note || <span style={{ fontStyle: "italic", opacity: 0.5 }}>No notes</span>}
                    </div>
                  </div>

                  {/* Done time */}
                  <div
                    style={{
                      fontSize: "var(--text-xs)",
                      fontFamily: "var(--font-mono)",
                      color: "var(--color-text-muted)",
                      flexShrink: 0,
                    }}
                  >
                    {formatDoneDate(reply.doneAt)}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* Serif Italic centered footer text matching Screenshot 3 */}
        {displayedReplies.length > 0 && (
          <div
            style={{
              textAlign: "center",
              marginTop: "var(--space-12)",
              marginBottom: "var(--space-6)",
              fontFamily: "var(--font-serif)",
              fontStyle: "italic",
              fontSize: "16px",
              color: "var(--color-text-muted)",
              lineHeight: 1.55,
              opacity: 0.8,
            }}
          >
            You showed up for people
            <br />
            who needed to hear from you.
          </div>
        )}
      </main>
    </div>
  );
}
