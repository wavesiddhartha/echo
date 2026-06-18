"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { useStore } from "@/store/useStore";
import { AddReminderSheet } from "@/components/add/AddReminderSheet";

interface DemoShellProps {
  children: React.ReactNode;
}

const PendingIcon = ({ active }: { active: boolean }) => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke={active ? "var(--color-pending)" : "var(--color-text-muted)"}
    strokeWidth="2"
    style={{ transition: "stroke 0.2s" }}
  >
    <circle cx="12" cy="12" r="9" strokeDasharray="3 3" opacity={active ? 1 : 0.6} />
    <circle cx="12" cy="12" r="5" />
    <circle cx="12" cy="12" r="2" fill={active ? "var(--color-pending)" : "var(--color-text-muted)"} />
  </svg>
);

const DoneIcon = ({ active }: { active: boolean }) => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke={active ? "var(--color-done)" : "var(--color-text-muted)"}
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ transition: "stroke 0.2s" }}
  >
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const PlusIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
  >
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

export function DemoShell({ children }: DemoShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const openAddSheet = useStore((s) => s.openAddSheet);
  const closeAddSheet = useStore((s) => s.closeAddSheet);
  const isAddSheetOpen = useStore((s) => s.isAddSheetOpen);
  const [mounted, setMounted] = useState(false);

  const isHomeActive = pathname === "/";
  const isDoneActive = pathname === "/done";
  const isSettingsActive = pathname === "/settings";
  const isOnboardingActive = pathname === "/onboarding";

  useEffect(() => {
    setMounted(true);
  }, []);

  const toggleAddSheet = () => {
    if (isAddSheetOpen) {
      closeAddSheet();
    } else {
      openAddSheet();
    }
  };

  if (!mounted) return null;

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        background: "var(--color-bg)",
        padding: "24px 16px 100px", // space for bottom bar
        fontFamily: "var(--font-sans)",
        position: "relative",
      }}
    >
      {/* Top Global Navigation Bar Capsule (Web Demo Page Switcher) */}
      <div
        style={{
          display: "flex",
          gap: "6px",
          background: "var(--color-surface)",
          border: "1px solid var(--color-border)",
          padding: "6px 10px",
          borderRadius: "var(--radius-full)",
          marginBottom: "28px",
          boxShadow: "0 4px 16px rgba(0,0,0,0.06)",
          zIndex: 100,
          position: "sticky",
          top: "12px",
        }}
      >
        <button
          onClick={() => {
            closeAddSheet();
            router.push("/");
          }}
          style={{
            padding: "6px 14px",
            borderRadius: "var(--radius-full)",
            background: isHomeActive && !isAddSheetOpen ? "var(--color-text-primary)" : "transparent",
            color: isHomeActive && !isAddSheetOpen ? "var(--color-bg)" : "var(--color-text-muted)",
            border: "none",
            cursor: "pointer",
            fontSize: "13px",
            fontWeight: 500,
            fontFamily: "var(--font-sans)",
            transition: "all var(--transition-fast)",
            outline: "none",
          }}
        >
          Home
        </button>
        <button
          onClick={openAddSheet}
          style={{
            padding: "6px 14px",
            borderRadius: "var(--radius-full)",
            background: isAddSheetOpen ? "var(--color-text-primary)" : "transparent",
            color: isAddSheetOpen ? "var(--color-bg)" : "var(--color-text-muted)",
            border: "none",
            cursor: "pointer",
            fontSize: "13px",
            fontWeight: 500,
            fontFamily: "var(--font-sans)",
            transition: "all var(--transition-fast)",
            outline: "none",
          }}
        >
          Add
        </button>
        <button
          onClick={() => {
            closeAddSheet();
            router.push("/done");
          }}
          style={{
            padding: "6px 14px",
            borderRadius: "var(--radius-full)",
            background: isDoneActive ? "var(--color-text-primary)" : "transparent",
            color: isDoneActive ? "var(--color-bg)" : "var(--color-text-muted)",
            border: "none",
            cursor: "pointer",
            fontSize: "13px",
            fontWeight: 500,
            fontFamily: "var(--font-sans)",
            transition: "all var(--transition-fast)",
            outline: "none",
          }}
        >
          Done
        </button>
        <button
          onClick={() => {
            closeAddSheet();
            router.push("/settings");
          }}
          style={{
            padding: "6px 14px",
            borderRadius: "var(--radius-full)",
            background: isSettingsActive ? "var(--color-text-primary)" : "transparent",
            color: isSettingsActive ? "var(--color-bg)" : "var(--color-text-muted)",
            border: "none",
            cursor: "pointer",
            fontSize: "13px",
            fontWeight: 500,
            fontFamily: "var(--font-sans)",
            transition: "all var(--transition-fast)",
            outline: "none",
          }}
        >
          Settings
        </button>
        <button
          onClick={() => {
            closeAddSheet();
            router.push("/onboarding");
          }}
          style={{
            padding: "6px 14px",
            borderRadius: "var(--radius-full)",
            background: isOnboardingActive ? "var(--color-text-primary)" : "transparent",
            color: isOnboardingActive ? "var(--color-bg)" : "var(--color-text-muted)",
            border: "none",
            cursor: "pointer",
            fontSize: "13px",
            fontWeight: 500,
            fontFamily: "var(--font-sans)",
            transition: "all var(--transition-fast)",
            outline: "none",
          }}
        >
          Onboarding
        </button>
      </div>

      {/* Main Responsive Page Container with iOS Stack Scaling animation */}
      <div
        style={{
          width: "100%",
          maxWidth: "480px",
          position: "relative",
          background: "#000",
          borderRadius: isAddSheetOpen ? "24px" : "0px",
          overflow: "hidden",
          border: "1px solid var(--color-border)",
          boxShadow: "0 8px 32px rgba(0,0,0,0.08)",
        }}
      >
        <motion.div
          animate={{
            scale: isAddSheetOpen ? 0.94 : 1,
            borderRadius: isAddSheetOpen ? "24px" : "0px",
            y: isAddSheetOpen ? 12 : 0,
            filter: isAddSheetOpen ? "brightness(0.6)" : "brightness(1)",
          }}
          transition={{ type: "spring", stiffness: 350, damping: 32 }}
          style={{
            minHeight: "calc(100vh - 120px)",
            background: "var(--color-bg)",
            transformOrigin: "top center",
            overflow: "hidden",
            paddingBottom: "100px", // Safe space for bottom bar
          }}
        >
          {children}
        </motion.div>

        {/* Add Reminder Sheet Overlay (slides up OVER the background stack) */}
        <AnimatePresence>
          {isAddSheetOpen && <AddReminderSheet />}
        </AnimatePresence>

        {/* Bottom App Navigation Bar (Fixed in center bottom viewport) */}
        <div
          style={{
            position: "absolute",
            bottom: "16px",
            left: "16px",
            right: "16px",
            height: "60px",
            background: "var(--color-surface)",
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-full)",
            display: "flex",
            justifyContent: "space-around",
            alignItems: "center",
            zIndex: 102,
            boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
          }}
        >
          <button
            onClick={() => {
              closeAddSheet();
              router.push("/");
            }}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              background: "none",
              border: "none",
              cursor: "pointer",
              gap: "2px",
              color: isHomeActive && !isAddSheetOpen ? "var(--color-pending)" : "var(--color-text-muted)",
              fontSize: "10px",
              fontFamily: "var(--font-mono)",
              letterSpacing: "0.05em",
              transition: "color 0.2s",
              outline: "none",
              width: "60px",
            }}
          >
            <PendingIcon active={isHomeActive && !isAddSheetOpen} />
            <span>pending</span>
          </button>

          <button
            onClick={toggleAddSheet}
            style={{
              width: "44px",
              height: "44px",
              borderRadius: "50%",
              background: "var(--color-text-primary)",
              color: "var(--color-bg)",
              border: "none",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
              transform: isAddSheetOpen ? "rotate(45deg)" : "rotate(0deg)",
              transition: "all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
              outline: "none",
            }}
          >
            <PlusIcon />
          </button>

          <button
            onClick={() => {
              closeAddSheet();
              router.push("/done");
            }}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              background: "none",
              border: "none",
              cursor: "pointer",
              gap: "2px",
              color: isDoneActive ? "var(--color-done)" : "var(--color-text-muted)",
              fontSize: "10px",
              fontFamily: "var(--font-mono)",
              letterSpacing: "0.05em",
              transition: "color 0.2s",
              outline: "none",
              width: "60px",
            }}
          >
            <DoneIcon active={isDoneActive} />
            <span>done</span>
          </button>
        </div>
      </div>
    </div>
  );
}

