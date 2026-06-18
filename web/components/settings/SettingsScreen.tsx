"use client";

import { useState, useEffect } from "react";
import { motion } from "motion/react";
import Link from "next/link";
import { useThemeContext } from "@/components/providers/ThemeProvider";
import { useStore } from "@/store/useStore";
import {
  requestNotificationPermission,
  scheduleNotification,
  scheduleWeeklySummaryNotification,
} from "@/hooks/useNotifications";
import { exportAllData, deleteAllData, getWeeklyStreak } from "@/lib/db";

export function SettingsScreen() {
  const { theme, setTheme } = useThemeContext();
  const addToast = useStore((s) => s.addToast);

  const [notifPermission, setNotifPermission] = useState<NotificationPermission>("default");
  const [streak, setStreak] = useState(0);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [weeklySummaryEnabled, setWeeklySummaryEnabled] = useState(true);

  useEffect(() => {
    setMounted(true);
    if ("Notification" in window) {
      setNotifPermission(Notification.permission);
    }
    getWeeklyStreak().then(setStreak);

    const stored = localStorage.getItem("echo-weekly-summary");
    if (stored !== null) {
      setWeeklySummaryEnabled(stored === "true");
    }
  }, []);

  async function handleWeeklySummaryToggle() {
    const nextVal = !weeklySummaryEnabled;
    setWeeklySummaryEnabled(nextVal);
    localStorage.setItem("echo-weekly-summary", String(nextVal));
    await scheduleWeeklySummaryNotification();
    addToast({ message: nextVal ? "Weekly summary enabled ✓" : "Weekly summary disabled" });
  }

  async function handleNotifToggle() {
    if (notifPermission === "granted") {
      addToast({ message: "Disable notifications in your browser settings" });
      return;
    }
    const granted = await requestNotificationPermission();
    setNotifPermission(granted ? "granted" : "denied");
    if (granted) {
      addToast({ message: "Notifications enabled ✓" });
    } else {
      addToast({ message: "Permission denied — check browser settings" });
    }
  }

  async function handleExport() {
    const json = await exportAllData();
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `echo-export-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    addToast({ message: "Data exported" });
  }

  async function handleDeleteAll() {
    await deleteAllData();
    setShowDeleteConfirm(false);
    addToast({ message: "All data deleted" });
  }

  if (!mounted) return null;

  const THEMES: { value: "light" | "dark" | "auto"; label: string; icon: string }[] = [
    { value: "light", label: "Light", icon: "☀️" },
    { value: "dark", label: "Dark", icon: "🌙" },
    { value: "auto", label: "Auto", icon: "✦" },
  ];

  return (
    <div className="page">
      {/* Header matching Screenshot 4 */}
      <header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "var(--space-6) var(--space-6) var(--space-4)",
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

      <main style={{ flex: 1, padding: "0 var(--space-6)", display: "flex", flexDirection: "column", gap: "var(--space-8)" }}>

        {/* Streak */}
        {streak > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              background: "rgba(90,158,122,0.08)",
              border: "1px solid rgba(90,158,122,0.2)",
              borderRadius: "var(--radius-md)",
              padding: "var(--space-4)",
              display: "flex",
              alignItems: "center",
              gap: "var(--space-3)",
            }}
          >
            <span style={{ fontSize: 24 }}>🎉</span>
            <div>
              <div style={{ fontSize: "var(--text-base)", fontFamily: "var(--font-serif)", color: "var(--color-text-primary)" }}>
                {streak} {streak === 1 ? "reply" : "replies"} this week
              </div>
              <div style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>
                Keep it up — people notice when you reply.
              </div>
            </div>
          </motion.div>
        )}

        {/* Appearance */}
        <section>
          <SectionLabel>Appearance</SectionLabel>
          <SettingsRow label="Theme">
            <div style={{ display: "flex", gap: "var(--space-1)", background: "var(--color-bg)", borderRadius: "var(--radius-full)", padding: "var(--space-1)", border: "1px solid var(--color-border)" }}>
              {THEMES.map((t) => (
                <button
                  key={t.value}
                  onClick={() => setTheme(t.value)}
                  aria-pressed={theme === t.value}
                  aria-label={`${t.label} theme`}
                  id={`theme-${t.value}-btn`}
                  style={{
                    padding: "var(--space-1) var(--space-3)",
                    borderRadius: "var(--radius-full)",
                    border: "none",
                    background: theme === t.value ? "var(--color-accent)" : "transparent",
                    color: theme === t.value ? "var(--color-accent-text)" : "var(--color-text-muted)",
                    fontSize: "var(--text-sm)",
                    cursor: "pointer",
                    fontFamily: "var(--font-sans)",
                    transition: "all var(--transition-fast)",
                    display: "flex",
                    alignItems: "center",
                    gap: "var(--space-1)",
                  }}
                >
                  <span>{t.icon}</span>
                  <span>{t.label}</span>
                </button>
              ))}
            </div>
          </SettingsRow>
        </section>

        {/* Notifications */}
        <section>
          <SectionLabel>Notifications</SectionLabel>
          <SettingsRow
            label="Reminders"
            subtitle={
              notifPermission === "denied"
                ? "Blocked — enable in browser settings"
                : notifPermission === "granted"
                ? "Enabled"
                : "Tap to enable"
            }
          >
            <button
              onClick={handleNotifToggle}
              id="notification-toggle-btn"
              aria-label={`Notifications ${notifPermission === "granted" ? "on" : "off"}`}
              aria-checked={notifPermission === "granted"}
              role="switch"
              style={{
                width: 48,
                height: 28,
                borderRadius: "var(--radius-full)",
                background: notifPermission === "granted" ? "var(--color-done)" : "var(--color-border)",
                border: "none",
                cursor: "pointer",
                position: "relative",
                transition: "background var(--transition-fast)",
                flexShrink: 0,
              }}
            >
              <motion.div
                animate={{ x: notifPermission === "granted" ? 22 : 2 }}
                transition={{ type: "spring", stiffness: 500, damping: 35 }}
                style={{
                  position: "absolute",
                  top: 2,
                  left: 0,
                  width: 24,
                  height: 24,
                  borderRadius: "50%",
                  background: "white",
                  boxShadow: "0 1px 4px rgba(0,0,0,0.2)",
                }}
              />
            </button>
          </SettingsRow>

          <div style={{ height: 1, background: "var(--color-border)", margin: "var(--space-2) 0" }} />

          <SettingsRow
            label="Weekly Summary"
            subtitle="Every Sunday at 10 AM, get a warm recap of your replies."
          >
            <button
              onClick={handleWeeklySummaryToggle}
              id="weekly-summary-toggle-btn"
              aria-label={`Weekly summary ${weeklySummaryEnabled ? "on" : "off"}`}
              aria-checked={weeklySummaryEnabled}
              role="switch"
              style={{
                width: 48,
                height: 28,
                borderRadius: "var(--radius-full)",
                background: weeklySummaryEnabled ? "var(--color-done)" : "var(--color-border)",
                border: "none",
                cursor: "pointer",
                position: "relative",
                transition: "background var(--transition-fast)",
                flexShrink: 0,
              }}
            >
              <motion.div
                animate={{ x: weeklySummaryEnabled ? 22 : 2 }}
                transition={{ type: "spring", stiffness: 500, damping: 35 }}
                style={{
                  position: "absolute",
                  top: 2,
                  left: 0,
                  width: 24,
                  height: 24,
                  borderRadius: "50%",
                  background: "white",
                  boxShadow: "0 1px 4px rgba(0,0,0,0.2)",
                }}
              />
            </button>
          </SettingsRow>
        </section>

        {/* Data */}
        <section>
          <SectionLabel>Data</SectionLabel>
          <SettingsButton
            label="Export as JSON"
            onClick={handleExport}
            id="export-data-btn"
          />
          <div style={{ height: 1, background: "var(--color-border)", margin: "0" }} />
          {showDeleteConfirm ? (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                padding: "var(--space-4)",
                background: "rgba(192,57,43,0.06)",
                borderRadius: "var(--radius-md)",
                display: "flex",
                flexDirection: "column",
                gap: "var(--space-3)",
              }}
            >
              <p style={{ fontSize: "var(--text-sm)", color: "var(--color-text-primary)" }}>
                This will permanently delete all your reminders. This cannot be undone.
              </p>
              <div style={{ display: "flex", gap: "var(--space-2)" }}>
                <button className="btn btn-danger" onClick={handleDeleteAll} id="confirm-delete-btn">
                  Delete everything
                </button>
                <button className="btn btn-ghost" onClick={() => setShowDeleteConfirm(false)} id="cancel-delete-btn">
                  Cancel
                </button>
              </div>
            </motion.div>
          ) : (
            <SettingsButton
              label="Delete everything"
              onClick={() => setShowDeleteConfirm(true)}
              danger
              id="delete-all-btn"
            />
          )}
        </section>

        {/* About */}
        <section>
          <SectionLabel>About</SectionLabel>
          <div
            style={{
              padding: "var(--space-4) 0",
              display: "flex",
              flexDirection: "column",
              gap: "var(--space-1)",
            }}
          >
            <p style={{ fontSize: "var(--text-sm)", color: "var(--color-text-muted)" }}>
              Version 1.0.0
            </p>
            <p style={{ fontSize: "var(--text-sm)", color: "var(--color-text-muted)" }}>
              Built with care ♡
            </p>
            <p
              style={{
                fontSize: "var(--text-xs)",
                fontFamily: "var(--font-mono)",
                color: "var(--color-text-muted)",
                marginTop: "var(--space-2)",
                opacity: 0.6,
              }}
            >
              All data lives on your device. Zero servers.
            </p>
            <Link
              href="/how-it-works"
              id="how-it-works-link"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "var(--space-1)",
                fontSize: "var(--text-sm)",
                color: "var(--color-text-muted)",
                textDecoration: "none",
                marginTop: "var(--space-3)",
              }}
            >
              How it works →
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
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
      {children}
    </p>
  );
}

function SettingsRow({
  label,
  subtitle,
  children,
}: {
  label: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "var(--space-3) 0",
        gap: "var(--space-4)",
      }}
    >
      <div>
        <p style={{ fontSize: "var(--text-base)", color: "var(--color-text-primary)" }}>{label}</p>
        {subtitle && (
          <p style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)", marginTop: 2 }}>
            {subtitle}
          </p>
        )}
      </div>
      {children}
    </div>
  );
}

function SettingsButton({
  label,
  onClick,
  danger,
  id,
}: {
  label: string;
  onClick: () => void;
  danger?: boolean;
  id?: string;
}) {
  return (
    <button
      onClick={onClick}
      id={id}
      style={{
        width: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "var(--space-3) 0",
        background: "none",
        border: "none",
        cursor: "pointer",
        color: danger ? "var(--color-danger)" : "var(--color-text-primary)",
        fontSize: "var(--text-base)",
        fontFamily: "var(--font-sans)",
        textAlign: "left",
      }}
    >
      {label}
      <span style={{ color: "var(--color-text-muted)", fontSize: 18 }}>→</span>
    </button>
  );
}
