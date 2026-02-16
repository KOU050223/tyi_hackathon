import { useState, useEffect } from "react";
import type { DeviceType } from "@/types/device";

/**
 * デバイスタイプ（スマートフォン/タブレット）を検出するhook
 *
 * @returns デバイスタイプ ('smartphone' | 'tablet')
 *
 * - スマートフォン（画面幅 < 768px）: 目のみ描画
 * - タブレット（画面幅 ≥ 768px）: 目 + 口を描画
 */
export const useDeviceType = (): DeviceType => {
  const [deviceType, setDeviceType] = useState<DeviceType>("smartphone");

  useEffect(() => {
    const checkDevice = () => {
      const isTablet = window.innerWidth >= 768;
      setDeviceType(isTablet ? "tablet" : "smartphone");
    };

    checkDevice();
    window.addEventListener("resize", checkDevice);

    return () => {
      window.removeEventListener("resize", checkDevice);
    };
  }, []);

  return deviceType;
};
