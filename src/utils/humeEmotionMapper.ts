import type { Expression } from "@/types/expression";

/** Hume AIの感情スコア */
export interface HumeEmotion {
  name: string;
  score: number;
}

/** マッピング結果 */
export interface EmotionMappingResult {
  expression: Expression;
  confidence: number;
}

/**
 * 感情グループ定義
 * 各Expressionに対応するHume感情名のリスト
 * スコアはグループ内の合算で判定する
 *
 * NOTE: 閾値チューニング
 * prosodyモデルのスコアは0.01〜0.3程度の低いレンジで分布するため、
 * 閾値はそれに合わせて低めに設定している。
 * 表情の反応感度を変えたい場合は各グループのthresholdを調整する。
 * - thresholdを下げる → その表情が出やすくなる
 * - thresholdを上げる → その表情が出にくくなる
 * - グループの順序は判定優先度に影響しない（スコア最大のグループが採用される）
 */
const EXPRESSION_GROUPS: {
  expression: Exclude<Expression, "blink" | "neutral">;
  emotions: string[];
  /** 合算スコアの最小閾値 */
  threshold: number;
}[] = [
  {
    expression: "smug",
    emotions: ["Triumph", "Pride", "Satisfaction"],
    threshold: 0.08, // NOTE: 閾値を調整して得意気表情の感度を変更
  },
  {
    expression: "embarrassed",
    emotions: ["Embarrassment", "Shame"],
    threshold: 0.08, // NOTE: 閾値を調整して照れ表情の感度を変更
  },
  {
    expression: "surprised",
    emotions: ["Surprise (positive)", "Surprise (negative)", "Awe", "Realization"],
    threshold: 0.1, // NOTE: 閾値を調整して驚き表情の感度を変更
  },
  {
    expression: "angry",
    emotions: ["Anger", "Contempt", "Annoyance", "Disgust"],
    threshold: 0.1, // NOTE: 閾値を調整して怒り表情の感度を変更
  },
  {
    expression: "sad",
    emotions: ["Sadness", "Disappointment", "Distress", "Grief", "Pain"],
    threshold: 0.1, // NOTE: 閾値を調整して悲しみ表情の感度を変更
  },
  {
    expression: "smile",
    emotions: ["Joy", "Amusement", "Excitement", "Contentment", "Love"],
    threshold: 0.1, // NOTE: 閾値を調整して笑顔表情の感度を変更
  },
  {
    expression: "confused",
    emotions: ["Confusion", "Awkwardness"],
    threshold: 0.12, // NOTE: 閾値を調整して困惑表情の感度を変更
  },
  {
    expression: "questioning",
    emotions: ["Interest", "Doubt", "Contemplation", "Concentration"],
    threshold: 0.15, // NOTE: 閾値を調整して疑問表情の感度を変更（4感情の合算のため高め）
  },
];

/**
 * Hume emotions配列を name→score の Map に変換
 */
export function emotionsToMap(emotions: HumeEmotion[]): Map<string, number> {
  const map = new Map<string, number>();
  for (const e of emotions) {
    map.set(e.name, e.score);
  }
  return map;
}

/**
 * Hume AIの感情スコア配列からExpressionを判定する。
 *
 * prosodyモデルのスコアは0.01〜0.3程度の低いレンジで分布するため、
 * グループ内の関連感情スコアを合算し、相対的に最もスコアの高い表情を採用する。
 */
export function mapHumeEmotionsToExpression(emotions: HumeEmotion[]): EmotionMappingResult {
  const scoreMap = emotionsToMap(emotions);

  // 各Expressionのグループスコアを計算
  const candidates: { expression: Expression; score: number }[] = [];

  for (const group of EXPRESSION_GROUPS) {
    let groupScore = 0;
    for (const emotionName of group.emotions) {
      groupScore += scoreMap.get(emotionName) ?? 0;
    }
    if (groupScore >= group.threshold) {
      candidates.push({ expression: group.expression, score: groupScore });
    }
  }

  if (candidates.length === 0) {
    return { expression: "neutral", confidence: 1.0 };
  }

  // スコアが最も高い表情を採用
  candidates.sort((a, b) => b.score - a.score);
  const best = candidates[0];

  // NOTE: グループ合算スコアは1を超えうるためキャップする
  return { expression: best.expression, confidence: Math.min(best.score, 1) };
}
