import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Platform as RNPlatform } from "react-native";
import Swipeable from "react-native-gesture-handler/Swipeable";
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from "react-native-reanimated";
import Svg, { Path, Polyline, Circle } from "react-native-svg";
import { useTheme } from "@/lib/theme";
import { PlatformIcon } from "./PlatformIcon";
import { type PendingReply, openChatForReply } from "@/lib/db";

// Vector SVG Icons for Actions
const CheckIcon = ({ color }: { color: string }) => (
  <Svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <Polyline points="20 6 9 17 4 12" />
  </Svg>
);

const ClockIcon = ({ color }: { color: string }) => (
  <Svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <Circle cx="12" cy="12" r="10" />
    <Polyline points="12 6 12 12 16 14" />
  </Svg>
);

const MessageBubbleIcon = ({ color }: { color: string }) => (
  <Svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </Svg>
);

const TrashIcon = ({ color }: { color: string }) => (
  <Svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <Polyline points="3 6 5 6 21 6" />
    <Path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </Svg>
);

// Time formatter
function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diff = date.getTime() - now.getTime();
  const absDiff = Math.abs(diff);
  const isPast = diff < 0;

  const minutes = Math.floor(absDiff / (1000 * 60));
  const hours = Math.floor(absDiff / (1000 * 60 * 60));
  const days = Math.floor(absDiff / (1000 * 60 * 60 * 24));

  if (isPast) {
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  }

  if (minutes < 60) return `in ${minutes}m`;
  if (hours < 24) {
    const h = Math.floor(hours);
    const m = Math.floor((absDiff % (1000 * 60 * 60)) / (1000 * 60));
    if (m === 0) return `in ${h}h`;
    return `in ${h}h ${m}m`;
  }
  if (days === 1) return "tomorrow";
  if (days < 7) return `in ${days} days`;

  return date.toLocaleDateString("en", { month: "short", day: "numeric" });
}

// Initials Avatar
function Avatar({ name }: { name: string }) {
  const { colors, fonts } = useTheme();
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <View style={[styles.avatar, { backgroundColor: colors.border }]}>
      <Text style={[styles.avatarText, { color: colors.textMuted, fontFamily: fonts.sans }]}>
        {initials}
      </Text>
    </View>
  );
}

interface ReplyCardProps {
  reply: PendingReply;
  onDone: (id: string) => void;
  onDelete: (id: string) => void;
  onSnooze: (id: string) => void;
  onLongPress: (reply: PendingReply) => void;
}

export function ReplyCard({ reply, onDone, onDelete, onSnooze, onLongPress }: ReplyCardProps) {
  const { colors, fonts, radius } = useTheme();
  const [isExpanded, setIsExpanded] = useState(false);

  const now = new Date();
  const remindDate = new Date(reply.remindAt);
  const overdueMs = now.getTime() - remindDate.getTime();
  const overdueHours = overdueMs / (1000 * 60 * 60);
  const isOverdue = overdueHours > 0 && reply.status === "pending";

  // Overdue Warmth configuration
  let cardBorderColor = colors.border;
  let cardShadowOpacity = 0;
  let warmthLabel = "";

  if (isOverdue) {
    if (overdueHours > 2 && overdueHours <= 24) {
      cardBorderColor = "rgba(200, 169, 110, 0.4)";
      cardShadowOpacity = 0.05;
    } else if (overdueHours > 24 && overdueHours <= 72) {
      cardBorderColor = "rgba(200, 169, 110, 0.6)";
      cardShadowOpacity = 0.1;
      warmthLabel = "still waiting...";
    } else if (overdueHours > 72) {
      const overdueDays = Math.floor(overdueHours / 24);
      cardBorderColor = "rgba(200, 169, 110, 0.85)";
      cardShadowOpacity = 0.15;
      warmthLabel = `${overdueDays} days now`;
    }
  }

  // Left Swipe Action (revealed on the left when swiping right) = Delete
  const renderLeftActions = () => {
    return (
      <View style={[styles.leftSwipeAction, { backgroundColor: "rgba(192, 57, 43, 0.08)", borderRadius: radius.md }]}>
        <View style={styles.actionLabelContainer}>
          <Text style={[styles.actionIconText, { color: colors.danger }]}>✕</Text>
          <Text style={[styles.actionText, { color: colors.danger, fontFamily: fonts.mono }]}>
            DELETE
          </Text>
        </View>
      </View>
    );
  };

  // Right Swipe Action (revealed on the right when swiping left) = Done
  const renderRightActions = () => {
    return (
      <View style={[styles.rightSwipeAction, { backgroundColor: "rgba(90, 158, 122, 0.08)", borderRadius: radius.md }]}>
        <View style={styles.actionLabelContainer}>
          <Text style={[styles.actionText, { color: colors.done, fontFamily: fonts.mono }]}>
            DONE
          </Text>
          <Text style={[styles.actionIconText, { color: colors.done }]}>✓</Text>
        </View>
      </View>
    );
  };

  const handleSwipeOpen = (direction: "left" | "right") => {
    if (direction === "left") {
      onDelete(reply.id);
    } else if (direction === "right") {
      onDone(reply.id);
    }
  };

  return (
    <Swipeable
      renderLeftActions={renderLeftActions}
      renderRightActions={renderRightActions}
      onSwipeableOpen={handleSwipeOpen}
      friction={1.2}
      leftThreshold={60}
      rightThreshold={60}
    >
      <TouchableOpacity
        onPress={() => setIsExpanded(!isExpanded)}
        onLongPress={() => onLongPress(reply)}
        delayLongPress={400}
        activeOpacity={0.9}
        style={[
          styles.cardContainer,
          {
            backgroundColor: colors.surface,
            borderColor: cardBorderColor,
            borderRadius: radius.md,
            shadowColor: colors.pending,
            shadowOpacity: cardShadowOpacity,
          },
        ]}
      >
        <View style={styles.mainRow}>
          {/* Active pending pulse dot */}
          <View style={[styles.pulseDot, { backgroundColor: colors.pending }]} />

          {/* Avatar */}
          <Avatar name={reply.contactName} />

          {/* Core metadata info */}
          <View style={styles.contentContainer}>
            <Text style={[styles.contactName, { color: colors.textPrimary, fontFamily: fonts.serif }]} numberOfLines={1}>
              {reply.contactName}
            </Text>
            <Text style={[styles.noteText, { color: colors.textMuted, fontFamily: fonts.sans }]} numberOfLines={1}>
              {reply.note || "checking in"}
            </Text>
            <View style={styles.timeRow}>
              <Text style={[styles.timeText, { color: isOverdue ? colors.pending : colors.textMuted, fontFamily: fonts.mono }]}>
                {formatRelativeTime(reply.remindAt)}
              </Text>
              {warmthLabel !== "" && (
                <>
                  <Text style={[styles.timeSeparator, { color: colors.textMuted }]}>•</Text>
                  <Text style={[styles.warmthText, { color: colors.pending, fontFamily: fonts.serif }]}>
                    {warmthLabel}
                  </Text>
                </>
              )}
            </View>
            {reply.handle && (
              <Text style={{ color: colors.textMuted, fontFamily: fonts.mono, fontSize: 11, marginTop: 4 }} numberOfLines={1}>
                [{reply.handle}]
              </Text>
            )}
          </View>

          {/* Platform logo */}
          <View style={styles.platformContainer}>
            <PlatformIcon platform={reply.platform} size={22} />
          </View>
        </View>

        {/* Tap-expanded actions row */}
        {isExpanded && (
          <View style={[styles.actionsRow, { borderTopColor: colors.border }]}>
            <TouchableOpacity
              onPress={() => openChatForReply(reply.platform, reply.handle)}
              activeOpacity={0.7}
              style={[styles.actionButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
            >
              <View style={styles.btnInner}>
                <MessageBubbleIcon color={colors.textPrimary} />
                <Text style={[styles.actionButtonText, { color: colors.textPrimary, fontFamily: fonts.mono }]}>
                  chat
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => onDone(reply.id)}
              activeOpacity={0.7}
              style={[styles.actionButton, { backgroundColor: "rgba(90, 158, 122, 0.08)", borderColor: "rgba(90, 158, 122, 0.2)" }]}
            >
              <View style={styles.btnInner}>
                <CheckIcon color={colors.done} />
                <Text style={[styles.actionButtonText, { color: colors.done, fontFamily: fonts.mono }]}>
                  done
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => onSnooze(reply.id)}
              activeOpacity={0.7}
              style={[styles.actionButton, { backgroundColor: "rgba(200, 169, 110, 0.08)", borderColor: "rgba(200, 169, 110, 0.2)" }]}
            >
              <View style={styles.btnInner}>
                <ClockIcon color={colors.pending} />
                <Text style={[styles.actionButtonText, { color: colors.pending, fontFamily: fonts.mono }]}>
                  snooze
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => onDelete(reply.id)}
              activeOpacity={0.7}
              style={[styles.actionButton, { backgroundColor: "rgba(192, 57, 43, 0.06)", borderColor: "rgba(192, 57, 43, 0.15)" }]}
            >
              <View style={styles.btnInner}>
                <TrashIcon color={colors.danger} />
                <Text style={[styles.actionButtonText, { color: colors.danger, fontFamily: fonts.mono }]}>
                  delete
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        )}
      </TouchableOpacity>
    </Swipeable>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 2,
  },
  mainRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 12,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  avatarText: {
    fontSize: 14,
    fontWeight: "600",
  },
  contentContainer: {
    flex: 1,
    justifyContent: "center",
  },
  contactName: {
    fontSize: 18,
    fontStyle: "italic",
    lineHeight: 22,
    marginBottom: 2,
  },
  noteText: {
    fontSize: 13,
    lineHeight: 16,
    marginBottom: 4,
  },
  timeRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  timeText: {
    fontSize: 11,
  },
  timeSeparator: {
    fontSize: 11,
    marginHorizontal: 6,
    opacity: 0.5,
  },
  warmthText: {
    fontSize: 12,
    fontStyle: "italic",
  },
  platformContainer: {
    marginLeft: 12,
  },
  actionsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    marginTop: 14,
    paddingTop: 12,
    gap: 8,
  },
  actionButton: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: "500",
  },
  btnInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  leftSwipeAction: {
    flex: 1,
    justifyContent: "center",
    paddingLeft: 24,
    marginBottom: 12,
  },
  rightSwipeAction: {
    flex: 1,
    justifyContent: "center",
    alignItems: "flex-end",
    paddingRight: 24,
    marginBottom: 12,
  },
  actionLabelContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  actionIconText: {
    fontSize: 16,
    fontWeight: "bold",
  },
  actionText: {
    fontSize: 10,
    letterSpacing: 0.8,
  },
});
