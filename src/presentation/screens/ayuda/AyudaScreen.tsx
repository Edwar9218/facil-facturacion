// ─────────────────────────────────────────────────────────────────────────────
// AyudaScreen.tsx  –  Centro de Ayuda estilo WhatsApp
// ─────────────────────────────────────────────────────────────────────────────

import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import {
    Pressable,
    ScrollView,
    StatusBar,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../../../theme";
import { AppText } from "../../components/ui/AppText";
import { Articulo, Categoria, CATEGORIAS } from "./ayudaData";

// ─── Tipos de vista ───────────────────────────────────────────────────────────
type Vista = "home" | "categoria" | "articulo";

// ─────────────────────────────────────────────────────────────────────────────
// PANTALLA PRINCIPAL
// ─────────────────────────────────────────────────────────────────────────────
export const AyudaScreen = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, spacing, typography, radius } = useTheme();

  // ── Estado de navegación interna ──────────────────────────────────────────
  const [vista, setVista] = useState<Vista>("home");
  const [categoriaActual, setCategoriaActual] = useState<Categoria | null>(
    null,
  );
  const [articuloActual, setArticuloActual] = useState<Articulo | null>(null);
  const [busqueda, setBusqueda] = useState("");

  // ── Resultados de búsqueda ────────────────────────────────────────────────
  const resultadosBusqueda = useMemo(() => {
    if (!busqueda.trim()) return [];
    const q = busqueda.toLowerCase();
    const resultados: { categoria: Categoria; articulo: Articulo }[] = [];
    CATEGORIAS.forEach((cat) => {
      cat.articulos.forEach((art) => {
        if (
          art.titulo.toLowerCase().includes(q) ||
          art.resumen.toLowerCase().includes(q) ||
          cat.titulo.toLowerCase().includes(q)
        ) {
          resultados.push({ categoria: cat, articulo: art });
        }
      });
    });
    return resultados;
  }, [busqueda]);

  // ── Navegación ────────────────────────────────────────────────────────────
  const irACategoria = (cat: Categoria) => {
    setCategoriaActual(cat);
    setBusqueda("");
    setVista("categoria");
  };

  const irAArticulo = (art: Articulo, cat?: Categoria) => {
    if (cat) setCategoriaActual(cat);
    setArticuloActual(art);
    setVista("articulo");
  };

  const volverHome = () => {
    setVista("home");
    setCategoriaActual(null);
    setArticuloActual(null);
    setBusqueda("");
  };

  const volverCategoria = () => {
    setVista("categoria");
    setArticuloActual(null);
  };

  // ─────────────────────────────────────────────────────────────────────────
  // HEADER compartido
  // ─────────────────────────────────────────────────────────────────────────
  const renderHeader = (
    titulo: string,
    onVolver: () => void,
    esHome = false,
  ) => (
    <View
      style={[
        s.header,
        {
          backgroundColor: colors.white,
          paddingTop: insets.top,
          borderBottomColor: colors.grayBorder,
        },
      ]}
    >
      <View style={s.headerSide}>
        <TouchableOpacity
          style={s.backBtn}
          activeOpacity={0.7}
          onPress={onVolver}
        >
          <Feather name="chevron-left" size={22} color={colors.grayText} />
          <AppText
            style={{
              fontSize: typography.size.md,
              color: colors.grayText,
              fontWeight: typography.weight.regular,
            }}
          >
            {esHome ? "Ajustes" : "volver"}
          </AppText>
        </TouchableOpacity>
      </View>

      <AppText
        style={{
          fontSize: 20,
          fontWeight: "800",
          color: colors.primary,
          letterSpacing: -0.3,
        }}
      >
        Fácil
      </AppText>

      <View style={[s.headerSide, { alignItems: "flex-end" }]} />
    </View>
  );

  // ─────────────────────────────────────────────────────────────────────────
  // VISTA 1: HOME (Centro de ayuda)
  // ─────────────────────────────────────────────────────────────────────────
  if (vista === "home") {
    return (
      <View style={[s.flex, { backgroundColor: colors.grayBg }]}>
        <StatusBar
          barStyle="dark-content"
          backgroundColor={colors.white}
          translucent
        />
        {renderHeader("Ayuda", () => router.back(), true)}

        <ScrollView
          contentContainerStyle={{ paddingBottom: insets.bottom + spacing.xl }}
          showsVerticalScrollIndicator={false}
        >
          {/* ── Banner superior ─────────────────────────────────── */}
          <View
            style={[
              s.banner,
              {
                backgroundColor: colors.white,
                borderBottomColor: colors.grayBorder,
              },
            ]}
          >
            <View
              style={[
                s.bannerIcon,
                { backgroundColor: colors.primaryLight, borderRadius: 50 },
              ]}
            >
              <MaterialCommunityIcons
                name="help-circle-outline"
                size={40}
                color={colors.primary}
              />
            </View>
            <AppText style={[s.bannerTitle, { color: colors.ink }]}>
              ¿Cómo podemos ayudarte?
            </AppText>

            {/* ── Barra de búsqueda ──────────────────────────────── */}
            <View
              style={[
                s.searchBar,
                {
                  backgroundColor: colors.grayBg,
                  borderRadius: radius.lg,
                  borderColor: busqueda ? colors.primary : colors.grayBorder,
                },
              ]}
            >
              <Feather
                name="search"
                size={18}
                color={colors.grayText}
                style={{ marginRight: spacing.sm }}
              />
              <TextInput
                value={busqueda}
                onChangeText={setBusqueda}
                placeholder="Busca en el Centro de ayuda"
                placeholderTextColor={colors.grayText}
                style={[
                  s.searchInput,
                  { color: colors.ink, fontSize: typography.size.md },
                ]}
              />
              {busqueda.length > 0 && (
                <TouchableOpacity onPress={() => setBusqueda("")}>
                  <Feather name="x" size={18} color={colors.grayText} />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* ── Resultados de búsqueda ─────────────────────────── */}
          {busqueda.trim().length > 0 && (
            <View style={[s.sectionBlock, { backgroundColor: colors.white }]}>
              <AppText
                style={[
                  s.sectionLabel,
                  {
                    color: colors.grayText,
                    paddingHorizontal: spacing.lg,
                    paddingTop: spacing.md,
                  },
                ]}
              >
                {resultadosBusqueda.length === 0
                  ? "Sin resultados para esa búsqueda"
                  : `${resultadosBusqueda.length} resultado${resultadosBusqueda.length !== 1 ? "s" : ""}`}
              </AppText>
              {resultadosBusqueda.map(({ categoria, articulo }, idx) => (
                <ArticuloRow
                  key={articulo.id}
                  articulo={articulo}
                  isLast={idx === resultadosBusqueda.length - 1}
                  badge={categoria.titulo}
                  badgeColor={categoria.color}
                  onPress={() => irAArticulo(articulo, categoria)}
                  colors={colors}
                  spacing={spacing}
                  typography={typography}
                />
              ))}
            </View>
          )}

          {/* ── Categorías ─────────────────────────────────────── */}
          {busqueda.trim().length === 0 && (
            <>
              <AppText
                style={[
                  s.sectionLabel,
                  {
                    color: colors.grayText,
                    paddingHorizontal: spacing.lg,
                    paddingTop: spacing.lg,
                    paddingBottom: spacing.xs,
                  },
                ]}
              >
                Temas de ayuda
              </AppText>

              <View style={[s.sectionBlock, { backgroundColor: colors.white }]}>
                {CATEGORIAS.map((cat, idx) => (
                  <CategoriaRow
                    key={cat.id}
                    categoria={cat}
                    isLast={idx === CATEGORIAS.length - 1}
                    onPress={() => irACategoria(cat)}
                    colors={colors}
                    spacing={spacing}
                    typography={typography}
                  />
                ))}
              </View>
            </>
          )}
        </ScrollView>
      </View>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // VISTA 2: CATEGORÍA (lista de artículos)
  // ─────────────────────────────────────────────────────────────────────────
  if (vista === "categoria" && categoriaActual) {
    return (
      <View style={[s.flex, { backgroundColor: colors.grayBg }]}>
        <StatusBar
          barStyle="dark-content"
          backgroundColor={colors.white}
          translucent
        />
        {renderHeader(categoriaActual.titulo, volverHome)}

        <ScrollView
          contentContainerStyle={{ paddingBottom: insets.bottom + spacing.xl }}
          showsVerticalScrollIndicator={false}
        >
          {/* Cabecera de categoría */}
          <View
            style={[
              s.catHeader,
              {
                backgroundColor: colors.white,
                borderBottomColor: colors.grayBorder,
              },
            ]}
          >
            <View
              style={[
                s.catIconCircle,
                { backgroundColor: categoriaActual.colorLight },
              ]}
            >
              <MaterialCommunityIcons
                name={categoriaActual.icono as any}
                size={32}
                color={categoriaActual.color}
              />
            </View>
            <AppText style={[s.catTitle, { color: colors.ink }]}>
              {categoriaActual.titulo}
            </AppText>
            <AppText style={[s.catDesc, { color: colors.grayText }]}>
              {categoriaActual.descripcion}
            </AppText>
          </View>

          {/* Lista de artículos */}
          <View
            style={[
              s.sectionBlock,
              { backgroundColor: colors.white, marginTop: spacing.lg },
            ]}
          >
            {categoriaActual.articulos.map((art, idx) => (
              <ArticuloRow
                key={art.id}
                articulo={art}
                isLast={idx === categoriaActual.articulos.length - 1}
                onPress={() => irAArticulo(art)}
                colors={colors}
                spacing={spacing}
                typography={typography}
              />
            ))}
          </View>
        </ScrollView>
      </View>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // VISTA 3: ARTÍCULO (contenido completo)
  // ─────────────────────────────────────────────────────────────────────────
  if (vista === "articulo" && articuloActual) {
    return (
      <View style={[s.flex, { backgroundColor: colors.grayBg }]}>
        <StatusBar
          barStyle="dark-content"
          backgroundColor={colors.white}
          translucent
        />
        {renderHeader(
          articuloActual.titulo,
          categoriaActual ? volverCategoria : volverHome,
        )}

        <ScrollView
          contentContainerStyle={{
            paddingHorizontal: spacing.lg,
            paddingBottom: insets.bottom + spacing.xl,
            paddingTop: spacing.lg,
          }}
          showsVerticalScrollIndicator={false}
        >
          {/* Etiqueta de categoría */}
          {categoriaActual && (
            <View
              style={[
                s.breadcrumb,
                {
                  backgroundColor: categoriaActual.colorLight,
                  borderRadius: radius.md,
                },
              ]}
            >
              <MaterialCommunityIcons
                name={categoriaActual.icono as any}
                size={14}
                color={categoriaActual.color}
              />
              <AppText
                style={{
                  fontSize: typography.size.sm,
                  color: categoriaActual.color,
                  fontWeight: typography.weight.semiBold,
                  marginLeft: 6,
                }}
              >
                {categoriaActual.titulo}
              </AppText>
            </View>
          )}

          {/* Título del artículo */}
          <AppText
            style={[
              s.articuloTitle,
              {
                color: colors.ink,
                fontSize: typography.size.xxl,
                marginTop: spacing.md,
              },
            ]}
          >
            {articuloActual.titulo}
          </AppText>

          {/* Resumen */}
          <AppText
            style={[
              s.articuloResumen,
              {
                color: colors.grayText,
                fontSize: typography.size.md,
                marginTop: spacing.xs,
                marginBottom: spacing.lg,
              },
            ]}
          >
            {articuloActual.resumen}
          </AppText>

          {/* Divisor */}
          <View style={[s.divider, { backgroundColor: colors.grayBorder }]} />

          {/* Pasos */}
          <AppText
            style={[
              s.pasosLabel,
              {
                color: colors.ink,
                fontSize: typography.size.lg,
                fontWeight: typography.weight.bold,
                marginTop: spacing.lg,
                marginBottom: spacing.md,
              },
            ]}
          >
            {articuloActual.titulo}
          </AppText>

          {articuloActual.pasos.map((paso, idx) => (
            <View key={idx} style={[s.pasoRow, { marginBottom: spacing.md }]}>
              {/* Número */}
              <View
                style={[
                  s.pasoNum,
                  {
                    backgroundColor: categoriaActual
                      ? categoriaActual.colorLight
                      : colors.primaryLight,
                    borderRadius: 20,
                  },
                ]}
              >
                <AppText
                  style={{
                    fontSize: typography.size.sm,
                    fontWeight: typography.weight.bold,
                    color: categoriaActual
                      ? categoriaActual.color
                      : colors.primary,
                  }}
                >
                  {idx + 1}
                </AppText>
              </View>

              {/* Texto */}
              <View style={{ flex: 1 }}>
                <AppText
                  style={{
                    fontSize: typography.size.md,
                    color: colors.ink,
                    lineHeight: 22,
                  }}
                >
                  {paso.texto}
                </AppText>
                {paso.nota && (
                  <AppText
                    style={{
                      fontSize: typography.size.sm,
                      color: colors.grayText,
                      marginTop: 4,
                      fontStyle: "italic",
                    }}
                  >
                    {paso.nota}
                  </AppText>
                )}
              </View>
            </View>
          ))}

          {/* Tip final */}
          {articuloActual.tip && (
            <View
              style={[
                s.tipBox,
                {
                  backgroundColor: colors.primaryLight,
                  borderRadius: radius.lg,
                  borderLeftColor: colors.primary,
                  marginTop: spacing.lg,
                },
              ]}
            >
              <MaterialCommunityIcons
                name="lightbulb-outline"
                size={20}
                color={colors.primary}
                style={{ marginRight: spacing.sm }}
              />
              <AppText
                style={{
                  flex: 1,
                  fontSize: typography.size.sm,
                  color: colors.primaryDark,
                  lineHeight: 20,
                }}
              >
                <AppText style={{ fontWeight: typography.weight.bold }}>
                  Consejo:{" "}
                </AppText>
                {articuloActual.tip}
              </AppText>
            </View>
          )}

          {/* ── Otros artículos de la misma categoría ──────────── */}
          {categoriaActual && categoriaActual.articulos.length > 1 && (
            <>
              <View
                style={[
                  s.divider,
                  { backgroundColor: colors.grayBorder, marginTop: spacing.xl },
                ]}
              />
              <AppText
                style={{
                  fontSize: typography.size.md,
                  fontWeight: typography.weight.semiBold,
                  color: colors.grayText,
                  marginTop: spacing.lg,
                  marginBottom: spacing.sm,
                }}
              >
                Más artículos en {categoriaActual.titulo}
              </AppText>
              {categoriaActual.articulos
                .filter((a) => a.id !== articuloActual.id)
                .map((art, idx, arr) => (
                  <ArticuloRow
                    key={art.id}
                    articulo={art}
                    isLast={idx === arr.length - 1}
                    onPress={() => irAArticulo(art)}
                    colors={colors}
                    spacing={spacing}
                    typography={typography}
                    style={{ borderRadius: 16, marginHorizontal: 0 }}
                  />
                ))}
            </>
          )}
        </ScrollView>
      </View>
    );
  }

  return null;
};

// ─────────────────────────────────────────────────────────────────────────────
// SUB-COMPONENTES
// ─────────────────────────────────────────────────────────────────────────────

/** Fila de categoría (vista home) */
function CategoriaRow({
  categoria,
  isLast,
  onPress,
  colors,
  spacing,
  typography,
}: {
  categoria: Categoria;
  isLast: boolean;
  onPress: () => void;
  colors: any;
  spacing: any;
  typography: any;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        s.listRow,
        {
          opacity: pressed ? 0.7 : 1,
          backgroundColor: pressed ? colors.grayLight : colors.white,
          borderBottomWidth: isLast ? 0 : 1,
          borderBottomColor: colors.grayBorder,
          paddingHorizontal: spacing.lg,
          paddingVertical: spacing.md,
        },
      ]}
    >
      {/* Ícono */}
      <View
        style={[
          s.rowIcon,
          { backgroundColor: categoria.colorLight, borderRadius: 12 },
        ]}
      >
        <MaterialCommunityIcons
          name={categoria.icono as any}
          size={22}
          color={categoria.color}
        />
      </View>

      {/* Textos */}
      <View style={{ flex: 1, marginLeft: spacing.md }}>
        <AppText
          style={{
            fontSize: typography.size.md,
            fontWeight: typography.weight.semiBold,
            color: colors.ink,
          }}
        >
          {categoria.titulo}
        </AppText>
        <AppText
          style={{
            fontSize: typography.size.sm,
            color: colors.grayText,
            marginTop: 2,
          }}
        >
          {categoria.descripcion}
        </AppText>
      </View>

      <Feather name="chevron-right" size={18} color={colors.grayText} />
    </Pressable>
  );
}

/** Fila de artículo (vista categoría y búsqueda) */
function ArticuloRow({
  articulo,
  isLast,
  onPress,
  colors,
  spacing,
  typography,
  badge,
  badgeColor,
  style,
}: {
  articulo: Articulo;
  isLast: boolean;
  onPress: () => void;
  colors: any;
  spacing: any;
  typography: any;
  badge?: string;
  badgeColor?: string;
  style?: object;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        s.listRow,
        {
          opacity: pressed ? 0.7 : 1,
          backgroundColor: pressed ? colors.grayLight : colors.white,
          borderBottomWidth: isLast ? 0 : 1,
          borderBottomColor: colors.grayBorder,
          paddingHorizontal: spacing.lg,
          paddingVertical: spacing.md,
        },
        style,
      ]}
    >
      {/* Ícono artículo */}
      <View
        style={[
          s.rowIcon,
          { backgroundColor: colors.grayBg, borderRadius: 10 },
        ]}
      >
        <MaterialCommunityIcons
          name="file-document-outline"
          size={20}
          color={colors.primary}
        />
      </View>

      {/* Textos */}
      <View style={{ flex: 1, marginLeft: spacing.md }}>
        {badge && (
          <AppText
            style={{
              fontSize: 11,
              fontWeight: typography.weight.semiBold,
              color: badgeColor ?? colors.primary,
              marginBottom: 2,
              textTransform: "uppercase",
              letterSpacing: 0.4,
            }}
          >
            {badge}
          </AppText>
        )}
        <AppText
          style={{
            fontSize: typography.size.md,
            fontWeight: typography.weight.medium,
            color: colors.ink,
          }}
        >
          {articulo.titulo}
        </AppText>
        <AppText
          style={{
            fontSize: typography.size.sm,
            color: colors.grayText,
            marginTop: 2,
          }}
          numberOfLines={1}
        >
          {articulo.resumen}
        </AppText>
      </View>

      <Feather name="chevron-right" size={18} color={colors.grayText} />
    </Pressable>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ESTILOS
// ─────────────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  flex: { flex: 1 },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 10,
    borderBottomWidth: 1,
  },
  headerSide: { width: 90, justifyContent: "center" },
  backBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    paddingVertical: 8,
  },

  // Banner home
  banner: {
    alignItems: "center",
    paddingVertical: 28,
    paddingHorizontal: 24,
    borderBottomWidth: 1,
  },
  bannerIcon: {
    width: 80,
    height: 80,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  bannerTitle: {
    fontSize: 22,
    fontWeight: "800",
    textAlign: "center",
    marginBottom: 16,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    width: "100%",
  },
  searchInput: { flex: 1 },

  // Sección/bloque de lista
  sectionLabel: {
    fontSize: 13,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  sectionBlock: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },

  // Fila genérica
  listRow: { flexDirection: "row", alignItems: "center" },
  rowIcon: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },

  // Cabecera de categoría
  catHeader: {
    alignItems: "center",
    paddingVertical: 28,
    paddingHorizontal: 24,
    borderBottomWidth: 1,
  },
  catIconCircle: {
    width: 72,
    height: 72,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 36,
    marginBottom: 12,
  },
  catTitle: {
    fontSize: 24,
    fontWeight: "800",
    textAlign: "center",
    marginBottom: 6,
  },
  catDesc: { fontSize: 15, textAlign: "center" },

  // Artículo
  breadcrumb: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  articuloTitle: { fontWeight: "800", lineHeight: 32 },
  articuloResumen: { lineHeight: 22 },
  divider: { height: 1 },
  pasosLabel: { lineHeight: 26 },
  pasoRow: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  pasoNum: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    marginTop: 2,
  },
  tipBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: 14,
    borderLeftWidth: 3,
  },
});
