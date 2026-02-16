import type { FaceBlendshapes } from "@/engines/mediapipe/blendshapes";
import type { BlendShapes } from "@/types/face";

/**
 * MediaPipe FaceBlendshapesをBlendShapes型に変換
 * @param faceBlendshapes MediaPipeから返されるBlendshapes
 * @returns expressionDetectorで使用可能なBlendShapes
 */
export function convertBlendshapes(faceBlendshapes: FaceBlendshapes | undefined): BlendShapes {
  if (!faceBlendshapes || !faceBlendshapes.categories) {
    return createEmptyBlendshapes();
  }

  const blendshapes: BlendShapes = {
    mouthSmileLeft: 0,
    mouthSmileRight: 0,
    jawOpen: 0,
    mouthFrownLeft: 0,
    mouthFrownRight: 0,
    browInnerUp: 0,
    browOuterUpLeft: 0,
    browOuterUpRight: 0,
    browDownLeft: 0,
    browDownRight: 0,
    eyeBlinkLeft: 0,
    eyeBlinkRight: 0,
    eyeWideLeft: 0,
    eyeWideRight: 0,
  };

  // MediaPipeのBlendshapesを変換
  for (const category of faceBlendshapes.categories) {
    const name = category.categoryName;
    const score = category.score;

    // expressionDetectorで使用するBlendshapeのみ抽出
    if (name in blendshapes) {
      blendshapes[name as keyof BlendShapes] = score;
    }
  }

  return blendshapes;
}

/**
 * 空のBlendShapesオブジェクトを作成
 */
function createEmptyBlendshapes(): BlendShapes {
  return {
    mouthSmileLeft: 0,
    mouthSmileRight: 0,
    jawOpen: 0,
    mouthFrownLeft: 0,
    mouthFrownRight: 0,
    browInnerUp: 0,
    browOuterUpLeft: 0,
    browOuterUpRight: 0,
    browDownLeft: 0,
    browDownRight: 0,
    eyeBlinkLeft: 0,
    eyeBlinkRight: 0,
    eyeWideLeft: 0,
    eyeWideRight: 0,
  };
}
