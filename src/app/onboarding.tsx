import React, { useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Image } from "expo-image";
import { useTheme } from "@/lib/theme";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export default function OnboardingScreen() {
  const { colors, fonts, spacing, radius } = useTheme();
  const router = useRouter();
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);

  const slides = [
    {
      title: "Some replies just need a little push.",
      description: "Echo helps you remember to reply to the people who matter most by keeping a gentle list of pending message responses.",
    },
    {
      title: "Type or quick parse.",
      description: "Enter a contact name, or type a natural sentence like 'reply to Simran on whatsapp tomorrow' in the quick parse bar to auto-fill fields.",
    },
    {
      title: "Direct chat routing.",
      description: "Deep link directly to specific threads using optional handles. Swipe native notifications to mark completed or snooze in the background.",
    },
  ];

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(contentOffsetX / SCREEN_WIDTH);
    setActiveIndex(index);
  };

  const handleComplete = async () => {
    await AsyncStorage.setItem("echo-onboarded", "true");
    router.replace("/");
  };

  const handleNext = () => {
    if (activeIndex < slides.length - 1) {
      scrollViewRef.current?.scrollTo({
        x: (activeIndex + 1) * SCREEN_WIDTH,
        animated: true,
      });
      setActiveIndex(activeIndex + 1);
    } else {
      handleComplete();
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]} edges={["top", "bottom", "left", "right"]}>
      {/* Brand logo in the top area */}
      <View style={styles.logoContainer}>
        <Image
          source={require("@/assets/images/icon.png")}
          style={styles.logoImage}
          contentFit="cover"
        />
      </View>

      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        style={styles.slidesContainer}
      >
        {slides.map((slide, index) => (
          <View key={index} style={styles.slide}>
            <View style={styles.textGroup}>
              <Text style={[styles.title, { color: colors.textPrimary, fontFamily: fonts.serif }]}>
                {slide.title}
              </Text>
              <Text style={[styles.description, { color: colors.textMuted, fontFamily: fonts.sans }]}>
                {slide.description}
              </Text>
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Pagination & CTA layout */}
      <View style={styles.footer}>
        <View style={styles.dotsRow}>
          {slides.map((_, index) => (
            <View
              key={index}
              style={[
                styles.dot,
                {
                  backgroundColor: activeIndex === index ? colors.pending : colors.border,
                  width: activeIndex === index ? 24 : 8,
                  borderRadius: radius.full,
                },
              ]}
            />
          ))}
        </View>

        <TouchableOpacity
          onPress={handleNext}
          activeOpacity={0.8}
          style={[styles.ctaButton, { backgroundColor: colors.textPrimary, borderRadius: radius.full }]}
        >
          <Text style={[styles.ctaText, { color: colors.bg, fontFamily: fonts.sans }]}>
            {activeIndex === slides.length - 1 ? "Let's Go" : "Continue"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={handleComplete} style={styles.skipButton}>
          <Text style={[styles.skipText, { color: colors.textMuted, fontFamily: fonts.sans }]}>
            skip onboarding
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "space-between",
  },
  logoContainer: {
    alignItems: "center",
    marginTop: 60,
    height: 120,
    justifyContent: "center",
  },
  logoImage: {
    width: 100,
    height: 100,
    borderRadius: 20,
  },
  slidesContainer: {
    flexGrow: 0,
    height: 260,
  },
  slide: {
    width: SCREEN_WIDTH,
    paddingHorizontal: 32,
    justifyContent: "center",
  },
  textGroup: {
    gap: 16,
  },
  title: {
    fontSize: 28,
    fontStyle: "italic",
    lineHeight: 36,
  },
  description: {
    fontSize: 15,
    lineHeight: 22,
  },
  footer: {
    paddingHorizontal: 32,
    paddingBottom: 40,
    alignItems: "center",
    gap: 24,
  },
  dotsRow: {
    flexDirection: "row",
    gap: 8,
    justifyContent: "center",
  },
  dot: {
    height: 8,
  },
  ctaButton: {
    width: "100%",
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  ctaText: {
    fontSize: 14,
    fontWeight: "600",
  },
  skipButton: {
    paddingVertical: 8,
  },
  skipText: {
    fontSize: 12,
    textDecorationLine: "underline",
  },
});
