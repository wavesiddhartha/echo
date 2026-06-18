import AsyncStorage from "@react-native-async-storage/async-storage";
import { Linking } from "react-native";

export interface Contact {
  id: string;
  name: string;
  platform: string;
  createdAt: string; // ISO string
  handle?: string;   // optional username/phone/email
}

export interface PendingReply {
  id: string;
  contactId: string;
  contactName: string;
  note: string;
  remindAt: string; // ISO string
  status: "pending" | "done" | "snoozed";
  createdAt: string; // ISO string
  doneAt?: string; // ISO string
  platform: string;
  handle?: string;   // optional username/phone/email
}

const KEYS = {
  REPLIES: "echo-replies-v1",
  CONTACTS: "echo-contacts-v1",
};

// Seed demo data if database is empty
export async function seedDemoData() {
  try {
    const existingReplies = await AsyncStorage.getItem(KEYS.REPLIES);
    const existingContacts = await AsyncStorage.getItem(KEYS.CONTACTS);

    if (!existingReplies && !existingContacts) {
      console.log("[DB] Seeding initial demo data...");

      const demoContacts: Contact[] = [
        { id: "c1", name: "Simran", platform: "whatsapp", createdAt: new Date().toISOString() },
        { id: "c2", name: "Rohan", platform: "instagram", createdAt: new Date().toISOString() },
        { id: "c3", name: "Mum", platform: "imessage", createdAt: new Date().toISOString() },
        { id: "c4", name: "Dave", platform: "whatsapp", createdAt: new Date().toISOString() },
        { id: "c5", name: "Simran", platform: "other", createdAt: new Date().toISOString() },
      ];

      const now = new Date();
      
      const in2h = new Date(now.getTime() + 2 * 60 * 60 * 1000).toISOString();
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
      const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString();

      const demoReplies: PendingReply[] = [
        {
          id: "r1",
          contactId: "c1",
          contactName: "Simran",
          note: "her job interview result",
          platform: "whatsapp",
          remindAt: in2h,
          status: "pending",
          createdAt: now.toISOString(),
        },
        {
          id: "r2",
          contactId: "c2",
          contactName: "Rohan",
          note: "birthday dinner plans",
          platform: "instagram",
          remindAt: yesterday,
          status: "pending",
          createdAt: yesterday,
        },
        {
          id: "r3",
          contactId: "c3",
          contactName: "Mum",
          note: "checking in",
          platform: "imessage",
          remindAt: threeDaysAgo,
          status: "pending",
          createdAt: threeDaysAgo,
        },
      ];

      await AsyncStorage.setItem(KEYS.CONTACTS, JSON.stringify(demoContacts));
      await AsyncStorage.setItem(KEYS.REPLIES, JSON.stringify(demoReplies));
      console.log("[DB] Seed complete!");
    }
  } catch (e) {
    console.error("[DB] Failed to seed data", e);
  }
}

// ─── Replies API ──────────────────────────────────────────────────────────

export async function getReplies(): Promise<PendingReply[]> {
  try {
    const raw = await AsyncStorage.getItem(KEYS.REPLIES);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error("Failed to load replies", e);
    return [];
  }
}

export async function saveReplies(replies: PendingReply[]): Promise<void> {
  try {
    await AsyncStorage.setItem(KEYS.REPLIES, JSON.stringify(replies));
  } catch (e) {
    console.error("Failed to save replies", e);
  }
}

export async function addReply(reply: PendingReply): Promise<void> {
  const replies = await getReplies();
  replies.push(reply);
  await saveReplies(replies);
}

export async function getReplyById(id: string): Promise<PendingReply | null> {
  const replies = await getReplies();
  return replies.find((r) => r.id === id) || null;
}

export async function markDone(id: string): Promise<void> {
  const replies = await getReplies();
  const index = replies.findIndex((r) => r.id === id);
  if (index !== -1) {
    replies[index].status = "done";
    replies[index].doneAt = new Date().toISOString();
    await saveReplies(replies);
  }
}

export async function deleteReply(id: string): Promise<void> {
  const replies = await getReplies();
  const filtered = replies.filter((r) => r.id !== id);
  await saveReplies(filtered);
}

export async function snoozeReply(id: string, until: Date): Promise<void> {
  const replies = await getReplies();
  const index = replies.findIndex((r) => r.id === id);
  if (index !== -1) {
    replies[index].status = "snoozed";
    replies[index].remindAt = until.toISOString();
    await saveReplies(replies);
  }
}

// ─── Contacts API ─────────────────────────────────────────────────────────

export async function getContacts(): Promise<Contact[]> {
  try {
    const raw = await AsyncStorage.getItem(KEYS.CONTACTS);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error("Failed to load contacts", e);
    return [];
  }
}

export async function saveContacts(contacts: Contact[]): Promise<void> {
  try {
    await AsyncStorage.setItem(KEYS.CONTACTS, JSON.stringify(contacts));
  } catch (e) {
    console.error("Failed to save contacts", e);
  }
}

export async function addContact(contact: Contact): Promise<void> {
  const contacts = await getContacts();
  const existingIndex = contacts.findIndex((c) => c.name.toLowerCase() === contact.name.toLowerCase());
  if (existingIndex !== -1) {
    contacts[existingIndex].platform = contact.platform;
    if (contact.handle) contacts[existingIndex].handle = contact.handle;
    contacts[existingIndex].createdAt = new Date().toISOString(); // bump timestamp
  } else {
    contacts.push(contact);
  }
  await saveContacts(contacts);
}

// ─── Stats API ────────────────────────────────────────────────────────────

export async function getWeeklyStreak(): Promise<number> {
  try {
    const replies = await getReplies();
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    // Count how many replies were completed in the last 7 days
    const completedCount = replies.filter(
      (r) => r.status === "done" && r.doneAt && new Date(r.doneAt) >= oneWeekAgo
    ).length;
    
    return completedCount;
  } catch (e) {
    console.error("Failed to calculate weekly streak", e);
    return 0;
  }
}

export async function clearAllData(): Promise<void> {
  try {
    await AsyncStorage.removeItem(KEYS.REPLIES);
    await AsyncStorage.removeItem(KEYS.CONTACTS);
    await AsyncStorage.removeItem("echo-onboarded");
  } catch (e) {
    console.error("Failed to clear database data", e);
  }
}

export const openChatForReply = async (platform: string, handle?: string) => {
  const normalized = platform.trim().toLowerCase();
  
  const tryOpenURL = async (appUrl: string, webUrl?: string) => {
    try {
      await Linking.openURL(appUrl);
    } catch (e) {
      if (webUrl) {
        try {
          await Linking.openURL(webUrl);
        } catch (err) {
          console.error("[Link] Failed to open web fallback URL", err);
        }
      } else {
        console.error("[Link] Failed to open URL (no fallback)", e);
      }
    }
  };

  if (!handle) {
    switch (normalized) {
      case "whatsapp":
        await tryOpenURL("whatsapp://", "https://whatsapp.com");
        break;
      case "telegram":
        await tryOpenURL("tg://", "https://t.me");
        break;
      case "imessage":
      case "sms":
        await tryOpenURL("sms://");
        break;
      case "instagram":
        await tryOpenURL("instagram://", "https://instagram.com");
        break;
      case "x":
      case "twitter":
        await tryOpenURL("twitter://", "https://x.com");
        break;
      case "signal":
        await tryOpenURL("signal://", "https://signal.org");
        break;
      case "gmail":
      case "email":
        await tryOpenURL("mailto:");
        break;
      default:
        break;
    }
    return;
  }

  switch (normalized) {
    case "whatsapp":
      const cleanPhone = handle.replace(/[^0-9]/g, "");
      await tryOpenURL(`whatsapp://send?phone=${cleanPhone}`, `https://wa.me/${cleanPhone}`);
      break;
    case "telegram":
      const cleanUsername = handle.replace("@", "");
      await tryOpenURL(`tg://resolve?domain=${cleanUsername}`, `https://t.me/${cleanUsername}`);
      break;
    case "imessage":
    case "sms":
      await tryOpenURL(`sms:${handle}`);
      break;
    case "instagram":
      const cleanIG = handle.replace("@", "");
      await tryOpenURL(`instagram://user?username=${cleanIG}`, `https://instagram.com/${cleanIG}`);
      break;
    case "x":
    case "twitter":
      const cleanX = handle.replace("@", "");
      await tryOpenURL(`twitter://user?screen_name=${cleanX}`, `https://x.com/${cleanX}`);
      break;
    case "signal":
      const cleanSignal = handle.replace(/[^0-9]/g, "");
      await tryOpenURL(`https://signal.me/#p/${cleanSignal}`);
      break;
    case "gmail":
    case "email":
      await tryOpenURL(`mailto:${handle}`);
      break;
    default:
      break;
  }
};
