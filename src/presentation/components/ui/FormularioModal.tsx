import { Feather, MaterialIcons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import React from "react";
import {
  Image,
  Keyboard,
  Pressable,
  ScrollView,
  TouchableOpacity,
  View,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { useTheme } from "../../../theme";
import { SlideModalType } from "../../hooks/useSlideModal";
import { AppButton } from "./AppButton";
import { AppInput } from "./AppInput";
import { AppText } from "./AppText";
import { SlideModal } from "./SlideModal";

export type TipoCampo =
  | "texto"
  | "numero"
  | "precio"
  | "telefono"
  | "selector"
  | "foto";

export interface Campo {
  id: string;
  label: string;
  placeholder?: string;
  tipo: TipoCampo;
  opciones?: string[];
  obligatorio?: boolean;
  maxLength?: number;
}

export type ValoresCampo = Record<string, string>;

interface Props {
  modal: SlideModalType;
  titulo: string;
  subtitulo?: string;
  campos: Campo[];
  valores: ValoresCampo;
  onChange: (id: string, valor: string) => void;
  onGuardar: () => void;
  labelGuardar?: string;
  labelGuardarEditar?: string;
  esEdicion?: boolean;
}

export const FormularioModal = ({
  modal,
  titulo,
  subtitulo,
  campos,
  valores,
  onChange,
  onGuardar,
  labelGuardar = "Agregar",
  labelGuardarEditar = "Guardar cambios",
  esEdicion = false,
}: Props) => {
  const { colors, spacing, radius, sizes } = useTheme();

  const [selectorActivo, setSelectorActivo] = React.useState<Campo | null>(
    null,
  );
  const [fotoVisible, setFotoVisible] = React.useState(false);

  const formularioValido = campos
    .filter((c) => c.obligatorio !== false)
    .every((c) => valores[c.id]?.trim());

  const campoFoto = campos.find((c) => c.tipo === "foto");

  const tomarFoto = async () => {
    setFotoVisible(false);
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") return;
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!result.canceled && campoFoto) {
      onChange(campoFoto.id, result.assets[0].uri);
    }
  };

  const elegirGaleria = async () => {
    setFotoVisible(false);
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") return;
    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!result.canceled && campoFoto) {
      onChange(campoFoto.id, result.assets[0].uri);
    }
  };

  // Panel inline reutilizable (selector y foto)
  const renderPanelInline = (onClose: () => void, content: React.ReactNode) => (
    <Pressable
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0,0,0,0.4)",
        justifyContent: "flex-end",
      }}
      onPress={onClose}
    >
      <Pressable onPress={() => {}}>
        <View
          style={{
            backgroundColor: colors.white,
            borderTopLeftRadius: radius.xl,
            borderTopRightRadius: radius.xl,
            padding: spacing.lg,
            paddingBottom: spacing.xxxl,
          }}
        >
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
          {content}
        </View>
      </Pressable>
    </Pressable>
  );

  return (
    <SlideModal modal={modal}>
      <KeyboardAwareScrollView
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        bottomOffset={10}
      >
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

        {/* Campos dinámicos */}
        {campos.map((campo) => {
          // ── Foto ────────────────────────────────────────────────────────
          if (campo.tipo === "foto") {
            const uri = valores[campo.id];
            return (
              <View key={campo.id}>
                <AppText
                  variant="label"
                  color={colors.ink}
                  style={{ marginBottom: spacing.xs }}
                >
                  {campo.label}{" "}
                  <AppText variant="caption" color={colors.primary}>
                    (opcional)
                  </AppText>
                </AppText>
                {uri ? (
                  <View
                    style={{ position: "relative", marginBottom: spacing.lg }}
                  >
                    <Image
                      source={{ uri }}
                      style={{
                        width: "100%",
                        height: 180,
                        borderRadius: radius.lg,
                      }}
                    />
                    <TouchableOpacity
                      style={{
                        position: "absolute",
                        bottom: spacing.xs,
                        left: spacing.xs,
                        flexDirection: "row",
                        alignItems: "center",
                        gap: spacing.xxs,
                        backgroundColor: colors.shadowDark,
                        paddingHorizontal: spacing.sm,
                        paddingVertical: spacing.xxs,
                        borderRadius: radius.full,
                      }}
                      onPress={() => {
                        Keyboard.dismiss();
                        setFotoVisible(true);
                      }}
                    >
                      <Feather name="edit-2" size={14} color={colors.white} />
                      <AppText
                        variant="caption"
                        color={colors.white}
                        style={{ fontWeight: "600" }}
                      >
                        Cambiar foto
                      </AppText>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={{
                        position: "absolute",
                        top: spacing.xs,
                        right: spacing.xs,
                        width: 32,
                        height: 32,
                        borderRadius: radius.full,
                        backgroundColor: colors.white,
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                      onPress={() => onChange(campo.id, "")}
                    >
                      <Feather name="x" size={18} color={colors.danger} />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={{
                      borderWidth: 1.5,
                      borderStyle: "dashed",
                      borderColor: colors.primaryMid,
                      borderRadius: radius.lg,
                      paddingVertical: spacing.xxl,
                      alignItems: "center",
                      marginBottom: spacing.lg,
                      gap: spacing.xxs,
                    }}
                    onPress={() => {
                      Keyboard.dismiss();
                      setFotoVisible(true);
                    }}
                  >
                    <View
                      style={{
                        width: 60,
                        height: 60,
                        borderRadius: radius.full,
                        backgroundColor: colors.primaryLight,
                        alignItems: "center",
                        justifyContent: "center",
                        marginBottom: spacing.xxs,
                      }}
                    >
                      <Feather
                        name="camera"
                        size={sizes.iconXl}
                        color={colors.primary}
                      />
                    </View>
                    <AppText variant="bodyBold" color={colors.primary}>
                      Agregar foto
                    </AppText>
                    <AppText variant="caption">
                      Toca para agregar una foto
                    </AppText>
                  </TouchableOpacity>
                )}
              </View>
            );
          }

          // ── Selector ────────────────────────────────────────────────────
          if (campo.tipo === "selector") {
            return (
              <AppInput
                key={campo.id}
                label={campo.label}
                tipo="selector"
                valorSelector={valores[campo.id]}
                onPressSelector={() => {
                  Keyboard.dismiss();
                  setSelectorActivo(campo);
                }}
              />
            );
          }

          // ── Precio ──────────────────────────────────────────────────────
          if (campo.tipo === "precio") {
            return (
              <AppInput
                key={campo.id}
                label={campo.label}
                tipo="precio"
                placeholder={campo.placeholder ?? "0"}
                value={valores[campo.id] ?? ""}
                onChangeText={(texto) => {
                  const soloNumeros = texto.replace(/[^0-9]/g, "");
                  const formateado = soloNumeros.replace(
                    /\B(?=(\d{3})+(?!\d))/g,
                    ".",
                  );
                  onChange(campo.id, formateado);
                }}
                keyboardType="numeric"
              />
            );
          }

          // ── Texto / Número / Teléfono ────────────────────────────────────
          return (
            <AppInput
              key={campo.id}
              label={campo.label}
              tipo={campo.tipo}
              placeholder={campo.placeholder}
              value={valores[campo.id] ?? ""}
              onChangeText={(v) => onChange(campo.id, v)}
              maxLength={campo.maxLength}
            />
          );
        })}

        <AppButton
          label={esEdicion ? labelGuardarEditar : labelGuardar}
          onPress={onGuardar}
          variant="primary"
          size="lg"
          disabled={!formularioValido}
          iconLeft={esEdicion ? "check" : "plus"}
          style={{ marginTop: spacing.xxs }}
        />

        <AppText
          variant="caption"
          align="center"
          style={{ marginTop: spacing.xs, marginBottom: spacing.xs }}
        >
          * Campos obligatorios
        </AppText>
      </KeyboardAwareScrollView>

      {/* ── Selector inline ─────────────────────────────────────────────── */}
      {selectorActivo &&
        renderPanelInline(
          () => setSelectorActivo(null),
          <>
            <AppText variant="h3" style={{ marginBottom: spacing.md }}>
              {selectorActivo.label}
            </AppText>
            <ScrollView keyboardShouldPersistTaps="handled">
              {selectorActivo.opciones?.map((opcion) => {
                const activa = valores[selectorActivo.id] === opcion;
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
                      backgroundColor: activa
                        ? colors.primaryLight
                        : "transparent",
                    }}
                    onPress={() => {
                      onChange(selectorActivo.id, opcion);
                      setSelectorActivo(null);
                    }}
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
            </ScrollView>
          </>,
        )}

      {/* ── Foto inline ─────────────────────────────────────────────────── */}
      {fotoVisible &&
        renderPanelInline(
          () => setFotoVisible(false),
          <>
            <AppText
              variant="h3"
              align="center"
              style={{ marginBottom: spacing.lg }}
            >
              Selecciona una opción
            </AppText>
            {[
              {
                label: "Tomar foto",
                sub: "Usa la cámara para tomar una foto",
                icono: (
                  <Feather
                    name="camera"
                    size={sizes.iconMd}
                    color={colors.white}
                  />
                ),
                color: colors.primary,
                onPress: tomarFoto,
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
                onPress: elegirGaleria,
              },
            ].map((opcion) => (
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
            <TouchableOpacity
              style={{
                alignItems: "center",
                paddingVertical: spacing.md,
                marginTop: spacing.xxs,
              }}
              onPress={() => setFotoVisible(false)}
            >
              <AppText variant="bodyBold" color={colors.primary}>
                Cancelar
              </AppText>
            </TouchableOpacity>
          </>,
        )}
    </SlideModal>
  );
};
