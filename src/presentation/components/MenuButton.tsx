// MenuButton.tsx migrado
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { TouchableOpacity } from "react-native";
import { useTheme } from "../../theme";
import { AppText } from "./ui/AppText";

interface Props {
  title: string;
  icon: string;
  onPress: () => void;
}

export const MenuButton = ({ title, icon, onPress }: Props) => {
  const { colors, sizes, radius, shadows, spacing } = useTheme();

  return (
    <TouchableOpacity
      style={{
        width: "47%",
        height: sizes.menuCardHeight,
        backgroundColor: colors.cardBlue,
        borderRadius: radius.xl,
        justifyContent: "center",
        alignItems: "center",
        gap: spacing.xs,
        ...shadows.primary,
      }}
      onPress={onPress}
      activeOpacity={0.75}
    >
      <MaterialCommunityIcons
        name={icon as any}
        size={sizes.iconXxl}
        color={colors.ink}
      />
      <AppText variant="label" color={colors.ink}>
        {title}
      </AppText>
    </TouchableOpacity>
  );
};
