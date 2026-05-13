import { Feather, MaterialIcons } from "@expo/vector-icons";
import React from "react";
import { TouchableOpacity, View } from "react-native";
import { useTheme } from "../../../theme";
import { SlideModalType } from "../../hooks/useSlideModal";
import { AppText } from "./AppText";
import { SlideModal } from "./SlideModal";

interface Props {
  modal: SlideModalType;
  onTomarFoto: () => void;
  onElegirGaleria: () => void;
}

export const FotoModal = ({ modal, onTomarFoto, onElegirGaleria }: Props) => {
  const { colors, spacing, radius, sizes } = useTheme();

  const opciones = [
    {
      label: "Tomar foto",
      sub: "Usa la cámara para tomar una foto",
      icono: <Feather name="camera" size={sizes.iconMd} color={colors.white} />,
      color: colors.primary,
      onPress: onTomarFoto,
    },
    {
      label: "Elegir de galería",
      sub: "Selecciona una foto desde tu galería",
      icono: (
        <MaterialIcons
          name="photo-library"
          size={sizes.iconMd}
          color={colors.white}
        />
      ),
      color: colors.success,
      onPress: onElegirGaleria,
    },
  ];

  return (
    <SlideModal modal={modal}>
      {/* Título */}
      <AppText variant="h3" align="center" style={{ marginBottom: spacing.lg }}>
        Selecciona una opción
      </AppText>

      {/* Opciones */}
      {opciones.map((opcion) => (
        <TouchableOpacity
          key={opcion.label}
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: spacing.md,
            padding: spacing.md,
            borderRadius: radius.lg,
            borderWidth: 1,
            borderColor: colors.grayBorder,
            marginBottom: spacing.xs,
          }}
          onPress={opcion.onPress}
        >
          <View
            style={{
              width: 52,
              height: 52,
              borderRadius: radius.full,
              backgroundColor: opcion.color,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {opcion.icono}
          </View>
          <View style={{ flex: 1 }}>
            <AppText variant="bodyBold">{opcion.label}</AppText>
            <AppText variant="caption" style={{ marginTop: spacing.xxs }}>
              {opcion.sub}
            </AppText>
          </View>
        </TouchableOpacity>
      ))}

      {/* Cancelar */}
      <TouchableOpacity
        style={{
          alignItems: "center",
          paddingVertical: spacing.md,
          marginTop: spacing.xxs,
        }}
        onPress={() => modal.cerrar()}
      >
        <AppText variant="bodyBold" color={colors.primary}>
          Cancelar
        </AppText>
      </TouchableOpacity>
    </SlideModal>
  );
};
