import { Feather } from "@expo/vector-icons";
import React from "react";
import { Modal, TouchableOpacity, View } from "react-native";
import { useTheme } from "../../../theme";
import { AppText } from "./AppText";

interface Props {
  visible: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}

export const AppModal = ({
  visible,
  onClose,
  title,
  subtitle,
  children,
}: Props) => {
  const { colors, radius, spacing, typography, shadows } = useTheme();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={{
          flex: 1,
          backgroundColor: colors.overlayDark,
          justifyContent: "flex-end",
        }}
        activeOpacity={1}
        onPress={onClose}
      >
        <TouchableOpacity
          activeOpacity={1}
          style={{
            backgroundColor: colors.white,
            borderTopLeftRadius: radius.xxl,
            borderTopRightRadius: radius.xxl,
            padding: spacing.lg,
            paddingBottom: spacing.xxxl,
            maxHeight: "90%",
          }}
        >
          {/* Handle */}
          <View
            style={{
              width: 36,
              height: 4,
              backgroundColor: colors.grayBorder,
              borderRadius: radius.full,
              alignSelf: "center",
              marginBottom: spacing.md,
            }}
          />

          {/* Header */}
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "flex-start",
              marginBottom: spacing.md,
            }}
          >
            <View style={{ flex: 1 }}>
              <AppText
                style={{
                  fontSize: typography.size.xl,
                  fontWeight: typography.weight.bold,
                  color: colors.ink,
                }}
              >
                {title}
              </AppText>
              {subtitle && (
                <AppText
                  style={{
                    fontSize: typography.size.sm,
                    color: colors.grayText,
                    marginTop: spacing.xxs,
                  }}
                >
                  {subtitle}
                </AppText>
              )}
            </View>
            <TouchableOpacity
              style={{
                width: 32,
                height: 32,
                borderRadius: radius.full,
                backgroundColor: colors.grayText,
                alignItems: "center",
                justifyContent: "center",
              }}
              onPress={onClose}
            >
              <Feather name="x" size={16} color={colors.white} />
            </TouchableOpacity>
          </View>

          {children}
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
};
