import { useState, useEffect } from "react";

/**
 * 画面の向きを検出するhook
 *
 * @returns isPortrait - 縦画面(portrait)の場合true
 */
export const useOrientationLock = (): boolean => {
  const getIsPortrait = () => {
    if (typeof window === "undefined") return false;
    // screen.orientation APIが利用可能な場合はそちらを優先
    if (window.screen?.orientation) {
      return window.screen.orientation.type.startsWith("portrait");
    }
    return window.innerHeight > window.innerWidth;
  };

  const [isPortrait, setIsPortrait] = useState<boolean>(getIsPortrait);

  useEffect(() => {
    const handleChange = () => {
      setIsPortrait(getIsPortrait());
    };

    if (window.screen?.orientation) {
      window.screen.orientation.addEventListener("change", handleChange);
    }
    window.addEventListener("resize", handleChange);

    return () => {
      if (window.screen?.orientation) {
        window.screen.orientation.removeEventListener("change", handleChange);
      }
      window.removeEventListener("resize", handleChange);
    };
  }, []);

  return isPortrait;
};
