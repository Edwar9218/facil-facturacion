/**
 * AppText.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Componente de texto global.
 * • Aplica la fuente Inter automáticamente en TODAS las variantes.
 * • Respeta la escala de accesibilidad del usuario (FontScale).
 * • El fontFamily varía según el fontWeight para usar la variante correcta.
 *
 * VARIANTES disponibles:
 *   hero        → 50px / black    (cifras muy grandes)
 *   display     → 38px / black    (totales, cantidades hero)
 *   h1          → 28px / bold     (títulos de pantalla)
 *   h2          → 24px / bold     (títulos de sección)
 *   h3          → 20px / bold     (subtítulos)
 *   body        → 17px / regular  (texto base)
 *   bodyBold    → 17px / bold     (texto base resaltado)
 *   label       → 15px / semiBold (etiquetas, meta-info)
 *   caption     → 13px / regular  (texto secundario pequeño)
 *   captionBold → 13px / bold     (etiqueta pequeña resaltada)
 * ─────────────────────────────────────────────────────────────────────────────
 */
import React from "react";
import { Text, TextStyle } from "react-native";
import { useTheme } from "../../../theme";
import { FONT } from "../../../theme/typescale";

type Variant =
  | "hero"
  | "display"
  | "h1"
  | "h2"
  | "h3"
  | "body"
  | "bodyBold"
  | "label"
  | "caption"
  | "captionBold";

interface Props {
  children: React.ReactNode;
  variant?: Variant;
  color?: string;
  style?: TextStyle | TextStyle[];
  numberOfLines?: number;
  align?: "left" | "center" | "right";
  ellipsizeMode?: "head" | "middle" | "tail" | "clip";
  onPress?: () => void;
  selectable?: boolean;
}

export const AppText = ({
  children,
  variant = "body",
  color,
  style,
  numberOfLines,
  align = "left",
  ellipsizeMode,
  onPress,
  selectable,
}: Props) => {
  const { typography, colors } = useTheme();

  const variantStyles: Record<Variant, TextStyle> = {
    hero: {
      fontSize: typography.size.hero,
      fontWeight: typography.weight.black,
      fontFamily: FONT.black,
      color: colors.primary,
      letterSpacing: typography.letterSpacing.tight,
    },
    display: {
      fontSize: typography.size.display,
      fontWeight: typography.weight.black,
      fontFamily: FONT.black,
      color: colors.primary,
      letterSpacing: typography.letterSpacing.tight,
    },
    h1: {
      fontSize: typography.size.xxxl,
      fontWeight: typography.weight.bold,
      fontFamily: FONT.bold,
      color: colors.ink,
    },
    h2: {
      fontSize: typography.size.xxl,
      fontWeight: typography.weight.bold,
      fontFamily: FONT.bold,
      color: colors.ink,
    },
    h3: {
      fontSize: typography.size.xl,
      fontWeight: typography.weight.bold,
      fontFamily: FONT.bold,
      color: colors.ink,
    },
    body: {
      fontSize: typography.size.md,
      fontWeight: typography.weight.regular,
      fontFamily: FONT.regular,
      color: colors.inkSoft,
    },
    bodyBold: {
      fontSize: typography.size.md,
      fontWeight: typography.weight.bold,
      fontFamily: FONT.bold,
      color: colors.ink,
    },
    label: {
      fontSize: typography.size.sm,
      fontWeight: typography.weight.medium,
      fontFamily: FONT.semiBold,
      color: colors.grayText,
    },
    caption: {
      fontSize: typography.size.xs,
      fontWeight: typography.weight.regular,
      fontFamily: FONT.regular,
      color: colors.grayText,
    },
    captionBold: {
      fontSize: typography.size.xs,
      fontWeight: typography.weight.bold,
      fontFamily: FONT.bold,
      color: colors.grayText,
    },
  };

  return (
    <Text
      numberOfLines={numberOfLines}
      ellipsizeMode={ellipsizeMode}
      onPress={onPress}
      selectable={selectable}
      maxFontSizeMultiplier={1.3}
      style={[
        variantStyles[variant],
        { textAlign: align },
        color ? { color } : {},
        style,
      ]}
    >
      {children}
    </Text>
  );
};
