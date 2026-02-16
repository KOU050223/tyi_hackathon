// 表情の型定義
export type Expression =
  | "neutral"
  | "smile"
  | "sad"
  | "angry"
  | "surprised"
  | "blink"
  | "confused"
  | "smug"
  | "questioning"
  | "embarrassed";

// ドット絵パターンの型定義
export interface DotPattern {
  color: string;
  grid: number[][];
}

export interface ExpressionPatterns {
  [key: string]: DotPattern;
}
