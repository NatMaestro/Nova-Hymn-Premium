import { useWindowDimensions } from "react-native";

export function useResponsive() {
  const { width, height } = useWindowDimensions();

  return {
    isSmallPhone: width < 360,
    isPhone: width >= 360 && width < 768,
    isTablet: width >= 768,
    isLandscape: width > height,
  };
}
