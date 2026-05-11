import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import {
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const COLORS = {
  BLUE: "#2B8EF0",
  GRAY_BG: "#F0F4FA",
  GRAY_BORDER: "#DDE3EE",
  GRAY_TEXT: "#8492A6",
  WHITE: "#FFFFFF",
};

interface Props {
  children: React.ReactNode;
  showBackButton?: boolean;
  labelBtnA?: string;
  labelBtnB?: string;
  onPressBtnA?: () => void;
  onPressBtnB?: () => void;
  showBtnA?: boolean;
  showBtnB?: boolean;
}

export const ScreenWrapper = ({
  children,
  showBackButton = true,
  labelBtnA = "volver",
  labelBtnB = "continuar",
  onPressBtnA,
  onPressBtnB,
  showBtnA = true,
  showBtnB = false,
}: Props) => {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.mainWrapper}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor={COLORS.WHITE}
        translucent
      />

      {/* HEADER */}
      <View
        style={[
          styles.header,
          {
            paddingTop: insets.top + 8,
          },
        ]}
      >
        <View style={styles.headerRow}>
          {/* BOTÓN A */}
          <View
            style={[
              styles.sideSlot,
              {
                alignItems: "flex-start",
              },
            ]}
          >
            {showBackButton && showBtnA && labelBtnA ? (
              <TouchableOpacity
                style={styles.backBtn}
                activeOpacity={0.7}
                onPress={onPressBtnA ?? (() => router.back())}
              >
                <Feather
                  name="chevron-left"
                  size={22}
                  color={COLORS.GRAY_TEXT}
                />

                <Text style={styles.backText}>{labelBtnA}</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.spacer} />
            )}
          </View>

          {/* LOGO */}
          <View style={styles.logoContainer}>
            <MaterialCommunityIcons
              name="receipt-text-check-outline"
              size={36}
              color={COLORS.BLUE}
            />

            <Text style={styles.logoText}>Fácil</Text>
          </View>

          {/* BOTÓN B */}
          <View
            style={[
              styles.sideSlot,
              {
                alignItems: "flex-end",
              },
            ]}
          >
            {showBtnB && labelBtnB ? (
              <TouchableOpacity
                style={styles.backBtn}
                activeOpacity={0.7}
                onPress={onPressBtnB}
              >
                <Text style={styles.backText}>{labelBtnB}</Text>

                <Feather
                  name="chevron-right"
                  size={22}
                  color={COLORS.GRAY_TEXT}
                />
              </TouchableOpacity>
            ) : (
              <View style={styles.spacer} />
            )}
          </View>
        </View>
      </View>

      {/* CONTENIDO */}
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            {
              paddingBottom: insets.bottom + 20,
            },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {children}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  mainWrapper: {
    flex: 1,
    backgroundColor: COLORS.GRAY_BG,
  },

  header: {
    backgroundColor: COLORS.WHITE,
    paddingHorizontal: 12,
    paddingBottom: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },

  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  sideSlot: {
    width: 100,
  },

  spacer: {
    width: 100,
    height: 46,
  },

  backBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },

  backText: {
    fontSize: 18,
    fontWeight: "400",
    color: COLORS.GRAY_TEXT,
  },

  logoContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  logoText: {
    fontSize: 28,
    fontWeight: "900",
    color: COLORS.BLUE,
    marginTop: -4,
  },

  scrollContent: {
    flexGrow: 1,
  },
});
