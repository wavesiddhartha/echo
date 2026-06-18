import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Share,
  Platform as RNPlatform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Notifications from "expo-notifications";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useTheme } from "@/lib/theme";
import { useStore } from "@/store/useStore";
import {
  requestNotificationPermission,
  scheduleWeeklySummaryNotification,
  scheduleNotification,
} from "@/lib/notifications";
import { getReplies, getContacts, clearAllData } from "@/lib/db";

const SOUNDS = [
  { id: "default", label: "Default System" },
  { id: "chime", label: "Chime (Double Monospace)" },
  { id: "wave", label: "Wave (Rising Chirp)" },
  { id: "tap", label: "Tap (Rapid Clicks)" },
];

export default function SettingsScreen() {
  const { colors, fonts, spacing, radius } = useTheme();
  const storeTheme = useStore((s) => s.theme);
  const setTheme = useStore((s) => s.setTheme);
  const addToast = useStore((s) => s.addToast);

  const [hasPushPermission, setHasPushPermission] = useState(false);
  const [weeklySummaryEnabled, setWeeklySummaryEnabled] = useState(false);
  const [selectedSound, setSelectedSound] = useState("default");

  useEffect(() => {
    const loadSoundPreference = async () => {
      const stored = await AsyncStorage.getItem("echo-notification-sound");
      if (stored) setSelectedSound(stored);
    };
    loadSoundPreference();
  }, []);

  const handleSoundChange = async (soundId: string) => {
    setSelectedSound(soundId);
    await AsyncStorage.setItem("echo-notification-sound", soundId);
    addToast({ message: `Sound set to ${soundId} ✓` });
  };

  const handleTestSound = async () => {
    if (RNPlatform.OS === "web") {
      addToast({ message: "Test sounds only on iOS/Android" });
      return;
    }

    addToast({ message: "Test alert incoming in 2 seconds..." });

    const dummyReply = {
      id: "test-sound-" + Math.random().toString(36).slice(2, 6),
      contactId: "test",
      contactName: "Sound Test",
      note: `testing sound [${selectedSound}]`,
      platform: "other",
      remindAt: new Date(Date.now() + 2000).toISOString(),
      status: "pending" as const,
      createdAt: new Date().toISOString(),
    };
    await scheduleNotification(dummyReply);
  };

  useEffect(() => {
    // Check initial push notification permissions
    const checkPermissions = async () => {
      if (RNPlatform.OS === "web") return;
      const { status } = await Notifications.getPermissionsAsync();
      setHasPushPermission(status === "granted");
    };

    // Check weekly summary state from storage
    const checkWeeklySummary = async () => {
      const stored = await AsyncStorage.getItem("echo-weekly-summary-enabled");
      setWeeklySummaryEnabled(stored === "true");
    };

    checkPermissions();
    checkWeeklySummary();
  }, []);

  const handlePushToggle = async () => {
    if (RNPlatform.OS === "web") {
      addToast({ message: "Notifications not supported on web" });
      return;
    }

    if (hasPushPermission) {
      // Direct user to system settings if they want to turn off permissions
      Alert.alert(
        "Notification Settings",
        "To disable notifications, please turn them off in your device's System Settings.",
        [{ text: "OK" }]
      );
    } else {
      const granted = await requestNotificationPermission();
      setHasPushPermission(granted);
      if (granted) {
        addToast({ message: "Notifications enabled ✓" });
      } else {
        addToast({ message: "Notification permissions denied" });
      }
    }
  };

  const handleWeeklySummaryToggle = async (value: boolean) => {
    if (RNPlatform.OS === "web") return;

    setWeeklySummaryEnabled(value);
    await AsyncStorage.setItem("echo-weekly-summary-enabled", value ? "true" : "false");

    if (value) {
      const scheduledId = await scheduleWeeklySummaryNotification();
      if (scheduledId) {
        addToast({ message: "Weekly summary scheduled for Sunday 10 AM ⏱" });
      } else {
        // Fallback if permission not granted
        setWeeklySummaryEnabled(false);
        await AsyncStorage.setItem("echo-weekly-summary-enabled", "false");
        addToast({ message: "Please enable push notifications first" });
      }
    } else {
      // Cancel weekly summary
      const scheduled = await Notifications.getAllScheduledNotificationsAsync();
      const weeklySummaries = scheduled.filter(
        (n) => n.content.data && n.content.data.type === "weekly-summary"
      );
      for (const ws of weeklySummaries) {
        await Notifications.cancelScheduledNotificationAsync(ws.identifier);
      }
      addToast({ message: "Weekly summary disabled" });
    }
  };

  const handleExportData = async () => {
    try {
      const replies = await getReplies();
      const contacts = await getContacts();
      const dbExport = {
        app: "echo",
        exportedAt: new Date().toISOString(),
        replies,
        contacts,
      };

      const jsonStr = JSON.stringify(dbExport, null, 2);
      await Share.share({
        title: "Echo Database Export",
        message: jsonStr,
      });
    } catch (e) {
      console.error("Failed to export data", e);
      addToast({ message: "Export failed" });
    }
  };

  const handleDeleteAll = () => {
    Alert.alert(
      "Delete everything?",
      "This will wipe all your reminders, contacts, and onboarding status. This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete Everything",
          style: "destructive",
          onPress: async () => {
            // Cancel all notifications
            await Notifications.cancelAllScheduledNotificationsAsync();
            await clearAllData();
            addToast({ message: "All data cleared. Restarting..." });
            // Alert user to restart or force redirect
            setTimeout(() => {
              RNPlatform.select({
                ios: () => Alert.alert("App Reset", "Please force-close and restart the app to complete the reset."),
                android: () => Alert.alert("App Reset", "Please restart the app."),
                default: () => {},
              })();
            }, 500);
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]} edges={["top", "left", "right"]}>
      {/* Header bar */}
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: colors.textPrimary, fontFamily: fonts.serif }]}>
          echo
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={[styles.title, { color: colors.textPrimary, fontFamily: fonts.serif }]}>
          settings
        </Text>

        {/* Theme Preferences */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.textMuted, fontFamily: fonts.mono }]}>
            appearance
          </Text>
          <View style={[styles.optionsGroup, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.md }]}>
            {(["light", "dark", "auto"] as const).map((mode, index) => {
              const active = storeTheme === mode;
              return (
                <TouchableOpacity
                  key={mode}
                  onPress={() => {
                    setTheme(mode);
                    addToast({ message: `Theme set to ${mode}` });
                  }}
                  activeOpacity={0.7}
                  style={[
                    styles.optionItem,
                    {
                      borderBottomWidth: index < 2 ? 1 : 0,
                      borderBottomColor: colors.border,
                    },
                  ]}
                >
                  <Text style={[styles.optionText, { color: colors.textPrimary, fontFamily: fonts.sans, textTransform: "capitalize" }]}>
                    {mode}
                  </Text>
                  {active && <Text style={[styles.checkmark, { color: colors.pending }]}>✓</Text>}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Notifications preferences */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.textMuted, fontFamily: fonts.mono }]}>
            notifications
          </Text>
          <View style={[styles.optionsGroup, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.md }]}>
            <View style={[styles.toggleItem, { borderBottomWidth: 1, borderBottomColor: colors.border }]}>
              <View style={{ flex: 1, paddingRight: 12 }}>
                <Text style={[styles.optionText, { color: colors.textPrimary, fontFamily: fonts.sans }]}>
                  Push Notifications
                </Text>
                <Text style={[styles.optionSubtext, { color: colors.textMuted, fontFamily: fonts.sans }]}>
                  Receive alerts when reminders trigger
                </Text>
              </View>
              <Switch
                value={hasPushPermission}
                onValueChange={handlePushToggle}
                trackColor={{ false: colors.border, true: colors.pending }}
                thumbColor={RNPlatform.OS === "ios" ? "#FFFFFF" : hasPushPermission ? colors.accentText : "#F4F3F0"}
              />
            </View>

            <View style={styles.toggleItem}>
              <View style={{ flex: 1, paddingRight: 12 }}>
                <Text style={[styles.optionText, { color: colors.textPrimary, fontFamily: fonts.sans }]}>
                  Weekly Summary
                </Text>
                <Text style={[styles.optionSubtext, { color: colors.textMuted, fontFamily: fonts.sans }]}>
                  Get a recap notification every Sunday at 10 AM
                </Text>
              </View>
              <Switch
                value={weeklySummaryEnabled}
                onValueChange={handleWeeklySummaryToggle}
                disabled={!hasPushPermission}
                trackColor={{ false: colors.border, true: colors.pending }}
                thumbColor={RNPlatform.OS === "ios" ? "#FFFFFF" : weeklySummaryEnabled ? colors.accentText : "#F4F3F0"}
              />
            </View>
          </View>
        </View>

        {/* Custom Sounds */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.textMuted, fontFamily: fonts.mono }]}>
            notification sound
          </Text>
          <View style={[styles.optionsGroup, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.md }]}>
            {SOUNDS.map((sound, index) => {
              const active = selectedSound === sound.id;
              return (
                <TouchableOpacity
                  key={sound.id}
                  onPress={() => handleSoundChange(sound.id)}
                  activeOpacity={0.7}
                  style={[
                    styles.optionItem,
                    {
                      borderBottomWidth: index < SOUNDS.length - 1 ? 1 : 0,
                      borderBottomColor: colors.border,
                    },
                  ]}
                >
                  <Text style={[styles.optionText, { color: colors.textPrimary, fontFamily: fonts.sans }]}>
                    {sound.label}
                  </Text>
                  {active && <Text style={[styles.checkmark, { color: colors.pending }]}>✓</Text>}
                </TouchableOpacity>
              );
            })}

            <TouchableOpacity
              onPress={handleTestSound}
              activeOpacity={0.7}
              style={[
                styles.optionItem,
                {
                  borderTopWidth: 1,
                  borderTopColor: colors.border,
                  backgroundColor: "rgba(200, 169, 110, 0.05)",
                  justifyContent: "center",
                },
              ]}
            >
              <Text style={[styles.optionText, { color: colors.pending, fontFamily: fonts.mono, textAlign: "center" }]}>
                [test sound now]
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Data Options */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.textMuted, fontFamily: fonts.mono }]}>
            database & data
          </Text>
          <View style={[styles.optionsGroup, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.md }]}>
            <TouchableOpacity
              onPress={handleExportData}
              activeOpacity={0.7}
              style={[styles.optionItem, { borderBottomWidth: 1, borderBottomColor: colors.border }]}
            >
              <View>
                <Text style={[styles.optionText, { color: colors.textPrimary, fontFamily: fonts.sans }]}>
                  Export JSON Database
                </Text>
                <Text style={[styles.optionSubtext, { color: colors.textMuted, fontFamily: fonts.sans }]}>
                  Share a text backup of your contacts and replies
                </Text>
              </View>
              <Text style={{ color: colors.textMuted, fontSize: 16 }}>↗</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleDeleteAll}
              activeOpacity={0.7}
              style={styles.optionItem}
            >
              <View>
                <Text style={[styles.optionText, { color: colors.danger, fontFamily: fonts.sans }]}>
                  Delete Everything
                </Text>
                <Text style={[styles.optionSubtext, { color: colors.textMuted, fontFamily: fonts.sans }]}>
                  Clear all local reminders, contacts, and configs
                </Text>
              </View>
              <Text style={{ color: colors.danger, fontSize: 16 }}>✕</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
  },
  headerTitle: {
    fontSize: 24,
    fontStyle: "italic",
    fontWeight: "normal",
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 140, // extra space for bottom tab bar
  },
  title: {
    fontSize: 22,
    fontStyle: "italic",
    marginBottom: 20,
    fontWeight: "300",
  },
  section: {
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: 10,
    letterSpacing: 0.8,
    marginBottom: 8,
    textTransform: "uppercase",
  },
  optionsGroup: {
    borderWidth: 1,
    overflow: "hidden",
  },
  optionItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  toggleItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  optionText: {
    fontSize: 15,
    fontWeight: "500",
  },
  optionSubtext: {
    fontSize: 11,
    marginTop: 2,
  },
  checkmark: {
    fontSize: 16,
    fontWeight: "bold",
  },
});
