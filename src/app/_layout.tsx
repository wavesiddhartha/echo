import React, { useEffect } from "react";
import { DarkTheme, DefaultTheme, ThemeProvider } from "expo-router/react-navigation";
import { useColorScheme, View, ActivityIndicator } from "react-native";
import { Tabs, useRouter, useSegments } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { StatusBar } from "expo-status-bar";
import * as Notifications from "expo-notifications";
import { markDone, snoozeReply, getReplyById } from "@/lib/db";
import { scheduleNotification } from "@/lib/notifications";

import {
  useFonts,
  InstrumentSerif_400Regular,
  InstrumentSerif_400Regular_Italic,
} from "@expo-google-fonts/instrument-serif";
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
} from "@expo-google-fonts/inter";
import {
  JetBrainsMono_400Regular,
  JetBrainsMono_500Medium,
} from "@expo-google-fonts/jetbrains-mono";

import { BottomNavBar } from "@/components/BottomNavBar";
import { useTheme } from "@/lib/theme";

export default function RootLayout() {
  const router = useRouter();
  const segments = useSegments();
  const { colors, isDark } = useTheme();
  
  const [fontsLoaded] = useFonts({
    InstrumentSerif_400Regular,
    InstrumentSerif_400Regular_Italic,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    JetBrainsMono_400Regular,
    JetBrainsMono_500Medium,
  });

  useEffect(() => {
    const checkOnboarding = async () => {
      const onboarded = await AsyncStorage.getItem("echo-onboarded");
      if (onboarded !== "true") {
        // Redirect to onboarding page first
        router.replace("/onboarding");
      }
    };
    if (fontsLoaded) {
      checkOnboarding();
    }
  }, [fontsLoaded]);

  useEffect(() => {
    const registerCategories = async () => {
      await Notifications.setNotificationCategoryAsync("REPLY_REMINDER", [
        {
          identifier: "replied",
          buttonTitle: "Replied ✓",
          options: {
            opensAppToForeground: false,
          },
        },
        {
          identifier: "snooze",
          buttonTitle: "Snooze 1h",
          options: {
            opensAppToForeground: false,
          },
        },
      ]);
    };
    registerCategories();

    const subscription = Notifications.addNotificationResponseReceivedListener(async (response) => {
      const { actionIdentifier, notification } = response;
      const data = notification.request.content.data;
      const replyId = data && typeof data === "object" ? (data.replyId as string | undefined) : undefined;

      if (!replyId) return;

      try {
        if (actionIdentifier === "replied") {
          console.log(`[Notification Action] Marking reply ${replyId} as replied (done)`);
          await markDone(replyId);
        } else if (actionIdentifier === "snooze") {
          console.log(`[Notification Action] Snoozing reply ${replyId} for 1 hour`);
          const reply = await getReplyById(replyId);
          if (reply) {
            const until = new Date();
            until.setHours(until.getHours() + 1);
            until.setSeconds(0, 0);

            await snoozeReply(replyId, until);

            const updatedReply = {
              ...reply,
              status: "snoozed" as const,
              remindAt: until.toISOString(),
            };
            await scheduleNotification(updatedReply);
          }
        }
      } catch (err) {
        console.error("Error handling notification action", err);
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="small" color="#C8A96E" />
      </View>
    );
  }

  const activeTheme = isDark ? DarkTheme : DefaultTheme;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider value={activeTheme}>
        <StatusBar style={isDark ? "light" : "dark"} />
        <Tabs
          tabBar={(props) => <BottomNavBar {...props} />}
          screenOptions={{
            headerShown: false,
            tabBarShowLabel: false,
          }}
        >
          <Tabs.Screen name="index" options={{ title: "home" }} />
          <Tabs.Screen name="add" options={{ title: "add" }} />
          <Tabs.Screen name="done" options={{ title: "done" }} />
          <Tabs.Screen name="settings" options={{ title: "settings" }} />
          <Tabs.Screen name="onboarding" options={{ title: "onboarding" }} />
        </Tabs>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}

