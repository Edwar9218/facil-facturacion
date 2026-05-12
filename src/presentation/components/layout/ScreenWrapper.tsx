import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../../../theme";

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
  const { colors, typography, spacing, shadows, sizes } = useTheme();

  return (
    <View style={{ flex: 1, backgroundColor: colors.grayBg }}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor={colors.white}
        translucent
      />

      {/* HEADER */}
      <View
        style={[
          {
            backgroundColor: colors.white,
            paddingHorizontal: spacing.sm,
            paddingBottom: spacing.md,
            ...shadows.md,
          },
          { paddingTop: insets.top + 8 },
        ]}
      >
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          {/* BOTÓN A */}
          <View style={{ width: 100, alignItems: "flex-start" }}>
            {showBackButton && showBtnA && labelBtnA ? (
              <TouchableOpacity
                style={{ flexDirection: "row", alignItems: "center", gap: 2 }}
                activeOpacity={0.7}
                onPress={onPressBtnA ?? (() => router.back())}
              >
                <Feather
                  name="chevron-left"
                  size={sizes.iconMd}
                  color={colors.grayText}
                />
                <Text
                  style={{
                    fontSize: typography.size.lg,
                    fontWeight: typography.weight.regular,
                    color: colors.grayText,
                  }}
                >
                  {labelBtnA}
                </Text>
              </TouchableOpacity>
            ) : (
              <View style={{ width: 100, height: 46 }} />
            )}
          </View>

          {/* LOGO */}
          <View
            style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
          >
            <MaterialCommunityIcons
              name="receipt-text-check-outline"
              size={36}
              color={colors.primary}
            />
            <Text
              style={{
                fontSize: typography.size.xxl,
                fontWeight: typography.weight.black,
                color: colors.primary,
                marginTop: -4,
              }}
            >
              Fácil
            </Text>
          </View>

          {/* BOTÓN B */}
          <View style={{ width: 100, alignItems: "flex-end" }}>
            {showBtnB && labelBtnB ? (
              <TouchableOpacity
                style={{ flexDirection: "row", alignItems: "center", gap: 2 }}
                activeOpacity={0.7}
                onPress={onPressBtnB}
              >
                <Text
                  style={{
                    fontSize: typography.size.lg,
                    fontWeight: typography.weight.regular,
                    color: colors.grayText,
                  }}
                >
                  {labelBtnB}
                </Text>
                <Feather
                  name="chevron-right"
                  size={sizes.iconMd}
                  color={colors.grayText}
                />
              </TouchableOpacity>
            ) : (
              <View style={{ width: 100, height: 46 }} />
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
          contentContainerStyle={{
            flexGrow: 1,
            paddingBottom: insets.bottom + spacing.lg,
          }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* TÍTULO */}
          {title && (
            <Text
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
            </Text>
          )}

          {children}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};
