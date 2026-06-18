import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Vibration,
  Modal,
  TextInput,
  Keyboard,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useRouter } from "expo-router";
import { getReplies, markDone, deleteReply, addReply, addContact, snoozeReply, getWeeklyStreak, type PendingReply, openChatForReply } from "@/lib/db";
import { useTheme } from "@/lib/theme";
import { useStore } from "@/store/useStore";
import { ReplyCard } from "@/components/ReplyCard";
import { EmptyState } from "@/components/EmptyState";
import { SnoozeSheet } from "@/components/SnoozeSheet";
import { cancelNotification, scheduleNotification } from "@/lib/notifications";
import { PlatformIcon } from "@/components/PlatformIcon";
import { Image } from "expo-image";
import Svg, { Circle, Polyline, Path } from "react-native-svg";

interface ParsedResult {
  name?: string;
  platform?: string;
  customAppName?: string;
  note?: string;
  remindChoice?: "2h" | "tonight" | "tomorrow" | "custom";
  customDate?: Date;
}

function parseNlpString(text: string): ParsedResult {
  const result: ParsedResult = {};

  const nameMatch = text.match(/reply\s+to\s+([A-Za-z0-9\s]+?)(?:\s+(?:on|about|tomorrow|tonight|in|at|by)\b|$)/i);
  if (nameMatch) {
    result.name = nameMatch[1].trim();
  }

  const platformMatch = text.match(/\bon\s+([A-Za-z0-9_-]+)\b/i);
  if (platformMatch) {
    const plat = platformMatch[1].toLowerCase();
    const stdPlatforms = ["whatsapp", "instagram", "imessage", "telegram", "x"];
    if (stdPlatforms.includes(plat)) {
      result.platform = plat;
    } else {
      result.platform = "other";
      result.customAppName = platformMatch[1];
    }
  }

  const noteMatch = text.match(/\babout\s+([A-Za-z0-9\s_-]+?)(?:\s+(?:on|tomorrow|tonight|in|at|by|reply\s+to)\b|$)/i);
  if (noteMatch) {
    result.note = noteMatch[1].trim();
  }

  if (/\btonight\b/i.test(text)) {
    result.remindChoice = "tonight";
  } else if (/\btomorrow\b/i.test(text)) {
    result.remindChoice = "tomorrow";
  } else {
    const durationMatch = text.match(/\bin\s+(\d+)\s*(hour|hr|min|day)s?\b/i);
    if (durationMatch) {
      const num = parseInt(durationMatch[1], 10);
      const unit = durationMatch[2].toLowerCase();
      const d = new Date();
      if (unit.startsWith("hour") || unit.startsWith("hr")) {
        d.setHours(d.getHours() + num);
      } else if (unit.startsWith("min")) {
        d.setMinutes(d.getMinutes() + num);
      } else if (unit.startsWith("day")) {
        d.setDate(d.getDate() + num);
      }
      d.setSeconds(0, 0);
      result.remindChoice = "custom";
      result.customDate = d;
    }
  }

  return result;
}

export default function HomeScreen() {
  const { colors, fonts, spacing, radius } = useTheme();
  const router = useRouter();

  const [replies, setReplies] = useState<PendingReply[]>([]);
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const [isQuickAddVisible, setIsQuickAddVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [quickAddText, setQuickAddText] = useState("");
  const [weeklyStreak, setWeeklyStreak] = useState(0);
  const [showBanner, setShowBanner] = useState(true);
  const [snoozeTarget, setSnoozeTarget] = useState<string | null>(null);
  const [longPressTarget, setLongPressTarget] = useState<PendingReply | null>(null);

  const addToast = useStore((s) => s.addToast);

  const COMMANDS = [
    { cmd: "/overdue", desc: "Filter overdue reminders" },
    { cmd: "/whatsapp", desc: "Filter WhatsApp only" },
    { cmd: "/telegram", desc: "Filter Telegram only" },
    { cmd: "/imessage", desc: "Filter iMessage only" },
    { cmd: "/instagram", desc: "Filter Instagram only" },
    { cmd: "/x", desc: "Filter X only" },
    { cmd: "/done", desc: "Go to completed recap" },
    { cmd: "/settings", desc: "Go to settings page" },
  ];

  const matchingCommands = searchQuery.startsWith("/")
    ? COMMANDS.filter((c) => c.cmd.startsWith(searchQuery.toLowerCase()) && c.cmd !== searchQuery.toLowerCase())
    : [];

  const handleExecuteCommand = (cmd: string) => {
    if (cmd === "/done") {
      setSearchQuery("");
      router.replace("/done");
    } else if (cmd === "/settings") {
      setSearchQuery("");
      router.replace("/settings");
    } else {
      setSearchQuery(cmd);
    }
  };

  const handleQuickAddSubmit = async () => {
    if (!quickAddText.trim()) return;

    const parsed = parseNlpString(quickAddText);
    const resolvedName = parsed.name || "Someone";
    const resolvedPlatform = parsed.platform || "whatsapp";
    const resolvedNote = parsed.note || "checking in";
    
    let remindAt = new Date();
    if (parsed.remindChoice === "tonight") {
      remindAt.setHours(21, 0, 0, 0);
      if (remindAt <= new Date()) remindAt.setDate(remindAt.getDate() + 1);
    } else if (parsed.remindChoice === "tomorrow") {
      remindAt.setDate(remindAt.getDate() + 1);
      remindAt.setHours(9, 0, 0, 0);
    } else if (parsed.remindChoice === "custom" && parsed.customDate) {
      remindAt = parsed.customDate;
    } else {
      remindAt.setHours(remindAt.getHours() + 2);
    }

    const contactId = Math.random().toString(36).slice(2);
    
    await addContact({
      id: contactId,
      name: resolvedName,
      platform: resolvedPlatform,
      createdAt: new Date().toISOString(),
    });

    const reply: PendingReply = {
      id: Math.random().toString(36).slice(2),
      contactId,
      contactName: resolvedName,
      note: resolvedNote,
      platform: resolvedPlatform,
      remindAt: remindAt.toISOString(),
      status: "pending",
      createdAt: new Date().toISOString(),
    };

    await addReply(reply);
    await scheduleNotification(reply);

    const list = await getReplies();
    const pendingList = list.filter((r) => r.status === "pending" || r.status === "snoozed");
    const now = new Date();
    const activePending = pendingList.filter((r) => {
      if (r.status === "snoozed") {
        return new Date(r.remindAt) <= now;
      }
      return true;
    });
    activePending.sort((a, b) => new Date(a.remindAt).getTime() - new Date(b.remindAt).getTime());
    setReplies(activePending);

    addToast({ message: `Reminder set for ${resolvedName} ✓` });
    setQuickAddText("");
    setIsQuickAddVisible(false);
    Keyboard.dismiss();
  };

  const filteredReplies = searchQuery.trim()
    ? replies.filter((r) => {
        const query = searchQuery.toLowerCase().trim();
        
        if (query === "/overdue") {
          const now = new Date();
          const remindDate = new Date(r.remindAt);
          return now.getTime() > remindDate.getTime();
        }
        if (query.startsWith("/")) {
          const platformCmd = query.replace("/", "");
          return r.platform.toLowerCase() === platformCmd;
        }

        return (
          r.contactName.toLowerCase().includes(query) ||
          (r.note || "").toLowerCase().includes(query) ||
          r.platform.toLowerCase().includes(query) ||
          (r.handle || "").toLowerCase().includes(query)
        );
      })
    : replies;

  // Reload data whenever this tab gains focus
  useFocusEffect(
    useCallback(() => {
      let isMounted = true;

      const loadData = async () => {
        const list = await getReplies();
        const pendingList = list.filter((r) => r.status === "pending" || r.status === "snoozed");
        
        // Filter out snoozed ones that haven't hit their trigger date yet
        const now = new Date();
        const activePending = pendingList.filter((r) => {
          if (r.status === "snoozed") {
            return new Date(r.remindAt) <= now;
          }
          return true;
        });

        // Sort by remindAt ascending
        activePending.sort((a, b) => new Date(a.remindAt).getTime() - new Date(b.remindAt).getTime());

        if (isMounted) {
          setReplies(activePending);
          const streak = await getWeeklyStreak();
          setWeeklyStreak(streak);
        }
      };

      loadData();

      return () => {
        isMounted = false;
      };
    }, [])
  );

  const handleDone = useCallback(
    async (id: string) => {
      const reply = replies.find((r) => r.id === id);
      if (!reply) return;
      await markDone(id);
      await cancelNotification(id);
      Vibration.vibrate([10, 5, 20]);
      addToast({ message: `✓ Replied to ${reply.contactName}` });
      setReplies((prev) => prev.filter((r) => r.id !== id));
    },
    [replies, addToast]
  );

  const handleDelete = useCallback(
    async (id: string) => {
      const reply = replies.find((r) => r.id === id);
      if (!reply) return;

      const saved = { ...reply };
      await deleteReply(id);
      await cancelNotification(id);
      setReplies((prev) => prev.filter((r) => r.id !== id));

      addToast({
        message: `Removed ${reply.contactName}`,
        action: {
          label: "Undo",
          fn: async () => {
            await addReply(saved);
            const list = await getReplies();
            const pendingList = list.filter((r) => r.status === "pending" || r.status === "snoozed");
            setReplies(pendingList);
          },
        },
      });
    },
    [replies, addToast]
  );

  const handleSnooze = useCallback((id: string) => {
    setSnoozeTarget(id);
  }, []);

  const handleSnoozeConfirm = useCallback(
    async (id: string, until: Date) => {
      await snoozeReply(id, until);
      const reply = replies.find((r) => r.id === id);
      addToast({ message: `Snoozed ${reply?.contactName ?? "reminder"}` });
      setReplies((prev) => prev.filter((r) => r.id !== id));
      setSnoozeTarget(null);
    },
    [replies, addToast]
  );

  const handleLongPress = useCallback((reply: PendingReply) => {
    Vibration.vibrate(40);
    setLongPressTarget(reply);
  }, []);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]} edges={["top", "left", "right"]}>
      {/* Header bar matching Screenshot 1 */}
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: colors.textPrimary, fontFamily: fonts.serif }]}>
          echo
        </Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            onPress={() => {
              setIsSearchVisible(!isSearchVisible);
              setIsQuickAddVisible(false);
            }}
            activeOpacity={0.7}
            style={[
              styles.headerIcon,
              isSearchVisible && { backgroundColor: colors.border, borderRadius: radius.sm },
            ]}
          >
            <Svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={colors.textPrimary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <Circle cx="11" cy="11" r="8" />
              <Path d="m21 21-4.3-4.3" />
            </Svg>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => {
              setIsQuickAddVisible(!isQuickAddVisible);
              setIsSearchVisible(false);
            }}
            activeOpacity={0.7}
            style={[
              styles.headerIcon,
              isQuickAddVisible && { backgroundColor: colors.border, borderRadius: radius.sm },
            ]}
          >
            <Svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={colors.textPrimary} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <Path d="M12 5v14M5 12h14" />
            </Svg>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Monospace Search Input & Clear Button */}
        {isSearchVisible && (
          <View style={styles.searchContainer}>
            <TextInput
              style={[
                styles.searchInput,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                  color: colors.textPrimary,
                  fontFamily: fonts.mono,
                  borderRadius: radius.sm,
                  flex: 1,
                },
              ]}
              placeholder="/search reminders..."
              placeholderTextColor={colors.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCapitalize="none"
              autoCorrect={false}
              autoFocus={true}
            />
            {searchQuery !== "" && (
              <TouchableOpacity
                onPress={() => setSearchQuery("")}
                activeOpacity={0.7}
                style={[
                  styles.searchClearButton,
                  {
                    borderColor: colors.border,
                    backgroundColor: colors.surface,
                    borderRadius: radius.sm,
                  },
                ]}
              >
                <Text style={{ color: colors.textPrimary, fontFamily: fonts.mono, fontSize: 11 }}>
                  [clear]
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Command suggestions palette */}
        {isSearchVisible && matchingCommands.length > 0 && (
          <View style={[styles.commandPalette, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.sm }]}>
            <Text style={[styles.commandHeader, { color: colors.textMuted, fontFamily: fonts.mono }]}>
              [command palette]
            </Text>
            {matchingCommands.map((c) => (
              <TouchableOpacity
                key={c.cmd}
                onPress={() => handleExecuteCommand(c.cmd)}
                style={[styles.commandItem, { borderBottomColor: colors.border }]}
                activeOpacity={0.7}
              >
                <Text style={[styles.commandText, { color: colors.pending, fontFamily: fonts.mono }]}>
                  {c.cmd}
                </Text>
                <Text style={[styles.commandDesc, { color: colors.textMuted, fontFamily: fonts.sans }]}>
                  {c.desc}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Home Screen Inline Quick Add NLP */}
        {isQuickAddVisible && (
          <View style={{ marginBottom: 16 }}>
            <View style={styles.quickAddContainer}>
              <TextInput
                style={[
                  styles.quickAddInput,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                    color: colors.textPrimary,
                    fontFamily: fonts.mono,
                    borderRadius: radius.sm,
                    flex: 1,
                  },
                ]}
                placeholder="+ quick add: reply to Mum tomorrow..."
                placeholderTextColor={colors.textMuted}
                value={quickAddText}
                onChangeText={setQuickAddText}
                onSubmitEditing={handleQuickAddSubmit}
                autoCapitalize="none"
                autoCorrect={false}
                autoFocus={true}
              />
              {quickAddText.trim() !== "" && (
                <TouchableOpacity
                  onPress={handleQuickAddSubmit}
                  activeOpacity={0.7}
                  style={[
                    styles.quickAddBtn,
                    {
                      borderColor: colors.border,
                      backgroundColor: colors.surface,
                      borderRadius: radius.sm,
                    },
                  ]}
                >
                  <Text style={{ color: colors.pending, fontFamily: fonts.mono, fontSize: 11 }}>
                    [add]
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Explanatory examples of NLP parser */}
            <View style={[styles.nlpExampleContainer, { borderLeftColor: colors.border }]}>
              <Text style={[styles.nlpExampleTitle, { color: colors.textMuted, fontFamily: fonts.mono }]}>
                [example quick add format — tap to try]
              </Text>
              <TouchableOpacity
                onPress={() => setQuickAddText("reply to Simran tomorrow on instagram about big news")}
                activeOpacity={0.7}
                style={styles.nlpExampleButton}
              >
                <Text style={[styles.nlpExampleText, { color: colors.textPrimary, fontFamily: fonts.sans }]}>
                  • "reply to <Text style={{ fontStyle: "italic", color: colors.pending }}>Simran</Text> <Text style={{ fontWeight: "bold" }}>tomorrow</Text> on <Text style={{ color: colors.pending }}>instagram</Text> about <Text style={{ color: colors.textMuted }}>big news</Text>"
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setQuickAddText("reply to Siddhartha in 2 hours on whatsapp")}
                activeOpacity={0.7}
                style={styles.nlpExampleButton}
              >
                <Text style={[styles.nlpExampleText, { color: colors.textPrimary, fontFamily: fonts.sans }]}>
                  • "reply to <Text style={{ fontStyle: "italic", color: colors.pending }}>Siddhartha</Text> <Text style={{ fontWeight: "bold" }}>in 2 hours</Text> on <Text style={{ color: colors.pending }}>whatsapp</Text>"
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setQuickAddText("reply to Someone tonight on telegram about checking in")}
                activeOpacity={0.7}
                style={styles.nlpExampleButton}
              >
                <Text style={[styles.nlpExampleText, { color: colors.textPrimary, fontFamily: fonts.sans }]}>
                  • "reply to <Text style={{ fontStyle: "italic", color: colors.pending }}>Someone</Text> <Text style={{ fontWeight: "bold" }}>tonight</Text> on <Text style={{ color: colors.pending }}>telegram</Text> about <Text style={{ color: colors.textMuted }}>checking in</Text>"
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Weekly summary banner */}
        {showBanner && weeklyStreak > 0 && (
          <View style={[styles.banner, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.md }]}>
            <TouchableOpacity onPress={() => setShowBanner(false)} style={styles.bannerClose}>
              <Text style={{ color: colors.textMuted, fontSize: 16 }}>×</Text>
            </TouchableOpacity>
            <Text style={[styles.bannerEyebrow, { color: colors.textMuted, fontFamily: fonts.serif }]}>
              this week
            </Text>
            <View style={styles.bannerRow}>
              <Text style={[styles.bannerCount, { color: colors.pending }]}>{weeklyStreak}</Text>
              <TouchableOpacity onPress={() => router.replace("/done?weekly=true")}>
                <Text style={[styles.bannerLink, { color: colors.textPrimary, fontFamily: fonts.sans }]}>
                  people you showed up for <Text style={{ fontSize: 10 }}>↗</Text>
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {replies.length === 0 ? (
          <EmptyState />
        ) : (
          <View>
            {/* Monospace count label */}
            <Text style={[styles.countLabel, { color: colors.textMuted, fontFamily: fonts.mono }]}>
              {filteredReplies.length} PENDING
            </Text>

            {/* List of pending items */}
            {filteredReplies.length === 0 ? (
              <View style={{ paddingVertical: 32, alignItems: "center" }}>
                <Text style={{ color: colors.textMuted, fontFamily: fonts.sans, fontSize: 14 }}>
                  No matching reminders found.
                </Text>
              </View>
            ) : (
              filteredReplies.map((reply) => (
                <ReplyCard
                  key={reply.id}
                  reply={reply}
                  onDone={handleDone}
                  onDelete={handleDelete}
                  onSnooze={handleSnooze}
                  onLongPress={handleLongPress}
                />
              ))
            )}

            {/* Notification Preview block matching Screenshot 1 */}
            <View style={styles.previewContainer}>
              <Text style={[styles.previewLabel, { color: colors.textMuted, fontFamily: fonts.mono }]}>
                notification preview
              </Text>
              <View style={[styles.previewCard, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.md, shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 3 }]}>
                <View style={styles.previewHeader}>
                  <View style={styles.previewHeaderLeft}>
                    <Image
                      source={require("@/assets/images/icon.png")}
                      style={styles.previewLogo}
                      contentFit="cover"
                    />
                    <Text style={[styles.previewTitle, { color: colors.textPrimary, fontFamily: fonts.serif, fontSize: 13, fontStyle: "italic" }]}>
                      echo
                    </Text>
                  </View>
                  <Text style={[styles.previewTime, { color: colors.textMuted, fontFamily: fonts.mono }]}>
                    now
                  </Text>
                </View>
                <Text style={[styles.previewBody, { color: colors.textPrimary, fontFamily: fonts.sans }]}>
                  Reply to {replies[0].contactName} — {replies[0].note || "checking in"}
                </Text>
                <View style={styles.previewActions}>
                  <TouchableOpacity
                    onPress={() => handleDone(replies[0].id)}
                    activeOpacity={0.7}
                    style={[styles.previewButton, { backgroundColor: "rgba(90, 158, 122, 0.08)", borderColor: "rgba(90, 158, 122, 0.2)" }]}
                  >
                    <View style={styles.previewBtnInner}>
                      <Svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={colors.done} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <Polyline points="20 6 9 17 4 12" />
                      </Svg>
                      <Text style={{ color: colors.done, fontSize: 11, fontWeight: "600", fontFamily: fonts.mono }}>replied</Text>
                    </View>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => {
                      const oneHourLater = new Date();
                      oneHourLater.setHours(oneHourLater.getHours() + 1);
                      handleSnoozeConfirm(replies[0].id, oneHourLater);
                    }}
                    activeOpacity={0.7}
                    style={[styles.previewButton, { backgroundColor: "rgba(200, 169, 110, 0.08)", borderColor: "rgba(200, 169, 110, 0.2)" }]}
                  >
                    <View style={styles.previewBtnInner}>
                      <Svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={colors.pending} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <Circle cx="12" cy="12" r="10" />
                        <Polyline points="12 6 12 12 16 14" />
                      </Svg>
                      <Text style={{ color: colors.pending, fontSize: 11, fontWeight: "600", fontFamily: fonts.mono }}>snooze 1h</Text>
                    </View>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* See Done link */}
            <TouchableOpacity onPress={() => router.replace("/done")} style={styles.seeDoneButton}>
              <Text style={[styles.seeDoneText, { color: colors.textMuted, fontFamily: fonts.sans }]}>
                See done →
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Snooze Sheet Overlay */}
      {snoozeTarget !== null && (
        <Modal
          visible={true}
          transparent={true}
          animationType="none"
          onRequestClose={() => setSnoozeTarget(null)}
        >
          <SnoozeSheet
            replyId={snoozeTarget}
            onConfirm={handleSnoozeConfirm}
            onClose={() => setSnoozeTarget(null)}
          />
        </Modal>
      )}

      {/* iOS-Style Long Press Context Menu Overlay */}
      {longPressTarget !== null && (
        <Modal
          visible={true}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setLongPressTarget(null)}
        >
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={() => setLongPressTarget(null)}
          >
            <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
              {/* Replica Card Preview */}
              <View style={[styles.replicaCard, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.md }]}>
                <View style={styles.replicaDot} />
                <View style={styles.replicaAvatar}>
                  <Text style={[styles.replicaAvatarText, { color: colors.textMuted, fontFamily: fonts.sans }]}>
                    {longPressTarget.contactName.slice(0, 2).toUpperCase()}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.replicaName, { color: colors.textPrimary, fontFamily: fonts.serif }]}>
                    {longPressTarget.contactName}
                  </Text>
                  <Text style={[styles.replicaNote, { color: colors.textMuted, fontFamily: fonts.sans }]} numberOfLines={1}>
                    {longPressTarget.note || "checking in"}
                  </Text>
                </View>
                <PlatformIcon platform={longPressTarget.platform} size={22} />
              </View>

              {/* Action items list */}
              <View style={[styles.menuContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <TouchableOpacity
                  onPress={() => {
                    handleDone(longPressTarget.id);
                    setLongPressTarget(null);
                  }}
                  style={[styles.menuItem, { borderBottomColor: colors.border }]}
                >
                  <Text style={[styles.menuItemText, { color: colors.textPrimary, fontFamily: fonts.sans }]}>Mark Done</Text>
                  <Text style={{ color: colors.done, fontSize: 16 }}>✓</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => {
                    handleSnooze(longPressTarget.id);
                    setLongPressTarget(null);
                  }}
                  style={[styles.menuItem, { borderBottomColor: colors.border }]}
                >
                  <Text style={[styles.menuItemText, { color: colors.textPrimary, fontFamily: fonts.sans }]}>Snooze Reminder</Text>
                  <Text style={{ color: colors.pending, fontSize: 16 }}>⏱</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => {
                    handleDelete(longPressTarget.id);
                    setLongPressTarget(null);
                  }}
                  style={styles.menuItem}
                >
                  <Text style={[styles.menuItemText, { color: colors.danger, fontFamily: fonts.sans }]}>Delete Reminder</Text>
                  <Text style={{ color: colors.danger, fontSize: 16 }}>✕</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>
        </Modal>
      )}
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
    paddingBottom: 120, // space for bottom tab bar
  },
  searchContainer: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 16,
    alignItems: "center",
  },
  searchInput: {
    height: 38,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 13,
  },
  searchClearButton: {
    height: 38,
    borderWidth: 1,
    paddingHorizontal: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headerIcon: {
    padding: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  banner: {
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
    position: "relative",
  },
  bannerClose: {
    position: "absolute",
    top: 8,
    right: 12,
    padding: 4,
  },
  bannerEyebrow: {
    fontSize: 12,
    fontStyle: "italic",
    marginBottom: 4,
  },
  bannerRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 8,
  },
  bannerCount: {
    fontSize: 28,
    fontWeight: "bold",
    lineHeight: 28,
  },
  bannerLink: {
    fontSize: 13,
  },
  countLabel: {
    fontSize: 10,
    letterSpacing: 0.5,
    marginBottom: 12,
    textTransform: "uppercase",
  },
  seeDoneButton: {
    alignItems: "center",
    marginTop: 24,
    paddingVertical: 12,
  },
  seeDoneText: {
    fontSize: 13,
  },
  previewContainer: {
    marginTop: 32,
    marginBottom: 16,
  },
  previewLabel: {
    fontSize: 10,
    letterSpacing: 0.8,
    textTransform: "uppercase",
    marginBottom: 10,
  },
  previewCard: {
    borderWidth: 1,
    padding: 16,
  },
  previewHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  previewHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  previewLogo: {
    width: 16,
    height: 16,
    borderRadius: 4,
  },
  previewTitle: {
    fontSize: 13,
  },
  previewBtnInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  previewTime: {
    fontSize: 10,
  },
  previewBody: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 16,
  },
  previewActions: {
    flexDirection: "row",
    gap: 10,
  },
  previewButton: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 6,
    paddingVertical: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  modalContent: {
    width: "100%",
    maxWidth: 300,
    gap: 12,
  },
  replicaCard: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    padding: 16,
  },
  replicaDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#C8A96E",
    marginRight: 12,
  },
  replicaAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#1F1F1F",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  replicaAvatarText: {
    fontSize: 14,
    fontWeight: "600",
  },
  replicaName: {
    fontSize: 18,
    fontStyle: "italic",
  },
  replicaNote: {
    fontSize: 13,
  },
  menuContainer: {
    borderWidth: 1,
    borderRadius: 16,
    overflow: "hidden",
  },
  menuItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
  },
  menuItemText: {
    fontSize: 15,
  },
  commandPalette: {
    borderWidth: 1,
    padding: 8,
    marginBottom: 16,
    gap: 4,
  },
  commandHeader: {
    fontSize: 9,
    letterSpacing: 0.8,
    textTransform: "uppercase",
    marginBottom: 6,
    paddingHorizontal: 8,
  },
  commandItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    alignItems: "center",
  },
  commandText: {
    fontSize: 13,
    fontWeight: "bold",
  },
  commandDesc: {
    fontSize: 11,
  },
  quickAddContainer: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 12,
    alignItems: "center",
  },
  quickAddInput: {
    height: 38,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 13,
  },
  quickAddBtn: {
    height: 38,
    borderWidth: 1,
    paddingHorizontal: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  nlpExampleContainer: {
    borderLeftWidth: 2,
    paddingLeft: 12,
    marginBottom: 16,
    gap: 6,
  },
  nlpExampleTitle: {
    fontSize: 9,
    letterSpacing: 0.8,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  nlpExampleButton: {
    paddingVertical: 2,
  },
  nlpExampleText: {
    fontSize: 12,
    lineHeight: 16,
  },
});
