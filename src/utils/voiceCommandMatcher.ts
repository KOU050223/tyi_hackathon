/**
 * 音声コマンドのマッチングロジック
 */

import type { VoiceCommand, WakeWordConfig } from "@/types/voice";
import { WAKE_WORD_CONFIG, VOICE_COMMANDS } from "@/constants/voice";

export { WAKE_WORD_CONFIG, VOICE_COMMANDS };

/**
 * テキストの正規化（ひらがな/カタカナ統一、句読点除去）
 * @param text - 正規化するテキスト
 * @returns 正規化されたテキスト（ひらがなに統一）
 */
export function normalizeText(text: string): string {
  // 前後の空白を除去
  let normalized = text.trim();

  // カタカナをひらがなに変換
  normalized = normalized.replace(/[\u30A1-\u30F6]/g, (match) => {
    const chr = match.charCodeAt(0) - 0x60;
    return String.fromCharCode(chr);
  });

  // 句読点、記号を除去
  normalized = normalized.replace(/[、。,.\s]/g, "");

  // 小文字に変換（アルファベット）
  normalized = normalized.toLowerCase();

  return normalized;
}

/**
 * 2つのテキスト間の類似度を計算（レーベンシュタイン距離ベース）
 * @param text1 - 比較するテキスト1
 * @param text2 - 比較するテキスト2
 * @returns 類似度（0.0-1.0）
 */
export function calculateSimilarity(text1: string, text2: string): number {
  if (text1 === text2) return 1.0;
  if (text1.length === 0 || text2.length === 0) return 0.0;

  // 部分一致チェック（完全一致より優先度は低いが、高い類似度）
  if (text1.includes(text2) || text2.includes(text1)) {
    const longerLength = Math.max(text1.length, text2.length);
    const shorterLength = Math.min(text1.length, text2.length);
    return 0.7 + (shorterLength / longerLength) * 0.2; // 0.7-0.9の範囲
  }

  // レーベンシュタイン距離の計算
  const matrix: number[][] = [];

  // 初期化
  for (let i = 0; i <= text1.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= text2.length; j++) {
    matrix[0][j] = j;
  }

  // DP計算
  for (let i = 1; i <= text1.length; i++) {
    for (let j = 1; j <= text2.length; j++) {
      const cost = text1[i - 1] === text2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1, // 削除
        matrix[i][j - 1] + 1, // 挿入
        matrix[i - 1][j - 1] + cost, // 置換
      );
    }
  }

  const distance = matrix[text1.length][text2.length];
  const maxLength = Math.max(text1.length, text2.length);

  // 類似度に変換（0.0-1.0）
  return 1 - distance / maxLength;
}

/**
 * テキストがウェイクワードを含むかチェック
 * @param transcript - 認識されたテキスト
 * @param config - ウェイクワード設定（デフォルト: WAKE_WORD_CONFIG）
 * @returns 検出結果と信頼度
 */
export function detectWakeWord(
  transcript: string,
  config: WakeWordConfig = WAKE_WORD_CONFIG,
): { detected: boolean; confidence: number } {
  const normalized = normalizeText(transcript);

  // 空文字列は検出しない
  if (normalized.length === 0) {
    return { detected: false, confidence: 0 };
  }

  let bestMatch = { detected: false, confidence: 0 };

  for (const keyword of config.keywords) {
    const normalizedKeyword = normalizeText(keyword);

    let confidence = 0;

    // 完全一致
    if (normalized === normalizedKeyword) {
      confidence = 1.0;
    }
    // 部分一致（キーワードが含まれている）
    else if (normalized.includes(normalizedKeyword)) {
      confidence = 0.9;
    }
    // 逆方向の部分一致（認識テキストがキーワードの一部）
    else if (normalizedKeyword.includes(normalized) && normalized.length >= 3) {
      // 3文字以上の場合のみ部分一致として扱う
      confidence = 0.8;
    }
    // 類似度計算にフォールバック（短すぎる文字列は除外）
    else if (normalized.length >= 3) {
      confidence = calculateSimilarity(normalized, normalizedKeyword);
    }

    // 最小信頼度を超え、かつ現在の最良マッチより高い場合
    if (confidence >= config.minConfidence && confidence > bestMatch.confidence) {
      bestMatch = { detected: true, confidence };
    }
  }

  return bestMatch;
}

/**
 * 認識テキストにマッチする音声コマンドを検索
 * @param transcript - 認識されたテキスト
 * @param minConfidence - 最小信頼度（デフォルト: 0.7）
 * @returns マッチしたコマンドと信頼度、またはnull
 */
export function matchVoiceCommand(
  transcript: string,
  minConfidence: number = 0.7,
): { command: VoiceCommand; confidence: number } | null {
  // テキストを正規化
  const normalizedTranscript = normalizeText(transcript);

  // 早期リターン: 空または短すぎるテキスト
  if (!normalizedTranscript || normalizedTranscript.length < 2) {
    return null;
  }

  let bestMatch: { command: VoiceCommand; confidence: number } | null = null;

  // 各コマンドとマッチング
  for (const command of VOICE_COMMANDS) {
    for (const pattern of command.patterns) {
      const normalizedPattern = normalizeText(pattern);

      let confidence = 0;

      switch (command.matchType) {
        case "exact":
          // 完全一致
          confidence = normalizedTranscript === normalizedPattern ? 1.0 : 0.0;
          break;

        case "fuzzy":
          // あいまい一致（類似度計算）
          confidence = calculateSimilarity(normalizedTranscript, normalizedPattern);
          break;

        case "partial":
        default:
          // 部分一致（デフォルト）
          if (normalizedTranscript === normalizedPattern) {
            confidence = 1.0;
          } else if (normalizedTranscript.includes(normalizedPattern)) {
            confidence = 0.9;
          } else if (normalizedPattern.includes(normalizedTranscript)) {
            confidence = 0.8;
          } else {
            // 類似度計算にフォールバック
            confidence = calculateSimilarity(normalizedTranscript, normalizedPattern);
          }
          break;
      }

      // 最小信頼度を超え、かつ現在の最良マッチより高い場合
      if (confidence >= minConfidence && (!bestMatch || confidence > bestMatch.confidence)) {
        bestMatch = { command, confidence };
      }
    }
  }

  return bestMatch;
}
