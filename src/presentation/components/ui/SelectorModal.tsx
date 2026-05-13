import { Feather } from "@expo/vector-icons";
import React from "react";
import { TouchableOpacity } from "react-native";
import { useTheme } from "../../../theme";
import { SlideModalType } from "../../hooks/useSlideModal";
import { AppText } from "./AppText";
import { SlideModal } from "./SlideModal";

interface Props {
  modal: SlideModalType;
  titulo: string;
  opciones: string[];
  valorActual: string;
  onSeleccionar: (valor: string) => void;
}

export const SelectorModal = ({
  modal,
  titulo,
  opciones,
  valorActual,
  onSeleccionar,
}: Props) => {
  const { colors, spacing, radius, sizes } = useTheme();

  return (
    <SlideModal modal={modal}>
      {/* Título */}
      <AppText variant="h3" style={{ marginBottom: spacing.md }}>
        {titulo}
      </AppText>

      {/* Opciones */}
      {opciones.map((opcion) => {
        const activa = valorActual === opcion;
        return (
          <TouchableOpacity
            key={opcion}
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              paddingVertical: spacing.md,
              paddingHorizontal: spacing.md,
              borderRadius: radius.md,
              marginBottom: spacing.xxs,
              backgroundColor: activa ? colors.primaryLight : "transparent",
            }}
            onPress={() => onSeleccionar(opcion)}
            activeOpacity={0.7}
          >
            <AppText
              variant={activa ? "bodyBold" : "body"}
              color={activa ? colors.primary : colors.ink}
            >
              {opcion}
            </AppText>

            {activa && (
              <Feather
                name="check"
                size={sizes.iconSm}
                color={colors.primary}
              />
            )}
          </TouchableOpacity>
        );
      })}
    </SlideModal>
  );
};
