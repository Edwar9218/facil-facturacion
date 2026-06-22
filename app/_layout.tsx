import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  Inter_800ExtraBold,
  Inter_900Black,
} from "@expo-google-fonts/inter";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useCallback } from "react";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { initDatabase } from "../src/data/database/database";
import { ThemeProvider } from "../src/theme/ThemeContext";

SplashScreen.preventAutoHideAsync();
initDatabase();

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    // ── Íconos ──────────────────────────────────────────────────────────────
    ...MaterialCommunityIcons.font,
    ...Feather.font,
    // ── Inter (fuente global de la app) ─────────────────────────────────────
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Inter_800ExtraBold,
    Inter_900Black,
  });

  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded || fontError) {
      await SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <ThemeProvider>
      <SafeAreaProvider onLayout={onLayoutRootView}>
        <KeyboardProvider>
          <Stack screenOptions={{ headerShown: false }} />
        </KeyboardProvider>
      </SafeAreaProvider>
    </ThemeProvider>
  );
}
