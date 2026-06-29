import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system/legacy";
import { useRouter } from "expo-router";
import * as Sharing from "expo-sharing";
import React from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView as RNScrollView,
  StyleSheet,
  Switch,
  TextInput,
  View,
} from "react-native";

import { ConfiguracionRepositoryImpl } from "../../../data/repositories/ConfiguracionRepositoryImpl";
import { CONFIG_KEYS } from "../../../domain/entities/Configuracion";
import { useTheme } from "../../../theme";
import { FontScale } from "../../../theme/typography";
import {
  cifrarRespaldo,
  descifrarRespaldo,
  leerCabeceraRespaldo,
} from "../../../utils/respaldoCifrado";
import { ScreenWrapper } from "../../components/layout/ScreenWrapper";
import { AppText } from "../../components/ui/AppText";

const configRepo = new ConfiguracionRepositoryImpl();

const ESCALAS: { key: FontScale; label: string; desc: string }[] = [
  { key: "pequeño", label: "Pequeño", desc: "A" },
  { key: "normal", label: "Normal", desc: "A" },
  { key: "grande", label: "Grande", desc: "A" },
  { key: "extraGrande", label: "Extra grande", desc: "A" },
];

export const AjustesScreen = () => {
  const router = useRouter();
  const { spacing, colors, radius, typography, fontScale, setFontScale } =
    useTheme();

  const [inventarioActivo, setInventarioActivo] = React.useState(false);
  const [cargandoConfig, setCargandoConfig] = React.useState(true);

  React.useEffect(() => {
    const cargar = async () => {
      const valor = await configRepo.get(CONFIG_KEYS.INVENTARIO_ACTIVO);
      setInventarioActivo(valor === "1");
      setCargandoConfig(false);
    };
    cargar();
  }, []);

  const toggleInventario = async (nuevoValor: boolean) => {
    setInventarioActivo(nuevoValor);
    await configRepo.set(CONFIG_KEYS.INVENTARIO_ACTIVO, nuevoValor ? "1" : "0");
  };

  const descargarDB = async () => {
    try {
      const origen = FileSystem.documentDirectory + "SQLite/facil.db";
      const destino = FileSystem.documentDirectory + "facil-export.db";
      await FileSystem.copyAsync({ from: origen, to: destino });
      const disponible = await Sharing.isAvailableAsync();
      if (!disponible) {
        Alert.alert("Error", "La función compartir no está disponible.");
        return;
      }
      await Sharing.shareAsync(destino, {
        mimeType: "application/octet-stream",
        dialogTitle: "Exportar Base de Datos",
      });
    } catch (error) {
      Alert.alert("Error", "No se pudo exportar la base de datos.");
    }
  };

  // ── Estado modales de respaldo ─────────────────────────────────────────────
  const [modalExportar, setModalExportar] = React.useState(false);
  const [modalImportar, setModalImportar] = React.useState(false);
  const [contrasenaExport, setContrasenaExport] = React.useState("");
  const [contrasenaImport, setContrasenaImport] = React.useState("");
  const [empresa, setEmpresa] = React.useState("");
  const [procesando, setProcesando] = React.useState(false);
  const [archivoImport, setArchivoImport] = React.useState<{
    uri: string;
    cabecera: { empresa: string; fecha: string } | null;
  } | null>(null);

  const abrirModalExportar = () => {
    setContrasenaExport("");
    setEmpresa("");
    setModalExportar(true);
  };

  const abrirModalImportar = async () => {
    try {
      const resultado = await DocumentPicker.getDocumentAsync({
        type: "*/*",
        copyToCacheDirectory: true,
      });
      if (resultado.canceled) return;
      const archivo = resultado.assets[0];
      const contenido = await FileSystem.readAsStringAsync(archivo.uri, {
        encoding: FileSystem.EncodingType.UTF8,
      });
      const cabecera = leerCabeceraRespaldo(contenido);
      if (!cabecera) {
        Alert.alert(
          "Archivo inválido",
          "El archivo seleccionado no es un respaldo de Fácil Facturación.",
        );
        return;
      }
      setArchivoImport({
        uri: archivo.uri,
        cabecera: { empresa: cabecera.empresa, fecha: cabecera.fecha },
      });
      setContrasenaImport("");
      setModalImportar(true);
    } catch {
      Alert.alert("Error", "No se pudo abrir el archivo.");
    }
  };

  const exportarRespaldo = async () => {
    if (!contrasenaExport.trim()) {
      Alert.alert(
        "Falta la contraseña",
        "Ingresa una contraseña para el respaldo.",
      );
      return;
    }
    setProcesando(true);
    try {
      const origen = FileSystem.documentDirectory + "SQLite/facil.db";
      const dbBase64 = await FileSystem.readAsStringAsync(origen, {
        encoding: FileSystem.EncodingType.Base64,
      });
      const binary = atob(dbBase64);
      const dbBytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        dbBytes[i] = binary.charCodeAt(i);
      }
      const nombreEmpresa = empresa.trim() || "Mi negocio";
      const jsonRespaldo = await cifrarRespaldo(
        dbBytes,
        contrasenaExport.trim(),
        nombreEmpresa,
      );
      const fecha = new Date().toISOString().split("T")[0];
      const rutaDestino =
        FileSystem.documentDirectory + `respaldo_${fecha}.backup`;
      await FileSystem.writeAsStringAsync(rutaDestino, jsonRespaldo, {
        encoding: FileSystem.EncodingType.UTF8,
      });
      const disponible = await Sharing.isAvailableAsync();
      if (!disponible) {
        Alert.alert("Error", "La función compartir no está disponible.");
        return;
      }
      // Primero share, después cerrar el modal
      await Sharing.shareAsync(rutaDestino, {
        mimeType: "application/octet-stream",
        dialogTitle: "Guardar respaldo",
      });
      setModalExportar(false);
    } catch {
      Alert.alert("Error", "No se pudo crear el respaldo.");
    } finally {
      setProcesando(false);
    }
  };

  const importarRespaldo = async () => {
    if (!contrasenaImport.trim()) {
      Alert.alert("Falta la contraseña", "Ingresa la contraseña del respaldo.");
      return;
    }
    if (!archivoImport) return;
    setProcesando(true);
    try {
      const contenido = await FileSystem.readAsStringAsync(archivoImport.uri, {
        encoding: FileSystem.EncodingType.UTF8,
      });
      const resultado = await descifrarRespaldo(
        contenido,
        contrasenaImport.trim(),
      );
      if (!resultado) {
        Alert.alert(
          "Contraseña incorrecta",
          "La contraseña ingresada no es correcta. Inténtalo de nuevo.",
        );
        setProcesando(false);
        return;
      }
      const destino = FileSystem.documentDirectory + "SQLite/facil.db";
      let binary = "";
      for (let i = 0; i < resultado.dbBytes.length; i++) {
        binary += String.fromCharCode(resultado.dbBytes[i]);
      }
      const base64 = btoa(binary);
      await FileSystem.writeAsStringAsync(destino, base64, {
        encoding: FileSystem.EncodingType.Base64,
      });
      setModalImportar(false);
      Alert.alert(
        "✅ Respaldo restaurado",
        "Los datos se restauraron correctamente. Reinicia la aplicación para ver los cambios.",
        [{ text: "Entendido" }],
      );
    } catch {
      Alert.alert(
        "Error",
        "No se pudo restaurar el respaldo. El archivo puede estar dañado.",
      );
    } finally {
      setProcesando(false);
    }
  };

  return (
    <ScreenWrapper showBtnB={false} title="Ajustes">
      <View
        style={[
          s.container,
          { paddingHorizontal: spacing.lg, paddingTop: spacing.md },
        ]}
      >
        {/* ── TAMAÑO DE LETRA ─────────────────────────────────────────────── */}
        {/* 
        <View
          style={[
            s.section,
            {
              backgroundColor: colors.white,
              borderRadius: radius.lg,
              marginBottom: spacing.lg,
            },
          ]}
        >
          <View
            style={[
              s.sectionHeader,
              {
                paddingHorizontal: spacing.lg,
                paddingTop: spacing.lg,
                paddingBottom: spacing.sm,
              },
            ]}
          >
            <MaterialCommunityIcons
              name="format-size"
              size={28}
              color={colors.primary}
            />
            <View style={{ flex: 1, marginLeft: spacing.md }}>
              <AppText
                style={{
                  fontSize: typography.size.md,
                  fontWeight: "700",
                  color: colors.ink,
                }}
              >
                Tamaño de letra
              </AppText>
              <AppText
                style={{
                  fontSize: typography.size.sm,
                  color: colors.grayText,
                  marginTop: 2,
                }}
              >
                Ajusta el texto de toda la aplicación
              </AppText>
            </View>
          </View>

          {/* Selector de escala */}
        {/*
          <View
            style={[
              s.escalaRow,
              {
                paddingHorizontal: spacing.md,
                paddingBottom: spacing.lg,
                gap: spacing.xs,
              },
            ]}
          >
            {ESCALAS.map((escala, i) => {
              const activo = fontScale === escala.key;
              const tamLetra = 13 + i * 4;
              return (
                <TouchableOpacity
                  key={escala.key}
                  onPress={() => setFontScale(escala.key)}
                  activeOpacity={0.8}
                  style={[
                    s.escalaBtn,
                    {
                      borderRadius: radius.lg,
                      borderColor: activo ? colors.primary : colors.grayBorder,
                      backgroundColor: activo
                        ? colors.primaryLight
                        : colors.grayBg,
                      borderWidth: activo ? 2 : 1,
                    },
                  ]}
                >
                  <AppText
                    style={{
                      fontSize: tamLetra,
                      fontWeight: "700",
                      color: activo ? colors.primary : colors.inkSoft,
                    }}
                  >
                    {escala.desc}
                  </AppText>
                  <AppText
                    style={{
                      fontSize: 12,
                      color: activo ? colors.primary : colors.grayText,
                      marginTop: 4,
                      textAlign: "center",
                    }}
                  >
                    {escala.label}
                  </AppText>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Vista previa */}
        {/*
          <View
            style={[
              s.preview,
              {
                marginHorizontal: spacing.lg,
                marginBottom: spacing.lg,
                backgroundColor: colors.grayBg,
                borderRadius: radius.md,
                padding: spacing.md,
              },
            ]}
          >
            <AppText
              style={{ fontSize: typography.size.xs, color: colors.grayText }}
            >
              Vista previa
            </AppText>
            <AppText
              style={{
                fontSize: typography.size.lg,
                fontWeight: "700",
                color: colors.ink,
                marginTop: 4,
              }}
            >
              Venta del día
            </AppText>
            <AppText
              style={{
                fontSize: typography.size.md,
                color: colors.inkSoft,
                marginTop: 2,
              }}
            >
              Total efectivo: $ 150.000
            </AppText>
            <AppText
              style={{
                fontSize: typography.size.sm,
                color: colors.grayText,
                marginTop: 2,
              }}
            >
              Factura N° 2026-001
            </AppText>
          </View>
        </View> 
        */}

        {/* ── TOGGLE INVENTARIO ───────────────────────────────────────────── */}
        <View
          style={[
            s.card,
            {
              backgroundColor: colors.white,
              borderRadius: radius.lg,
              marginBottom: spacing.lg,
            },
          ]}
        >
          <MaterialCommunityIcons
            name="package-variant"
            size={38}
            color={colors.primary}
            style={{ marginRight: spacing.lg }}
          />
          <View style={{ flex: 1 }}>
            <AppText
              style={{
                fontSize: typography.size.md,
                fontWeight: "700",
                color: colors.ink,
                marginBottom: 4,
              }}
            >
              Control de inventario
            </AppText>
            <AppText
              style={{
                fontSize: typography.size.sm,
                color: colors.grayText,
                lineHeight: 20,
              }}
            >
              {inventarioActivo
                ? "Activo · El stock se descuenta al vender"
                : "Inactivo · Las ventas no afectan el stock"}
            </AppText>
          </View>
          <Switch
            value={inventarioActivo}
            onValueChange={toggleInventario}
            disabled={cargandoConfig}
            trackColor={{ false: colors.grayBorder, true: colors.primary }}
            thumbColor={colors.white}
          />
        </View>

        {/* ── DESCARGAR BD ────────────────────────────────────────────────── */}
        <Pressable
          onPress={descargarDB}
          style={({ pressed }) => [
            s.card,
            {
              backgroundColor: pressed ? colors.grayBg : colors.white,
              borderRadius: radius.lg,
              marginBottom: spacing.lg,
              opacity: pressed ? 0.9 : 1,
            },
          ]}
        >
          <MaterialCommunityIcons
            name="database-arrow-down"
            size={38}
            color={colors.primary}
            style={{ marginRight: spacing.lg }}
          />
          <View style={{ flex: 1 }}>
            <AppText
              style={{
                fontSize: typography.size.md,
                fontWeight: "700",
                color: colors.ink,
                marginBottom: 4,
              }}
            >
              Descargar base de datos
            </AppText>
            <AppText
              style={{
                fontSize: typography.size.sm,
                color: colors.grayText,
                lineHeight: 20,
              }}
            >
              Exporta y guarda una copia local de la base de datos.
            </AppText>
          </View>
          <MaterialCommunityIcons
            name="chevron-right"
            size={24}
            color={colors.grayText}
          />
        </Pressable>

        {/* ── EXPORTAR RESPALDO ────────────────────────────────────────────── */}
        <Pressable
          onPress={abrirModalExportar}
          style={({ pressed }) => [
            s.card,
            {
              backgroundColor: pressed ? colors.grayBg : colors.white,
              borderRadius: radius.lg,
              marginBottom: spacing.lg,
              opacity: pressed ? 0.9 : 1,
            },
          ]}
        >
          <MaterialCommunityIcons
            name="shield-lock-outline"
            size={38}
            color={colors.primary}
            style={{ marginRight: spacing.lg }}
          />
          <View style={{ flex: 1 }}>
            <AppText
              style={{
                fontSize: typography.size.md,
                fontWeight: "700",
                color: colors.ink,
                marginBottom: 4,
              }}
            >
              Respaldar datos
            </AppText>
            <AppText
              style={{
                fontSize: typography.size.sm,
                color: colors.grayText,
                lineHeight: 20,
              }}
            >
              Crea una copia cifrada y segura de tu información.
            </AppText>
          </View>
          <MaterialCommunityIcons
            name="chevron-right"
            size={24}
            color={colors.grayText}
          />
        </Pressable>

        {/* ── IMPORTAR RESPALDO ────────────────────────────────────────────── */}
        <Pressable
          onPress={abrirModalImportar}
          style={({ pressed }) => [
            s.card,
            {
              backgroundColor: pressed ? colors.grayBg : colors.white,
              borderRadius: radius.lg,
              marginBottom: spacing.lg,
              opacity: pressed ? 0.9 : 1,
            },
          ]}
        >
          <MaterialCommunityIcons
            name="restore"
            size={38}
            color={colors.primary}
            style={{ marginRight: spacing.lg }}
          />
          <View style={{ flex: 1 }}>
            <AppText
              style={{
                fontSize: typography.size.md,
                fontWeight: "700",
                color: colors.ink,
                marginBottom: 4,
              }}
            >
              Restaurar respaldo
            </AppText>
            <AppText
              style={{
                fontSize: typography.size.sm,
                color: colors.grayText,
                lineHeight: 20,
              }}
            >
              Recupera tus datos desde un archivo de respaldo.
            </AppText>
          </View>
          <MaterialCommunityIcons
            name="chevron-right"
            size={24}
            color={colors.grayText}
          />
        </Pressable>

        {/* ── AYUDA ───────────────────────────────────────────────────────── */}
        <Pressable
          onPress={() => router.push("/ayuda")}
          style={({ pressed }) => [
            s.card,
            {
              backgroundColor: pressed ? colors.grayBg : colors.white,
              borderRadius: radius.lg,
              opacity: pressed ? 0.9 : 1,
            },
          ]}
        >
          <MaterialCommunityIcons
            name="chat-question"
            size={38}
            color={colors.primary}
            style={{ marginRight: spacing.lg }}
          />
          <View style={{ flex: 1 }}>
            <AppText
              style={{
                fontSize: typography.size.md,
                fontWeight: "700",
                color: colors.ink,
                marginBottom: 4,
              }}
            >
              Ayuda y soporte
            </AppText>
            <AppText
              style={{
                fontSize: typography.size.sm,
                color: colors.grayText,
                lineHeight: 20,
              }}
            >
              Resuelve dudas o contacta con soporte técnico.
            </AppText>
          </View>
          <MaterialCommunityIcons
            name="chevron-right"
            size={24}
            color={colors.grayText}
          />
        </Pressable>
      </View>

      {/* ── MODAL EXPORTAR ─────────────────────────────────────────────────── */}
      <Modal
        visible={modalExportar}
        transparent
        animationType="fade"
        onRequestClose={() => setModalExportar(false)}
      >
        <KeyboardAvoidingView
          style={s.modalOverlay}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <RNScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ flexGrow: 1, justifyContent: "center" }}
            showsVerticalScrollIndicator={false}
          >
            <View
              style={[
                s.modalBox,
                { backgroundColor: colors.white, borderRadius: radius.lg },
              ]}
            >
              <AppText
                style={{
                  fontSize: typography.size.lg,
                  fontWeight: "800",
                  color: colors.ink,
                  marginBottom: 4,
                }}
              >
                Respaldar datos
              </AppText>
              <AppText
                style={{
                  fontSize: typography.size.sm,
                  color: colors.grayText,
                  marginBottom: spacing.lg,
                  lineHeight: 20,
                }}
              >
                El respaldo se cifrará con la contraseña que ingreses. Sin ella
                no será posible restaurar los datos.
              </AppText>

              {/* Nombre empresa */}
              <AppText
                style={{
                  fontSize: typography.size.sm,
                  fontWeight: "600",
                  color: colors.ink,
                  marginBottom: 6,
                }}
              >
                Nombre del negocio (opcional)
              </AppText>
              <TextInput
                value={empresa}
                onChangeText={setEmpresa}
                placeholder="Ej: Panadería El Sol"
                placeholderTextColor={colors.grayText}
                style={[
                  s.input,
                  {
                    color: colors.ink,
                    borderColor: colors.grayBorder,
                    borderRadius: radius.md,
                    backgroundColor: colors.grayBg,
                    fontSize: typography.size.md,
                    marginBottom: spacing.md,
                  },
                ]}
              />

              {/* Contraseña */}
              <AppText
                style={{
                  fontSize: typography.size.sm,
                  fontWeight: "600",
                  color: colors.ink,
                  marginBottom: 6,
                }}
              >
                Contraseña del respaldo *
              </AppText>
              <TextInput
                value={contrasenaExport}
                onChangeText={setContrasenaExport}
                placeholder="NIT, PIN o contraseña"
                placeholderTextColor={colors.grayText}
                secureTextEntry
                style={[
                  s.input,
                  {
                    color: colors.ink,
                    borderColor: colors.grayBorder,
                    borderRadius: radius.md,
                    backgroundColor: colors.grayBg,
                    fontSize: typography.size.md,
                    marginBottom: spacing.lg,
                  },
                ]}
              />

              {/* Botones */}
              <View style={s.modalBtns}>
                <Pressable
                  onPress={() => setModalExportar(false)}
                  style={[
                    s.btnSecundario,
                    { borderColor: colors.grayBorder, borderRadius: radius.md },
                  ]}
                >
                  <AppText
                    style={{
                      color: colors.grayText,
                      fontWeight: "600",
                      fontSize: typography.size.md,
                    }}
                  >
                    Cancelar
                  </AppText>
                </Pressable>
                <Pressable
                  onPress={exportarRespaldo}
                  disabled={procesando}
                  style={[
                    s.btnPrimario,
                    {
                      backgroundColor: colors.primary,
                      borderRadius: radius.md,
                      opacity: procesando ? 0.7 : 1,
                    },
                  ]}
                >
                  <AppText
                    style={{
                      color: colors.white,
                      fontWeight: "700",
                      fontSize: typography.size.md,
                    }}
                  >
                    {procesando ? "Cifrando…" : "Exportar"}
                  </AppText>
                </Pressable>
              </View>
            </View>
          </RNScrollView>
        </KeyboardAvoidingView>
      </Modal>

      {/* ── MODAL IMPORTAR ─────────────────────────────────────────────────── */}
      <Modal
        visible={modalImportar}
        transparent
        animationType="fade"
        onRequestClose={() => setModalImportar(false)}
      >
        <KeyboardAvoidingView
          style={s.modalOverlay}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <RNScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ flexGrow: 1, justifyContent: "center" }}
            showsVerticalScrollIndicator={false}
          >
            <View
              style={[
                s.modalBox,
                { backgroundColor: colors.white, borderRadius: radius.lg },
              ]}
            >
              <AppText
                style={{
                  fontSize: typography.size.lg,
                  fontWeight: "800",
                  color: colors.ink,
                  marginBottom: 4,
                }}
              >
                Restaurar respaldo
              </AppText>

              {/* Info del archivo */}
              {archivoImport?.cabecera && (
                <View
                  style={[
                    s.infoBox,
                    {
                      backgroundColor: colors.primaryLight,
                      borderRadius: radius.md,
                      marginBottom: spacing.lg,
                    },
                  ]}
                >
                  <AppText
                    style={{
                      fontSize: typography.size.sm,
                      color: colors.grayText,
                      marginBottom: 2,
                    }}
                  >
                    Respaldo encontrado
                  </AppText>
                  <AppText
                    style={{
                      fontSize: typography.size.md,
                      fontWeight: "700",
                      color: colors.ink,
                    }}
                  >
                    {archivoImport.cabecera.empresa}
                  </AppText>
                  <AppText
                    style={{
                      fontSize: typography.size.sm,
                      color: colors.grayText,
                      marginTop: 2,
                    }}
                  >
                    Fecha: {archivoImport.cabecera.fecha}
                  </AppText>
                </View>
              )}

              <AppText
                style={{
                  fontSize: typography.size.sm,
                  color: colors.grayText,
                  marginBottom: spacing.md,
                  lineHeight: 20,
                }}
              >
                ⚠️ Esta acción reemplazará todos los datos actuales con los del
                respaldo.
              </AppText>

              {/* Contraseña */}
              <AppText
                style={{
                  fontSize: typography.size.sm,
                  fontWeight: "600",
                  color: colors.ink,
                  marginBottom: 6,
                }}
              >
                Contraseña del respaldo *
              </AppText>
              <TextInput
                value={contrasenaImport}
                onChangeText={setContrasenaImport}
                placeholder="NIT, PIN o contraseña"
                placeholderTextColor={colors.grayText}
                secureTextEntry
                style={[
                  s.input,
                  {
                    color: colors.ink,
                    borderColor: colors.grayBorder,
                    borderRadius: radius.md,
                    backgroundColor: colors.grayBg,
                    fontSize: typography.size.md,
                    marginBottom: spacing.lg,
                  },
                ]}
              />

              {/* Botones */}
              <View style={s.modalBtns}>
                <Pressable
                  onPress={() => setModalImportar(false)}
                  style={[
                    s.btnSecundario,
                    { borderColor: colors.grayBorder, borderRadius: radius.md },
                  ]}
                >
                  <AppText
                    style={{
                      color: colors.grayText,
                      fontWeight: "600",
                      fontSize: typography.size.md,
                    }}
                  >
                    Cancelar
                  </AppText>
                </Pressable>
                <Pressable
                  onPress={importarRespaldo}
                  disabled={procesando}
                  style={[
                    s.btnPrimario,
                    {
                      backgroundColor: colors.primary,
                      borderRadius: radius.md,
                      opacity: procesando ? 0.7 : 1,
                    },
                  ]}
                >
                  <AppText
                    style={{
                      color: colors.white,
                      fontWeight: "700",
                      fontSize: typography.size.md,
                    }}
                  >
                    {procesando ? "Restaurando…" : "Restaurar"}
                  </AppText>
                </Pressable>
              </View>
            </View>
          </RNScrollView>
        </KeyboardAvoidingView>
      </Modal>
    </ScreenWrapper>
  );
};

const s = StyleSheet.create({
  container: { flex: 1 },
  section: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
  },
  sectionHeader: { flexDirection: "row", alignItems: "center" },
  escalaRow: { flexDirection: "row" },
  escalaBtn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    paddingHorizontal: 6,
  },
  preview: {},
  card: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 100,
    paddingHorizontal: 20,
    paddingVertical: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
  },
  // Modales
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  modalBox: {
    width: "100%",
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 10,
  },
  input: {
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    height: 48,
  },
  infoBox: {
    padding: 14,
  },
  modalBtns: {
    flexDirection: "row",
    gap: 12,
  },
  btnSecundario: {
    flex: 1,
    height: 48,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  btnPrimario: {
    flex: 1,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
  },
});
