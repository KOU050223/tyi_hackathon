import type { Expression } from "@/types/expression";

export interface SmootherConfig {
  /** 移動平均フレーム数 デフォルト: 3 */
  windowSize?: number;
  /** 最小表示時間(ms) デフォルト: 1500 */
  minDisplayTime?: number;
  /** 無音後neutralに戻るまでの時間(ms) デフォルト: 2000 */
  decayTimeout?: number;
  /** NOTE: 最小表示時間中でも表情を上書きする信頼度閾値 デフォルト: 0.7 */
  overrideConfidenceThreshold?: number;
}

export interface SmootherInput {
  expression: Expression;
  confidence: number;
  isSpeaking: boolean;
  timestamp: number;
}

const DEFAULT_WINDOW_SIZE = 3;
const DEFAULT_MIN_DISPLAY_TIME = 1500;
const DEFAULT_DECAY_TIMEOUT = 2000;
// NOTE: 閾値を調整して、最小表示時間中の表情上書き感度を変更
const DEFAULT_OVERRIDE_CONFIDENCE_THRESHOLD = 0.7;

/**
 * 表情のスムージング・Debounce・Decayを管理する。
 * - 移動平均: 直近N回の結果から最頻表情を選出
 * - 最小表示時間: 表情変更後、一定時間は維持
 * - 無音Decay: 発話停止後、一定時間でneutralに戻る
 */
export class ExpressionSmoother {
  private history: SmootherInput[] = [];
  private currentExpression: Expression = "neutral";
  private lastChangeTime = 0;
  private lastSpeakingTime = 0;

  private readonly windowSize: number;
  private readonly minDisplayTime: number;
  private readonly decayTimeout: number;
  private readonly overrideConfidenceThreshold: number;

  constructor(config?: SmootherConfig) {
    this.windowSize = config?.windowSize ?? DEFAULT_WINDOW_SIZE;
    this.minDisplayTime = config?.minDisplayTime ?? DEFAULT_MIN_DISPLAY_TIME;
    this.decayTimeout = config?.decayTimeout ?? DEFAULT_DECAY_TIMEOUT;
    this.overrideConfidenceThreshold =
      config?.overrideConfidenceThreshold ?? DEFAULT_OVERRIDE_CONFIDENCE_THRESHOLD;
  }

  update(input: SmootherInput): Expression {
    // 履歴に追加（windowSizeまで保持）
    this.history.push(input);
    if (this.history.length > this.windowSize) {
      this.history.shift();
    }

    // 発話中なら最終発話時刻を更新
    if (input.isSpeaking) {
      this.lastSpeakingTime = input.timestamp;
    }

    // 無音Decay: 発話停止からdecayTimeout経過したらneutralに戻す
    if (!input.isSpeaking && input.timestamp - this.lastSpeakingTime > this.decayTimeout) {
      if (this.currentExpression !== "neutral") {
        this.currentExpression = "neutral";
        this.lastChangeTime = input.timestamp;
      }
      return this.currentExpression;
    }

    // 移動平均: 直近の履歴から最頻表情を決定
    const candidate = this.getMostFrequentExpression();

    // 最小表示時間チェック
    const timeSinceChange = input.timestamp - this.lastChangeTime;
    if (timeSinceChange < this.minDisplayTime) {
      // 表示時間内でも、より高い信頼度の別の強い感情なら上書き許可
      if (
        candidate.expression !== this.currentExpression &&
        candidate.confidence > this.overrideConfidenceThreshold
      ) {
        this.currentExpression = candidate.expression;
        this.lastChangeTime = input.timestamp;
      }
      return this.currentExpression;
    }

    // 通常の表情更新
    if (candidate.expression !== this.currentExpression) {
      this.currentExpression = candidate.expression;
      this.lastChangeTime = input.timestamp;
    }

    return this.currentExpression;
  }

  reset(): void {
    this.history = [];
    this.currentExpression = "neutral";
    this.lastChangeTime = 0;
    this.lastSpeakingTime = 0;
  }

  private getMostFrequentExpression(): { expression: Expression; confidence: number } {
    if (this.history.length === 0) {
      return { expression: "neutral", confidence: 1.0 };
    }

    // 各表情の出現回数と合計信頼度を集計
    const counts = new Map<Expression, { count: number; totalConfidence: number }>();
    for (const entry of this.history) {
      const existing = counts.get(entry.expression) ?? { count: 0, totalConfidence: 0 };
      existing.count++;
      existing.totalConfidence += entry.confidence;
      counts.set(entry.expression, existing);
    }

    // 最頻表情を選出（同数なら平均信頼度が高い方）
    let bestExpression: Expression = "neutral";
    let bestCount = 0;
    let bestAvgConfidence = 0;

    for (const [expr, { count, totalConfidence }] of counts) {
      const avgConfidence = totalConfidence / count;
      if (count > bestCount || (count === bestCount && avgConfidence > bestAvgConfidence)) {
        bestExpression = expr;
        bestCount = count;
        bestAvgConfidence = avgConfidence;
      }
    }

    return { expression: bestExpression, confidence: bestAvgConfidence };
  }
}
