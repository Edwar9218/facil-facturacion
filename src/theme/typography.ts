// Escala pensada para usuarios 40+ — mínimo 15px, cuerpo en 17-18px
export const typography = {
  // Tamaños
  size: {
    xs: 13,
    sm: 15,
    md: 17,
    lg: 18,
    xl: 20,
    xxl: 24,
    xxxl: 28,
    display: 38,
    hero: 50,
  },

  // Pesos
  weight: {
    regular: "400" as const,
    medium: "600" as const,
    bold: "700" as const,
    extraBold: "800" as const,
    black: "900" as const,
  },

  // Altura de línea
  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    loose: 1.8,
  },

  // Espaciado entre letras
  letterSpacing: {
    tight: -1.5,
    normal: 0,
    wide: 0.5,
  },
} as const;

export type Typography = typeof typography;
