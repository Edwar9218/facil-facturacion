import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system/legacy";
import * as Linking from "expo-linking";
import * as Sharing from "expo-sharing";
import React from "react";
import {
    Alert,
    KeyboardAvoidingView,
    Modal,
    NativeModules,
    Platform,
    Pressable,
    ScrollView as RNScrollView,
    StyleSheet,
    TextInput,
    View,
} from "react-native";

import { resetDatabase } from "../../../data/database/database";
import { useTheme } from "../../../theme";
import {
    cifrarRespaldo,
    descifrarRespaldo,
    leerCabeceraRespaldo,
} from "../../../utils/respaldoCifrado";
import { ScreenWrapper } from "../../components/layout/ScreenWrapper";
import { AppText } from "../../components/ui/AppText";

// ─────────────────────────────────────────────────────────────────────────────
// Tipos de modal internos
// ─────────────────────────────────────────────────────────────────────────────
type ModalActivo =
  | "exportar"
  | "importar"
  | "borrar1"
  | "borrar2"
  | "reiniciar"
  | null;

export const GestionDatosScreen = () => {
  const { spacing, colors, radius, typography } = useTheme();

  // ── Estado general de modales ────────────────────────────────────────────────
  const [modalActivo, setModalActivo] = React.useState<ModalActivo>(null);

  // ── Respaldo exportar ────────────────────────────────────────────────────────
  const [contrasenaExport, setContrasenaExport] = React.useState("");
  const [empresa, setEmpresa] = React.useState("");
  const [procesandoExport, setProcesandoExport] = React.useState(false);

  // ── Respaldo importar ────────────────────────────────────────────────────────
  const [contrasenaImport, setContrasenaImport] = React.useState("");
  const [procesandoImport, setProcesandoImport] = React.useState(false);
  const [archivoImport, setArchivoImport] = React.useState<{
    uri: string;
    cabecera: { empresa: string; fecha: string } | null;
  } | null>(null);

  // ── Restablecer de fábrica ───────────────────────────────────────────────────
  const [textoBorrar, setTextoBorrar] = React.useState("");

  // ── Helpers de cierre ───────────────────────────────────────────────────────
  const cerrar = () => setModalActivo(null);

  // ─────────────────────────────────────────────────────────────────────────────
  // EXPORTAR RESPALDO
  // ─────────────────────────────────────────────────────────────────────────────
  const abrirExportar = () => {
    setContrasenaExport("");
    setEmpresa("");
    setModalActivo("exportar");
  };

  const exportarRespaldo = async () => {
    if (!contrasenaExport.trim()) {
      Alert.alert(
        "Falta la contraseña",
        "Ingresa una contraseña para el respaldo.",
      );
      return;
    }
    setProcesandoExport(true);
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
      await Sharing.shareAsync(rutaDestino, {
        mimeType: "application/octet-stream",
        dialogTitle: "Guardar respaldo",
      });
      cerrar();
    } catch {
      Alert.alert("Error", "No se pudo crear el respaldo.");
    } finally {
      setProcesandoExport(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // IMPORTAR RESPALDO
  // ─────────────────────────────────────────────────────────────────────────────
  const abrirImportar = async () => {
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
      setModalActivo("importar");
    } catch {
      Alert.alert("Error", "No se pudo abrir el archivo.");
    }
  };

  const importarRespaldo = async () => {
    if (!contrasenaImport.trim()) {
      Alert.alert("Falta la contraseña", "Ingresa la contraseña del respaldo.");
      return;
    }
    if (!archivoImport) return;
    setProcesandoImport(true);
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
        setProcesandoImport(false);
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
      cerrar();
      // Pequeña pausa para que el modal de importar se cierre antes de abrir el de reinicio
      setTimeout(() => setModalActivo("reiniciar"), 300);
    } catch {
      Alert.alert(
        "Error",
        "No se pudo restaurar el respaldo. El archivo puede estar dañado.",
      );
    } finally {
      setProcesandoImport(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // REINICIAR APP
  // En producción (EAS build): abre el scheme de la app para relanzarla.
  // En desarrollo (Expo Go / dev client): usa DevSettings.reload().
  // ─────────────────────────────────────────────────────────────────────────────
  const reiniciarApp = async () => {
    cerrar();
    // Pequeña pausa para que el modal cierre antes del reinicio
    await new Promise((r) => setTimeout(r, 200));

    // Dev: DevSettings.reload() recarga el bundle JS inmediatamente
    if (__DEV__ && NativeModules.DevSettings?.reload) {
      NativeModules.DevSettings.reload();
      return;
    }

    // Producción: relanzar via deep link del scheme de la app
    try {
      await Linking.openURL("facil://");
    } catch {
      // Fallback: si el scheme no responde, informar al usuario
      Alert.alert(
        "Reinicia manualmente",
        "Cierra la aplicación y vuelve a abrirla para ver los cambios.",
      );
    }
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // DESCARGAR BASE DE DATOS — solo developer (comentar antes de publicar)
  // ─────────────────────────────────────────────────────────────────────────────
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
    } catch {
      Alert.alert("Error", "No se pudo exportar la base de datos.");
    }
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // RESTABLECER DE FÁBRICA — doble confirmación
  // ─────────────────────────────────────────────────────────────────────────────
  const iniciarRestablecimiento = () => {
    Alert.alert(
      "⚠️ ¿Borrar todo?",
      "Esta acción eliminará PERMANENTEMENTE todas tus ventas, productos, clientes, créditos, gastos y configuración.\n\nEsta acción NO se puede deshacer.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Continuar",
          style: "destructive",
          onPress: () => {
            setTextoBorrar("");
            setModalActivo("borrar2");
          },
        },
      ],
    );
  };

  const ejecutarRestablecimiento = () => {
    if (textoBorrar !== "BORRAR") {
      Alert.alert(
        "Texto incorrecto",
        'Debes escribir exactamente "BORRAR" para confirmar.',
      );
      return;
    }
    try {
      resetDatabase();
      cerrar();
      Alert.alert(
        "✅ Restablecimiento completado",
        "Todos los datos han sido eliminados. La aplicación está como nueva.",
        [{ text: "Entendido" }],
      );
    } catch {
      Alert.alert(
        "Error",
        "No se pudo restablecer la aplicación. Intenta de nuevo.",
      );
    }
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <ScreenWrapper showBtnB={false} title="Gestión de datos">
      <View
        style={[
          s.container,
          { paddingHorizontal: spacing.lg, paddingTop: spacing.md },
        ]}
      >
        {/* ── DESCRIPCIÓN ───────────────────────────────────────────────────── */}
        <AppText
          style={{
            fontSize: typography.size.sm,
            color: colors.grayText,
            lineHeight: 20,
            marginBottom: spacing.lg,
          }}
        >
          Administra los datos de tu negocio: crea respaldos seguros, restaura
          información o restablece la aplicación.
        </AppText>

        {/* ── 🔒 RESPALDAR DATOS ───────────────────────────────────────────── */}
        <Pressable
          onPress={abrirExportar}
          style={({ pressed }) => [
            s.card,
            {
              backgroundColor: pressed ? colors.grayBg : colors.white,
              borderRadius: radius.lg,
              marginBottom: spacing.md,
            },
          ]}
        >
          <View
            style={[
              s.iconWrap,
              { backgroundColor: colors.primaryLight, borderRadius: radius.md },
            ]}
          >
            <MaterialCommunityIcons
              name="shield-lock-outline"
              size={28}
              color={colors.primary}
            />
          </View>
          <View style={{ flex: 1, marginLeft: spacing.md }}>
            <AppText
              style={{
                fontSize: typography.size.md,
                fontWeight: "700",
                color: colors.ink,
                marginBottom: 2,
              }}
            >
              Respaldar datos
            </AppText>
            <AppText
              style={{
                fontSize: typography.size.sm,
                color: colors.grayText,
                lineHeight: 18,
              }}
            >
              Exporta una copia cifrada y segura de tu información.
            </AppText>
          </View>
          <MaterialCommunityIcons
            name="chevron-right"
            size={22}
            color={colors.grayText}
          />
        </Pressable>

        {/* ── 📥 RESTAURAR RESPALDO ─────────────────────────────────────────── */}
        <Pressable
          onPress={abrirImportar}
          style={({ pressed }) => [
            s.card,
            {
              backgroundColor: pressed ? colors.grayBg : colors.white,
              borderRadius: radius.lg,
              marginBottom: spacing.md,
            },
          ]}
        >
          <View
            style={[
              s.iconWrap,
              { backgroundColor: colors.primaryLight, borderRadius: radius.md },
            ]}
          >
            <MaterialCommunityIcons
              name="restore"
              size={28}
              color={colors.primary}
            />
          </View>
          <View style={{ flex: 1, marginLeft: spacing.md }}>
            <AppText
              style={{
                fontSize: typography.size.md,
                fontWeight: "700",
                color: colors.ink,
                marginBottom: 2,
              }}
            >
              Restaurar respaldo
            </AppText>
            <AppText
              style={{
                fontSize: typography.size.sm,
                color: colors.grayText,
                lineHeight: 18,
              }}
            >
              Importa y descifra un archivo de respaldo existente.
            </AppText>
          </View>
          <MaterialCommunityIcons
            name="chevron-right"
            size={22}
            color={colors.grayText}
          />
        </Pressable>

        {/* ── 🔧 DESCARGAR BASE DE DATOS — solo developer ───────────────────── */}
        {/* COMENTAR ANTES DE PUBLICAR */}
        <Pressable
          onPress={descargarDB}
          style={({ pressed }) => [
            s.card,
            {
              backgroundColor: pressed ? colors.grayBg : colors.white,
              borderRadius: radius.lg,
              marginBottom: spacing.md,
              borderWidth: 1,
              borderStyle: "dashed",
              borderColor: colors.grayBorder,
            },
          ]}
        >
          <View
            style={[
              s.iconWrap,
              {
                backgroundColor: "#FFF8E1",
                borderRadius: radius.md,
              },
            ]}
          >
            <MaterialCommunityIcons
              name="database-arrow-down"
              size={28}
              color="#F59E0B"
            />
          </View>
          <View style={{ flex: 1, marginLeft: spacing.md }}>
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
            >
              <AppText
                style={{
                  fontSize: typography.size.md,
                  fontWeight: "700",
                  color: colors.ink,
                  marginBottom: 2,
                }}
              >
                Descargar base de datos
              </AppText>
              <View
                style={{
                  backgroundColor: "#FEF3C7",
                  borderRadius: 4,
                  paddingHorizontal: 6,
                  paddingVertical: 1,
                  marginBottom: 2,
                }}
              >
                <AppText
                  style={{
                    fontSize: 10,
                    fontWeight: "700",
                    color: "#92400E",
                  }}
                >
                  DEV
                </AppText>
              </View>
            </View>
            <AppText
              style={{
                fontSize: typography.size.sm,
                color: colors.grayText,
                lineHeight: 18,
              }}
            >
              Exporta el archivo .db sin cifrar. Solo para desarrollo.
            </AppText>
          </View>
          <MaterialCommunityIcons
            name="chevron-right"
            size={22}
            color={colors.grayText}
          />
        </Pressable>
        {/* FIN BLOQUE DEVELOPER */}

        {/* ── ⚠️ RESTABLECER DE FÁBRICA ─────────────────────────────────────── */}
        <Pressable
          onPress={iniciarRestablecimiento}
          style={({ pressed }) => [
            s.card,
            {
              backgroundColor: pressed ? "#FFF1F2" : colors.white,
              borderRadius: radius.lg,
              marginBottom: spacing.md,
              borderWidth: 1,
              borderColor: "#FECDD3",
            },
          ]}
        >
          <View
            style={[
              s.iconWrap,
              { backgroundColor: "#FFF1F2", borderRadius: radius.md },
            ]}
          >
            <MaterialCommunityIcons
              name="alert-circle-outline"
              size={28}
              color="#EF4444"
            />
          </View>
          <View style={{ flex: 1, marginLeft: spacing.md }}>
            <AppText
              style={{
                fontSize: typography.size.md,
                fontWeight: "700",
                color: "#EF4444",
                marginBottom: 2,
              }}
            >
              Restablecer de fábrica
            </AppText>
            <AppText
              style={{
                fontSize: typography.size.sm,
                color: colors.grayText,
                lineHeight: 18,
              }}
            >
              Elimina todos los datos. Esta acción no se puede deshacer.
            </AppText>
          </View>
          <MaterialCommunityIcons
            name="chevron-right"
            size={22}
            color="#EF4444"
          />
        </Pressable>
      </View>

      {/* ════════════════════════════════════════════════════════════════════════
          MODAL EXPORTAR
      ════════════════════════════════════════════════════════════════════════ */}
      {modalActivo === "exportar" && (
        <ModalBase onClose={cerrar}>
          <AppText style={[s.modalTitulo, { color: colors.ink }]}>
            🔒 Respaldar datos
          </AppText>
          <AppText style={[s.modalSubtitulo, { color: colors.grayText }]}>
            El respaldo se cifrará con la contraseña que ingreses. Sin ella no
            será posible restaurar los datos.
          </AppText>

          <AppText style={[s.label, { color: colors.ink }]}>
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

          <AppText style={[s.label, { color: colors.ink }]}>
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

          <View style={s.modalBtns}>
            <Pressable
              onPress={cerrar}
              style={[
                s.btnSecundario,
                { borderColor: colors.grayBorder, borderRadius: radius.md },
              ]}
            >
              <AppText style={{ color: colors.grayText, fontWeight: "600" }}>
                Cancelar
              </AppText>
            </Pressable>
            <Pressable
              onPress={exportarRespaldo}
              disabled={procesandoExport}
              style={[
                s.btnPrimario,
                {
                  backgroundColor: colors.primary,
                  borderRadius: radius.md,
                  opacity: procesandoExport ? 0.7 : 1,
                },
              ]}
            >
              <AppText style={{ color: colors.white, fontWeight: "700" }}>
                {procesandoExport ? "Cifrando…" : "Exportar"}
              </AppText>
            </Pressable>
          </View>
        </ModalBase>
      )}

      {/* ════════════════════════════════════════════════════════════════════════
          MODAL IMPORTAR
      ════════════════════════════════════════════════════════════════════════ */}
      {modalActivo === "importar" && (
        <ModalBase onClose={cerrar}>
          <AppText style={[s.modalTitulo, { color: colors.ink }]}>
            📥 Restaurar respaldo
          </AppText>

          {archivoImport?.cabecera && (
            <View
              style={[
                s.infoBox,
                {
                  backgroundColor: colors.primaryLight,
                  borderRadius: radius.md,
                  marginBottom: spacing.md,
                },
              ]}
            >
              <AppText
                style={{ fontSize: typography.size.sm, color: colors.grayText }}
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

          <AppText style={[s.modalSubtitulo, { color: colors.grayText }]}>
            ⚠️ Esta acción reemplazará todos los datos actuales con los del
            respaldo.
          </AppText>

          <AppText style={[s.label, { color: colors.ink }]}>
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

          <View style={s.modalBtns}>
            <Pressable
              onPress={cerrar}
              style={[
                s.btnSecundario,
                { borderColor: colors.grayBorder, borderRadius: radius.md },
              ]}
            >
              <AppText style={{ color: colors.grayText, fontWeight: "600" }}>
                Cancelar
              </AppText>
            </Pressable>
            <Pressable
              onPress={importarRespaldo}
              disabled={procesandoImport}
              style={[
                s.btnPrimario,
                {
                  backgroundColor: colors.primary,
                  borderRadius: radius.md,
                  opacity: procesandoImport ? 0.7 : 1,
                },
              ]}
            >
              <AppText style={{ color: colors.white, fontWeight: "700" }}>
                {procesandoImport ? "Restaurando…" : "Restaurar"}
              </AppText>
            </Pressable>
          </View>
        </ModalBase>
      )}

      {/* ════════════════════════════════════════════════════════════════════════
          MODAL BORRAR — paso 2: escribir "BORRAR"
      ════════════════════════════════════════════════════════════════════════ */}
      {modalActivo === "borrar2" && (
        <ModalBase onClose={cerrar}>
          {/* Ícono de advertencia grande */}
          <View style={s.dangerIconWrap}>
            <MaterialCommunityIcons
              name="alert-circle"
              size={48}
              color="#EF4444"
            />
          </View>

          <AppText
            style={[s.modalTitulo, { color: "#EF4444", textAlign: "center" }]}
          >
            Última confirmación
          </AppText>
          <AppText
            style={[
              s.modalSubtitulo,
              { color: colors.grayText, textAlign: "center" },
            ]}
          >
            Para continuar, escribe la palabra{" "}
            <AppText style={{ fontWeight: "800", color: "#EF4444" }}>
              BORRAR
            </AppText>{" "}
            en el campo de abajo.
          </AppText>

          <TextInput
            value={textoBorrar}
            onChangeText={setTextoBorrar}
            placeholder="Escribe BORRAR aquí"
            placeholderTextColor={colors.grayText}
            autoCapitalize="characters"
            style={[
              s.input,
              {
                color: "#EF4444",
                borderColor:
                  textoBorrar === "BORRAR" ? "#EF4444" : colors.grayBorder,
                borderRadius: 10,
                backgroundColor: "#FFF1F2",
                fontSize: typography.size.md,
                fontWeight: "700",
                textAlign: "center",
                marginBottom: spacing.lg,
                letterSpacing: 2,
              },
            ]}
          />

          <View style={s.modalBtns}>
            <Pressable
              onPress={cerrar}
              style={[
                s.btnSecundario,
                { borderColor: colors.grayBorder, borderRadius: radius.md },
              ]}
            >
              <AppText style={{ color: colors.grayText, fontWeight: "600" }}>
                Cancelar
              </AppText>
            </Pressable>
            <Pressable
              onPress={ejecutarRestablecimiento}
              style={[
                s.btnPrimario,
                {
                  backgroundColor:
                    textoBorrar === "BORRAR" ? "#EF4444" : "#FECDD3",
                  borderRadius: radius.md,
                },
              ]}
            >
              <AppText
                style={{
                  color: textoBorrar === "BORRAR" ? "#fff" : "#F87171",
                  fontWeight: "700",
                }}
              >
                Borrar todo
              </AppText>
            </Pressable>
          </View>
        </ModalBase>
      )}
      {/* ════════════════════════════════════════════════════════════════════════
          MODAL REINICIAR — no se puede cerrar tocando fuera
      ════════════════════════════════════════════════════════════════════════ */}
      {modalActivo === "reiniciar" && (
        <ModalBase onClose={null}>
          {/* Ícono de éxito */}
          <View style={{ alignItems: "center", marginBottom: 12 }}>
            <View
              style={{
                width: 56,
                height: 56,
                borderRadius: 28,
                backgroundColor: "#D1FAE5",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <MaterialCommunityIcons
                name="check-circle-outline"
                size={32}
                color="#10B981"
              />
            </View>
          </View>

          <AppText
            style={[s.modalTitulo, { color: colors.ink, textAlign: "center" }]}
          >
            Respaldo restaurado
          </AppText>
          <AppText
            style={[
              s.modalSubtitulo,
              {
                color: colors.grayText,
                textAlign: "center",
                marginBottom: spacing.lg,
              },
            ]}
          >
            Los datos se cargaron correctamente. Para que los cambios sean
            visibles, la aplicación debe reiniciarse.
          </AppText>

          <View style={s.modalBtns}>
            <Pressable
              onPress={cerrar}
              style={[
                s.btnSecundario,
                { borderColor: colors.grayBorder, borderRadius: radius.md },
              ]}
            >
              <AppText style={{ color: colors.grayText, fontWeight: "600" }}>
                Ahora no
              </AppText>
            </Pressable>
            <Pressable
              onPress={reiniciarApp}
              style={[
                s.btnPrimario,
                { backgroundColor: colors.primary, borderRadius: radius.md },
              ]}
            >
              <MaterialCommunityIcons
                name="restart"
                size={18}
                color="#fff"
                style={{ marginRight: 6 }}
              />
              <AppText style={{ color: colors.white, fontWeight: "700" }}>
                Reiniciar
              </AppText>
            </Pressable>
          </View>
        </ModalBase>
      )}
    </ScreenWrapper>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Componente auxiliar: Modal nativo con KeyboardAvoidingView propio.
// onClose = null → no se puede cerrar tocando fuera (modal obligatorio).
// ─────────────────────────────────────────────────────────────────────────────
const ModalBase = ({
  children,
  onClose,
}: {
  children: React.ReactNode;
  onClose: (() => void) | null;
}) => (
  <Modal
    visible
    transparent
    animationType="fade"
    onRequestClose={onClose ?? (() => {})}
    statusBarTranslucent
  >
    <KeyboardAvoidingView
      style={s.modalOverlay}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      {/* Solo cierra al tocar fuera si onClose no es null */}
      <Pressable
        style={StyleSheet.absoluteFillObject}
        onPress={onClose ?? undefined}
      />

      <RNScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={s.modalScroll}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        <Pressable onPress={(e) => e.stopPropagation()}>
          <View style={s.modalBox}>{children}</View>
        </Pressable>
      </RNScrollView>
    </KeyboardAvoidingView>
  </Modal>
);

// ─────────────────────────────────────────────────────────────────────────────
// Estilos
// ─────────────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  container: { flex: 1 },

  // Tarjetas de opciones
  card: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
  },
  iconWrap: {
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
  },

  // Modal overlay — dentro del Modal nativo, ocupa toda la pantalla
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-end", // ancla el scroll al fondo para que suba con el teclado
  },
  // ScrollView interno del modal: centra el contenido verticalmente
  modalScroll: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 24,
  },
  modalBox: {
    width: "100%",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 10,
  },

  // Textos de modal
  modalTitulo: {
    fontSize: 20,
    fontWeight: "800",
    marginBottom: 6,
  },
  modalSubtitulo: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 6,
  },
  infoBox: {
    padding: 14,
  },

  // Inputs y botones de modal
  input: {
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    height: 48,
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
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },

  // Bloque de peligro
  dangerIconWrap: {
    alignItems: "center",
    marginBottom: 12,
  },
});
