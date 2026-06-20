import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { ConfiguracionRepositoryImpl } from "../data/repositories/ConfiguracionRepositoryImpl";
import { colors, colorsDark } from "./colors";
import { radius } from "./radius";
import { shadows } from "./shadows";
import { sizes } from "./sizes";
import { spacing } from "./spacing";
import { buildTypography, FontScale } from "./typography";

const FONT_SCALE_KEY = "font_scale";
const configRepo = new ConfiguracionRepositoryImpl();

// ── Tipo del contexto ──────────────────────────────────────────────────────
interface ThemeContextType {
  colors: typeof colors;
  typography: ReturnType<typeof buildTypography>;
  spacing: typeof spacing;
  radius: typeof radius;
  sizes: typeof sizes;
  shadows: typeof shadows;
  isDark: boolean;
  fontScale: FontScale;
  setFontScale: (scale: FontScale) => void;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

// ── Provider ───────────────────────────────────────────────────────────────
export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [fontScale, setFontScaleState] = useState<FontScale>("normal");
  const [isDark] = useState(false);

  // Cargar escala guardada al inicio
  useEffect(() => {
    configRepo.get(FONT_SCALE_KEY).then((val) => {
      if (val && ["pequeño", "normal", "grande", "extraGrande"].includes(val)) {
        setFontScaleState(val as FontScale);
      }
    });
  }, []);

  const setFontScale = useCallback(async (scale: FontScale) => {
    setFontScaleState(scale);
    await configRepo.set(FONT_SCALE_KEY, scale);
  }, []);

  const theme = useMemo<ThemeContextType>(
    () => ({
      colors: isDark ? colorsDark : colors,
      typography: buildTypography(fontScale),
      spacing,
      radius,
      sizes,
      shadows,
      isDark,
      fontScale,
      setFontScale,
    }),
    [fontScale, isDark, setFontScale],
  );

  return (
    <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
};
