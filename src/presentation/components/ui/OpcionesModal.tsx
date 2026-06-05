import {
  Feather,
  MaterialCommunityIcons,
  MaterialIcons,
} from "@expo/vector-icons";
import React from "react";
import { TouchableOpacity, View } from "react-native";
import { useTheme } from "../../../theme";
import { SlideModalType } from "../../hooks/useSlideModal";
import { AppText } from "./AppText";
import { SlideModal } from "./SlideModal";

export interface Opcion {
  label: string;
  sublabel: string;
  iconName: string;
  iconLibrary?: "feather" | "material" | "material-community";
  color: string;
  colorFondo: string;
  onPress: () => void;
}

interface Props {
  modal: SlideModalType;
  titulo: string;
  subtitulo?: string;
  opciones: Opcion[];
  aviso?: string;
}

export const OpcionesModal = ({
  modal,
  titulo,
  subtitulo,
  opciones,
  aviso,
}: Props) => {
  const { colors, spacing, radius, sizes } = useTheme();

  return (
    <SlideModal modal={modal}>
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
          <AppText variant="h3">{titulo}</AppText>
          {subtitulo && (
            <AppText variant="caption" style={{ marginTop: spacing.xxs }}>
              {subtitulo}
            </AppText>
          )}
        </View>

        {/* Botón cerrar */}
        <TouchableOpacity
          style={{
            width: 32,
            height: 32,
            borderRadius: radius.full,
            backgroundColor: colors.grayText,
            alignItems: "center",
            justifyContent: "center",
          }}
          onPress={() => modal.cerrar()}
        >
          <Feather name="x" size={16} color={colors.white} />
        </TouchableOpacity>
      </View>

      {/* Opciones */}
      {opciones.map((opcion) => (
        <TouchableOpacity
          key={opcion.label}
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: spacing.md,
            borderWidth: 1,
            borderColor: opcion.colorFondo,
            borderRadius: radius.lg,
            padding: spacing.md,
            marginBottom: spacing.xs,
            backgroundColor: colors.white,
          }}
          onPress={opcion.onPress}
          activeOpacity={0.7}
        >
          {/* Ícono */}
          <View
            style={{
              width: 52,
              height: 52,
              borderRadius: radius.md,
              backgroundColor: opcion.colorFondo,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {opcion.iconLibrary === "material" ? (
              <MaterialIcons
                name={opcion.iconName as any}
                size={sizes.iconMd}
                color={opcion.color}
              />
            ) : opcion.iconLibrary === "material-community" ? (
              <MaterialCommunityIcons
                name={opcion.iconName as any}
                size={sizes.iconMd}
                color={opcion.color}
              />
            ) : (
              <Feather
                name={opcion.iconName as any}
                size={sizes.iconMd}
                color={opcion.color}
              />
            )}
          </View>

          {/* Texto */}
          <View style={{ flex: 1 }}>
            <AppText variant="bodyBold" color={opcion.color}>
              {opcion.label}
            </AppText>
            <AppText variant="caption" style={{ marginTop: spacing.xxs }}>
              {opcion.sublabel}
            </AppText>
          </View>

          <MaterialIcons
            name="chevron-right"
            size={sizes.iconMd}
            color={opcion.color}
          />
        </TouchableOpacity>
      ))}

      {/* Aviso */}
      {aviso && (
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: spacing.xs,
            backgroundColor: colors.grayBg,
            borderRadius: radius.sm,
            padding: spacing.sm,
            marginTop: spacing.xxs,
          }}
        >
          <MaterialIcons
            name="info-outline"
            size={sizes.iconXs}
            color={colors.grayText}
          />
          <AppText variant="caption">{aviso}</AppText>
        </View>
      )}
    </SlideModal>
  );
};
