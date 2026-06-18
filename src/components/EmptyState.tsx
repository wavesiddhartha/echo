import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { useTheme } from "@/lib/theme";
import Svg, { Path } from "react-native-svg";

export function EmptyState() {
  const { colors, fonts } = useTheme();
  const router = useRouter();

  return (
    <View style={styles.container}>
      {/* Golden Wave Logo */}
      <View style={styles.waveContainer}>
        <Svg width="48" height="12" viewBox="0 0 48 12" fill="none">
          <Path
            d="M2 6C6 2 10 2 14 6C18 10 22 10 26 6C30 2 34 2 38 6C42 10 46 10 48 8"
            stroke={colors.pending}
            strokeWidth="2"
            strokeLinecap="round"
          />
        </Svg>
      </View>

      <View style={styles.textContainer}>
        <Text style={[styles.heading, { color: colors.textPrimary, fontFamily: fonts.serif }]}>
          You're all caught up.
        </Text>
        <Text style={[styles.subheading, { color: colors.textMuted, fontFamily: fonts.sans }]}>
          No pending replies.
        </Text>
      </View>

      <TouchableOpacity
        onPress={() => router.replace("/add")}
        activeOpacity={0.7}
        style={styles.addButton}
      >
        <Text style={[styles.addButtonText, { color: colors.textPrimary, fontFamily: fonts.sans }]}>
          + Add one
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 48,
    paddingHorizontal: 24,
  },
  waveContainer: {
    marginBottom: 16,
  },
  textContainer: {
    alignItems: "center",
    marginBottom: 24,
  },
  heading: {
    fontSize: 26,
    fontStyle: "italic",
    textAlign: "center",
    marginBottom: 6,
  },
  subheading: {
    fontSize: 14,
    textAlign: "center",
  },
  addButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: "500",
    textTransform: "lowercase",
  },
});
