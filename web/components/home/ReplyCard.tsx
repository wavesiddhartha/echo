"use client";

import { useRef, useState } from "react";
import { motion, useMotionValue, useTransform, AnimatePresence } from "motion/react";
import { type PendingReply } from "@/lib/db";
import { useStore } from "@/store/useStore";
import { PlatformIcon, type Platform } from "@/components/ui/PlatformIcon";

// ─── Helpers ──────────────────────────────────────────────────────────────

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diff = date.getTime() - now.getTime();
  const absDiff = Math.abs(diff);
  const isPast = diff < 0;

  const minutes = Math.floor(absDiff / (1000 * 60));
  const hours = Math.floor(absDiff / (1000 * 60 * 60));
  const days = Math.floor(absDiff / (1000 * 60 * 60 * 24));

  if (isPast) {
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  }

  if (minutes < 60) return `in ${minutes}m`;
  if (hours < 24) {
    const h = Math.floor(hours);
    const m = Math.floor((absDiff % (1000 * 60 * 60)) / (1000 * 60));
    if (m === 0) return `in ${h}h`;
    return `in ${h}h ${m}m`;
  }
  if (days === 1) return "Tomorrow";
  if (days < 7) return `in ${days} days`;

  // Absolute date
  return date.toLocaleDateString("en", { month: "short", day: "numeric" });
}

// ─── Avatar ───────────────────────────────────────────────────────────────

function Avatar({
  name,
  avatar,
  size = 40,
}: {
  name: string;
  avatar?: string;
  size?: number;
}) {
  const isEmoji = avatar && /\p{Emoji}/u.test(avatar) && avatar.length <= 2;

  return (
    <div
      aria-hidden="true"
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: "var(--color-border)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        fontSize: isEmoji ? size * 0.55 + "px" : size * 0.38 + "px",
        fontFamily: isEmoji ? "system-ui" : "var(--font-sans)",
        fontWeight: isEmoji ? 400 : 600,
        color: isEmoji ? "inherit" : "var(--color-text-muted)",
        letterSpacing: "-0.5px",
        userSelect: "none",
      }}
    >
      {isEmoji ? avatar : getInitials(name)}
    </div>
  );
}

// ─── Reply Card ───────────────────────────────────────────────────────────

const SWIPE_THRESHOLD = 80;

interface ReplyCardProps {
  reply: PendingReply;
  onDone: (id: string) => void;
  onDelete: (id: string) => void;
  onSnooze: (id: string) => void;
}

export function ReplyCard({ reply, onDone, onDelete, onSnooze }: ReplyCardProps) {
  const x = useMotionValue(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [exitDirection, setExitDirection] = useState<"left" | "right" | null>(null);
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [isLongPressed, setIsLongPressed] = useState(false);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const addToast = useStore((s) => s.addToast);

  function startPress() {
    setIsLongPressed(false);
    longPressTimer.current = setTimeout(() => {
      if ("vibrate" in navigator) navigator.vibrate(20);
      setShowContextMenu(true);
      setIsLongPressed(true);
    }, 500);
  }

  function cancelPress() {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }

  const now = new Date();
  const overdueMs = now.getTime() - reply.remindAt.getTime();
  const overdueHours = overdueMs / (1000 * 60 * 60);
  const isOverdue = overdueHours > 0 && reply.status === "pending";

  // Escalating Overdue Warmth Configuration
  let cardBorder = "1px solid var(--color-border)";
  let cardBoxShadow = "none";
  let warmthLabel = "";

  if (isOverdue) {
    if (overdueHours <= 2) {
      // 0-2h overdue: no change
      cardBorder = "1px solid var(--color-border)";
    } else if (overdueHours <= 24) {
      // 2-24h overdue: subtle amber glow
      cardBorder = "1px solid rgba(200, 169, 110, 0.4)";
      cardBoxShadow = "0 0 8px rgba(200, 169, 110, 0.1)";
    } else if (overdueHours <= 72) {
      // 24-72h overdue: soft label "still waiting..."
      cardBorder = "1px solid rgba(200, 169, 110, 0.5)";
      cardBoxShadow = "0 0 10px rgba(200, 169, 110, 0.15)";
      warmthLabel = "still waiting...";
    } else {
      // 72h+ overdue: label becomes "X days now", border slightly warmer
      const overdueDays = Math.floor(overdueHours / 24);
      cardBorder = "1px solid rgba(200, 169, 110, 0.75)";
      cardBoxShadow = "0 0 12px rgba(200, 169, 110, 0.25)";
      warmthLabel = `${overdueDays} days now`;
    }
  }

  // Right swipe (x > 0) is delete:
  const deleteProgress = useTransform(x, [0, SWIPE_THRESHOLD * 1.5], [0, 1]);
  const deleteOpacity = useTransform(x, [20, SWIPE_THRESHOLD], [0, 1]);

  // Left swipe (x < 0) is done:
  const doneProgress = useTransform(x, [-SWIPE_THRESHOLD * 1.5, 0], [1, 0]);
  const doneOpacity = useTransform(x, [-SWIPE_THRESHOLD, -20], [1, 0]);

  // cardBg: left swipe (x < 0) is done, right swipe (x > 0) is delete:
  const cardBg = useTransform(
    x,
    [-SWIPE_THRESHOLD * 1.5, 0, SWIPE_THRESHOLD * 1.5],
    ["rgba(90,158,122,0.08)", "transparent", "rgba(192,57,43,0.08)"]
  );

  function handleDragEnd(_: unknown, info: { offset: { x: number } }) {
    setIsDragging(false);
    if (info.offset.x > SWIPE_THRESHOLD) {
      // Swipe right: delete (slide from left to delete)
      if ("vibrate" in navigator) navigator.vibrate(15);
      setExitDirection("right");
      onDelete(reply.id);
    } else if (info.offset.x < -SWIPE_THRESHOLD) {
      // Swipe left: done
      if ("vibrate" in navigator) navigator.vibrate([10, 5, 10]);
      setExitDirection("left");
      onDone(reply.id);
    }
  }

  return (
    <motion.div
      layout
      style={{ position: "relative", overflow: "hidden", borderRadius: "var(--radius-md)", marginBottom: "var(--space-3)" }}
    >
      {/* Delete background (right swipe, revealed on the left side) */}
      <motion.div
        style={{
          position: "absolute",
          inset: 0,
          background: "linear-gradient(90deg, rgba(192,57,43,0.18) 0%, rgba(192,57,43,0.02) 100%)",
          display: "flex",
          alignItems: "center",
          paddingLeft: "var(--space-6)",
          opacity: deleteOpacity,
          zIndex: 0,
          borderRadius: "var(--radius-md)",
        }}
        aria-hidden="true"
      >
        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
          <motion.span
            style={{
              fontSize: 18,
              scale: deleteProgress,
              color: "#E74C3C",
              fontWeight: "bold",
            }}
          >
            ✕
          </motion.span>
          <motion.span
            style={{
              fontSize: "var(--text-xs)",
              fontFamily: "var(--font-mono)",
              color: "#E74C3C",
              opacity: deleteOpacity,
              letterSpacing: "0.05em",
            }}
          >
            DELETE
          </motion.span>
        </div>
      </motion.div>

      {/* Done background (left swipe, revealed on the right side) */}
      <motion.div
        style={{
          position: "absolute",
          inset: 0,
          background: "linear-gradient(270deg, rgba(90,158,122,0.2) 0%, rgba(90,158,122,0.02) 100%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-end",
          paddingRight: "var(--space-6)",
          opacity: doneOpacity,
          zIndex: 0,
          borderRadius: "var(--radius-md)",
        }}
        aria-hidden="true"
      >
        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
          <motion.span
            style={{
              fontSize: "var(--text-xs)",
              fontFamily: "var(--font-mono)",
              color: "var(--color-done)",
              opacity: doneOpacity,
              letterSpacing: "0.05em",
            }}
          >
            DONE
          </motion.span>
          <motion.span
            style={{
              fontSize: 20,
              scale: doneProgress,
              color: "var(--color-done)",
              fontWeight: "bold",
            }}
          >
            ✓
          </motion.span>
        </div>
      </motion.div>

      {/* Card */}
      <motion.div
        style={{
          x,
          backgroundColor: cardBg,
          background: "var(--color-surface)",
          border: cardBorder,
          boxShadow: cardBoxShadow,
          borderRadius: "var(--radius-md)",
          position: "relative",
          zIndex: 1,
          cursor: isDragging ? "grabbing" : "pointer",
          userSelect: "none",
          WebkitUserSelect: "none",
          touchAction: "pan-y",
          transition: "border var(--transition-base), box-shadow var(--transition-base)",
        }}
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.15}
        onDragStart={() => setIsDragging(true)}
        onDragEnd={handleDragEnd}
        whileTap={{ cursor: "grabbing" }}
        exit={{
          x: exitDirection === "right" ? 400 : exitDirection === "left" ? -400 : 0,
          opacity: 0,
          height: 0,
          marginBottom: 0,
          transition: {
            x: { type: "spring", stiffness: 350, damping: 30 },
            opacity: { duration: 0.2 },
            height: { delay: 0.15, type: "spring", stiffness: 350, damping: 30 },
            marginBottom: { delay: 0.15, type: "spring", stiffness: 350, damping: 30 }
          }
        }}
        tabIndex={0}
        role="article"
        aria-label={`Reply to ${reply.contactName} about ${reply.note}`}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") setIsExpanded(!isExpanded);
          if (e.key === "d") onDone(reply.id);
          if (e.key === "Delete" || e.key === "Backspace") onDelete(reply.id);
        }}
        onMouseDown={startPress}
        onMouseUp={cancelPress}
        onMouseLeave={cancelPress}
        onTouchStart={startPress}
        onTouchEnd={cancelPress}
        onTouchMove={cancelPress}
        onClick={(e) => {
          if (isLongPressed) {
            e.preventDefault();
            setIsLongPressed(false);
            return;
          }
          if (!isDragging) setIsExpanded(!isExpanded);
        }}
      >
        <div
          style={{
            padding: "var(--space-4)",
            display: "flex",
            alignItems: "center",
            gap: "var(--space-3)",
          }}
        >
          {/* Status dot — always warm amber, never failure red */}
          <div
            aria-hidden="true"
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: "var(--color-pending)",
              flexShrink: 0,
              animation: "pulse-pending 2.5s ease-in-out infinite",
            }}
          />

          {/* Avatar */}
          <Avatar name={reply.contactName} avatar={reply.contactName[0]} />

          {/* Content */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: "var(--text-lg)",
                fontFamily: "var(--font-serif)",
                color: "var(--color-text-primary)",
                lineHeight: 1.3,
                marginBottom: 2,
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
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "var(--space-2)",
                fontSize: "var(--text-xs)",
                fontFamily: "var(--font-mono)",
                color: isOverdue ? "var(--color-pending)" : "var(--color-text-muted)",
                marginTop: "var(--space-1)",
              }}
            >
              <span>{formatRelativeTime(reply.remindAt)}</span>
              {warmthLabel && (
                <>
                  <span style={{ opacity: 0.5 }}>•</span>
                  <span style={{ fontStyle: "italic", opacity: 0.85 }}>{warmthLabel}</span>
                </>
              )}
            </div>
          </div>

          {/* Platform badge — real logo */}
          <div
            style={{ flexShrink: 0, opacity: 0.85 }}
            title={reply.contactName}
            aria-hidden="true"
          >
            <PlatformIcon platform={reply.platform ?? "other"} size={22} />
          </div>
        </div>

        {/* Expanded detail */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ type: "spring", stiffness: 400, damping: 35 }}
              style={{ overflow: "hidden" }}
            >
              <div
                style={{
                  padding: "0 var(--space-4) var(--space-4)",
                  paddingLeft: "calc(var(--space-4) + 8px + var(--space-3) + 40px + var(--space-3))",
                  display: "flex",
                  gap: "var(--space-2)",
                  flexWrap: "wrap",
                }}
              >
                <button
                  className="btn btn-primary"
                  style={{ padding: "var(--space-2) var(--space-4)", fontSize: "var(--text-sm)" }}
                  onClick={(e) => { e.stopPropagation(); onDone(reply.id); }}
                  id={`done-btn-${reply.id}`}
                  aria-label={`Mark reply to ${reply.contactName} as done`}
                >
                  ✓ Done
                </button>
                <button
                  className="btn btn-secondary"
                  style={{ padding: "var(--space-2) var(--space-4)", fontSize: "var(--text-sm)" }}
                  onClick={(e) => { e.stopPropagation(); onSnooze(reply.id); }}
                  id={`snooze-btn-${reply.id}`}
                  aria-label={`Snooze reminder for ${reply.contactName}`}
                >
                  ⏱ Snooze
                </button>
                <button
                  className="btn btn-danger"
                  style={{ padding: "var(--space-2) var(--space-4)", fontSize: "var(--text-sm)" }}
                  onClick={(e) => { e.stopPropagation(); onDelete(reply.id); }}
                  id={`delete-btn-${reply.id}`}
                  aria-label={`Delete reminder for ${reply.contactName}`}
                >
                  Delete
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* iOS-Style Long Press Context Menu Modal */}
      <AnimatePresence>
        {showContextMenu && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 9999,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "var(--space-6)",
            }}
          >
            {/* Backdrop with backdrop-filter blur */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={(e) => {
                e.stopPropagation();
                setShowContextMenu(false);
                setIsLongPressed(false);
              }}
              style={{
                position: "absolute",
                inset: 0,
                background: "rgba(0, 0, 0, 0.7)",
                backdropFilter: "blur(12px)",
                WebkitBackdropFilter: "blur(12px)",
              }}
            />

            {/* Menu Container */}
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 15 }}
              transition={{ type: "spring", stiffness: 420, damping: 32 }}
              style={{
                position: "relative",
                width: "100%",
                maxWidth: "300px",
                zIndex: 10000,
                display: "flex",
                flexDirection: "column",
                gap: "var(--space-3)",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Highlighted replica preview of the card */}
              <div
                style={{
                  background: "var(--color-surface)",
                  border: "1px solid rgba(255, 255, 255, 0.08)",
                  borderRadius: "var(--radius-md)",
                  boxShadow: "0 20px 40px rgba(0, 0, 0, 0.6)",
                  padding: "var(--space-4)",
                  display: "flex",
                  alignItems: "center",
                  gap: "var(--space-3)",
                  transform: "scale(1.02)",
                  pointerEvents: "none",
                  userSelect: "none",
                }}
              >
                <Avatar name={reply.contactName} avatar={reply.contactName[0]} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: "var(--text-lg)", fontFamily: "var(--font-serif)", color: "var(--color-text-primary)" }}>
                    {reply.contactName}
                  </div>
                  <div style={{ fontSize: "var(--text-sm)", color: "var(--color-text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {reply.note || <span style={{ fontStyle: "italic", opacity: 0.5 }}>No notes</span>}
                  </div>
                </div>
                <div style={{ opacity: 0.8 }}>
                  <PlatformIcon platform={reply.platform ?? "other"} size={22} />
                </div>
              </div>

              {/* iOS Style Action Menu Options */}
              <div
                style={{
                  background: "var(--color-surface)",
                  border: "1px solid var(--color-border)",
                  borderRadius: "16px",
                  overflow: "hidden",
                  boxShadow: "0 10px 30px rgba(0,0,0,0.4)",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <button
                  onClick={() => {
                    setShowContextMenu(false);
                    setIsLongPressed(false);
                    onDone(reply.id);
                  }}
                  style={{
                    width: "100%",
                    padding: "14px 20px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    fontSize: "var(--text-base)",
                    color: "var(--color-text-primary)",
                    fontFamily: "var(--font-sans)",
                    borderBottom: "1px solid var(--color-border)",
                    textAlign: "left",
                    outline: "none",
                  }}
                >
                  <span>Mark Done</span>
                  <span style={{ color: "var(--color-done)", fontWeight: "bold" }}>✓</span>
                </button>
                <button
                  onClick={() => {
                    setShowContextMenu(false);
                    setIsLongPressed(false);
                    onSnooze(reply.id);
                  }}
                  style={{
                    width: "100%",
                    padding: "14px 20px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    fontSize: "var(--text-base)",
                    color: "var(--color-text-primary)",
                    fontFamily: "var(--font-sans)",
                    borderBottom: "1px solid var(--color-border)",
                    textAlign: "left",
                    outline: "none",
                  }}
                >
                  <span>Snooze Reminder</span>
                  <span style={{ color: "var(--color-pending)", fontSize: 18 }}>⏱</span>
                </button>
                <button
                  onClick={() => {
                    setShowContextMenu(false);
                    setIsLongPressed(false);
                    onDelete(reply.id);
                  }}
                  style={{
                    width: "100%",
                    padding: "14px 20px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    fontSize: "var(--text-base)",
                    color: "var(--color-danger)",
                    fontFamily: "var(--font-sans)",
                    textAlign: "left",
                    outline: "none",
                  }}
                >
                  <span>Delete Reminder</span>
                  <span style={{ fontWeight: "bold" }}>✕</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
