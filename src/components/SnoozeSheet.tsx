import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, Platform as RNPlatform, TextInput } from "react-native";
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withTiming, runOnJS } from "react-native-reanimated";
import { useTheme } from "@/lib/theme";
import DateTimePicker from "@react-native-community/datetimepicker";

const { height: WINDOW_HEIGHT } = Dimensions.get("window");

interface SnoozeSheetProps {
  replyId: string;
  onConfirm: (id: string, until: Date) => void;
  onClose: () => void;
}

const SNOOZE_OPTIONS = [
  {
    label: "+1 hour",
    getDate: () => {
      const d = new Date();
      d.setHours(d.getHours() + 1);
      return d;
    },
  },
  {
    label: "Tonight 9 PM",
    getDate: () => {
      const d = new Date();
      d.setHours(21, 0, 0, 0);
      if (d <= new Date()) d.setDate(d.getDate() + 1);
      return d;
    },
  },
  {
    label: "Tomorrow 9 AM",
    getDate: () => {
      const d = new Date();
      d.setDate(d.getDate() + 1);
      d.setHours(9, 0, 0, 0);
      return d;
    },
  },
  {
    label: "In 3 days",
    getDate: () => {
      const d = new Date();
      d.setDate(d.getDate() + 3);
      d.setHours(9, 0, 0, 0);
      return d;
    },
  },
];

export function SnoozeSheet({ replyId, onConfirm, onClose }: SnoozeSheetProps) {
  const { colors, fonts, radius } = useTheme();

  // Custom picker state
  const [showCustomPicker, setShowCustomPicker] = useState(false);
  const [customDate, setCustomDate] = useState<Date>(() => {
    const d = new Date();
    d.setHours(d.getHours() + 1);
    d.setMinutes(0, 0, 0);
    return d;
  });
  const [showAndroidDate, setShowAndroidDate] = useState(false);
  const [showAndroidTime, setShowAndroidTime] = useState(false);

  // Animations
  const translateY = useSharedValue(WINDOW_HEIGHT);
  const backdropOpacity = useSharedValue(0);

  useEffect(() => {
    translateY.value = withSpring(0, { damping: 28, stiffness: 220 });
    backdropOpacity.value = withTiming(0.5, { duration: 250 });
  }, []);

  const handleClose = () => {
    backdropOpacity.value = withTiming(0, { duration: 200 });
    translateY.value = withSpring(WINDOW_HEIGHT, { damping: 26, stiffness: 220 }, (finished) => {
      if (finished) {
        runOnJS(onClose)();
      }
    });
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  return (
    <View style={StyleSheet.absoluteFill}>
      {/* Backdrop */}
      <Animated.View style={[styles.backdrop, backdropStyle]} onTouchEnd={handleClose} />

      {/* Sheet Container */}
      <View style={styles.sheetContainer}>
        <Animated.View style={[styles.sheet, { backgroundColor: colors.surface, borderTopColor: colors.border }, animatedStyle]}>
          {/* Drag handle */}
          <View style={[styles.dragHandle, { backgroundColor: colors.border }]} />

          <Text style={[styles.title, { color: colors.textPrimary, fontFamily: fonts.serif }]}>
            Snooze until
          </Text>

          {!showCustomPicker ? (
            <View style={styles.optionsContainer}>
              {SNOOZE_OPTIONS.map((opt) => (
                <TouchableOpacity
                  key={opt.label}
                  onPress={() => {
                    onConfirm(replyId, opt.getDate());
                    handleClose();
                  }}
                  activeOpacity={0.7}
                  style={[styles.optionButton, { backgroundColor: colors.bg, borderColor: colors.border, borderRadius: radius.md }]}
                >
                  <Text style={[styles.optionText, { color: colors.textPrimary, fontFamily: fonts.sans }]}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              ))}

              <TouchableOpacity
                onPress={() => setShowCustomPicker(true)}
                activeOpacity={0.7}
                style={[styles.optionButton, { backgroundColor: colors.bg, borderColor: colors.border, borderRadius: radius.md }]}
              >
                <Text style={[styles.optionText, { color: colors.textPrimary, fontFamily: fonts.sans }]}>
                  Custom...
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={{ gap: 12, marginBottom: 16 }}>
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
                <View style={{ paddingVertical: 8 }}>
                  <TextInput
                    style={{
                      height: 44,
                      borderWidth: 1,
                      borderColor: colors.border,
                      backgroundColor: colors.bg,
                      color: colors.textPrimary,
                      borderRadius: radius.md,
                      paddingHorizontal: 12,
                      fontFamily: fonts.mono,
                      marginBottom: 12,
                    }}
                    placeholder="YYYY-MM-DDTHH:MM"
                    value={customDate.toISOString().slice(0, 16)}
                    onChangeText={(text) => {
                      const parsed = Date.parse(text);
                      if (!isNaN(parsed)) setCustomDate(new Date(parsed));
                    }}
                  />
                </View>
              ) : (
                <View style={{ gap: 12 }}>
                  <TouchableOpacity
                    onPress={() => setShowAndroidDate(true)}
                    activeOpacity={0.7}
                    style={{
                      borderWidth: 1,
                      borderColor: colors.border,
                      borderRadius: radius.md,
                      padding: 14,
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
                      borderRadius: radius.md,
                      padding: 14,
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

              <TouchableOpacity
                onPress={() => {
                  onConfirm(replyId, customDate);
                  handleClose();
                }}
                activeOpacity={0.8}
                style={{
                  backgroundColor: colors.textPrimary,
                  borderRadius: radius.full,
                  height: 48,
                  alignItems: "center",
                  justifyContent: "center",
                  marginTop: 8,
                }}
              >
                <Text style={{ color: colors.bg, fontFamily: fonts.sans, fontWeight: "600", fontSize: 14 }}>
                  Confirm snooze
                </Text>
              </TouchableOpacity>
            </View>
          )}

          <TouchableOpacity
            onPress={showCustomPicker ? () => setShowCustomPicker(false) : handleClose}
            activeOpacity={0.7}
            style={[styles.cancelButton, { borderRadius: radius.full }]}
          >
            <Text style={[styles.cancelText, { color: colors.textMuted, fontFamily: fonts.sans }]}>
              {showCustomPicker ? "Back" : "Cancel"}
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
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
    paddingBottom: 40,
  },
  dragHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontStyle: "italic",
    marginBottom: 20,
    fontWeight: "300",
  },
  optionsContainer: {
    gap: 8,
    marginBottom: 16,
  },
  optionButton: {
    borderWidth: 1,
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: "flex-start",
  },
  optionText: {
    fontSize: 14,
    fontWeight: "500",
  },
  cancelButton: {
    paddingVertical: 12,
    alignItems: "center",
  },
  cancelText: {
    fontSize: 14,
    fontWeight: "500",
  },
});
