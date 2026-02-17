import type { Expression, DotPattern } from "@/types/expression";
import { getDotPattern } from "@/utils/dotPatterns";

/**
 * Canvas 2Dでドット絵を描画するレンダリングエンジン
 */
export class CanvasRenderer {
  private ctx: CanvasRenderingContext2D;
  private canvas: HTMLCanvasElement;
  private currentExpression: Expression | null = null;
  private dotSize: number = 40; // 各ドットのサイズ（ピクセル）
  private _renderVersion: number = 0; // レンダリング競合防止用バージョントークン

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const context = canvas.getContext("2d");
    if (!context) {
      throw new Error("Canvas 2D context not supported");
    }
    this.ctx = context;
    this.setupCanvas();
  }

  /**
   * Canvasの初期設定
   */
  private setupCanvas() {
    // ピクセルアート風の描画設定
    this.ctx.imageSmoothingEnabled = false;
    this.canvas.style.imageRendering = "pixelated";
  }

  /**
   * キャンバスをクリア
   */
  private clear() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  /**
   * ドット絵パターンを描画
   * 画面サイズに収まるようにdotSizeを自動調整
   */
  private drawDotPattern(pattern: DotPattern) {
    const { color, grid } = pattern;
    const rows = grid.length;
    const cols = grid[0]?.length || 0;

    // 画面サイズを取得
    const maxWidth = window.innerWidth;
    const maxHeight = window.innerHeight;

    // 画面に収まる最大のdotSizeを計算（余白10%確保）
    const maxDotSizeByWidth = Math.floor((maxWidth * 0.9) / cols);
    const maxDotSizeByHeight = Math.floor((maxHeight * 0.9) / rows);
    const optimalDotSize = Math.min(maxDotSizeByWidth, maxDotSizeByHeight, this.dotSize);

    // キャンバスサイズを計算
    const canvasWidth = cols * optimalDotSize;
    const canvasHeight = rows * optimalDotSize;

    if (this.canvas.width !== canvasWidth || this.canvas.height !== canvasHeight) {
      this.canvas.width = canvasWidth;
      this.canvas.height = canvasHeight;
      // Canvas resizeは2Dコンテキストをリセットするため再初期化
      this.setupCanvas();
    }

    this.clear();

    // ドットを描画
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        if (grid[row][col] === 1) {
          this.ctx.fillStyle = color;
          this.ctx.fillRect(
            col * optimalDotSize,
            row * optimalDotSize,
            optimalDotSize,
            optimalDotSize,
          );
        }
      }
    }
  }

  /**
   * 表情をレンダリング（非同期）
   * @param expression 表情
   * @param deviceType デバイスタイプ（スマホ/タブレット）
   */
  async render(expression: Expression, deviceType: "smartphone" | "tablet") {
    // 差分レンダリング: 表情が変わった時のみ再描画
    if (expression === this.currentExpression) {
      return;
    }

    // レンダリングバージョンをインクリメント（非同期競合防止）
    this._renderVersion++;
    const currentVersion = this._renderVersion;

    const pattern = await getDotPattern(expression, deviceType);

    // 非同期処理中に新しいrenderが呼ばれた場合はスキップ
    if (currentVersion !== this._renderVersion) {
      return;
    }

    this.drawDotPattern(pattern);
    this.currentExpression = expression;
  }

  /**
   * ドットサイズを設定
   */
  setDotSize(size: number) {
    this.dotSize = size;
  }

  /**
   * 任意のDotPatternを直接描画（エディタプレビュー用）
   */
  renderPattern(pattern: DotPattern): void {
    this.drawDotPattern(pattern);
    this.currentExpression = null;
  }

  /**
   * キャンバスをリセット
   */
  reset() {
    this.clear();
    this.currentExpression = null;
  }
}
