// MediaPipe Face Landmarkerの型定義

export interface Landmark {
  x: number;
  y: number;
  z: number;
}

export interface BlendShapes {
  // 口の動き
  mouthSmileLeft: number;
  mouthSmileRight: number;
  jawOpen: number;
  mouthFrownLeft: number;
  mouthFrownRight: number;

  // 眉の動き
  browInnerUp: number;
  browOuterUpLeft: number;
  browOuterUpRight: number;
  browDownLeft: number;
  browDownRight: number;

  // 目の動き
  eyeBlinkLeft: number;
  eyeBlinkRight: number;
  eyeWideLeft: number;
  eyeWideRight: number;

  // その他の表情要素
  [key: string]: number;
}

export interface FaceDetectionResult {
  faceLandmarks: Landmark[];
  faceBlendshapes: BlendShapes;
  confidence: number;
}

// 標準グリッド（26×21）における目・口の位置
export const GUIDE_CONFIG = {
  // 左目エリア: 行4-9, 列3-4
  leftEye: { rowStart: 4, rowEnd: 9, colStart: 4, colEnd: 5 },
  // 右目エリア: 行4-9, 列15-16
  rightEye: { rowStart: 4, rowEnd: 9, colStart: 15, colEnd: 16 },
  // 口エリア: 行16-21, 列5-14
  mouth: { rowStart: 16, rowEnd: 21, colStart: 6, colEnd: 14 },
  // スマホ/タブレット境界: 行13の下
  eyeOnlyBoundary: 13,
  // 標準グリッドサイズ
  standardRows: 26,
  standardCols: 21,
};
