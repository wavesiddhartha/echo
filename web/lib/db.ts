import Dexie, { type EntityTable } from "dexie";

// ─── Types ─────────────────────────────────────────────────────────────────

export type Platform = "whatsapp" | "instagram" | "imessage" | "telegram" | "twitter" | "other";
export type ReplyStatus = "pending" | "done" | "snoozed";

export interface Contact {
  id: string;
  name: string;
  platform: Platform;
  avatar?: string; // emoji or initials
  createdAt: Date;
}

export interface PendingReply {
  id: string;
  contactId: string;
  contactName: string; // denormalized for display performance
  note: string; // max 200 chars
  remindAt: Date;
  status: ReplyStatus;
  createdAt: Date;
  doneAt?: Date;
  snoozedUntil?: Date;
  platform: Platform;
}

export interface Reminder {
  id: string;
  replyId: string;
  scheduledAt: Date;
  delivered: boolean;
}

export interface UsagePattern {
  id?: number;
  hour: number; // 0-23
  timestamp: Date;
}

// ─── Database ──────────────────────────────────────────────────────────────

class EchoDatabase extends Dexie {
  contacts!: EntityTable<Contact, "id">;
  pendingReplies!: EntityTable<PendingReply, "id">;
  reminders!: EntityTable<Reminder, "id">;
  usagePatterns!: EntityTable<UsagePattern, "id">;

  constructor() {
    super("EchoDatabase");
    this.version(1).stores({
      contacts: "id, name, platform, createdAt",
      pendingReplies: "id, contactId, status, remindAt, createdAt, doneAt",
      reminders: "id, replyId, scheduledAt, delivered",
      usagePatterns: "++id, hour, timestamp",
    });
  }
}

// Singleton — safe to import in client components
export const db = new EchoDatabase();

// ─── Helper functions ──────────────────────────────────────────────────────

export async function getPendingReplies(): Promise<PendingReply[]> {
  return db.pendingReplies
    .where("status")
    .equals("pending")
    .sortBy("remindAt");
}

export async function getDoneReplies(): Promise<PendingReply[]> {
  return db.pendingReplies
    .where("status")
    .equals("done")
    .reverse()
    .sortBy("doneAt");
}

export async function addReply(reply: PendingReply): Promise<void> {
  await db.pendingReplies.add(reply);
}

export async function markDone(id: string): Promise<void> {
  const doneAt = new Date();
  await db.pendingReplies.update(id, { status: "done", doneAt });
  await recordUsagePattern(doneAt.getHours());
}

export async function deleteReply(id: string): Promise<void> {
  await db.pendingReplies.delete(id);
  await db.reminders.where("replyId").equals(id).delete();
}

export async function snoozeReply(
  id: string,
  until: Date
): Promise<void> {
  await db.pendingReplies.update(id, {
    status: "snoozed",
    remindAt: until,
    snoozedUntil: until,
  });
}

export async function wakeSnoozedreplies(): Promise<void> {
  const now = new Date();
  const snoozed = await db.pendingReplies
    .where("status")
    .equals("snoozed")
    .toArray();
  const toWake = snoozed.filter(
    (r) => r.snoozedUntil && r.snoozedUntil <= now
  );
  for (const r of toWake) {
    await db.pendingReplies.update(r.id, { status: "pending" });
  }
}

export async function exportAllData(): Promise<string> {
  const contacts = await db.contacts.toArray();
  const replies = await db.pendingReplies.toArray();
  const reminders = await db.reminders.toArray();
  return JSON.stringify({ contacts, replies, reminders }, null, 2);
}

export async function deleteAllData(): Promise<void> {
  await db.contacts.clear();
  await db.pendingReplies.clear();
  await db.reminders.clear();
  await db.usagePatterns.clear();
}

// ─── Streak helpers ────────────────────────────────────────────────────────

export async function getWeeklyStreak(): Promise<number> {
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  const done = await db.pendingReplies
    .where("status")
    .equals("done")
    .and((r) => !!r.doneAt && r.doneAt >= oneWeekAgo)
    .count();

  return done;
}

// ─── Contact and Auto-complete helpers ──────────────────────────────────────

export async function getRecentContacts(): Promise<Contact[]> {
  return db.contacts
    .orderBy("createdAt")
    .reverse()
    .limit(5)
    .toArray();
}

export async function searchContacts(query: string): Promise<Contact[]> {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return db.contacts
    .filter((c) => c.name.toLowerCase().includes(q))
    .toArray();
}

// ─── Smart Time Suggestion helpers ─────────────────────────────────────────

export async function recordUsagePattern(hour: number): Promise<void> {
  await db.usagePatterns.add({
    hour,
    timestamp: new Date(),
  });
}

export async function getSmartTimeSuggestion(): Promise<{ label: string; getDate: () => Date } | null> {
  const patterns = await db.usagePatterns.toArray();
  if (patterns.length < 5) return null;

  // Find most frequent hour
  const counts: Record<number, number> = {};
  let maxCount = 0;
  let usualHour = 21; // Default fallback: 9 PM

  for (const p of patterns) {
    counts[p.hour] = (counts[p.hour] || 0) + 1;
    if (counts[p.hour] > maxCount) {
      maxCount = counts[p.hour];
      usualHour = p.hour;
    }
  }

  const displayHour = usualHour === 0 ? 12 : usualHour > 12 ? usualHour - 12 : usualHour;
  const ampm = usualHour >= 12 ? "PM" : "AM";
  const label = `Your usual (${displayHour} ${ampm})`;

  return {
    label,
    getDate: () => {
      const d = new Date();
      d.setHours(usualHour, 0, 0, 0);
      if (d <= new Date()) {
        d.setDate(d.getDate() + 1);
      }
      return d;
    },
  };
}

export async function seedDemoData(): Promise<void> {
  const pendingCount = await db.pendingReplies.count();
  const contactCount = await db.contacts.count();
  if (pendingCount > 0 || contactCount > 0) return;

  // Add demo contacts
  const contacts = [
    { id: "c1", name: "Priya", platform: "whatsapp" as const, createdAt: new Date() },
    { id: "c2", name: "Rohan", platform: "instagram" as const, createdAt: new Date() },
    { id: "c3", name: "Mum", platform: "imessage" as const, createdAt: new Date() },
    { id: "c4", name: "Aisha", platform: "whatsapp" as const, createdAt: new Date() },
    { id: "c5", name: "Dad", platform: "imessage" as const, createdAt: new Date() },
    { id: "c6", name: "Nisha", platform: "instagram" as const, createdAt: new Date() },
  ];

  for (const c of contacts) {
    try {
      await db.contacts.add(c);
    } catch (e) {
      console.warn("Contact already exists", c.id, e);
    }
  }

  const today = new Date();
  
  // Set Priya to today at 6 PM
  const priyaTime = new Date(today);
  priyaTime.setHours(18, 0, 0, 0);

  // Set Rohan to yesterday at 10 AM
  const rohanTime = new Date(today);
  rohanTime.setDate(rohanTime.getDate() - 1);
  rohanTime.setHours(10, 0, 0, 0);

  // Set Mum to 3 days ago
  const mumTime = new Date(today);
  mumTime.setDate(mumTime.getDate() - 3);

  // Add pending replies
  const pending = [
    {
      id: "p1",
      contactId: "c1",
      contactName: "Priya",
      note: "her job interview result",
      remindAt: priyaTime,
      status: "pending" as const,
      createdAt: new Date(today.getTime() - 2 * 60 * 60 * 1000),
      platform: "whatsapp" as const,
    },
    {
      id: "p2",
      contactId: "c2",
      contactName: "Rohan",
      note: "birthday dinner plans",
      remindAt: rohanTime,
      status: "pending" as const,
      createdAt: new Date(today.getTime() - 26 * 60 * 60 * 1000),
      platform: "instagram" as const,
    },
    {
      id: "p3",
      contactId: "c3",
      contactName: "Mum",
      note: "checking in",
      remindAt: mumTime,
      status: "pending" as const,
      createdAt: new Date(today.getTime() - 4 * 24 * 60 * 60 * 1000),
      platform: "imessage" as const,
    },
  ];

  for (const p of pending) {
    try {
      await db.pendingReplies.add(p);
    } catch (e) {
      console.warn("Pending reply already exists", p.id, e);
    }
  }

  // Add done replies
  const doneToday = new Date(today);
  doneToday.setHours(14, 14, 0, 0);

  const doneYesterday = new Date(today);
  doneYesterday.setDate(doneYesterday.getDate() - 1);
  doneYesterday.setHours(20, 30, 0, 0);

  const doneMon = new Date(today);
  const day = doneMon.getDay();
  // Find last Monday
  const diff = doneMon.getDate() - day + (day === 0 ? -6 : 1) - 7;
  doneMon.setDate(diff);
  doneMon.setHours(11, 2, 0, 0);

  const done = [
    {
      id: "d1",
      contactId: "c4",
      contactName: "Aisha",
      note: "her new apartment",
      remindAt: new Date(doneToday.getTime() - 4 * 60 * 60 * 1000),
      status: "done" as const,
      createdAt: new Date(doneToday.getTime() - 24 * 60 * 60 * 1000),
      doneAt: doneToday,
      platform: "whatsapp" as const,
    },
    {
      id: "d2",
      contactId: "c5",
      contactName: "Dad",
      note: "checking in",
      remindAt: new Date(doneYesterday.getTime() - 5 * 60 * 60 * 1000),
      status: "done" as const,
      createdAt: new Date(doneYesterday.getTime() - 48 * 60 * 60 * 1000),
      doneAt: doneYesterday,
      platform: "imessage" as const,
    },
    {
      id: "d3",
      contactId: "c6",
      contactName: "Nisha",
      note: "their birthday",
      remindAt: new Date(doneMon.getTime() - 2 * 60 * 60 * 1000),
      status: "done" as const,
      createdAt: new Date(doneMon.getTime() - 72 * 60 * 60 * 1000),
      doneAt: doneMon,
      platform: "instagram" as const,
    },
  ];

  for (const d of done) {
    try {
      await db.pendingReplies.add(d);
    } catch (e) {
      console.warn("Done reply already exists", d.id, e);
    }
  }

  // Seed usage patterns
  for (let i = 0; i < 6; i++) {
    try {
      await db.usagePatterns.add({
        hour: 21,
        timestamp: new Date(today.getTime() - i * 24 * 60 * 60 * 1000),
      });
    } catch (e) {
      console.warn("Usage pattern already exists", e);
    }
  }
}
