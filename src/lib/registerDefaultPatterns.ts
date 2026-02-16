import { auth } from "@/lib/firebase";
import { createPattern, updatePattern, findPatternByKey } from "@/lib/patterns";
import { uploadPreviewImage } from "@/lib/storage";
import { CanvasRenderer } from "@/engines/renderer/CanvasRenderer";
import { getFullPattern } from "@/utils/dotPatterns";
import { PATTERN_METADATA } from "@/lib/patternMetadata";
import type { Expression } from "@/types/expression";

/**
 * デフォルトパターンをFirestoreギャラリーに一括登録
 */
export async function registerDefaultPatterns(): Promise<{
  success: number;
  failed: number;
  errors: Array<{ expression: Expression; error: string }>;
}> {
  // 認証チェック
  const user = auth.currentUser;
  if (!user) {
    throw new Error("認証が必要です。GitHub OAuthでログインしてください。");
  }

  const expressions = Object.keys(PATTERN_METADATA) as Array<Exclude<Expression, "blink">>;
  let successCount = 0;
  let failedCount = 0;
  const errors: Array<{ expression: Expression; error: string }> = [];

  console.log(`🚀 デフォルトパターンの一括登録を開始します（全${expressions.length}件）`);
  console.log(`ユーザーID: [REDACTED]\n`);

  for (let i = 0; i < expressions.length; i++) {
    const expression = expressions[i];
    const metadata = PATTERN_METADATA[expression];
    const index = i + 1;

    try {
      console.log(`[${index}/${expressions.length}] 登録中: ${metadata.nameJa} (${expression})...`);

      // パターンデータを取得
      const pattern = await getFullPattern(expression);

      // Canvas要素を動的生成
      const canvas = document.createElement("canvas");
      const renderer = new CanvasRenderer(canvas);

      // パターンを描画
      renderer.renderPattern(pattern);

      // 既存パターンを検索（重複チェック）
      const existingPattern = await findPatternByKey(user.uid, expression, "tablet");

      let patternId: string;

      if (existingPattern) {
        // 既存パターンを更新
        console.log(`  既存パターンを更新: ${existingPattern.id}`);
        patternId = existingPattern.id;

        // Storageにプレビュー画像をアップロード
        const previewUrl = await uploadPreviewImage(patternId, canvas);

        // Firestoreのパターンを更新
        await updatePattern(patternId, {
          color: pattern.color,
          gridData: pattern.grid,
          tags: metadata.tags,
          previewImageUrl: previewUrl,
        });
      } else {
        // 新規パターンを作成
        patternId = await createPattern({
          userId: user.uid,
          name: metadata.nameJa,
          expressionType: expression,
          deviceType: "tablet",
          color: pattern.color,
          gridData: pattern.grid,
          isPublic: true,
          tags: metadata.tags,
        });

        // Storageにプレビュー画像をアップロード
        const previewUrl = await uploadPreviewImage(patternId, canvas);

        // FirestoreのパターンにpreviewImageUrlを更新
        await updatePattern(patternId, { previewImageUrl: previewUrl });
      }

      console.log(`✓ [${index}/${expressions.length}] 完了: ${metadata.nameJa} (${expression})`);
      console.log(`  パターンID: ${patternId}\n`);

      successCount++;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`✗ [${index}/${expressions.length}] 失敗: ${metadata.nameJa} (${expression})`);
      console.error(`  エラー: ${errorMessage}\n`);

      errors.push({ expression, error: errorMessage });
      failedCount++;
    }
  }

  console.log("====================================");
  console.log("登録完了！");
  console.log(`成功: ${successCount}件`);
  console.log(`失敗: ${failedCount}件`);

  if (errors.length > 0) {
    console.log("\n失敗した表情:");
    errors.forEach(({ expression, error }) => {
      console.log(`  - ${expression}: ${error}`);
    });
  }

  return { success: successCount, failed: failedCount, errors };
}
