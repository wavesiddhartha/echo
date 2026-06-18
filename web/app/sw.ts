import { defaultCache } from "@serwist/next/worker";
import type { SerwistGlobalConfig } from "serwist";
import { Serwist } from "serwist";
import Dexie from "dexie";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (string | { url: string; revision: string | null })[];
  }
}
declare const self: ServiceWorkerGlobalScope;

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  runtimeCaching: defaultCache,
});

serwist.addEventListeners();

// Open database directly in the Service Worker
const db = new Dexie("EchoDatabase");
db.version(1).stores({
  contacts: "id, name, platform, createdAt",
  pendingReplies: "id, contactId, status, remindAt, createdAt, doneAt",
  reminders: "id, replyId, scheduledAt, delivered",
  usagePatterns: "++id, hour, timestamp",
});

// Local notification scheduling via messages from main thread
const scheduledNotifications = new Map<string, ReturnType<typeof setTimeout>>();

self.addEventListener("message", (event) => {
  const { type, payload } = event.data ?? {};

  if (type === "SCHEDULE_NOTIFICATION") {
    const { id, title, body, scheduledAt } = payload;
    const delay = new Date(scheduledAt).getTime() - Date.now();

    // Cancel existing if rescheduled
    if (scheduledNotifications.has(id)) {
      clearTimeout(scheduledNotifications.get(id)!);
    }

    const showNotificationNow = () => {
      self.registration.showNotification(title, {
        body,
        icon: "/icons/icon-192.png",
        badge: "/icons/badge-72.png",
        tag: id,
        data: { id, title, body },
        actions: [
          { action: "done", title: "Replied ✓" },
          { action: "snooze", title: "Snooze 1h" },
        ],
      } as any);
    };

    if (delay <= 0) {
      showNotificationNow();
    } else {
      const timeout = setTimeout(() => {
        showNotificationNow();
        scheduledNotifications.delete(id);
      }, delay);
      scheduledNotifications.set(id, timeout);
    }
  }

  if (type === "CANCEL_NOTIFICATION") {
    const { id } = payload;
    if (scheduledNotifications.has(id)) {
      clearTimeout(scheduledNotifications.get(id)!);
      scheduledNotifications.delete(id);
    }
  }
});

// Handle notification clicks — support background actions & normal clicks
self.addEventListener("notificationclick", (event) => {
  const notification = event.notification;
  const replyId = notification.data?.id;
  const action = event.action;

  notification.close();

  if (!replyId) return;

  if (action === "done") {
    // Mark done silently in background
    const doneAt = new Date();
    event.waitUntil(
      Promise.all([
        db.table("pendingReplies").update(replyId, {
          status: "done",
          doneAt,
        }),
        db.table("usagePatterns").add({
          hour: doneAt.getHours(),
          timestamp: doneAt,
        }),
      ])
    );
  } else if (action === "snooze") {
    // Snooze silently in background for 1 hour
    const snoozeUntil = new Date();
    snoozeUntil.setHours(snoozeUntil.getHours() + 1);

    event.waitUntil(
      db.table("pendingReplies").update(replyId, {
        status: "snoozed",
        remindAt: snoozeUntil,
        snoozedUntil: snoozeUntil,
      }).then(() => {
        // Schedule next reminder for 1 hour later
        const delay = snoozeUntil.getTime() - Date.now();
        if (delay > 0) {
          const timeout = setTimeout(() => {
            self.registration.showNotification(notification.data?.title || "Echo", {
              body: notification.data?.body || "Reply reminder",
              icon: "/icons/icon-192.png",
              badge: "/icons/badge-72.png",
              tag: replyId,
              data: notification.data,
              actions: [
                { action: "done", title: "Replied ✓" },
                { action: "snooze", title: "Snooze 1h" },
              ],
            } as any);
            scheduledNotifications.delete(replyId);
          }, delay);
          scheduledNotifications.set(replyId, timeout);
        }
      })
    );
  } else {
    // Normal tap: open or focus app
    const targetUrl = replyId === "weekly-summary" ? "/done?weekly=true" : "/";
    event.waitUntil(
      self.clients.matchAll({ type: "window" }).then((clientList) => {
        for (const client of clientList) {
          const clientUrlObj = new URL(client.url);
          const isTargetWeekly = targetUrl.includes("weekly=true") && clientUrlObj.pathname === "/done";
          const isTargetHome = targetUrl === "/" && clientUrlObj.pathname === "/";
          if (isTargetWeekly || isTargetHome) {
            if ("focus" in client) return client.focus();
          }
        }
        if (self.clients.openWindow) {
          return self.clients.openWindow(targetUrl);
        }
      })
    );
  }
});
