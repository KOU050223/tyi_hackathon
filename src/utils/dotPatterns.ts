import type { Expression, DotPattern, ExpressionPatterns } from "@/types/expression";

/**
 * 各表情に対応するドット絵パターン定義
 * グリッドサイズ: 21x26（全デバイス共通）
 * - スマートフォン: 上14行のみ表示（目のみ)
 * - タブレット: 全26行表示（目+口）
 * 0 = 透明, 1 = 塗りつぶし
 *
 * パターンは public/patterns/*.json から動的に読み込まれます
 */

// パターンキャッシュ
let patternsCache: ExpressionPatterns | null = null;
let isLoading = false;
let loadPromise: Promise<ExpressionPatterns> | null = null;

/**
 * public/patterns/ から全ての表情パターンをJSONで読み込む
 */
async function loadPatternsFromJSON(): Promise<ExpressionPatterns> {
  const expressions: Expression[] = [
    "neutral",
    "smile",
    "surprised",
    "sad",
    "angry",
    "blink",
    "confused",
    "smug",
    "questioning",
    "embarrassed",
  ];

  const patterns: ExpressionPatterns = {};

  await Promise.all(
    expressions.map(async (expression) => {
      try {
        // ローカルストレージに保存済みのパターンがあれば優先使用
        const savedJson = localStorage.getItem(`localPattern:${expression}`);
        if (savedJson) {
          const data = JSON.parse(savedJson);
          patterns[expression] = {
            color: data.color,
            grid: data.grid,
          };
          return;
        }

        const response = await fetch(`/patterns/${expression}.json`);
        if (!response.ok) {
          console.warn(`Failed to load pattern: ${expression}`);
          return;
        }
        const data = await response.json();
        patterns[expression] = {
          color: data.color,
          grid: data.grid,
        };
      } catch (error) {
        console.error(`Error loading pattern ${expression}:`, error);
      }
    }),
  );

  return patterns;
}

/**
 * パターンを取得（初回はロード、以降はキャッシュから返す）
 */
async function getPatterns(): Promise<ExpressionPatterns> {
  // キャッシュがあればそれを返す
  if (patternsCache) {
    return patternsCache;
  }

  // 既にロード中であれば、そのPromiseを返す
  if (isLoading && loadPromise) {
    return loadPromise;
  }

  // ロード開始
  isLoading = true;
  loadPromise = loadPatternsFromJSON();

  try {
    const patterns = await loadPromise;
    patternsCache = patterns;
    return patterns;
  } finally {
    isLoading = false;
    loadPromise = null;
  }
}

/**
 * フォールバック用のデフォルトパターン（JSONロード失敗時）
 */
const fallbackPattern: DotPattern = {
  color: "#E66CBC",
  grid: Array.from({ length: 26 }, () => Array(21).fill(0)),
};

/**
 * デバイスタイプに応じた表情パターンを取得（非同期）
 * スマートフォンの場合は上14行のみ、タブレットは全26行を返す
 */
export const getDotPattern = async (
  expression: Expression,
  deviceType: "smartphone" | "tablet",
): Promise<DotPattern> => {
  const patterns = await getPatterns();
  const fullPattern = patterns[expression] || patterns.neutral || fallbackPattern;

  if (deviceType === "smartphone") {
    // スマートフォンは上14行のみ（目のみ）
    return {
      color: fullPattern.color,
      grid: fullPattern.grid.slice(0, 14),
    };
  }

  // タブレットは全26行
  return fullPattern;
};

/**
 * 目のみのパターンを取得（スマートフォン用）
 * 上14行のみを返す
 */
export const getEyeOnlyPattern = async (expression: Expression): Promise<DotPattern> => {
  const patterns = await getPatterns();
  const fullPattern = patterns[expression] || patterns.neutral || fallbackPattern;
  return {
    color: fullPattern.color,
    grid: fullPattern.grid.slice(0, 14),
  };
};

/**
 * 目 + 口のパターンを取得（タブレット用）
 * 全26行を返す
 */
export const getFullPattern = async (expression: Expression): Promise<DotPattern> => {
  const patterns = await getPatterns();
  return patterns[expression] || patterns.neutral || fallbackPattern;
};

/**
 * パターンキャッシュをクリア（開発用・JSONファイル変更後のリロード用）
 */
export const clearPatternCache = () => {
  patternsCache = null;
  isLoading = false;
  loadPromise = null;
};
