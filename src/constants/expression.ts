import type { Expression } from "@/types/expression";

/**
 * 表情判定の優先度定義（高い順）
 */
export const EXPRESSION_PRIORITY: Expression[] = [
  "blink", // まばたきは最優先
  "surprised", // 驚きは強い表情
  "angry", // 怒りも強い表情
  "smug", // ウインクは特徴的
  "smile", // 笑顔
  "sad", // 悲しみ
  "questioning", // 疑問
  "confused", // 困惑
  "embarrassed", // 照れ
  "neutral", // デフォルト
];

/**
 * すべての検出可能な表情の配列（表示順）
 */
export const ALL_DETECTABLE_EXPRESSIONS: Expression[] = [
  "neutral",
  "smile",
  "surprised",
  "blink",
  "sad",
  "angry",
  "confused",
  "smug",
  "questioning",
  "embarrassed",
];

/**
 * 表情の日本語ラベル
 */
export const EXPRESSION_LABELS: Record<Expression, string> = {
  neutral: "ニュートラル",
  smile: "笑顔",
  surprised: "驚き",
  blink: "まばたき",
  sad: "悲しみ",
  angry: "怒り",
  confused: "困惑",
  smug: "ドヤ顔",
  questioning: "疑問",
  embarrassed: "照れ",
};
