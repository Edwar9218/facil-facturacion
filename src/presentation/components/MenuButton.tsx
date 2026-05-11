import { MaterialCommunityIcons } from "@expo/vector-icons"; // Expo ya lo trae
import { StyleSheet, Text, TouchableOpacity } from "react-native";

interface Props {
  title: string;
  icon: string;
  onPress: () => void;
  color?: string;
}

export const MenuButton = ({ title, icon, onPress }: Props) => (
  <TouchableOpacity style={styles.button} onPress={onPress}>
    <MaterialCommunityIcons name={icon as any} size={50} color="black" />
    <Text style={styles.text}>{title}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  button: {
    width: "47%", // ← sin margin, el width controla el espacio
    height: 130,
    backgroundColor: "#45B5FA",
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    elevation: 4,
    shadowColor: "#1A6FC4",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.18,
    shadowRadius: 6,
  },
  text: {
    marginTop: 8,
    fontWeight: "700",
    fontSize: 14,
    color: "#0F172A",
    textAlign: "center",
  },
});
