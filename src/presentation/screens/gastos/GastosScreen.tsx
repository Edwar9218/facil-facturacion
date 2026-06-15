// src/presentation/screens/gastos/GastosScreen.tsx

import { MaterialCommunityIcons, MaterialIcons } from "@expo/vector-icons";
import React from "react";
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CATEGORIAS_SUGERIDAS } from "../../../domain/entities/Gasto";
import { useTheme } from "../../../theme";
import { ScreenWrapper } from "../../components/layout/ScreenWrapper";
import { Campo, FormularioModal } from "../../components/ui/FormularioModal";
import { GastoCard } from "./components/GastoCard";
import { useGastos } from "./hooks/useGastos";

const fmt = (n: number) =>
  n.toLocaleString("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
  });

export default function GastosScreen() {
  const insets = useSafeAreaInsets();
  const { colors, spacing, radius, shadows, typography } = useTheme();

  const {
    gastos,
    cargando,
    modalAbierto,
    form,
    categoriaLibre,
    totalEfectivo,
    totalTransferencia,
    setCampo,
    seleccionarCategoria,
    abrirModal,
    cerrarModal,
    registrarGasto,
    confirmarEliminar,
  } = useGastos();

  // ── Resumen superior ──────────────────────────────────────────────────────
  const renderResumen = () => (
    <View
      style={{
        flexDirection: "row",
        gap: spacing.sm,
        marginBottom: spacing.lg,
      }}
    >
      {/* Efectivo */}
      <View
        style={{
          flex: 1,
          backgroundColor: colors.white,
          borderRadius: radius.lg,
          padding: spacing.md,
          borderWidth: 1,
          borderColor: "#A7F3D0",
          ...shadows.card,
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 6,
            marginBottom: 4,
          }}
        >
          <MaterialCommunityIcons name="cash" size={16} color="#2EAA6E" />
          <Text
            style={{
              fontSize: typography.size.sm,
              fontWeight: typography.weight.bold,
              color: "#2EAA6E",
            }}
          >
            Efectivo
          </Text>
        </View>
        <Text
          style={{
            fontSize: typography.size.xl,
            fontWeight: typography.weight.black,
            color: "#E03E3E",
          }}
        >
          -{fmt(totalEfectivo)}
        </Text>
      </View>

      {/* Transferencia */}
      <View
        style={{
          flex: 1,
          backgroundColor: colors.white,
          borderRadius: radius.lg,
          padding: spacing.md,
          borderWidth: 1,
          borderColor: "#DDD6FE",
          ...shadows.card,
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 6,
            marginBottom: 4,
          }}
        >
          <MaterialCommunityIcons
            name="bank-transfer"
            size={16}
            color="#7C3AED"
          />
          <Text
            style={{
              fontSize: typography.size.sm,
              fontWeight: typography.weight.bold,
              color: "#7C3AED",
            }}
          >
            Transferencia
          </Text>
        </View>
        <Text
          style={{
            fontSize: typography.size.xl,
            fontWeight: typography.weight.black,
            color: "#E03E3E",
          }}
        >
          -{fmt(totalTransferencia)}
        </Text>
      </View>
    </View>
  );

  // ── Configuración y Mapeo del Formulario Generalizado ──────────────────────

  const modalConfig = {
    visible: modalAbierto,
    abrir: abrirModal,
    cerrar: cerrarModal,
  };

  const camposFormulario: Campo[] = [
    {
      id: "descripcion",
      label: "Descripción",
      placeholder: "Ej: Gasolina, Almuerzo...",
      tipo: "texto",
      obligatorio: true,
    },
    {
      id: "monto",
      label: "Monto",
      placeholder: "0",
      tipo: "precio",
      obligatorio: true,
    },
    {
      id: "categoria",
      label: "Categoría",
      tipo: "selector",
      opciones: [...CATEGORIAS_SUGERIDAS, "Otro"],
      obligatorio: true,
    },
    // Si elige 'Otro', se inserta dinámicamente el input de texto libre
    ...(categoriaLibre
      ? [
          {
            id: "categoriaPersonalizada",
            label: "Nombre de la categoría",
            placeholder: "Escribe la categoría...",
            tipo: "texto" as const,
            obligatorio: true,
          },
        ]
      : []),
    {
      id: "metodoPago",
      label: "Método de Pago",
      tipo: "selector",
      opciones: ["efectivo", "transferencia"],
      obligatorio: true,
    },
    {
      id: "foto",
      label: "Foto del comprobante",
      tipo: "foto",
      obligatorio: false,
    },
  ];

  const valoresFormulario = {
    descripcion: form.descripcion,
    // Enviamos el monto formateado con puntos para cumplir con el diseño visual del modal
    monto:
      form.monto && Number(form.monto) > 0
        ? form.monto.replace(/\B(?=(\d{3})+(?!\d))/g, ".")
        : "",
    categoria: categoriaLibre ? "Otro" : form.categoria,
    categoriaPersonalizada: form.categoriaPersonalizada,
    metodoPago: form.metodoPago,
    foto: form.foto,
  };

  const handleOnChange = (id: string, valor: string) => {
    if (id === "monto") {
      // Removemos los puntos introducidos por el formato visual antes de guardarlo en el estado numérico plano
      setCampo("monto", valor.replace(/[^0-9]/g, ""));
    } else if (id === "categoria") {
      seleccionarCategoria(valor);
    } else {
      setCampo(id as any, valor);
    }
  };

  // ── Render principal ──────────────────────────────────────────────────────
  return (
    <>
      <ScreenWrapper title="Gastos del día" showBtnB={false}>
        <ScrollView
          contentContainerStyle={{
            padding: spacing.lg,
            paddingBottom: insets.bottom + 100,
          }}
          showsVerticalScrollIndicator={false}
        >
          {/* Fecha del día colocada limpiamente al principio del contenido */}
          <Text
            style={{
              fontSize: typography.size.sm,
              color: colors.grayText,
              marginBottom: spacing.md,
              textTransform: "capitalize",
            }}
          >
            {new Date().toLocaleDateString("es-CO", {
              weekday: "long",
              day: "numeric",
              month: "long",
            })}
          </Text>

          {renderResumen()}

          {/* Lista de gastos */}
          {cargando && gastos.length === 0 ? (
            <ActivityIndicator
              color={colors.primary}
              style={{ marginTop: 40 }}
            />
          ) : gastos.length === 0 ? (
            <View
              style={{ alignItems: "center", paddingVertical: 48, gap: 10 }}
            >
              <Text style={{ fontSize: 40 }}>💸</Text>
              <Text
                style={{
                  fontSize: typography.size.lg,
                  fontWeight: typography.weight.bold,
                  color: colors.ink,
                }}
              >
                Sin gastos hoy
              </Text>
              <Text
                style={{
                  fontSize: typography.size.md,
                  color: colors.grayText,
                  textAlign: "center",
                }}
              >
                Registra los gastos del día para llevar el control
              </Text>
            </View>
          ) : (
            gastos.map((g) => (
              <GastoCard key={g.id} gasto={g} onEliminar={confirmarEliminar} />
            ))
          )}
        </ScrollView>

        {/* FAB */}
        <TouchableOpacity
          onPress={abrirModal}
          style={{
            position: "absolute",
            bottom: insets.bottom + spacing.lg,
            right: spacing.lg,
            width: 60,
            height: 60,
            borderRadius: 30,
            backgroundColor: "#E03E3E",
            alignItems: "center",
            justifyContent: "center",
            shadowColor: "#E03E3E",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.35,
            shadowRadius: 8,
            elevation: 6,
          }}
          activeOpacity={0.85}
        >
          <MaterialIcons name="add" size={28} color={colors.white} />
        </TouchableOpacity>
      </ScreenWrapper>

      {/* Uso de FormularioModal Generalizado */}
      <FormularioModal
        modal={modalConfig}
        titulo="Nuevo gasto"
        subtitulo="Registra los detalles del gasto actual"
        campos={camposFormulario}
        valores={valoresFormulario}
        onChange={handleOnChange}
        onGuardar={registrarGasto}
        labelGuardar="Registrar gasto"
      />
    </>
  );
}
