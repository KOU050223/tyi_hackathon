import type { BlendShapes } from '@/types/face'

/**
 * 表情の種類
 */
export type Expression =
  | 'neutral'
  | 'smile'
  | 'surprised'
  | 'blink'
  | 'sad'
  | 'angry'
  | 'confused'
  | 'smug'
  | 'questioning'
  | 'embarrassed'

/**
 * 表情判定結果
 */
export interface ExpressionResult {
  expression: Expression
  confidence: number
}

/**
 * 表情判定の優先度定義（高い順）
 */
const EXPRESSION_PRIORITY: Expression[] = [
  'blink', // まばたきは最優先
  'surprised', // 驚きは強い表情
  'angry', // 怒りも強い表情
  'smug', // ウインクは特徴的
  'smile', // 笑顔
  'sad', // 悲しみ
  'questioning', // 疑問
  'confused', // 困惑
  'embarrassed', // 照れ
  'neutral', // デフォルト
]

/**
 * Blendshapesから表情を判定する
 * @param blendShapes - MediaPipeから取得したBlendshapes
 * @param minConfidence - 最小信頼度（デフォルト: 0.3）
 * @returns 判定された表情と信頼度
 */
export function detectExpression(
  blendShapes: BlendShapes,
  minConfidence: number = 0.3
): ExpressionResult {
  // 各表情の判定関数を優先度順に実行
  for (const expression of EXPRESSION_PRIORITY) {
    const detector = expressionDetectors[expression]
    const confidence = detector(blendShapes)

    if (confidence >= minConfidence) {
      return { expression, confidence }
    }
  }

  // どの表情にも該当しない場合はneutral
  return { expression: 'neutral', confidence: 1.0 }
}

/**
 * 各表情の判定関数
 * 信頼度（0.0 - 1.0）を返す
 */
const expressionDetectors: Record<
  Expression,
  (blendShapes: BlendShapes) => number
> = {
  /**
   * まばたき: 両目が閉じている
   */
  blink: (bs: BlendShapes): number => {
    const leftBlink = bs.eyeBlinkLeft || 0
    const rightBlink = bs.eyeBlinkRight || 0

    if (leftBlink > 0.7 && rightBlink > 0.7) {
      return Math.min(leftBlink, rightBlink)
    }
    return 0
  },

  /**
   * 笑顔: 口角が上がっている
   */
  smile: (bs: BlendShapes): number => {
    const leftSmile = bs.mouthSmileLeft || 0
    const rightSmile = bs.mouthSmileRight || 0

    if (leftSmile > 0.5 || rightSmile > 0.5) {
      return (leftSmile + rightSmile) / 2
    }
    return 0
  },

  /**
   * 驚き: 口が開いて眉が上がっている
   */
  surprised: (bs: BlendShapes): number => {
    const jawOpen = bs.jawOpen || 0
    const browUp = bs.browInnerUp || 0

    if (jawOpen > 0.6 && browUp > 0.5) {
      return (jawOpen + browUp) / 2
    }
    return 0
  },

  /**
   * 悲しみ: 口角が下がっている
   */
  sad: (bs: BlendShapes): number => {
    const leftFrown = bs.mouthFrownLeft || 0
    const rightFrown = bs.mouthFrownRight || 0

    if (leftFrown > 0.5 || rightFrown > 0.5) {
      return (leftFrown + rightFrown) / 2
    }
    return 0
  },

  /**
   * 怒り: 眉が下がっている
   */
  angry: (bs: BlendShapes): number => {
    const leftBrowDown = bs.browDownLeft || 0
    const rightBrowDown = bs.browDownRight || 0

    if (leftBrowDown > 0.5 || rightBrowDown > 0.5) {
      return (leftBrowDown + rightBrowDown) / 2
    }
    return 0
  },

  /**
   * 困惑: 眉の内側が上がっているが口角は下がっていない
   */
  confused: (bs: BlendShapes): number => {
    const browUp = bs.browInnerUp || 0
    const leftFrown = bs.mouthFrownLeft || 0
    const rightFrown = bs.mouthFrownRight || 0
    const avgFrown = (leftFrown + rightFrown) / 2

    if (browUp > 0.4 && avgFrown < 0.3) {
      return browUp
    }
    return 0
  },

  /**
   * 得意気（ウインク）: 片目だけ閉じている
   */
  smug: (bs: BlendShapes): number => {
    const leftWide = bs.eyeWideLeft || 0
    const rightWide = bs.eyeWideRight || 0
    const leftBlink = bs.eyeBlinkLeft || 0
    const rightBlink = bs.eyeBlinkRight || 0

    // 片目が閉じていて、もう片方が開いている
    const leftWinking = leftBlink > 0.6 && rightBlink < 0.3
    const rightWinking = rightBlink > 0.6 && leftBlink < 0.3

    if (leftWinking || rightWinking) {
      return Math.max(leftBlink, rightBlink)
    }

    // 目の開き具合が明確に異なる（ウインク的な表情）
    const wideDiff = Math.abs(leftWide - rightWide)
    if (wideDiff > 0.4) {
      return wideDiff
    }

    return 0
  },

  /**
   * 疑問: 眉の外側が上がっている
   */
  questioning: (bs: BlendShapes): number => {
    const leftBrowUp = bs.browOuterUpLeft || 0
    const rightBrowUp = bs.browOuterUpRight || 0

    if (leftBrowUp > 0.5 || rightBrowUp > 0.5) {
      return (leftBrowUp + rightBrowUp) / 2
    }
    return 0
  },

  /**
   * 照れ: 軽い笑顔と眉の内側が少し上がっている
   */
  embarrassed: (bs: BlendShapes): number => {
    const leftSmile = bs.mouthSmileLeft || 0
    const rightSmile = bs.mouthSmileRight || 0
    const browUp = bs.browInnerUp || 0
    const avgSmile = (leftSmile + rightSmile) / 2

    // 軽い笑顔と眉の動き
    if (avgSmile > 0.3 && avgSmile < 0.6 && browUp > 0.2 && browUp < 0.5) {
      return (avgSmile + browUp) / 2
    }
    return 0
  },

  /**
   * 通常: デフォルト
   */
  neutral: (): number => {
    return 1.0
  },
}

/**
 * 表情の日本語名を取得
 */
export function getExpressionLabel(expression: Expression): string {
  const labels: Record<Expression, string> = {
    neutral: '通常',
    smile: '笑顔',
    surprised: '驚き',
    blink: 'まばたき',
    sad: '悲しみ',
    angry: '怒り',
    confused: '困惑',
    smug: '得意気',
    questioning: '疑問',
    embarrassed: '照れ',
  }
  return labels[expression]
}
