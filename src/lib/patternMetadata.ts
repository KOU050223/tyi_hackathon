import type { Expression } from "@/types/expression";

/**
 * 各表情パターンのメタデータ定義
 */
export const PATTERN_METADATA: Record<
  Exclude<Expression, "blink">,
  { nameJa: string; tags: string[] }
> = {
  neutral: { nameJa: "通常", tags: ["基本", "デフォルト"] },
  smile: { nameJa: "笑顔", tags: ["嬉しい", "ポジティブ"] },
  surprised: { nameJa: "驚き", tags: ["驚いた", "びっくり"] },
  angry: { nameJa: "怒り", tags: ["怒った", "不機嫌"] },
  sad: { nameJa: "悲しみ", tags: ["悲しい", "落ち込み"] },
  confused: { nameJa: "困惑", tags: ["困った", "迷い"] },
  smug: { nameJa: "得意気", tags: ["ウインク", "自信"] },
  questioning: { nameJa: "疑問", tags: ["はてな", "質問"] },
  embarrassed: { nameJa: "照れ", tags: ["恥ずかしい", "照れくさい"] },
};
