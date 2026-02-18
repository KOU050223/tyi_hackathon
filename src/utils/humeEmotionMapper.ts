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
    threshold: 0.08,
  },
  {
    expression: "embarrassed",
    emotions: ["Embarrassment", "Awkwardness", "Shame"],
    threshold: 0.08,
  },
  {
    expression: "surprised",
    emotions: ["Surprise (positive)", "Surprise (negative)", "Awe", "Realization"],
    threshold: 0.1,
  },
  {
    expression: "angry",
    emotions: ["Anger", "Contempt", "Annoyance", "Disgust"],
    threshold: 0.1,
  },
  {
    expression: "sad",
    emotions: ["Sadness", "Disappointment", "Distress", "Grief", "Pain"],
    threshold: 0.1,
  },
  {
    expression: "smile",
    emotions: ["Joy", "Amusement", "Excitement", "Contentment", "Love"],
    threshold: 0.1,
  },
  {
    expression: "confused",
    emotions: ["Confusion", "Awkwardness"],
    threshold: 0.12,
  },
  {
    expression: "questioning",
    emotions: ["Interest", "Doubt", "Contemplation", "Concentration"],
    threshold: 0.15,
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

  return { expression: best.expression, confidence: best.score };
}
