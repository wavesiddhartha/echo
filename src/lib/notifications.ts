import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { type PendingReply } from "./db";

// Handle foreground notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function requestNotificationPermission(): Promise<boolean> {
  if (Platform.OS === "web") return false;
  
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  
  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  
  return finalStatus === "granted";
}

export async function scheduleNotification(reply: PendingReply): Promise<string | null> {
  if (Platform.OS === "web") return null;

  const hasPermission = await requestNotificationPermission();
  if (!hasPermission) return null;

  const triggerDate = new Date(reply.remindAt);
  if (triggerDate <= new Date()) {
    // If the time has already passed, don't schedule
    return null;
  }

  try {
    const soundPref = (await AsyncStorage.getItem("echo-notification-sound")) || "default";

    let channelId = "echo-default";
    let iosSound: string | boolean = true;

    if (soundPref !== "default") {
      channelId = `echo-${soundPref}`;
      iosSound = `${soundPref}.wav`;

      if (Platform.OS === "android") {
        await Notifications.setNotificationChannelAsync(channelId, {
          name: `Echo (${soundPref})`,
          importance: Notifications.AndroidImportance.HIGH,
          sound: soundPref,
          enableVibrate: true,
          showBadge: true,
        });
      }
    } else {
      if (Platform.OS === "android") {
        await Notifications.setNotificationChannelAsync("echo-default", {
          name: "Echo (Default)",
          importance: Notifications.AndroidImportance.HIGH,
          enableVibrate: true,
          showBadge: true,
        });
      }
    }

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: "echo",
        body: `Reply to ${reply.contactName} — ${reply.note || "checking in"}`,
        data: { replyId: reply.id },
        sound: iosSound,
        categoryIdentifier: "REPLY_REMINDER",
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: triggerDate,
        channelId: channelId,
      } as any,
    });
    
    return notificationId;
  } catch (e) {
    console.error("Failed to schedule native notification", e);
    return null;
  }
}

export async function cancelNotification(replyId: string): Promise<void> {
  if (Platform.OS === "web") return;

  try {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    const target = scheduled.find(
      (n) => n.content.data && n.content.data.replyId === replyId
    );

    if (target) {
      await Notifications.cancelScheduledNotificationAsync(target.identifier);
      console.log(`[Notification] Cancelled scheduled reminder for ${replyId}`);
    }
  } catch (e) {
    console.error("Failed to cancel native notification", e);
  }
}

export async function scheduleWeeklySummaryNotification(): Promise<string | null> {
  if (Platform.OS === "web") return null;

  try {
    const hasPermission = await requestNotificationPermission();
    if (!hasPermission) return null;

    // Cancel existing weekly summaries to prevent duplicates
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    const weeklySummaries = scheduled.filter(
      (n) => n.content.data && n.content.data.type === "weekly-summary"
    );
    for (const ws of weeklySummaries) {
      await Notifications.cancelScheduledNotificationAsync(ws.identifier);
    }

    // Schedule for next Sunday at 10:00 AM
    const now = new Date();
    const nextSunday = new Date();
    nextSunday.setDate(now.getDate() + ((7 - now.getDay()) % 7 || 7));
    nextSunday.setHours(10, 0, 0, 0);

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: "echo",
        body: "Your weekly recap is ready. See how many people you showed up for this week. 🤍",
        data: { type: "weekly-summary" },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: nextSunday,
      },
    });

    console.log(`[Notification] Scheduled weekly summary for next Sunday at ${nextSunday.toLocaleTimeString()}`);
    return notificationId;
  } catch (e) {
    console.error("Failed to schedule weekly summary notification", e);
    return null;
  }
}
