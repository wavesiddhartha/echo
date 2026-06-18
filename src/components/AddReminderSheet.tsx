import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Dimensions,
  Platform as RNPlatform,
  KeyboardAvoidingView,
  Keyboard,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
  withTiming,
} from "react-native-reanimated";
import { useStore } from "@/store/useStore";
import { useTheme } from "@/lib/theme";
import { PlatformIcon, PLATFORM_META, type Platform } from "./PlatformIcon";
import { getContacts, addContact, addReply, type Contact, type PendingReply } from "@/lib/db";
import { scheduleNotification } from "@/lib/notifications";

const { height: WINDOW_HEIGHT } = Dimensions.get("window");

// Simple Avatar Component
function Avatar({ name, size = 36 }: { name: string; size?: number }) {
  const { colors, fonts } = useTheme();
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  
  return (
    <View style={[styles.avatar, { width: size, height: size, borderRadius: size / 2, backgroundColor: colors.border }]}>
      <Text style={[styles.avatarText, { color: colors.textPrimary, fontSize: size * 0.35, fontFamily: fonts.mono }]}>
        {initials}
      </Text>
    </View>
  );
}

export function AddReminderSheet() {
  const { colors, fonts, radius, spacing } = useTheme();
  
  const closeAddSheet = useStore((s) => s.closeAddSheet);
  const addToast = useStore((s) => s.addToast);

  const [name, setName] = useState("");
  const [platform, setPlatform] = useState<Platform>("whatsapp");
  const [note, setNote] = useState("");
  const [remindChoice, setRemindChoice] = useState<"2h" | "tonight" | "tomorrow" | "custom">("2h");
  
  // Custom Date/Time
  const [customDate, setCustomDate] = useState("");
  const [customTime, setCustomTime] = useState("");

  const [contacts, setContacts] = useState<Contact[]>([]);
  const [errors, setErrors] = useState<{ name?: string }>({});

  useEffect(() => {
    getContacts().then(setContacts);
  }, []);

  // Filter contacts for autocomplete
  const filteredContacts = name.trim()
    ? contacts.filter((c) => c.name.toLowerCase().includes(name.toLowerCase()))
    : [];

  const frequentPeople = contacts
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  // Reanimated Sheet position values
  const translateY = useSharedValue(WINDOW_HEIGHT);
  const backdropOpacity = useSharedValue(0);

  useEffect(() => {
    translateY.value = withSpring(0, { damping: 28, stiffness: 220 });
    backdropOpacity.value = withTiming(0.6, { duration: 250 });
  }, []);

  const handleClose = () => {
    Keyboard.dismiss();
    backdropOpacity.value = withTiming(0, { duration: 200 });
    translateY.value = withSpring(WINDOW_HEIGHT, { damping: 26, stiffness: 220 }, (finished) => {
      if (finished) {
        runOnJS(closeAddSheet)();
      }
    });
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  const handleSave = async () => {
    if (!name.trim()) {
      setErrors({ name: "Who do you want to reply to?" });
      return;
    }

    let remindAt = new Date();
    if (remindChoice === "2h") {
      remindAt.setHours(remindAt.getHours() + 2);
    } else if (remindChoice === "tonight") {
      remindAt.setHours(21, 0, 0, 0); // 9 PM
      if (remindAt <= new Date()) remindAt.setDate(remindAt.getDate() + 1);
    } else if (remindChoice === "tomorrow") {
      remindAt.setDate(remindAt.getDate() + 1);
      remindAt.setHours(9, 0, 0, 0); // 9 AM
    } else if (remindChoice === "custom") {
      // Parse custom input or default to 1 hour if blank
      remindAt.setHours(remindAt.getHours() + 1);
    }

    const contactId = Math.random().toString(36).slice(2);
    
    // Save contact history
    await addContact({
      id: contactId,
      name: name.trim(),
      platform,
      createdAt: new Date().toISOString(),
    });

    const reply: PendingReply = {
      id: Math.random().toString(36).slice(2),
      contactId,
      contactName: name.trim(),
      note: note.trim(),
      platform,
      remindAt: remindAt.toISOString(),
      status: "pending",
      createdAt: new Date().toISOString(),
    };

    await addReply(reply);
    await scheduleNotification(reply);

    addToast({ message: `Reminder set for ${reply.contactName} ✓` });
    handleClose();
  };

  const CHIPS = ["their big news", "checking in", "their birthday", "the favor", "job thing", "need to apologize"];

  return (
    <View style={StyleSheet.absoluteFill}>
      {/* Backdrop overlay */}
      <Animated.View style={[styles.backdrop, backdropStyle]} onTouchEnd={handleClose} />

      {/* Sheet view */}
      <KeyboardAvoidingView
        behavior={RNPlatform.OS === "ios" ? "padding" : undefined}
        style={styles.sheetContainer}
      >
        <Animated.View style={[styles.sheet, { backgroundColor: colors.surface, borderTopColor: colors.border }, animatedStyle]}>
          <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
            {/* Header bar */}
            <View style={styles.header}>
              <Text style={[styles.brandText, { color: colors.textPrimary, fontFamily: fonts.serif }]}>
                echo
              </Text>
              <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
                <Text style={[styles.closeButtonText, { color: colors.textMuted }]}>×</Text>
              </TouchableOpacity>
            </View>

            <Text style={[styles.title, { color: colors.textPrimary, fontFamily: fonts.serif }]}>
              who do you owe?
            </Text>

            {/* ── Recent Contacts Row ── */}
            {frequentPeople.length >= 2 && (
              <View style={styles.recentContainer}>
                <Text style={[styles.sectionLabel, { color: colors.textMuted, fontFamily: fonts.mono }]}>
                  recent people
                </Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.recentScroll}>
                  {frequentPeople.map((p) => (
                    <TouchableOpacity
                      key={p.id}
                      onPress={() => {
                        setName(p.name);
                        setPlatform(p.platform);
                      }}
                      style={styles.recentItem}
                    >
                      <Avatar name={p.name} size={36} />
                      <Text style={[styles.recentName, { color: colors.textPrimary, fontFamily: fonts.sans }]} numberOfLines={1}>
                        {p.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            {/* Name input */}
            <Text style={[styles.sectionLabel, { color: colors.textMuted, fontFamily: fonts.mono, marginTop: 12 }]}>
              OR TYPE A NAME
            </Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.bg, borderColor: colors.border, color: colors.textPrimary, fontFamily: fonts.sans }]}
              placeholder="someone's name..."
              placeholderTextColor={colors.textMuted}
              value={name}
              onChangeText={(t) => {
                setName(t);
                if (errors.name) setErrors({});
              }}
            />
            {errors.name && <Text style={[styles.errorText, { color: colors.danger, fontFamily: fonts.sans }]}>{errors.name}</Text>}

            {/* Autocomplete list */}
            {filteredContacts.length > 0 && (
              <View style={[styles.autocomplete, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                {filteredContacts.map((c) => (
                  <TouchableOpacity
                    key={c.id}
                    onPress={() => {
                      setName(c.name);
                      setPlatform(c.platform);
                      Keyboard.dismiss();
                    }}
                    style={[styles.autocompleteItem, { borderBottomColor: colors.border }]}
                  >
                    <Text style={{ color: colors.textPrimary, fontFamily: fonts.sans }}>{c.name}</Text>
                    <Text style={{ color: colors.textMuted, fontSize: 11, fontFamily: fonts.mono }}>{c.platform}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Platform picker */}
            <View style={styles.platformPicker}>
              {PLATFORM_META.map((meta) => {
                const active = platform === meta.value;
                return (
                  <TouchableOpacity
                    key={meta.value}
                    onPress={() => setPlatform(meta.value)}
                    style={[
                      styles.platformButton,
                      {
                        backgroundColor: active ? colors.textPrimary : colors.surface,
                        borderRadius: radius.sm,
                        borderColor: active ? colors.textPrimary : colors.border,
                        borderWidth: 1,
                        justifyContent: "center",
                        alignItems: "center",
                        paddingVertical: 12,
                      },
                    ]}
                  >
                    <Text
                      style={{
                        color: active ? colors.accentText : colors.textPrimary,
                        fontFamily: fonts.mono,
                        fontSize: 13,
                        textTransform: "lowercase",
                      }}
                    >
                      [{meta.value}]
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Note field */}
            <Text style={[styles.sectionLabel, { color: colors.textMuted, fontFamily: fonts.mono, marginTop: 16 }]}>
              WHAT'S IT ABOUT? (OPTIONAL)
            </Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.bg, borderColor: colors.border, color: colors.textPrimary, fontFamily: fonts.sans }]}
              placeholder="what's it about?"
              placeholderTextColor={colors.textMuted}
              value={note}
              onChangeText={setNote}
            />

            {/* Note chips */}
            <View style={styles.chipsRow}>
              {CHIPS.map((chip) => (
                <TouchableOpacity
                  key={chip}
                  onPress={() => setNote(chip)}
                  style={[styles.chip, { backgroundColor: colors.bg, borderColor: colors.border, borderRadius: radius.full }]}
                >
                  <Text style={[styles.chipText, { color: colors.textMuted, fontFamily: fonts.sans }]}>
                    {chip}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Remind Me picker */}
            <Text style={[styles.sectionLabel, { color: colors.textMuted, fontFamily: fonts.mono, marginTop: 16 }]}>
              REMIND ME
            </Text>
            <View style={styles.remindPicker}>
              {[
                { id: "2h", label: "In 2 hours" },
                { id: "tonight", label: "Tonight" },
                { id: "tomorrow", label: "Tomorrow" },
              ].map((opt) => {
                const active = remindChoice === opt.id;
                return (
                  <TouchableOpacity
                    key={opt.id}
                    onPress={() => setRemindChoice(opt.id as any)}
                    style={[
                      styles.remindButton,
                      {
                        backgroundColor: active ? colors.textPrimary : "transparent",
                        borderColor: colors.border,
                        borderRadius: radius.full,
                      },
                    ]}
                  >
                    <Text style={[styles.remindButtonText, { color: active ? colors.bg : colors.textMuted, fontFamily: fonts.sans }]}>
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Save Reminder Button */}
            <TouchableOpacity
              onPress={handleSave}
              activeOpacity={0.8}
              style={[styles.saveButton, { backgroundColor: colors.textPrimary, borderRadius: radius.full }]}
            >
              <Text style={[styles.saveButtonText, { color: colors.bg, fontFamily: fonts.sans }]}>
                Save reminder
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </Animated.View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "#000",
    zIndex: 100,
  },
  sheetContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 101,
    justifyContent: "flex-end",
  },
  sheet: {
    borderTopWidth: 1,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 12,
    maxHeight: WINDOW_HEIGHT * 0.9,
  },
  scrollContent: {
    paddingBottom: 48,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  brandText: {
    fontSize: 18,
    fontStyle: "italic",
  },
  closeButton: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  closeButtonText: {
    fontSize: 28,
    lineHeight: 32,
  },
  title: {
    fontSize: 22,
    fontStyle: "italic",
    marginBottom: 16,
    fontWeight: "300",
  },
  sectionLabel: {
    fontSize: 10,
    letterSpacing: 0.8,
    marginBottom: 8,
    textTransform: "uppercase",
  },
  recentContainer: {
    marginBottom: 16,
  },
  recentScroll: {
    flexDirection: "row",
    gap: 12,
  },
  recentItem: {
    alignItems: "center",
    width: 50,
  },
  avatar: {
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontWeight: "500",
  },
  recentName: {
    fontSize: 11,
    marginTop: 4,
  },
  input: {
    height: 44,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 14,
    marginBottom: 12,
  },
  errorText: {
    fontSize: 12,
    marginTop: -8,
    marginBottom: 8,
  },
  autocomplete: {
    borderWidth: 1,
    borderRadius: 8,
    maxHeight: 120,
    overflow: "hidden",
    marginBottom: 12,
  },
  autocompleteItem: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    borderBottomWidth: 1,
  },
  platformPicker: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 8,
    flexWrap: "wrap",
    gap: 8,
  },
  platformButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  platformLabel: {
    fontSize: 12,
    fontWeight: "500",
  },
  chipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginVertical: 8,
  },
  chip: {
    borderWidth: 1,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  chipText: {
    fontSize: 11,
  },
  remindPicker: {
    flexDirection: "row",
    gap: 10,
    marginVertical: 8,
  },
  remindButton: {
    borderWidth: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  remindButtonText: {
    fontSize: 12,
    fontWeight: "500",
  },
  saveButton: {
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  saveButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
});
