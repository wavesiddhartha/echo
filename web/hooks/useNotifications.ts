import { useEffect, useRef } from "react";
import { type PendingReply, getWeeklyStreak } from "@/lib/db";

// Request notification permission
export async function requestNotificationPermission(): Promise<boolean> {
  if (!("Notification" in window)) return false;
  if (Notification.permission === "granted") return true;
  if (Notification.permission === "denied") return false;

  const result = await Notification.requestPermission();
  return result === "granted";
}

// Schedule a notification via Service Worker message
export async function scheduleNotification(reply: PendingReply): Promise<void> {
  if (!("Notification" in window)) return;
  if (Notification.permission !== "granted") return;

  const contactName = reply.contactName;
  const body = `Reply to ${contactName} — ${reply.note}`;

  // First try: SW message (works while app is backgrounded, if SW is alive)
  if ("serviceWorker" in navigator) {
    const swReg = await navigator.serviceWorker.ready.catch(() => null);
    if (swReg?.active) {
      swReg.active.postMessage({
        type: "SCHEDULE_NOTIFICATION",
        payload: {
          id: reply.id,
          title: "Echo",
          body,
          scheduledAt: reply.remindAt.toISOString(),
        },
      });
      return;
    }
  }

  // Fallback: main-thread setTimeout (tab must stay open)
  const delay = reply.remindAt.getTime() - Date.now();
  if (delay > 0) {
    setTimeout(() => {
      new Notification("Echo", {
        body,
        icon: "/icons/icon-192.png",
      });
    }, delay);
  }
}

// Cancel a scheduled notification
export async function cancelNotification(replyId: string): Promise<void> {
  if ("serviceWorker" in navigator) {
    const swReg = await navigator.serviceWorker.ready.catch(() => null);
    if (swReg?.active) {
      swReg.active.postMessage({
        type: "CANCEL_NOTIFICATION",
        payload: { id: replyId },
      });
    }
  }
}

// Hook: check for overdue reminders on mount
export function useOverdueCheck(
  replies: PendingReply[],
  enabled: boolean
) {
  const checkedRef = useRef(false);

  useEffect(() => {
    if (!enabled || checkedRef.current || !replies.length) return;
    if (!("Notification" in window)) return;
    if (Notification.permission !== "granted") return;

    checkedRef.current = true;
    const now = new Date();
    const overdue = replies.filter(
      (r) => r.status === "pending" && r.remindAt <= now
    );

    overdue.forEach((r) => {
      new Notification("Echo — Overdue", {
        body: `Still haven't replied to ${r.contactName} — ${r.note}`,
        icon: "/icons/icon-192.png",
        tag: `overdue-${r.id}`,
      });
    });
  }, [replies, enabled]);
}

// Helper to find the next Sunday at 10 AM
export function getNextSunday10AM(): Date {
  const d = new Date();
  const day = d.getDay();
  // If it is Sunday (0) and before 10 AM, we target today. Otherwise we target next Sunday.
  let daysUntilSunday = (7 - day) % 7;
  if (day === 0 && d.getHours() >= 10) {
    daysUntilSunday = 7;
  }
  
  const target = new Date(d);
  target.setDate(d.getDate() + daysUntilSunday);
  target.setHours(10, 0, 0, 0);
  return target;
}

// Schedule the weekly summary notification
export async function scheduleWeeklySummaryNotification(): Promise<void> {
  if (!("Notification" in window)) return;
  if (Notification.permission !== "granted") return;

  const enabled = localStorage.getItem("echo-weekly-summary") !== "false";
  if (!enabled) {
    // Cancel any existing summary notification
    await cancelNotification("weekly-summary");
    return;
  }

  const count = await getWeeklyStreak();
  const remindAt = getNextSunday10AM();
  const body = `You replied to ${count} ${count === 1 ? "person" : "people"} this week. That matters. 🙌`;

  if ("serviceWorker" in navigator) {
    const swReg = await navigator.serviceWorker.ready.catch(() => null);
    if (swReg?.active) {
      swReg.active.postMessage({
        type: "SCHEDULE_NOTIFICATION",
        payload: {
          id: "weekly-summary",
          title: "Echo",
          body,
          scheduledAt: remindAt.toISOString(),
        },
      });
    }
  }
}
