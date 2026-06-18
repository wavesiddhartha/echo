import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useTheme } from "@/lib/theme";
import Svg, { Circle, Line, Polyline, Path } from "react-native-svg";


const HomeIcon = ({ active, colors }: { active: boolean; colors: any }) => (
  <Svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="9" stroke={active ? colors.pending : colors.textMuted} strokeWidth="2" strokeDasharray="3 3" opacity={active ? 1 : 0.6} />
    <Circle cx="12" cy="12" r="5" stroke={active ? colors.pending : colors.textMuted} strokeWidth="2" />
    <Circle cx="12" cy="12" r="2" fill={active ? colors.pending : colors.textMuted} />
  </Svg>
);

const PlusIcon = ({ active, colors }: { active: boolean; colors: any }) => (
  <Svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <Line x1="12" y1="5" x2="12" y2="19" stroke={active ? colors.textPrimary : colors.textMuted} strokeWidth="2.5" strokeLinecap="round" />
    <Line x1="5" y1="12" x2="19" y2="12" stroke={active ? colors.textPrimary : colors.textMuted} strokeWidth="2.5" strokeLinecap="round" />
  </Svg>
);

const DoneIcon = ({ active, colors }: { active: boolean; colors: any }) => (
  <Svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <Polyline
      points="20 6 9 17 4 12"
      stroke={active ? colors.done : colors.textMuted}
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const SettingsIcon = ({ active, colors }: { active: boolean; colors: any }) => (
  <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={active ? colors.textPrimary : colors.textMuted} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Circle cx="12" cy="12" r="3" />
    <Path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </Svg>
);

const OnboardingIcon = ({ active, colors }: { active: boolean; colors: any }) => (
  <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={active ? colors.textPrimary : colors.textMuted} strokeWidth="2" strokeLinecap="round">
    <Path d="M2 12c3-4 6-4 9 0s6 4 9 0" />
  </Svg>
);

export function BottomNavBar({ state, descriptors, navigation }: any) {
  const { colors, fonts, radius } = useTheme();
  const [isOnboarded, setIsOnboarded] = useState<boolean | null>(null);

  useEffect(() => {
    // Check if onboarded to dynamically hide tab bar on first install
    const checkOnboarded = async () => {
      const stored = await AsyncStorage.getItem("echo-onboarded");
      setIsOnboarded(stored === "true");
    };
    checkOnboarded();
  }, [state]);

  const activeRoute = state.routes[state.index];

  // Hide tab bar if user is not onboarded and is currently on onboarding screen
  if (activeRoute.name === "onboarding" && isOnboarded === false) {
    return null;
  }

  const visibleRoutes = state.routes.filter((route: any) => route.name !== "onboarding");

  return (
    <View style={[styles.container, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.full }]}>
      {visibleRoutes.map((route: any) => {
        const isFocused = state.routes[state.index]?.key === route.key;

        const onPress = () => {
          const event = navigation.emit({
            type: "tabPress",
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        const renderIcon = () => {
          switch (route.name) {
            case "index":
              return <HomeIcon active={isFocused} colors={colors} />;
            case "add":
              return <PlusIcon active={isFocused} colors={colors} />;
            case "done":
              return <DoneIcon active={isFocused} colors={colors} />;
            case "settings":
              return <SettingsIcon active={isFocused} colors={colors} />;
            default:
              return null;
          }
        };

        const label = route.name === "index" ? "home" : route.name;

        return (
          <TouchableOpacity
            key={route.key}
            onPress={onPress}
            activeOpacity={0.7}
            style={styles.tabButton}
          >
            {renderIcon()}
            <Text
              style={[
                styles.tabLabel,
                {
                  color: isFocused
                    ? route.name === "index"
                      ? colors.pending
                      : route.name === "done"
                      ? colors.done
                      : colors.textPrimary
                    : colors.textMuted,
                  fontFamily: fonts.mono,
                },
              ]}
              numberOfLines={1}
            >
              {label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 24,
    left: 16,
    right: 16,
    height: 62,
    borderWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 8,
    zIndex: 102,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  tabButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    height: 48,
    gap: 3,
  },
  tabLabel: {
    fontSize: 9,
    letterSpacing: 0.2,
    textTransform: "lowercase",
    textAlign: "center",
  },
});
