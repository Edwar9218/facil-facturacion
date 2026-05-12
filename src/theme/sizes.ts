// Tamaños fijos para componentes — pensados para dedos de 40+
export const sizes = {
  // Botones
  btnHeightSm: 44,
  btnHeightMd: 52,
  btnHeightLg: 58,

  // Inputs
  inputHeightSm: 44,
  inputHeightMd: 52,
  inputHeightLg: 58,

  // Íconos
  iconXs: 16,
  iconSm: 20,
  iconMd: 24,
  iconLg: 32,
  iconXl: 40,
  iconXxl: 50,

  // Avatares
  avatarSm: 36,
  avatarMd: 44,
  avatarLg: 60,

  // Cards del menú
  menuCardHeight: 130,

  // Imágenes producto
  productImageSm: 50,
  productImageMd: 70,
  productImageLg: 120,

  // FAB
  fabSize: 64,

  // Header
  headerHeight: 64,

  // Divider
  dividerHeight: 1,
} as const;

export type Sizes = typeof sizes;
