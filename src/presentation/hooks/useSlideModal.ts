import { useRef, useState } from "react";
import { Animated } from "react-native";

export const useSlideModal = (height = 600) => {
  const [visible, setVisible] = useState(false);
  const anim = useRef(new Animated.Value(0)).current;

  const abrir = () => {
    setVisible(true);
    anim.setValue(0);
    Animated.spring(anim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 20,
      friction: 15,
    }).start();
  };

  const cerrar = (cb?: () => void) => {
    Animated.timing(anim, {
      toValue: 0,
      duration: 50,
      useNativeDriver: true,
    }).start(() => {
      setVisible(false);
      cb?.();
    });
  };

  const animatedStyle = {
    transform: [
      {
        translateY: anim.interpolate({
          inputRange: [0, 1],
          outputRange: [height, 0],
        }),
      },
    ],
  };

  return { visible, abrir, cerrar, animatedStyle };
};

// Tipo exportado para usar en props de componentes
export type SlideModalType = ReturnType<typeof useSlideModal>;
