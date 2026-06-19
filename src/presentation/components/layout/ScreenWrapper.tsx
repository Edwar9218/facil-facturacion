import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../../../theme";
import { AppText } from "../ui/AppText";

interface Props {
  children: React.ReactNode;
  showBackButton?: boolean;
  title?: string;
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
  title,
  labelBtnA = "volver",
  labelBtnB = "continuar",
  onPressBtnA,
  onPressBtnB,
  showBtnA = true,
  showBtnB = false,
}: Props) => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, typography, spacing } = useTheme();

  return (
    <View style={{ flex: 1, backgroundColor: colors.grayBg }}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor={colors.white}
        translucent
      />

      {/* HEADER estilo WhatsApp */}
      <View
        style={[
          s.header,
          {
            backgroundColor: colors.white,
            paddingTop: insets.top,
            borderBottomColor: "#F0F0F0",
          },
        ]}
      >
        {/* BOTÓN VOLVER */}
        <View style={s.sideSlot}>
          {showBackButton && showBtnA && labelBtnA ? (
            <TouchableOpacity
              style={s.backBtn}
              activeOpacity={0.7}
              onPress={onPressBtnA ?? (() => router.back())}
            >
              <Feather name="chevron-left" size={22} color={colors.grayText} />
              <AppText
                style={{
                  fontSize: typography.size.md,
                  color: colors.grayText,
                  fontWeight: typography.weight.regular,
                }}
              >
                {labelBtnA}
              </AppText>
            </TouchableOpacity>
          ) : (
            <View />
          )}
        </View>

        {/* TÍTULO CENTRAL */}
        <AppText
          style={{
            fontSize: 20,
            fontWeight: "800",
            color: colors.primary,
            letterSpacing: -0.3,
          }}
        >
          Fácil
        </AppText>

        {/* BOTÓN B */}
        <View style={[s.sideSlot, { alignItems: "flex-end" }]}>
          {showBtnB && labelBtnB ? (
            <TouchableOpacity
              style={s.backBtn}
              activeOpacity={0.7}
              onPress={onPressBtnB}
            >
              <AppText
                style={{
                  fontSize: typography.size.md,
                  color: colors.grayText,
                  fontWeight: typography.weight.regular,
                }}
              >
                {labelBtnB}
              </AppText>
              <Feather name="chevron-right" size={22} color={colors.grayText} />
            </TouchableOpacity>
          ) : (
            <View />
          )}
        </View>
      </View>

      {/* CONTENIDO */}
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            paddingBottom: insets.bottom + spacing.lg,
          }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* TÍTULO DE PANTALLA */}
          {title && (
            <AppText
              style={{
                fontSize: typography.size.xxl,
                fontWeight: typography.weight.extraBold,
                color: colors.ink,
                paddingHorizontal: spacing.lg,
                paddingTop: spacing.lg,
                paddingBottom: spacing.xs,
              }}
            >
              {title}
            </AppText>
          )}

          {children}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const s = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 10,
    borderBottomWidth: 1,
  },
  sideSlot: {
    width: 90,
    justifyContent: "center",
  },
  backBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    paddingVertical: 8,
  },
});
