import {
  MaterialCommunityIcons,
  MaterialIcons,
} from "@expo/vector-icons";
import React from "react";
import {
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useTheme } from "../../../../theme";
import { AppText } from "../../../components/ui/AppText";
import { fmt } from "../hooks/useNuevaVenta";
import { GREEN, GREEN_LIGHT, RED, RED_LIGHT, s, T } from "./tokens";

interface Props {
  step: number;
  carrito: any[];
  clienteSeleccionado: any;
  totalCarrito: number;
  metodoPago: string | null;
  setMetodoPago: (v: string) => void;
  subMetodoPago: string | null;
  setSubMetodoPago: (v: string | null) => void;
  paganCon: string;
  paganConNum: number;
  devuelve: number;
  manejarCambioDinero: (v: string) => void;
  finalizarVenta: () => void;
  inputPagoRef: React.RefObject<TextInput>;
  scrollRef: React.RefObject<any>;
  retroceder: () => void;
}

export function PasoCobro({
  step,
  carrito,
  clienteSeleccionado,
  totalCarrito,
  metodoPago,
  setMetodoPago,
  subMetodoPago,
  setSubMetodoPago,
  paganCon,
  paganConNum,
  devuelve,
  manejarCambioDinero,
  finalizarVenta,
  inputPagoRef,
  scrollRef,
  retroceder,
}: Props) {
  const { colors, spacing } = useTheme();
  const BLUE = colors.primary;
  const BLUE_LIGHT = colors.primaryLight;

  const CircleStep = ({ num, active }: { num: number; active: boolean }) => (
    <View style={[s.circle, active ? s.circleActive : s.circleInactive]}>
      <Text style={s.circleText}>{num}</Text>
    </View>
  );

  return (
    <View style={[s.stepRow, { zIndex: 30 }]}>
      <View style={s.timelineCol}>
        <CircleStep num={3} active={step >= 3} />
      </View>
      <View style={s.contentCol}>
        <View style={s.stepHeader}>
          <MaterialIcons
            name="payments"
            size={16}
            color={step >= 3 ? BLUE : "#CCC"}
          />
          <Text
            style={[
              T.h3,
              step >= 3 ? { color: "#111827", fontWeight: "700" } : { color: "#CCC" },
            ]}
          >
            Finalizar cobro
          </Text>
        </View>

        {step === 3 && (
          <View style={s.activeBlock}>
            {/* ── Ticket resumen ── */}
            <View style={s.ticketCard}>
              <View style={[s.ticketStripe, { backgroundColor: BLUE }]} />
              <View style={s.ticketBody}>
                <View style={s.ticketRow}>
                  <Text style={T.label}>Cliente</Text>
                  <Text style={T.bodyBold}>{clienteSeleccionado?.nombre}</Text>
                </View>
                <View style={s.dividerDashed} />
                {carrito.length === 0 ? (
                  <View style={{ paddingVertical: 14, alignItems: "center" }}>
                    <Text style={{ fontSize: 28, marginBottom: 6 }}>🛒</Text>
                    <Text style={[T.caption, { textAlign: "center" }]}>
                      No hay productos en el pedido
                    </Text>
                  </View>
                ) : (
                  carrito.map((item) => (
                    <View
                      key={item.id}
                      style={[s.ticketRow, { paddingVertical: 5 }]}
                    >
                      <View style={{ flex: 1 }}>
                        <Text style={T.body}>{item.nombre}</Text>
                        <Text style={T.caption}>
                          {item.qty} {item.unidad} × {fmt(item.precio)}
                        </Text>
                      </View>
                      <Text style={T.bodyBold}>
                        {fmt(item.precio * item.qty)}
                      </Text>
                    </View>
                  ))
                )}
                <View style={s.dividerDashed} />
                <View
                  style={[
                    s.ticketRow,
                    { alignItems: "flex-end", paddingTop: 4 },
                  ]}
                >
                  <View>
                    <Text style={T.label}>Total a cobrar</Text>
                    <Text style={T.number}>{fmt(totalCarrito)}</Text>
                  </View>
                  <View style={[s.totalBadge, { backgroundColor: BLUE_LIGHT }]}>
                    <Text style={[s.totalBadgeText, { color: BLUE }]}>
                      {carrito.length} ítem{carrito.length !== 1 ? "s" : ""}
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            {/* ── 1. ¿Cómo pagó el cliente? ── */}
            <AppText
              variant="label"
              style={{ marginTop: spacing.lg, marginBottom: spacing.sm }}
            >
              ¿Cómo pagó el cliente?
            </AppText>

            <View style={s.metodoPagoGrid}>
              {/* CONTADO */}
              <TouchableOpacity
                style={[
                  s.metodoBtn,
                  metodoPago === "contado" && {
                    ...s.metodoBtnActive,
                    backgroundColor: BLUE,
                    borderColor: BLUE,
                  },
                ]}
                onPress={() => {
                  setMetodoPago("contado");
                  setSubMetodoPago(null);
                  setTimeout(() => {
                    scrollRef.current?.scrollTo({ y: 99999, animated: true });
                  }, 100);
                }}
              >
                {metodoPago === "contado" && (
                  <View style={{ position: "absolute", top: 10, right: 10 }}>
                    <MaterialIcons name="check-circle" size={18} color="#fff" />
                  </View>
                )}
                <View
                  style={[
                    s.metodoIconBox,
                    metodoPago === "contado"
                      ? s.metodoIconBoxActive
                      : { backgroundColor: BLUE_LIGHT },
                  ]}
                >
                  <MaterialIcons
                    name="payments"
                    size={32}
                    color={metodoPago === "contado" ? "#fff" : BLUE}
                  />
                </View>
                <Text
                  style={[
                    s.metodoBtnLabel,
                    metodoPago === "contado" && s.metodoBtnLabelActive,
                  ]}
                >
                  Contado
                </Text>
                <Text
                  style={[
                    T.caption,
                    metodoPago === "contado"
                      ? { color: "rgba(255,255,255,0.75)" }
                      : {},
                  ]}
                >
                  Pago inmediato
                </Text>
              </TouchableOpacity>

              {/* CRÉDITO */}
              <TouchableOpacity
                style={[
                  s.metodoBtn,
                  metodoPago === "credito" && s.metodoBtnCredito,
                ]}
                onPress={() => {
                  setMetodoPago("credito");
                  setSubMetodoPago(null);
                  setTimeout(() => {
                    scrollRef.current?.scrollTo({ y: 99999, animated: true });
                  }, 100);
                }}
              >
                {metodoPago === "credito" && (
                  <View style={{ position: "absolute", top: 10, right: 10 }}>
                    <MaterialIcons name="check-circle" size={18} color="#fff" />
                  </View>
                )}
                <View
                  style={[
                    s.metodoIconBox,
                    metodoPago === "credito" && s.metodoIconBoxCredito,
                  ]}
                >
                  <MaterialIcons
                    name="schedule"
                    size={32}
                    color={metodoPago === "credito" ? "#fff" : "#F59E0B"}
                  />
                </View>
                <Text
                  style={[
                    s.metodoBtnLabel,
                    metodoPago === "credito" && { color: "#fff" },
                  ]}
                >
                  Crédito
                </Text>
                <Text
                  style={[
                    T.caption,
                    metodoPago === "credito"
                      ? { color: "rgba(255,255,255,0.75)" }
                      : {},
                  ]}
                >
                  Queda pendiente
                </Text>
              </TouchableOpacity>
            </View>

            {/* ── 2. Método de pago (solo si contado) ── */}
            {metodoPago === "contado" && (
              <>
                <AppText
                  variant="label"
                  style={{ marginTop: spacing.lg, marginBottom: 4 }}
                >
                  Método de pago
                </AppText>
                <Text style={[T.caption, { marginBottom: spacing.sm }]}>
                  Selecciona cómo recibió el pago
                </Text>

                <View style={s.metodoPagoGrid}>
                  {/* EFECTIVO */}
                  <TouchableOpacity
                    style={[
                      s.metodoBtn,
                      subMetodoPago === "efectivo" && {
                        ...s.metodoBtnActive,
                        backgroundColor: GREEN,
                        borderColor: GREEN,
                        shadowColor: GREEN,
                      },
                    ]}
                    onPress={() => {
                      setSubMetodoPago("efectivo");
                      setTimeout(() => {
                        scrollRef.current?.scrollTo({
                          y: 99999,
                          animated: true,
                        });
                      }, 100);
                    }}
                  >
                    {subMetodoPago === "efectivo" && (
                      <View
                        style={{ position: "absolute", top: 10, right: 10 }}
                      >
                        <MaterialIcons
                          name="check-circle"
                          size={18}
                          color="#fff"
                        />
                      </View>
                    )}
                    <View
                      style={[
                        s.metodoIconBox,
                        subMetodoPago === "efectivo"
                          ? s.metodoIconBoxActive
                          : { backgroundColor: GREEN_LIGHT },
                      ]}
                    >
                      <MaterialCommunityIcons
                        name="cash-multiple"
                        size={32}
                        color={subMetodoPago === "efectivo" ? "#fff" : GREEN}
                      />
                    </View>
                    <Text
                      style={[
                        s.metodoBtnLabel,
                        subMetodoPago === "efectivo" && s.metodoBtnLabelActive,
                      ]}
                    >
                      Efectivo
                    </Text>
                    <Text
                      style={[
                        T.caption,
                        { textAlign: "center" },
                        subMetodoPago === "efectivo"
                          ? { color: "rgba(255,255,255,0.75)" }
                          : {},
                      ]}
                    >
                      El cliente paga{"\n"}en efectivo
                    </Text>
                  </TouchableOpacity>

                  {/* TRANSFERENCIA */}
                  <TouchableOpacity
                    style={[
                      s.metodoBtn,
                      subMetodoPago === "transferencia" && {
                        ...s.metodoBtnActive,
                        backgroundColor: "#7C3AED",
                        borderColor: "#7C3AED",
                        shadowColor: "#7C3AED",
                      },
                    ]}
                    onPress={() => {
                      setSubMetodoPago("transferencia");
                      setTimeout(() => {
                        scrollRef.current?.scrollTo({
                          y: 99999,
                          animated: true,
                        });
                      }, 100);
                    }}
                  >
                    {subMetodoPago === "transferencia" && (
                      <View
                        style={{ position: "absolute", top: 10, right: 10 }}
                      >
                        <MaterialIcons
                          name="check-circle"
                          size={18}
                          color="#fff"
                        />
                      </View>
                    )}
                    <View
                      style={[
                        s.metodoIconBox,
                        subMetodoPago === "transferencia"
                          ? { backgroundColor: "rgba(255,255,255,0.2)" }
                          : { backgroundColor: "#EDE9FE" },
                      ]}
                    >
                      <MaterialCommunityIcons
                        name="bank-transfer"
                        size={32}
                        color={
                          subMetodoPago === "transferencia" ? "#fff" : "#7C3AED"
                        }
                      />
                    </View>
                    <Text
                      style={[
                        s.metodoBtnLabel,
                        subMetodoPago === "transferencia" &&
                          s.metodoBtnLabelActive,
                      ]}
                    >
                      Transferencia
                    </Text>
                    <Text
                      style={[
                        T.caption,
                        { textAlign: "center" },
                        subMetodoPago === "transferencia"
                          ? { color: "rgba(255,255,255,0.75)" }
                          : {},
                      ]}
                    >
                      El cliente paga{"\n"}por transferencia
                    </Text>
                  </TouchableOpacity>
                </View>
              </>
            )}

            {/* ── 3. Calculadora de cambio (solo efectivo) ── */}
            {metodoPago === "contado" && subMetodoPago === "efectivo" && (
              <View style={s.calculadoraCard}>
                <AppText variant="label" style={{ marginBottom: spacing.sm }}>
                  ¿Con cuánto pagó?
                </AppText>
                <TextInput
                  ref={inputPagoRef}
                  style={s.inputDinero}
                  keyboardType="numeric"
                  value={paganCon}
                  onChangeText={manejarCambioDinero}
                  placeholder="$ 0"
                  placeholderTextColor="#7B8499"
                  onFocus={() => {
                    scrollRef.current?.scrollTo({ y: 99999, animated: true });
                  }}
                />
                {paganConNum > 0 && (
                  <View
                    style={[
                      s.vueltoBox,
                      paganConNum < totalCarrito && {
                        backgroundColor: RED_LIGHT,
                        borderColor: RED,
                      },
                    ]}
                  >
                    {paganConNum < totalCarrito ? (
                      <>
                        <MaterialIcons
                          name="warning-amber"
                          size={18}
                          color={RED}
                        />
                        <Text
                          style={[T.captionMd, { color: RED, marginTop: 4 }]}
                        >
                          Pago insuficiente, falta saldo
                        </Text>
                        <Text style={[T.number, { color: RED }]}>
                          {fmt(totalCarrito - paganConNum)}
                        </Text>
                      </>
                    ) : (
                      <>
                        <MaterialIcons
                          name="check-circle-outline"
                          size={18}
                          color={GREEN}
                        />
                        <Text
                          style={[T.captionMd, { color: GREEN, marginTop: 4 }]}
                        >
                          Cambio para el cliente
                        </Text>
                        <Text style={[T.number, { color: GREEN }]}>
                          {fmt(devuelve)}
                        </Text>
                      </>
                    )}
                  </View>
                )}
              </View>
            )}

            {/* Info transferencia */}
            {metodoPago === "contado" && subMetodoPago === "transferencia" && (
              <View
                style={[
                  s.CreditoInfo,
                  { borderColor: "#DDD6FE", backgroundColor: "#F5F3FF" },
                ]}
              >
                <MaterialCommunityIcons
                  name="bank-transfer"
                  size={16}
                  color="#7C3AED"
                />
                <Text
                  style={[
                    T.caption,
                    { flex: 1, marginLeft: 8, color: "#5B21B6" },
                  ]}
                >
                  Pago por transferencia. No aplica cálculo de cambio.
                </Text>
              </View>
            )}

            {/* Info crédito */}
            {metodoPago === "credito" && (
              <View style={s.CreditoInfo}>
                <MaterialIcons name="info-outline" size={16} color="#F59E0B" />
                <Text
                  style={[
                    T.caption,
                    { flex: 1, marginLeft: 8, color: "#92400E" },
                  ]}
                >
                  Esta venta quedará registrada como deuda de{" "}
                  <Text style={{ fontWeight: "700" }}>
                    {clienteSeleccionado?.nombre}
                  </Text>
                  . Podrás cobrarla después desde su perfil.
                </Text>
              </View>
            )}

            {/* ── Botones Atrás / Listo vendido ── */}
            <View style={[s.botonesRow, { marginTop: 24 }]}>
              <TouchableOpacity style={s.btnOutline} onPress={retroceder}>
                <MaterialIcons name="arrow-back" size={16} color={BLUE} />
                <Text style={[s.btnOutlineText, { color: BLUE }]}>Atrás</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  s.btnFinalizar,
                  (!metodoPago ||
                    (metodoPago === "contado" && !subMetodoPago) ||
                    (subMetodoPago === "efectivo" &&
                      paganConNum < totalCarrito)) &&
                    s.btnDisabled,
                ]}
                onPress={finalizarVenta}
                activeOpacity={0.85}
              >
                <MaterialIcons name="check-circle" size={20} color="#fff" />
                <Text style={s.btnPrimaryText}>¡Listo, vendido!</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    </View>
  );
}
