import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform as RNPlatform,
  Keyboard,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useTheme } from "@/lib/theme";
import { useStore } from "@/store/useStore";
import { PlatformIcon, PLATFORM_META, type Platform } from "@/components/PlatformIcon";
import { getContacts, getReplies, addContact, addReply, type Contact, type PendingReply } from "@/lib/db";
import { scheduleNotification } from "@/lib/notifications";
import DateTimePicker from "@react-native-community/datetimepicker";


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

function getHandleLabel(platform: string, customAppName?: string): string {
  const p = platform === "other" ? (customAppName || "").toLowerCase() : platform.toLowerCase();
  if (p === "whatsapp" || p === "imessage" || p === "signal" || p === "sms") {
    return "phone number (optional)";
  }
  if (p === "telegram" || p === "x" || p === "twitter" || p === "instagram") {
    return "username / handle (optional)";
  }
  if (p === "gmail" || p === "email" || p === "mailto") {
    return "email address (optional)";
  }
  return "username or handle (optional)";
}

function getHandlePlaceholder(platform: string, customAppName?: string): string {
  const p = platform === "other" ? (customAppName || "").toLowerCase() : platform.toLowerCase();
  if (p === "whatsapp" || p === "imessage" || p === "signal" || p === "sms") {
    return "+1234567890...";
  }
  if (p === "telegram" || p === "x" || p === "twitter" || p === "instagram") {
    return "@username...";
  }
  if (p === "gmail" || p === "email" || p === "mailto") {
    return "name@example.com...";
  }
  return "handle or details...";
}

export default function AddScreen() {
  const { colors, fonts, radius, isDark } = useTheme();
  const router = useRouter();
  const addToast = useStore((s) => s.addToast);

  const [name, setName] = useState("");
  const [platform, setPlatform] = useState<string>("whatsapp");
  const [customAppName, setCustomAppName] = useState("");
  const [note, setNote] = useState("");
  const [handle, setHandle] = useState("");
  const [quickParseText, setQuickParseText] = useState("");
  const [remindChoice, setRemindChoice] = useState<"2h" | "tonight" | "tomorrow" | "custom">("2h");
  
  // Custom Date
  const [customDate, setCustomDate] = useState<Date>(() => {
    const d = new Date();
    d.setHours(d.getHours() + 1);
    d.setMinutes(0, 0, 0);
    return d;
  });
  const [showAndroidDate, setShowAndroidDate] = useState(false);
  const [showAndroidTime, setShowAndroidTime] = useState(false);

  const [contacts, setContacts] = useState<Contact[]>([]);
  const [errors, setErrors] = useState<{ name?: string }>({});
  const [templates, setTemplates] = useState<PendingReply[]>([]);

  // Reload contacts on mount / focus
  useEffect(() => {
    getContacts().then(setContacts);
    
    // Fetch recently completed replies as templates
    getReplies().then((list) => {
      const doneList = list.filter((r) => r.status === "done");
      const seen = new Set<string>();
      const uniqueTemplates: PendingReply[] = [];
      for (const r of doneList) {
        const key = `${r.contactName.toLowerCase()}-${r.platform.toLowerCase()}-${(r.note || "").toLowerCase()}`;
        if (!seen.has(key)) {
          seen.add(key);
          uniqueTemplates.push(r);
        }
        if (uniqueTemplates.length >= 3) break;
      }
      setTemplates(uniqueTemplates);
    });
  }, []);

  // Filter contacts for autocomplete
  const filteredContacts = name.trim()
    ? contacts.filter((c) => c.name.toLowerCase().includes(name.toLowerCase()))
    : [];

  const frequentPeople = contacts
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  const handleNlpChange = (text: string) => {
    setQuickParseText(text);
    const parsed = parseNlpString(text);
    if (parsed.name !== undefined) setName(parsed.name);
    if (parsed.platform !== undefined) {
      setPlatform(parsed.platform);
      if (parsed.platform === "other" && parsed.customAppName !== undefined) {
        setCustomAppName(parsed.customAppName);
      }
    }
    if (parsed.note !== undefined) setNote(parsed.note);
    if (parsed.remindChoice !== undefined) {
      setRemindChoice(parsed.remindChoice);
      if (parsed.remindChoice === "custom" && parsed.customDate !== undefined) {
        setCustomDate(parsed.customDate);
      }
    }
  };

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
      remindAt = customDate;
    }

    const contactId = Math.random().toString(36).slice(2);
    const contactNameTrimmed = name.trim();
    const resolvedPlatform = platform === "other" ? (customAppName.trim() || "Custom App") : platform;

    // Save contact history
    await addContact({
      id: contactId,
      name: contactNameTrimmed,
      platform: resolvedPlatform,
      handle: handle.trim() || undefined,
      createdAt: new Date().toISOString(),
    });

    const reply: PendingReply = {
      id: Math.random().toString(36).slice(2),
      contactId,
      contactName: contactNameTrimmed,
      note: note.trim(),
      platform: resolvedPlatform,
      handle: handle.trim() || undefined,
      remindAt: remindAt.toISOString(),
      status: "pending",
      createdAt: new Date().toISOString(),
    };

    await addReply(reply);
    await scheduleNotification(reply);

    addToast({ message: `Reminder set for ${reply.contactName} ✓` });
    Keyboard.dismiss();
    
    // Reset form
    setName("");
    setNote("");
    setPlatform("whatsapp");
    setCustomAppName("");
    setHandle("");
    setQuickParseText("");
    setRemindChoice("2h");
    const defaultDate = new Date();
    defaultDate.setHours(defaultDate.getHours() + 1);
    defaultDate.setMinutes(0, 0, 0);
    setCustomDate(defaultDate);

    // Redirect to index page tab
    router.replace("/");
  };

  const NOTE_CHIPS = ["their big news", "checking in", "their birthday", "the favor", "job thing", "need to apologize"];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]} edges={["top", "left", "right"]}>
      <KeyboardAvoidingView
        behavior={RNPlatform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header title */}
          <Text style={[styles.brandText, { color: colors.textPrimary, fontFamily: fonts.serif }]}>
            echo
          </Text>

          <Text style={[styles.title, { color: colors.textPrimary, fontFamily: fonts.serif }]}>
            who do you owe?
          </Text>

          {/* Quick NLP Parse Input */}
          <Text style={[styles.sectionLabel, { color: colors.textMuted, fontFamily: fonts.mono, marginTop: 4 }]}>
            [quick parse input]
          </Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
                color: colors.textPrimary,
                fontFamily: fonts.mono,
                fontSize: 13,
                marginBottom: quickParseText.trim() !== "" ? 8 : 12,
              },
            ]}
            placeholder="e.g. reply to Simran on whatsapp tomorrow about job interview"
            placeholderTextColor={colors.textMuted}
            value={quickParseText}
            onChangeText={handleNlpChange}
            autoCapitalize="none"
            autoCorrect={false}
          />

          {quickParseText.trim() !== "" && (
            <View style={styles.nlpBadgesRow}>
              {name !== "" && (
                <View style={[styles.nlpBadge, { borderColor: colors.border, backgroundColor: colors.surface }]}>
                  <Text style={[styles.nlpBadgeText, { color: colors.textPrimary, fontFamily: fonts.mono }]}>
                    name: {name}
                  </Text>
                </View>
              )}
              {platform !== "" && (
                <View style={[styles.nlpBadge, { borderColor: colors.border, backgroundColor: colors.surface }]}>
                  <Text style={[styles.nlpBadgeText, { color: colors.textPrimary, fontFamily: fonts.mono }]}>
                    app: {platform === "other" && customAppName ? customAppName : platform}
                  </Text>
                </View>
              )}
              {note !== "" && (
                <View style={[styles.nlpBadge, { borderColor: colors.border, backgroundColor: colors.surface }]}>
                  <Text style={[styles.nlpBadgeText, { color: colors.textPrimary, fontFamily: fonts.mono }]}>
                    about: {note}
                  </Text>
                </View>
              )}
              <View style={[styles.nlpBadge, { borderColor: colors.border, backgroundColor: colors.surface }]}>
                <Text style={[styles.nlpBadgeText, { color: colors.textPrimary, fontFamily: fonts.mono }]}>
                  when: {remindChoice === "custom" ? customDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : remindChoice}
                </Text>
              </View>
            </View>
          )}

          {/* Recent contacts row */}
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
                      if (p.handle) setHandle(p.handle);
                      else setHandle("");
                    }}
                    style={styles.recentItem}
                    activeOpacity={0.7}
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

          {/* Recent templates */}
          {templates.length > 0 && (
            <View style={{ marginBottom: 16 }}>
              <Text style={[styles.sectionLabel, { color: colors.textMuted, fontFamily: fonts.mono }]}>
                [quick templates (re-add)]
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.recentScroll}>
                {templates.map((t) => (
                  <TouchableOpacity
                    key={t.id}
                    onPress={() => {
                      setName(t.contactName);
                      setPlatform(t.platform);
                      setNote(t.note || "");
                      if (t.handle) setHandle(t.handle);
                      else setHandle("");
                      addToast({ message: "Template loaded ✓" });
                    }}
                    style={[
                      styles.templateChip,
                      {
                        borderColor: colors.border,
                        backgroundColor: colors.surface,
                        borderRadius: radius.sm,
                      },
                    ]}
                    activeOpacity={0.7}
                  >
                    <Text style={{ color: colors.textPrimary, fontFamily: fonts.sans, fontSize: 12 }}>
                      {t.contactName}
                    </Text>
                    <Text style={{ color: colors.textMuted, fontFamily: fonts.mono, fontSize: 10 }}>
                      [{t.platform}] {t.note ? `about ${t.note}` : ""}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Name input */}
          <Text style={[styles.sectionLabel, { color: colors.textMuted, fontFamily: fonts.mono, marginTop: 12 }]}>
            or type a name
          </Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.textPrimary, fontFamily: fonts.sans }]}
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
          {name.trim() !== "" && filteredContacts.length > 0 && (
            <View style={[styles.autocomplete, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              {filteredContacts.map((c) => (
                <TouchableOpacity
                  key={c.id}
                  onPress={() => {
                    setName(c.name);
                    setPlatform(c.platform);
                    if (c.handle) setHandle(c.handle);
                    else setHandle("");
                    Keyboard.dismiss();
                  }}
                  style={[styles.autocompleteItem, { borderBottomColor: colors.border }]}
                  activeOpacity={0.7}
                >
                  <Text style={{ color: colors.textPrimary, fontFamily: fonts.sans }}>{c.name}</Text>
                  <Text style={{ color: colors.textMuted, fontSize: 11, fontFamily: fonts.mono }}>{c.platform}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Handle input */}
          <Text style={[styles.sectionLabel, { color: colors.textMuted, fontFamily: fonts.mono, marginTop: 8 }]}>
            {getHandleLabel(platform, customAppName)}
          </Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
                color: colors.textPrimary,
                fontFamily: fonts.mono,
              },
            ]}
            placeholder={getHandlePlaceholder(platform, customAppName)}
            placeholderTextColor={colors.textMuted}
            value={handle}
            onChangeText={setHandle}
            autoCapitalize="none"
            autoCorrect={false}
          />

          {/* Platform selector */}
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
                      paddingVertical: 10,
                    },
                  ]}
                  activeOpacity={0.7}
                >
                  <Text
                    style={{
                      color: active ? colors.accentText : colors.textPrimary,
                      fontFamily: fonts.mono,
                      fontSize: 11,
                      textTransform: "lowercase",
                    }}
                  >
                    [{meta.value}]
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Custom App Name Input */}
          {platform === "other" && (
            <View style={{ marginBottom: 12 }}>
              <Text style={[styles.sectionLabel, { color: colors.textMuted, fontFamily: fonts.mono, marginTop: 8 }]}>
                custom app name
              </Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.textPrimary, fontFamily: fonts.sans }]}
                placeholder="e.g. Slack, WeChat, Signal, Email..."
                placeholderTextColor={colors.textMuted}
                value={customAppName}
                onChangeText={setCustomAppName}
              />
            </View>
          )}

          {/* Note field */}
          <Text style={[styles.sectionLabel, { color: colors.textMuted, fontFamily: fonts.mono, marginTop: 16 }]}>
            what's it about? (optional)
          </Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.textPrimary, fontFamily: fonts.sans }]}
            placeholder="message context..."
            placeholderTextColor={colors.textMuted}
            value={note}
            onChangeText={(t) => setNote(t.slice(0, 200))}
            maxLength={200}
          />

          {/* Note chips */}
          <View style={styles.chipsRow}>
            {NOTE_CHIPS.map((chip) => (
              <TouchableOpacity
                key={chip}
                onPress={() => setNote(chip)}
                style={[styles.chip, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.sm }]}
                activeOpacity={0.7}
              >
                <Text style={[styles.chipText, { color: colors.textMuted, fontFamily: fonts.mono, fontSize: 10, textTransform: "lowercase" }]}>
                  #{chip.replace(" ", "-")}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Remind choices */}
          <Text style={[styles.sectionLabel, { color: colors.textMuted, fontFamily: fonts.mono, marginTop: 16 }]}>
            remind me
          </Text>
          <View style={styles.remindPicker}>
            {[
              { id: "2h", label: "in 2h" },
              { id: "tonight", label: "tonight" },
              { id: "tomorrow", label: "tomorrow" },
              { id: "custom", label: "custom" },
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
                      borderColor: active ? colors.textPrimary : colors.border,
                      borderRadius: radius.sm,
                      borderWidth: 1,
                    },
                  ]}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.remindButtonText, { color: active ? colors.bg : colors.textMuted, fontFamily: fonts.mono, fontSize: 11, textTransform: "lowercase" }]}>
                    [{opt.label}]
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Custom Date Picker (Scrolling wheel) */}
          {remindChoice === "custom" && (
            <View style={[styles.customPicker, { borderColor: colors.border, backgroundColor: colors.surface, borderRadius: radius.md, paddingVertical: 16 }]}>
              {RNPlatform.OS === "ios" ? (
                <DateTimePicker
                  value={customDate}
                  mode="datetime"
                  display="spinner"
                  textColor={colors.textPrimary}
                  onValueChange={(event, date) => {
                    setCustomDate(date);
                  }}
                  style={{ height: 180, width: "100%" }}
                />
              ) : RNPlatform.OS === "web" ? (
                <View style={{ paddingHorizontal: 12, paddingVertical: 8 }}>
                  <Text style={[styles.customLabel, { color: colors.textPrimary, fontFamily: fonts.sans, marginBottom: 8 }]}>
                    Date & Time
                  </Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: colors.bg, borderColor: colors.border, color: colors.textPrimary, fontFamily: fonts.mono }]}
                    placeholder="YYYY-MM-DDTHH:MM"
                    value={customDate.toISOString().slice(0, 16)}
                    onChangeText={(text) => {
                      const parsed = Date.parse(text);
                      if (!isNaN(parsed)) setCustomDate(new Date(parsed));
                    }}
                  />
                </View>
              ) : (
                <View style={{ gap: 12, paddingHorizontal: 12 }}>
                  <TouchableOpacity
                    onPress={() => setShowAndroidDate(true)}
                    activeOpacity={0.7}
                    style={{
                      borderWidth: 1,
                      borderColor: colors.border,
                      borderRadius: radius.sm,
                      padding: 12,
                      alignItems: "center",
                      backgroundColor: colors.bg,
                    }}
                  >
                    <Text style={{ color: colors.textPrimary, fontFamily: fonts.mono, fontSize: 13 }}>
                      date: {customDate.toLocaleDateString()}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => setShowAndroidTime(true)}
                    activeOpacity={0.7}
                    style={{
                      borderWidth: 1,
                      borderColor: colors.border,
                      borderRadius: radius.sm,
                      padding: 12,
                      alignItems: "center",
                      backgroundColor: colors.bg,
                    }}
                  >
                    <Text style={{ color: colors.textPrimary, fontFamily: fonts.mono, fontSize: 13 }}>
                      time: {customDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </Text>
                  </TouchableOpacity>

                  {showAndroidDate && (
                    <DateTimePicker
                      value={customDate}
                      mode="date"
                      display="spinner"
                      onValueChange={(event, date) => {
                        setShowAndroidDate(false);
                        const newDate = new Date(customDate);
                        newDate.setFullYear(date.getFullYear(), date.getMonth(), date.getDate());
                        setCustomDate(newDate);
                      }}
                      onDismiss={() => {
                        setShowAndroidDate(false);
                      }}
                    />
                  )}

                  {showAndroidTime && (
                    <DateTimePicker
                      value={customDate}
                      mode="time"
                      display="spinner"
                      onValueChange={(event, date) => {
                        setShowAndroidTime(false);
                        const newDate = new Date(customDate);
                        newDate.setHours(date.getHours(), date.getMinutes());
                        setCustomDate(newDate);
                      }}
                      onDismiss={() => {
                        setShowAndroidTime(false);
                      }}
                    />
                  )}
                </View>
              )}
            </View>
          )}

          {/* Save Button */}
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
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 120, // space for bottom tab bar
  },
  brandText: {
    fontSize: 18,
    fontStyle: "italic",
    marginBottom: 8,
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
    width: 54,
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
    textAlign: "center",
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
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    width: "48%", // 2-column grid
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
    gap: 8,
    marginVertical: 8,
    flexWrap: "wrap",
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
  customPicker: {
    borderWidth: 1,
    padding: 12,
    marginVertical: 8,
    gap: 12,
  },
  customRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  customLabel: {
    fontSize: 13,
    fontWeight: "500",
  },
  customInput: {
    borderWidth: 1,
    borderRadius: 6,
    width: 60,
    height: 32,
    textAlign: "center",
    fontSize: 14,
    padding: 0,
  },
  divider: {
    height: 1,
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
  nlpBadgesRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 12,
  },
  nlpBadge: {
    borderWidth: 1,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  nlpBadgeText: {
    fontSize: 10,
  },
  templateChip: {
    borderWidth: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginRight: 8,
    gap: 4,
    alignItems: "flex-start",
  },
});
