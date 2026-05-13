import { Feather } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import React from "react";
import { Image, ScrollView, TouchableOpacity, View } from "react-native";
import { useTheme } from "../../../theme";
import { SlideModalType, useSlideModal } from "../../hooks/useSlideModal";
import { AppButton } from "./AppButton";
import { AppInput } from "./AppInput";
import { AppText } from "./AppText";
import { FotoModal } from "./FotoModal";
import { SelectorModal } from "./SelectorModal";
import { SlideModal } from "./SlideModal";

// ── Tipos de campo ───────────────────────────────────────────────────────────
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
  opciones?: string[]; // para tipo "selector"
  obligatorio?: boolean;
}

// ── Valores del formulario ───────────────────────────────────────────────────
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
  const { colors, spacing, radius, sizes, shadows } = useTheme();

  // ── Modales internos ──────────────────────────────────────────────────────
  const [selectorActivo, setSelectorActivo] = React.useState<Campo | null>(
    null,
  );
  const [modalSelectorVisible, setModalSelectorVisible] = React.useState(false);
  const modalFotoInterno = React.useRef<SlideModalType | null>(null);
  const [fotoModalKey, setFotoModalKey] = React.useState(0);

  // Hook para modal foto interno
  const modalFoto = useSlideModal(30);
  const modalSelector = useSlideModal(480);

  // ── Validación ─────────────────────────────────────────────────────────────
  const formularioValido = campos
    .filter((c) => c.obligatorio !== false)
    .every((c) => valores[c.id]?.trim());

  // ── Handlers foto ──────────────────────────────────────────────────────────
  const campoFoto = campos.find((c) => c.tipo === "foto");

  const tomarFoto = () => {
    modalFoto.cerrar(async () => {
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
    });
  };

  const elegirGaleria = () => {
    modalFoto.cerrar(async () => {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") return;
      const result = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });
      if (!result.canceled && campoFoto) {
        onChange(campoFoto.id, result.assets[0].uri);
      }
    });
  };

  return (
    <>
      <SlideModal modal={modal}>
        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
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
                      style={{
                        position: "relative",
                        marginBottom: spacing.lg,
                      }}
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
                        onPress={() => modalFoto.abrir()}
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
                      onPress={() => modalFoto.abrir()}
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
                    setSelectorActivo(campo);
                    setModalSelectorVisible(true);
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
              />
            );
          })}

          {/* Botón guardar */}
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
        </ScrollView>
      </SlideModal>

      {/* Modal foto interno */}
      <FotoModal
        modal={modalFoto}
        onTomarFoto={tomarFoto}
        onElegirGaleria={elegirGaleria}
      />

      {/* Modal selector interno */}
      {selectorActivo && (
        <SelectorModal
          modal={{
            visible: modalSelectorVisible,
            abrir: () => setModalSelectorVisible(true),
            cerrar: (cb) => {
              setModalSelectorVisible(false);
              cb?.();
            },
            animatedStyle: { transform: [] },
          }}
          titulo={selectorActivo.label}
          opciones={selectorActivo.opciones ?? []}
          valorActual={valores[selectorActivo.id] ?? ""}
          onSeleccionar={(valor) => {
            onChange(selectorActivo.id, valor);
            setModalSelectorVisible(false);
          }}
        />
      )}
    </>
  );
};
