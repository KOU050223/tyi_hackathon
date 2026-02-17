import type { Expression } from "@/types/expression";

export interface PatternJson {
  expression: string;
  color: string;
  grid: number[][];
  size: {
    width: number;
    height: number;
  };
  metadata: {
    eyeOnlyRows: number;
    fullRows: number;
    description: string;
  };
}

/**
 * public/patterns/からパターンJSONを読み込む
 */
export async function loadPatternJson(
  expression: Expression,
): Promise<PatternJson> {
  const response = await fetch(`/patterns/${expression}.json`);

  if (!response.ok) {
    throw new Error(
      `Failed to load pattern: ${expression} (${response.status})`,
    );
  }

  const data = await response.json();
  return data as PatternJson;
}

/**
 * PatternJsonの形式を検証する
 */
export function validatePatternJson(data: unknown): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (typeof data !== "object" || data === null) {
    errors.push("データがオブジェクトではありません");
    return { valid: false, errors };
  }

  const pattern = data as Record<string, unknown>;

  // expression
  if (typeof pattern.expression !== "string") {
    errors.push("expressionが文字列ではありません");
  }

  // color
  if (typeof pattern.color !== "string") {
    errors.push("colorが文字列ではありません");
  } else if (!/^#[0-9A-Fa-f]{6}$/.test(pattern.color)) {
    errors.push("colorが有効なHEXカラーコードではありません");
  }

  // grid
  if (!Array.isArray(pattern.grid)) {
    errors.push("gridが配列ではありません");
  } else {
    const grid = pattern.grid;
    if (grid.length === 0) {
      errors.push("gridが空です");
    } else {
      // 各行が配列かチェック
      for (let i = 0; i < grid.length; i++) {
        if (!Array.isArray(grid[i])) {
          errors.push(`grid[${i}]が配列ではありません`);
          break;
        }
      }

      // 全行の長さが同じかチェック
      const firstRowLength = (grid[0] as unknown[]).length;
      for (let i = 1; i < grid.length; i++) {
        if ((grid[i] as unknown[]).length !== firstRowLength) {
          errors.push(
            `grid[${i}]の長さ(${(grid[i] as unknown[]).length})が最初の行の長さ(${firstRowLength})と異なります`,
          );
          break;
        }
      }

      // 値が0か1のみかチェック
      for (let i = 0; i < grid.length; i++) {
        const row = grid[i] as unknown[];
        for (let j = 0; j < row.length; j++) {
          if (row[j] !== 0 && row[j] !== 1) {
            errors.push(
              `grid[${i}][${j}]の値が0または1ではありません: ${row[j]}`,
            );
            break;
          }
        }
      }
    }
  }

  // size
  if (typeof pattern.size !== "object" || pattern.size === null) {
    errors.push("sizeがオブジェクトではありません");
  } else {
    const size = pattern.size as Record<string, unknown>;
    if (typeof size.width !== "number") {
      errors.push("size.widthが数値ではありません");
    }
    if (typeof size.height !== "number") {
      errors.push("size.heightが数値ではありません");
    }

    // gridとsizeの整合性チェック
    if (Array.isArray(pattern.grid) && pattern.grid.length > 0) {
      const grid = pattern.grid;
      if (typeof size.height === "number" && grid.length !== size.height) {
        errors.push(
          `gridの行数(${grid.length})がsize.height(${size.height})と一致しません`,
        );
      }
      if (
        typeof size.width === "number" &&
        Array.isArray(grid[0]) &&
        (grid[0] as unknown[]).length !== size.width
      ) {
        errors.push(
          `gridの列数(${(grid[0] as unknown[]).length})がsize.width(${size.width})と一致しません`,
        );
      }
    }
  }

  // metadata
  if (typeof pattern.metadata !== "object" || pattern.metadata === null) {
    errors.push("metadataがオブジェクトではありません");
  } else {
    const metadata = pattern.metadata as Record<string, unknown>;
    if (typeof metadata.eyeOnlyRows !== "number") {
      errors.push("metadata.eyeOnlyRowsが数値ではありません");
    }
    if (typeof metadata.fullRows !== "number") {
      errors.push("metadata.fullRowsが数値ではありません");
    }
    if (typeof metadata.description !== "string") {
      errors.push("metadata.descriptionが文字列ではありません");
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
