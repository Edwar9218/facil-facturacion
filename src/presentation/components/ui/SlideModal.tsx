import React from "react";
import { Animated, Modal, TouchableOpacity, View } from "react-native";
import { useTheme } from "../../../theme";
import { SlideModalType } from "../../hooks/useSlideModal";

interface Props {
  modal: SlideModalType;
  children: React.ReactNode;
  onClose?: () => void;
  oculto?: boolean;
}

export const SlideModal = ({
  modal,
  children,
  onClose,
  oculto = false,
}: Props) => {
  const { colors, spacing, radius } = useTheme();

  const handleClose = () => modal.cerrar(onClose);

  return (
    <Modal
      visible={modal.visible}
      transparent
      animationType="none"
      onRequestClose={handleClose}
    >
      <TouchableOpacity
        style={{
          flex: 1,
          backgroundColor: colors.overlayDark,
          justifyContent: "flex-end",
          opacity: oculto ? 0 : 1, // ← invisible pero existe
        }}
        activeOpacity={1}
        onPress={handleClose}
      >
        <TouchableOpacity activeOpacity={1}>
          <Animated.View
            style={[
              {
                backgroundColor: colors.white,
                borderTopLeftRadius: radius.xxl,
                borderTopRightRadius: radius.xxl,
                padding: spacing.lg,
                paddingBottom: spacing.xxxl,
                maxHeight: "90%",
              },
              modal.animatedStyle,
            ]}
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

            {children}
          </Animated.View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
};
