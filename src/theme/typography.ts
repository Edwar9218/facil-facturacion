// Escala base pensada para usuarios 40+ — mínimo 15px, cuerpo en 17-18px
const baseSize = {
  xs: 13,
  sm: 15,
  md: 17,
  lg: 18,
  xl: 20,
  xxl: 24,
  xxxl: 28,
  display: 38,
  hero: 50,
};

// Multiplicadores por nivel de escala
export const fontScaleMultipliers = {
  pequeño: 0.85,
  normal: 1.0,
  grande: 1.15,
  extraGrande: 1.3,
} as const;

export type FontScale = keyof typeof fontScaleMultipliers;

// Función que genera los tamaños escalados
export const buildTypography = (scale: FontScale = "normal") => {
  const m = fontScaleMultipliers[scale];
  return {
    size: {
      xs: Math.round(baseSize.xs * m),
      sm: Math.round(baseSize.sm * m),
      md: Math.round(baseSize.md * m),
      lg: Math.round(baseSize.lg * m),
      xl: Math.round(baseSize.xl * m),
      xxl: Math.round(baseSize.xxl * m),
      xxxl: Math.round(baseSize.xxxl * m),
      display: Math.round(baseSize.display * m),
      hero: Math.round(baseSize.hero * m),
    },
    weight: {
      regular: "400" as const,
      medium: "600" as const,
      bold: "700" as const,
      extraBold: "800" as const,
      black: "900" as const,
    },
    lineHeight: {
      tight: 1.2,
      normal: 1.5,
      loose: 1.8,
    },
    letterSpacing: {
      tight: -1.5,
      normal: 0,
      wide: 0.5,
    },
  };
};

// Exportación por defecto (escala normal) para compatibilidad con theme.ts
export const typography = buildTypography("normal");

export type Typography = ReturnType<typeof buildTypography>;
