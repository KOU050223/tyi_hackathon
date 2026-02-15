import type { Expression, DotPattern } from '@/types/expression'
import { getDotPattern } from '@/utils/dotPatterns'

/**
 * Canvas 2Dでドット絵を描画するレンダリングエンジン
 */
export class CanvasRenderer {
  private ctx: CanvasRenderingContext2D
  private canvas: HTMLCanvasElement
  private currentExpression: Expression | null = null
  private dotSize: number = 40 // 各ドットのサイズ（ピクセル）

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas
    const context = canvas.getContext('2d')
    if (!context) {
      throw new Error('Canvas 2D context not supported')
    }
    this.ctx = context
    this.setupCanvas()
  }

  /**
   * Canvasの初期設定
   */
  private setupCanvas() {
    // ピクセルアート風の描画設定
    this.ctx.imageSmoothingEnabled = false
    this.canvas.style.imageRendering = 'pixelated'
  }

  /**
   * キャンバスをクリア
   */
  private clear() {
    this.ctx.fillStyle = '#000000'
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)
  }

  /**
   * ドット絵パターンを描画
   */
  private drawDotPattern(pattern: DotPattern) {
    const { color, grid } = pattern
    const rows = grid.length
    const cols = grid[0]?.length || 0

    // キャンバスサイズをパターンに合わせて調整
    const canvasWidth = cols * this.dotSize
    const canvasHeight = rows * this.dotSize

    if (
      this.canvas.width !== canvasWidth ||
      this.canvas.height !== canvasHeight
    ) {
      this.canvas.width = canvasWidth
      this.canvas.height = canvasHeight
    }

    this.clear()

    // ドットを描画
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        if (grid[row][col] === 1) {
          this.ctx.fillStyle = color
          this.ctx.fillRect(
            col * this.dotSize,
            row * this.dotSize,
            this.dotSize,
            this.dotSize
          )
        }
      }
    }
  }

  /**
   * 表情をレンダリング
   * @param expression 表情
   * @param deviceType デバイスタイプ（スマホ/タブレット）
   */
  render(expression: Expression, deviceType: 'smartphone' | 'tablet') {
    // 差分レンダリング: 表情が変わった時のみ再描画
    if (expression === this.currentExpression) {
      return
    }

    const pattern = getDotPattern(expression, deviceType)
    this.drawDotPattern(pattern)
    this.currentExpression = expression
  }

  /**
   * ドットサイズを設定
   */
  setDotSize(size: number) {
    this.dotSize = size
  }

  /**
   * 任意のDotPatternを直接描画（エディタプレビュー用）
   */
  renderPattern(pattern: DotPattern): void {
    this.drawDotPattern(pattern)
    this.currentExpression = null
  }

  /**
   * キャンバスをリセット
   */
  reset() {
    this.clear()
    this.currentExpression = null
  }
}
