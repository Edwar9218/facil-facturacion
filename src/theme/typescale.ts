/**
 * typescale.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Escala tipográfica semántica para usar en StyleSheet.create().
 * Todos los valores están alineados con buildTypography("normal") en typography.ts
 * y con las variantes de AppText.
 *
 * USO:
 *   import { TS, TW } from '../../../theme/typescale';
 *   const s = StyleSheet.create({
 *     titulo:  { fontSize: TS.h1,  fontWeight: TW.bold },
 *     cuerpo:  { fontSize: TS.md,  fontWeight: TW.regular },
 *     etiqueta:{ fontSize: TS.sm,  fontWeight: TW.semiBold },
 *   });
 *
 * MAPEO con variantes de <AppText variant="...">:
 *   TS.xs   → caption / captionBold
 *   TS.sm   → label
 *   TS.md   → body / bodyBold
 *   TS.xl   → h3
 *   TS.h2   → h2
 *   TS.h1   → h1
 *   TS.disp → display
 * ─────────────────────────────────────────────────────────────────────────────
 */

// Tamaños (en px — coinciden con buildTypography("normal"))
export const TS = {
  /** 12px — badges micro, textos decorativos muy pequeños */
  micro: 12,
  /** 13px — caption (info secundaria pequeña)   → AppText variant="caption" */
  xs: 13,
  /** 15px — label, meta-info                    → AppText variant="label"   */
  sm: 15,
  /** 17px — cuerpo principal                    → AppText variant="body"    */
  md: 17,
  /** 18px — cuerpo grande / heading pequeño     → AppText variant="h3" base */
  lg: 18,
  /** 20px — heading 3                           → AppText variant="h3"      */
  xl: 20,
  /** 24px — heading 2 (secciones, subtítulos)   → AppText variant="h2"      */
  h2: 24,
  /** 28px — heading 1 (títulos de pantalla)     → AppText variant="h1"      */
  h1: 28,
  /** 32px — números grandes (montos, cifras)    */
  num: 32,
  /** 38px — display (montos hero, totales)      → AppText variant="display" */
  disp: 38,
} as const;

export type TScale = keyof typeof TS;

// Pesos de fuente
export const TW = {
  regular: "400" as const,
  medium: "500" as const,
  semiBold: "600" as const,
  bold: "700" as const,
  extraBold: "800" as const,
  black: "900" as const,
} as const;

// Fuente global de la app (Inter via @expo-google-fonts/inter)
export const FONT = {
  regular: "Inter_400Regular",
  medium: "Inter_500Medium",
  semiBold: "Inter_600SemiBold",
  bold: "Inter_700Bold",
  extraBold: "Inter_800ExtraBold",
  black: "Inter_900Black",
} as const;
