// デバイスタイプの型定義
export type DeviceType = 'smartphone' | 'tablet'

// カメラ設定の型定義
export interface CameraConstraints {
  video: {
    facingMode: string
    width: { ideal: number }
    height: { ideal: number }
    focusMode?: string
    focusDistance?: { ideal: number }
  }
}
