import { describe, it, expect } from 'vitest'
import {
  detectExpression,
  getExpressionLabel,
  type Expression,
} from '../../src/utils/expressionDetector'
import { BlendShapes } from '../../src/types/face'

/**
 * テスト用のベースBlendshapes（すべて0）
 */
const createBaseBlendShapes = (): BlendShapes => ({
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
})

describe('expressionDetector', () => {
  describe('detectExpression', () => {
    it('通常の表情を判定できる', () => {
      const blendShapes = createBaseBlendShapes()
      const result = detectExpression(blendShapes)

      expect(result.expression).toBe('neutral')
      expect(result.confidence).toBe(1.0)
    })

    it('笑顔を判定できる', () => {
      const blendShapes = createBaseBlendShapes()
      blendShapes.mouthSmileLeft = 0.8
      blendShapes.mouthSmileRight = 0.7

      const result = detectExpression(blendShapes)

      expect(result.expression).toBe('smile')
      expect(result.confidence).toBeGreaterThan(0.5)
    })

    it('片側だけの笑顔も判定できる', () => {
      const blendShapes = createBaseBlendShapes()
      blendShapes.mouthSmileLeft = 0.9
      blendShapes.mouthSmileRight = 0.2

      const result = detectExpression(blendShapes)

      expect(result.expression).toBe('smile')
    })

    it('驚きを判定できる', () => {
      const blendShapes = createBaseBlendShapes()
      blendShapes.jawOpen = 0.8
      blendShapes.browInnerUp = 0.7

      const result = detectExpression(blendShapes)

      expect(result.expression).toBe('surprised')
      expect(result.confidence).toBeGreaterThan(0.5)
    })

    it('口が開いているだけでは驚きと判定されない', () => {
      const blendShapes = createBaseBlendShapes()
      blendShapes.jawOpen = 0.8
      blendShapes.browInnerUp = 0.2

      const result = detectExpression(blendShapes)

      expect(result.expression).not.toBe('surprised')
    })

    it('まばたきを判定できる', () => {
      const blendShapes = createBaseBlendShapes()
      blendShapes.eyeBlinkLeft = 0.9
      blendShapes.eyeBlinkRight = 0.85

      const result = detectExpression(blendShapes)

      expect(result.expression).toBe('blink')
      expect(result.confidence).toBeGreaterThan(0.7)
    })

    it('片目だけでは完全なまばたきと判定されない', () => {
      const blendShapes = createBaseBlendShapes()
      blendShapes.eyeBlinkLeft = 0.9
      blendShapes.eyeBlinkRight = 0.3

      const result = detectExpression(blendShapes)

      // 得意気（ウインク）として判定される可能性がある
      expect(result.expression).not.toBe('blink')
    })

    it('悲しみを判定できる', () => {
      const blendShapes = createBaseBlendShapes()
      blendShapes.mouthFrownLeft = 0.7
      blendShapes.mouthFrownRight = 0.6

      const result = detectExpression(blendShapes)

      expect(result.expression).toBe('sad')
      expect(result.confidence).toBeGreaterThan(0.5)
    })

    it('怒りを判定できる', () => {
      const blendShapes = createBaseBlendShapes()
      blendShapes.browDownLeft = 0.8
      blendShapes.browDownRight = 0.7

      const result = detectExpression(blendShapes)

      expect(result.expression).toBe('angry')
      expect(result.confidence).toBeGreaterThan(0.5)
    })

    it('困惑を判定できる', () => {
      const blendShapes = createBaseBlendShapes()
      blendShapes.browInnerUp = 0.6
      blendShapes.mouthFrownLeft = 0.1
      blendShapes.mouthFrownRight = 0.1

      const result = detectExpression(blendShapes)

      expect(result.expression).toBe('confused')
      expect(result.confidence).toBeGreaterThan(0.3)
    })

    it('得意気（ウインク）を判定できる - 左目ウインク', () => {
      const blendShapes = createBaseBlendShapes()
      blendShapes.eyeBlinkLeft = 0.8
      blendShapes.eyeBlinkRight = 0.1

      const result = detectExpression(blendShapes)

      expect(result.expression).toBe('smug')
    })

    it('得意気（ウインク）を判定できる - 右目ウインク', () => {
      const blendShapes = createBaseBlendShapes()
      blendShapes.eyeBlinkLeft = 0.1
      blendShapes.eyeBlinkRight = 0.8

      const result = detectExpression(blendShapes)

      expect(result.expression).toBe('smug')
    })

    it('得意気（ウインク）を判定できる - 目の開き具合の差', () => {
      const blendShapes = createBaseBlendShapes()
      blendShapes.eyeWideLeft = 0.9
      blendShapes.eyeWideRight = 0.2

      const result = detectExpression(blendShapes)

      expect(result.expression).toBe('smug')
    })

    it('疑問を判定できる', () => {
      const blendShapes = createBaseBlendShapes()
      blendShapes.browOuterUpLeft = 0.7
      blendShapes.browOuterUpRight = 0.6

      const result = detectExpression(blendShapes)

      expect(result.expression).toBe('questioning')
      expect(result.confidence).toBeGreaterThan(0.5)
    })

    it('照れを判定できる', () => {
      const blendShapes = createBaseBlendShapes()
      blendShapes.mouthSmileLeft = 0.4
      blendShapes.mouthSmileRight = 0.4
      blendShapes.browInnerUp = 0.3

      const result = detectExpression(blendShapes)

      expect(result.expression).toBe('embarrassed')
      expect(result.confidence).toBeGreaterThan(0.3)
    })

    it('強い笑顔は照れではなく笑顔と判定される', () => {
      const blendShapes = createBaseBlendShapes()
      blendShapes.mouthSmileLeft = 0.9
      blendShapes.mouthSmileRight = 0.9
      blendShapes.browInnerUp = 0.3

      const result = detectExpression(blendShapes)

      expect(result.expression).toBe('smile')
    })
  })

  describe('minConfidence パラメータ', () => {
    it('最小信頼度を変更できる', () => {
      const blendShapes = createBaseBlendShapes()
      blendShapes.mouthSmileLeft = 0.6
      blendShapes.mouthSmileRight = 0.6

      // デフォルト（0.3）では笑顔と判定
      const result1 = detectExpression(blendShapes)
      expect(result1.expression).toBe('smile')

      // 最小信頼度を0.7にするとneutralと判定
      const result2 = detectExpression(blendShapes, 0.7)
      expect(result2.expression).toBe('neutral')
    })

    it('低信頼度のデータを除外できる', () => {
      const blendShapes = createBaseBlendShapes()
      blendShapes.browInnerUp = 0.45

      // 低い閾値ではconfusedと判定される
      const result1 = detectExpression(blendShapes, 0.2)
      expect(result1.expression).toBe('confused')

      // より高い閾値ではneutralと判定
      const result2 = detectExpression(blendShapes, 0.5)
      expect(result2.expression).toBe('neutral')
    })
  })

  describe('優先度テスト', () => {
    it('まばたきは他の表情より優先される', () => {
      const blendShapes = createBaseBlendShapes()
      blendShapes.eyeBlinkLeft = 0.9
      blendShapes.eyeBlinkRight = 0.9
      blendShapes.mouthSmileLeft = 0.8 // 笑顔の条件も満たす
      blendShapes.mouthSmileRight = 0.8

      const result = detectExpression(blendShapes)

      expect(result.expression).toBe('blink')
    })

    it('驚きは笑顔より優先される', () => {
      const blendShapes = createBaseBlendShapes()
      blendShapes.jawOpen = 0.8
      blendShapes.browInnerUp = 0.7
      blendShapes.mouthSmileLeft = 0.6 // 笑顔の条件も満たす可能性
      blendShapes.mouthSmileRight = 0.6

      const result = detectExpression(blendShapes)

      expect(result.expression).toBe('surprised')
    })
  })

  describe('getExpressionLabel', () => {
    it('すべての表情の日本語ラベルを取得できる', () => {
      const expressions: Expression[] = [
        'neutral',
        'smile',
        'surprised',
        'blink',
        'sad',
        'angry',
        'confused',
        'smug',
        'questioning',
        'embarrassed',
      ]

      expressions.forEach(expression => {
        const label = getExpressionLabel(expression)
        expect(label).toBeTruthy()
        expect(typeof label).toBe('string')
      })
    })

    it('正しい日本語ラベルを返す', () => {
      expect(getExpressionLabel('smile')).toBe('笑顔')
      expect(getExpressionLabel('angry')).toBe('怒り')
      expect(getExpressionLabel('neutral')).toBe('通常')
    })
  })

  describe('エッジケース', () => {
    it('すべての値が高い場合は優先度に従って判定', () => {
      const blendShapes: BlendShapes = {
        mouthSmileLeft: 0.9,
        mouthSmileRight: 0.9,
        jawOpen: 0.9,
        mouthFrownLeft: 0.9,
        mouthFrownRight: 0.9,
        browInnerUp: 0.9,
        browOuterUpLeft: 0.9,
        browOuterUpRight: 0.9,
        browDownLeft: 0.9,
        browDownRight: 0.9,
        eyeBlinkLeft: 0.9,
        eyeBlinkRight: 0.9,
        eyeWideLeft: 0.9,
        eyeWideRight: 0.9,
      }

      const result = detectExpression(blendShapes)

      // まばたきが最優先
      expect(result.expression).toBe('blink')
    })

    it('undefinedの値を適切に処理する', () => {
      const blendShapes: Partial<BlendShapes> = {
        mouthSmileLeft: undefined,
        mouthSmileRight: undefined,
      }

      const result = detectExpression(blendShapes as BlendShapes)

      expect(result.expression).toBe('neutral')
    })

    it('負の値を適切に処理する', () => {
      const blendShapes = createBaseBlendShapes()
      blendShapes.mouthSmileLeft = -0.5

      const result = detectExpression(blendShapes)

      expect(result.expression).toBe('neutral')
    })

    it('1より大きい値を適切に処理する', () => {
      const blendShapes = createBaseBlendShapes()
      blendShapes.mouthSmileLeft = 1.5
      blendShapes.mouthSmileRight = 1.5

      const result = detectExpression(blendShapes)

      expect(result.expression).toBe('smile')
      expect(result.confidence).toBeGreaterThan(0.5)
    })
  })
})
