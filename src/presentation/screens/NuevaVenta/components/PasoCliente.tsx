import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import React from "react";
import {
  Animated,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useTheme } from "../../../../theme";
import { AppText } from "../../../components/ui/AppText";
import { ClienteCard } from "../../clientes/components/ClienteCard";
import { smoothLayout } from "../hooks/useNuevaVenta";
import { GREEN, GREEN_LIGHT, INK, RED, s, T } from "./tokens";

interface MoraInfo {
  enMora: boolean;
  saldo: number;
}

interface Props {
  step: number;
  flexPaso1: Animated.AnimatedNode;
  filtroCliente: string;
  setFiltroCliente: (v: string) => void;
  filtroClienteActivo: boolean;
  setFiltroClienteActivo: (v: boolean) => void;
  clienteSeleccionado: any;
  setClienteSeleccionado: (v: any) => void;
  clientesFiltrados: any[];
  seleccionarCliente: (c: any) => void;
  setValoresNuevoCliente: React.Dispatch<React.SetStateAction<any>>;
  modalNuevoCliente: { abrir: () => void };
  getMora: (clienteId: string) => MoraInfo;
  dropdownMaxHeight: number;
  siguiente: () => void;
}

export function PasoCliente({
  step,
  flexPaso1,
  filtroCliente,
  setFiltroCliente,
  filtroClienteActivo,
  setFiltroClienteActivo,
  clienteSeleccionado,
  setClienteSeleccionado,
  clientesFiltrados,
  seleccionarCliente,
  setValoresNuevoCliente,
  modalNuevoCliente,
  getMora,
  dropdownMaxHeight,
  siguiente,
}: Props) {
  const { colors, spacing, radius, shadows, sizes, typography } = useTheme();
  const BLUE = colors.primary;
  const BLUE_LIGHT = colors.primaryLight;

  const [alturaInputCliente, setAlturaInputCliente] = React.useState(56);

  const CircleStep = ({ num, active }: { num: number; active: boolean }) => (
    <View style={[s.circle, active ? s.circleActive : s.circleInactive]}>
      <Text style={s.circleText}>{num}</Text>
    </View>
  );

  const renderInputBusqueda = ({
    value,
    onChangeText,
    placeholder,
    onFocus,
    onBlur,
    onClear,
    inputRef,
  }: {
    value: string;
    onChangeText: (t: string) => void;
    placeholder: string;
    onFocus?: () => void;
    onBlur?: () => void;
    onClear: () => void;
    inputRef?: React.RefObject<TextInput>;
  }) => (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: colors.white,
        borderRadius: radius.lg,
        borderWidth: 1,
        borderColor: colors.grayBorder,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        marginBottom: spacing.sm,
        gap: spacing.xs,
      }}
    >
      <MaterialIcons name="search" size={sizes.iconSm} color={colors.grayText} />
      <TextInput
        ref={inputRef}
        style={{
          flex: 1,
          fontSize: typography.size.md,
          color: colors.ink,
          paddingVertical: 0,
        }}
        placeholder={placeholder}
        placeholderTextColor={colors.grayText}
        value={value}
        onChangeText={onChangeText}
        onFocus={onFocus}
        onBlur={onBlur}
      />
      {value.length > 0 && (
        <TouchableOpacity onPress={onClear}>
          <MaterialIcons name="cancel" size={sizes.iconSm} color={colors.grayText} />
        </TouchableOpacity>
      )}
    </View>
  );

  const renderCrearCard = ({
    iconName,
    label,
    sublabel,
    onPress,
  }: {
    iconName: string;
    label: React.ReactNode;
    sublabel?: string;
    onPress: () => void;
  }) => (
    <TouchableOpacity
      style={{
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: colors.white,
        borderWidth: 1.5,
        borderColor: colors.primaryLight,
        borderStyle: "dashed",
        borderRadius: radius.lg,
        padding: spacing.md,
        gap: spacing.sm,
        marginBottom: spacing.xs,
      }}
      onPress={onPress}
      activeOpacity={0.75}
    >
      <View
        style={{
          width: 40,
          height: 40,
          borderRadius: 20,
          backgroundColor: colors.primaryLight,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <MaterialIcons name={iconName as any} size={20} color={colors.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={T.bodyBold}>{label}</Text>
        {sublabel ? <Text style={T.caption}>{sublabel}</Text> : null}
      </View>
      <MaterialIcons name="chevron-right" size={18} color={colors.primary} />
    </TouchableOpacity>
  );

  return (
    <Animated.View style={[s.stepRow, { flex: flexPaso1, zIndex: 60 }]}>
      <View style={s.timelineCol}>
        <CircleStep num={1} active={step >= 1} />
        <View style={s.line} />
      </View>
      <View style={s.contentCol}>
        <View style={s.stepHeader}>
          <Ionicons name="person" size={16} color={step >= 1 ? BLUE : "#CCC"} />
          <Text
            style={[
              T.h3,
              step >= 1 ? { color: INK, fontWeight: "700" } : { color: "#CCC" },
            ]}
          >
            Seleccionar cliente
          </Text>
        </View>

        {step === 1 && (
          <View style={s.activeBlock}>
            {!clienteSeleccionado ? (
              <>
                <AppText variant="label" style={{ marginBottom: spacing.xs }}>
                  Busca o crea un cliente
                </AppText>

                <View
                  style={[
                    s.inputDropdownWrapper,
                    (filtroClienteActivo || filtroCliente.trim() !== "") && {
                      paddingBottom: dropdownMaxHeight + 0,
                    },
                  ]}
                >
                  <View
                    onLayout={(e) =>
                      setAlturaInputCliente(e.nativeEvent.layout.height)
                    }
                  >
                    {renderInputBusqueda({
                      value: filtroCliente,
                      onChangeText: setFiltroCliente,
                      placeholder: "Buscar cliente...",
                      onFocus: () => {
                        smoothLayout();
                        setFiltroClienteActivo(true);
                      },
                      onBlur: () => {
                        if (filtroCliente.trim() === "") {
                          smoothLayout();
                          setFiltroClienteActivo(false);
                        }
                      },
                      onClear: () => {
                        setFiltroCliente("");
                      },
                    })}
                  </View>

                  {(filtroClienteActivo || filtroCliente.trim() !== "") && (
                    <ScrollView
                      style={[
                        s.dropdownFloat,
                        {
                          maxHeight: dropdownMaxHeight,
                          top: alturaInputCliente,
                        },
                      ]}
                      contentContainerStyle={{ paddingBottom: 4 }}
                      keyboardShouldPersistTaps="always"
                      nestedScrollEnabled={true}
                      showsVerticalScrollIndicator={true}
                    >
                      {filtroCliente.trim() === "" ? (
                        <View style={s.guiaBox}>
                          <MaterialIcons
                            name="search"
                            size={36}
                            color="#7B8499"
                            style={{ marginBottom: 8 }}
                          />
                          <Text style={T.body}>Escribe para buscar un cliente</Text>
                        </View>
                      ) : clientesFiltrados.length === 0 ? (
                        <View>
                          <AppText
                            variant="caption"
                            color={colors.grayText}
                            style={{
                              marginBottom: spacing.sm,
                              textAlign: "center",
                            }}
                          >
                            No se encontró ningún cliente con ese nombre
                          </AppText>
                          {renderCrearCard({
                            iconName: "person-add",
                            label: (
                              <>
                                Crear{" "}
                                <Text style={{ color: BLUE }}>
                                  "{filtroCliente.trim()}"
                                </Text>
                              </>
                            ),
                            onPress: () => {
                              setValoresNuevoCliente((prev: any) => ({
                                ...prev,
                                nombre: filtroCliente.trim(),
                              }));
                              modalNuevoCliente.abrir();
                            },
                          })}
                        </View>
                      ) : (
                        <>
                          <AppText
                            variant="label"
                            style={{ marginBottom: spacing.xs }}
                          >
                            {clientesFiltrados.length} cliente
                            {clientesFiltrados.length !== 1 ? "s" : ""}
                          </AppText>
                          {clientesFiltrados.map((c) => (
                            <ClienteCard
                              key={c.id}
                              cliente={c}
                              enMora={getMora(c.id).enMora}
                              totalDeuda={getMora(c.id).saldo}
                              onPress={() => seleccionarCliente(c)}
                            />
                          ))}
                        </>
                      )}
                    </ScrollView>
                  )}
                </View>

                {!filtroClienteActivo &&
                  filtroCliente.trim() === "" &&
                  renderCrearCard({
                    iconName: "person-add",
                    label: "Crear cliente nuevo",
                    sublabel: "Agregar a la lista de clientes",
                    onPress: () => {
                      setValoresNuevoCliente({
                        nombre: "",
                        telefono: "",
                        direccion: "",
                      });
                      modalNuevoCliente.abrir();
                    },
                  })}
              </>
            ) : (
              <View
                style={{
                  backgroundColor: colors.white,
                  borderWidth: 1,
                  borderColor: colors.grayBorder,
                  borderRadius: radius.lg,
                  padding: spacing.md,
                  gap: spacing.md,
                  ...shadows.card,
                }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: spacing.sm,
                  }}
                >
                  <View
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 20,
                      backgroundColor: GREEN_LIGHT,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Text
                      style={{ fontSize: 19, fontWeight: "700", color: GREEN }}
                    >
                      {clienteSeleccionado.nombre.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <AppText variant="label">Cliente seleccionado</AppText>
                    <Text style={[T.h2, { marginTop: 2 }]}>
                      {clienteSeleccionado.nombre}
                    </Text>
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        marginTop: 3,
                      }}
                    >
                      <MaterialIcons name="phone" size={12} color={BLUE} />
                      <Text style={[T.caption, { marginLeft: 2, color: BLUE }]}>
                        {clienteSeleccionado.telefono}
                      </Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    style={s.btnRemove}
                    onPress={() => setClienteSeleccionado(null)}
                  >
                    <MaterialIcons name="person-remove" size={16} color={RED} />
                  </TouchableOpacity>
                </View>
                <TouchableOpacity style={s.btnPrimary} onPress={siguiente}>
                  <Text style={s.btnPrimaryText}>Continuar</Text>
                  <MaterialIcons name="arrow-forward" size={18} color="#fff" />
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
      </View>
    </Animated.View>
  );
}
