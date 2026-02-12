// MediaPipe Face Landmarkerの型定義

export interface Landmark {
  x: number
  y: number
  z: number
}

export interface BlendShapes {
  // 口の動き
  mouthSmileLeft: number
  mouthSmileRight: number
  jawOpen: number
  mouthFrownLeft: number
  mouthFrownRight: number

  // 眉の動き
  browInnerUp: number
  browOuterUpLeft: number
  browOuterUpRight: number
  browDownLeft: number
  browDownRight: number

  // 目の動き
  eyeBlinkLeft: number
  eyeBlinkRight: number
  eyeWideLeft: number
  eyeWideRight: number

  // その他の表情要素
  [key: string]: number
}

export interface FaceDetectionResult {
  faceLandmarks: Landmark[]
  faceBlendshapes: BlendShapes
  confidence: number
}
