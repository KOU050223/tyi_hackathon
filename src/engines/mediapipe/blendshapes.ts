/**
 * MediaPipe Face Landmarkerが出力する52種類のBlendshapes型定義
 * ARKit互換のBlendshape名を使用
 */

export type BlendshapeName =
  | '_neutral'
  | 'browDownLeft'
  | 'browDownRight'
  | 'browInnerUp'
  | 'browOuterUpLeft'
  | 'browOuterUpRight'
  | 'cheekPuff'
  | 'cheekSquintLeft'
  | 'cheekSquintRight'
  | 'eyeBlinkLeft'
  | 'eyeBlinkRight'
  | 'eyeLookDownLeft'
  | 'eyeLookDownRight'
  | 'eyeLookInLeft'
  | 'eyeLookInRight'
  | 'eyeLookOutLeft'
  | 'eyeLookOutRight'
  | 'eyeLookUpLeft'
  | 'eyeLookUpRight'
  | 'eyeSquintLeft'
  | 'eyeSquintRight'
  | 'eyeWideLeft'
  | 'eyeWideRight'
  | 'jawForward'
  | 'jawLeft'
  | 'jawOpen'
  | 'jawRight'
  | 'mouthClose'
  | 'mouthDimpleLeft'
  | 'mouthDimpleRight'
  | 'mouthFrownLeft'
  | 'mouthFrownRight'
  | 'mouthFunnel'
  | 'mouthLeft'
  | 'mouthLowerDownLeft'
  | 'mouthLowerDownRight'
  | 'mouthPressLeft'
  | 'mouthPressRight'
  | 'mouthPucker'
  | 'mouthRight'
  | 'mouthRollLower'
  | 'mouthRollUpper'
  | 'mouthShrugLower'
  | 'mouthShrugUpper'
  | 'mouthSmileLeft'
  | 'mouthSmileRight'
  | 'mouthStretchLeft'
  | 'mouthStretchRight'
  | 'mouthUpperUpLeft'
  | 'mouthUpperUpRight'
  | 'noseSneerLeft'
  | 'noseSneerRight'

/**
 * Blendshapeの値（0.0～1.0の範囲）
 */
export interface BlendshapeValue {
  categoryName: BlendshapeName
  score: number
  displayName?: string
  index?: number
}

/**
 * 顔検出結果に含まれるBlendshapesデータ
 */
export interface FaceBlendshapes {
  categories: BlendshapeValue[]
}

/**
 * Blendshapesを名前でアクセスしやすいMap形式に変換
 */
export function blendshapesToMap(
  blendshapes: FaceBlendshapes
): Map<BlendshapeName, number> {
  const map = new Map<BlendshapeName, number>()
  for (const category of blendshapes.categories) {
    map.set(category.categoryName, category.score)
  }
  return map
}

/**
 * 特定のBlendshape値を安全に取得
 * @param blendshapes Blendshapesデータ
 * @param name Blendshape名
 * @param defaultValue デフォルト値（デフォルト: 0）
 */
export function getBlendshapeValue(
  blendshapes: FaceBlendshapes | undefined,
  name: BlendshapeName,
  defaultValue = 0
): number {
  if (!blendshapes) return defaultValue
  const category = blendshapes.categories.find(c => c.categoryName === name)
  return category?.score ?? defaultValue
}

/**
 * 複数のBlendshape値の平均を計算
 */
export function averageBlendshapes(
  blendshapes: FaceBlendshapes,
  names: BlendshapeName[]
): number {
  const values = names.map(name => getBlendshapeValue(blendshapes, name))
  return values.reduce((sum, val) => sum + val, 0) / values.length
}
