import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Share,
  Platform as RNPlatform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useLocalSearchParams } from "expo-router";
import { getReplies, getContacts, getWeeklyStreak, type Contact, type PendingReply, openChatForReply } from "@/lib/db";
import { useTheme } from "@/lib/theme";
import { PlatformIcon } from "@/components/PlatformIcon";

interface ContactWarmth {
  name: string;
  platform: string;
  handle?: string;
  warmth: number;
  statusLabel: string;
}

function calculateContactWarmth(contacts: Contact[], replies: PendingReply[]): ContactWarmth[] {
  const now = new Date();
  
  return contacts.map((c) => {
    const contactReplies = replies.filter((r) => r.contactName.toLowerCase() === c.name.toLowerCase() && (r.status === "pending" || r.status === "snoozed"));
    
    if (contactReplies.length === 0) {
      return {
        name: c.name,
        platform: c.platform,
        handle: c.handle,
        warmth: 5,
        statusLabel: "active",
      };
    }

    contactReplies.sort((a, b) => new Date(a.remindAt).getTime() - new Date(b.remindAt).getTime());
    const oldestReply = contactReplies[0];
    const remindDate = new Date(oldestReply.remindAt);
    
    if (remindDate > now) {
      return {
        name: c.name,
        platform: c.platform,
        handle: c.handle,
        warmth: 4,
        statusLabel: "waiting",
      };
    }

    const overdueMs = now.getTime() - remindDate.getTime();
    const overdueHours = overdueMs / (1000 * 60 * 60);

    if (overdueHours <= 12) {
      return {
        name: c.name,
        platform: c.platform,
        handle: c.handle,
        warmth: 3,
        statusLabel: "lukewarm",
      };
    }
    if (overdueHours <= 48) {
      return {
        name: c.name,
        platform: c.platform,
        handle: c.handle,
        warmth: 2,
        statusLabel: "cooling",
      };
    }
    if (overdueHours <= 120) {
      return {
        name: c.name,
        platform: c.platform,
        handle: c.handle,
        warmth: 1,
        statusLabel: "cold",
      };
    }
    return {
      name: c.name,
      platform: c.platform,
      handle: c.handle,
      warmth: 0,
      statusLabel: "frozen",
    };
  });
}

export default function DoneScreen() {
  const { colors, fonts, spacing, radius } = useTheme();
  const params = useLocalSearchParams();

  const [doneReplies, setDoneReplies] = useState<PendingReply[]>([]);
  const [allReplies, setAllReplies] = useState<PendingReply[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [showWarmthGraph, setShowWarmthGraph] = useState(false);
  const [weeklyStreak, setWeeklyStreak] = useState(0);
  const [showWeeklyCard, setShowWeeklyCard] = useState(false);

  // Load data on screen focus
  useFocusEffect(
    useCallback(() => {
      let isMounted = true;

      const loadData = async () => {
        const list = await getReplies();
        const doneList = list.filter((r) => r.status === "done");
        
        // Sort by doneAt descending
        doneList.sort((a, b) => {
          const aTime = a.doneAt ? new Date(a.doneAt).getTime() : 0;
          const bTime = b.doneAt ? new Date(b.doneAt).getTime() : 0;
          return bTime - aTime;
        });

        const streak = await getWeeklyStreak();
        const contactList = await getContacts();

        if (isMounted) {
          setDoneReplies(doneList);
          setAllReplies(list);
          setContacts(contactList);
          setWeeklyStreak(streak);
          if (params.weekly === "true") {
            setShowWeeklyCard(true);
          }
        }
      };

      loadData();

      return () => {
        isMounted = false;
      };
    }, [params.weekly])
  );

  const handleShare = async () => {
    try {
      const message = `I showed up and caught up with ${weeklyStreak} ${
        weeklyStreak === 1 ? "person" : "people"
      } this week. Small steps to stay connected. ~ Echo`;
      await Share.share({
        message,
      });
    } catch (error) {
      console.error("Error sharing recap:", error);
    }
  };

  const formatDate = (isoString?: string) => {
    if (!isoString) return "";
    const date = new Date(isoString);
    return date.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]} edges={["top", "left", "right"]}>
      {/* Header bar matching Home */}
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: colors.textPrimary, fontFamily: fonts.serif }]}>
          echo
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Weekly Summary Card */}
        {showWeeklyCard && weeklyStreak > 0 && (
          <View style={[styles.weeklyCard, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.md }]}>
            <Text style={[styles.weeklyEyebrow, { color: colors.pending, fontFamily: fonts.mono }]}>
              weekly recap
            </Text>
            <Text style={[styles.weeklyTitle, { color: colors.textPrimary, fontFamily: fonts.serif }]}>
              You showed up.
            </Text>
            <Text style={[styles.weeklyBody, { color: colors.textPrimary, fontFamily: fonts.sans }]}>
              You replied to <Text style={{ color: colors.pending, fontWeight: "bold" }}>{weeklyStreak}</Text> {weeklyStreak === 1 ? "person" : "people"} this week. That matters.
            </Text>
            
            <View style={styles.weeklyActions}>
              <TouchableOpacity
                onPress={handleShare}
                activeOpacity={0.8}
                style={[styles.shareBtn, { backgroundColor: colors.textPrimary, borderRadius: radius.full }]}
              >
                <Text style={[styles.shareBtnText, { color: colors.bg, fontFamily: fonts.sans }]}>
                  Share Card
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setShowWeeklyCard(false)}
                activeOpacity={0.7}
                style={[styles.closeBtn, { borderColor: colors.border, borderRadius: radius.full }]}
              >
                <Text style={[styles.closeBtnText, { color: colors.textMuted, fontFamily: fonts.sans }]}>
                  See All
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Connection Warmth Dashboard toggle */}
        {contacts.length > 0 && (
          <View style={{ marginBottom: 20 }}>
            <TouchableOpacity
              onPress={() => setShowWarmthGraph(!showWarmthGraph)}
              activeOpacity={0.7}
              style={[
                styles.graphToggle,
                {
                  borderColor: colors.border,
                  backgroundColor: colors.surface,
                  borderRadius: radius.sm,
                },
              ]}
            >
              <Text style={{ color: colors.textPrimary, fontFamily: fonts.mono, fontSize: 11 }}>
                {showWarmthGraph ? "[-] hide connection warmth index" : "[+] show connection warmth index"}
              </Text>
            </TouchableOpacity>

            {showWarmthGraph && (
              <View style={[styles.graphContainer, { borderColor: colors.border, backgroundColor: colors.surface, borderRadius: radius.sm }]}>
                <Text style={[styles.graphHeader, { color: colors.textMuted, fontFamily: fonts.mono }]}>
                  [warmth index — rescue frozen first]
                </Text>
                {calculateContactWarmth(contacts, allReplies)
                  .sort((a, b) => a.warmth - b.warmth)
                  .map((cw) => {
                    const bar = "■".repeat(cw.warmth) + "□".repeat(5 - cw.warmth);
                    let warmthColor = colors.textPrimary;
                    if (cw.warmth <= 1) warmthColor = colors.danger;
                    else if (cw.warmth <= 3) warmthColor = colors.pending;
                    else warmthColor = colors.done;

                    return (
                      <View key={cw.name} style={[styles.graphItem, { borderBottomColor: colors.border }]}>
                        <View style={{ flex: 1, flexDirection: "row", alignItems: "center", gap: 8 }}>
                          <Text style={{ color: colors.textPrimary, fontFamily: fonts.sans, fontSize: 13, width: 80 }} numberOfLines={1}>
                            {cw.name}
                          </Text>
                          <Text style={{ color: warmthColor, fontFamily: fonts.mono, fontSize: 12 }}>
                            {bar}
                          </Text>
                          <Text style={{ color: colors.textMuted, fontFamily: fonts.mono, fontSize: 9, textTransform: "lowercase" }}>
                            {cw.statusLabel}
                          </Text>
                        </View>

                        <TouchableOpacity
                          onPress={() => openChatForReply(cw.platform, cw.handle)}
                          activeOpacity={0.7}
                          style={{ paddingHorizontal: 8, paddingVertical: 4 }}
                        >
                          <Text style={{ color: colors.pending, fontFamily: fonts.mono, fontSize: 11 }}>
                            [chat]
                          </Text>
                        </TouchableOpacity>
                      </View>
                    );
                  })}
              </View>
            )}
          </View>
        )}

        {/* Monospace count label */}
        <Text style={[styles.countLabel, { color: colors.textMuted, fontFamily: fonts.mono }]}>
          {doneReplies.length} COMPLETED
        </Text>

        {doneReplies.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: colors.textMuted, fontFamily: fonts.sans }]}>
              No completed reminders yet.
            </Text>
          </View>
        ) : (
          <View style={styles.listContainer}>
            {doneReplies.map((reply) => (
              <View
                key={reply.id}
                style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.md }]}
              >
                <View style={styles.cardLeft}>
                  <View style={[styles.avatar, { backgroundColor: colors.border }]}>
                    <Text style={[styles.avatarText, { color: colors.textPrimary, fontFamily: fonts.mono }]}>
                      {reply.contactName.slice(0, 2).toUpperCase()}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.name, { color: colors.textPrimary, fontFamily: fonts.serif }]}>
                      {reply.contactName}
                    </Text>
                    {reply.note ? (
                      <Text style={[styles.note, { color: colors.textMuted, fontFamily: fonts.sans }]} numberOfLines={1}>
                        {reply.note}
                      </Text>
                    ) : null}
                    <Text style={[styles.time, { color: colors.textMuted, fontFamily: fonts.mono }]}>
                      replied {formatDate(reply.doneAt || reply.createdAt)}
                    </Text>
                    {reply.handle && (
                      <Text style={{ color: colors.textMuted, fontFamily: fonts.mono, fontSize: 11, marginTop: 4 }} numberOfLines={1}>
                        [{reply.handle}]
                      </Text>
                    )}
                  </View>
                </View>
                <View style={styles.cardRight}>
                  {reply.platform && (
                    <View style={styles.platformBadge}>
                      <PlatformIcon platform={reply.platform as any} size={18} />
                    </View>
                  )}
                  <Text style={[styles.checkmark, { color: colors.done }]}>✓</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Serif footer quote */}
        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: colors.textMuted, fontFamily: fonts.serif }]}>
            “You showed up for people who needed to hear from you.”
          </Text>
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
    paddingBottom: 120, // space for bottom tab bar
  },
  weeklyCard: {
    borderWidth: 1,
    padding: 20,
    marginBottom: 24,
    gap: 10,
  },
  weeklyEyebrow: {
    fontSize: 10,
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  weeklyTitle: {
    fontSize: 24,
    fontStyle: "italic",
  },
  weeklyBody: {
    fontSize: 15,
    lineHeight: 20,
  },
  weeklyActions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
  },
  shareBtn: {
    flex: 1,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  shareBtnText: {
    fontSize: 13,
    fontWeight: "600",
  },
  closeBtn: {
    flex: 1,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  closeBtnText: {
    fontSize: 13,
    fontWeight: "500",
  },
  countLabel: {
    fontSize: 10,
    letterSpacing: 0.5,
    marginBottom: 12,
    textTransform: "uppercase",
  },
  emptyContainer: {
    paddingVertical: 40,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 14,
  },
  listContainer: {
    gap: 12,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderWidth: 1,
  },
  cardLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 12,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: 14,
    fontWeight: "600",
  },
  name: {
    fontSize: 18,
    fontStyle: "italic",
  },
  note: {
    fontSize: 13,
    marginTop: 2,
  },
  time: {
    fontSize: 10,
    marginTop: 4,
  },
  cardRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  platformBadge: {
    opacity: 0.6,
  },
  checkmark: {
    fontSize: 18,
    fontWeight: "bold",
  },
  footer: {
    marginTop: 48,
    marginBottom: 24,
    alignItems: "center",
    paddingHorizontal: 24,
  },
  footerText: {
    fontSize: 16,
    fontStyle: "italic",
    textAlign: "center",
    lineHeight: 22,
  },
  graphToggle: {
    borderWidth: 1,
    paddingVertical: 10,
    alignItems: "center",
  },
  graphContainer: {
    borderWidth: 1,
    marginTop: 8,
    padding: 12,
  },
  graphHeader: {
    fontSize: 9,
    letterSpacing: 0.8,
    textTransform: "uppercase",
    marginBottom: 8,
  },
  graphItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
});
