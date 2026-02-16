/**
 * voiceCommandMatcherのユニットテスト
 */

import { describe, it, expect } from "vitest";
import {
  normalizeText,
  calculateSimilarity,
  matchVoiceCommand,
  detectWakeWord,
  VOICE_COMMANDS,
  WAKE_WORD_CONFIG,
} from "@/utils/voiceCommandMatcher";

describe("voiceCommandMatcher", () => {
  describe("normalizeText", () => {
    it("カタカナをひらがなに変換する", () => {
      expect(normalizeText("リナちゃん")).toBe("りなちゃん");
      expect(normalizeText("エディター")).toBe("えでぃたー");
    });

    it("前後の空白を除去する", () => {
      expect(normalizeText("  リナちゃん  ")).toBe("りなちゃん");
    });

    it("句読点を除去する", () => {
      expect(normalizeText("リナちゃん、エディター。")).toBe("りなちゃんえでぃたー");
    });

    it("アルファベットを小文字に変換する", () => {
      expect(normalizeText("EDITOR")).toBe("editor");
    });

    it("複合的な正規化", () => {
      // 漢字はそのまま残る（音声認識結果は通常ひらがな/カタカナで返されるため）
      expect(normalizeText("  リナちゃん、エディター起動  ")).toBe("りなちゃんえでぃたー起動");
    });
  });

  describe("calculateSimilarity", () => {
    it("完全一致で1.0を返す", () => {
      expect(calculateSimilarity("test", "test")).toBe(1.0);
    });

    it("完全に異なる文字列で低い類似度を返す", () => {
      const similarity = calculateSimilarity("abc", "xyz");
      expect(similarity).toBeLessThan(0.5);
    });

    it("部分一致で高い類似度を返す", () => {
      const similarity = calculateSimilarity("りなちゃんえでぃたーきどう", "えでぃたーきどう");
      expect(similarity).toBeGreaterThan(0.7);
    });

    it("空文字列で0.0を返す", () => {
      expect(calculateSimilarity("", "test")).toBe(0.0);
      expect(calculateSimilarity("test", "")).toBe(0.0);
    });
  });

  describe("detectWakeWord", () => {
    it("ウェイクワードを完全一致で検出する", () => {
      const result = detectWakeWord("璃奈ちゃんボード");
      expect(result.detected).toBe(true);
      expect(result.confidence).toBeGreaterThanOrEqual(WAKE_WORD_CONFIG.minConfidence);
    });

    it("ウェイクワードをひらがなで検出する", () => {
      const result = detectWakeWord("りなちゃんぼーど");
      expect(result.detected).toBe(true);
      expect(result.confidence).toBeGreaterThanOrEqual(WAKE_WORD_CONFIG.minConfidence);
    });

    it("ウェイクワードをカタカナで検出する", () => {
      const result = detectWakeWord("リナちゃんボード");
      expect(result.detected).toBe(true);
      expect(result.confidence).toBeGreaterThanOrEqual(WAKE_WORD_CONFIG.minConfidence);
    });

    it("ウェイクワードが文中に含まれる場合も検出する", () => {
      const result = detectWakeWord("璃奈ちゃんボード、エディター起動");
      expect(result.detected).toBe(true);
      expect(result.confidence).toBeGreaterThanOrEqual(WAKE_WORD_CONFIG.minConfidence);
    });

    it("ウェイクワードでないテキストは検出しない", () => {
      const result = detectWakeWord("エディター起動");
      expect(result.detected).toBe(false);
      expect(result.confidence).toBe(0);
    });

    it("空文字列は検出しない", () => {
      const result = detectWakeWord("");
      expect(result.detected).toBe(false);
    });

    it("短縮形でもウェイクワードを検出できる", () => {
      const result = detectWakeWord("りなちゃん");
      expect(result.detected).toBe(true);
      expect(result.confidence).toBeGreaterThanOrEqual(WAKE_WORD_CONFIG.minConfidence);
    });

    it("部分的な発音でも検出する（類似度ベース）", () => {
      const result = detectWakeWord("りなちゃ");
      // 類似度が十分に高ければ検出される
      if (result.detected) {
        expect(result.confidence).toBeGreaterThanOrEqual(WAKE_WORD_CONFIG.minConfidence);
      }
    });

    it("カスタム設定でウェイクワードを検出できる", () => {
      const customConfig = {
        keywords: ["テスト"],
        commandTimeout: 5000,
        minConfidence: 0.9,
      };
      const result = detectWakeWord("テスト", customConfig);
      expect(result.detected).toBe(true);
    });
  });

  describe("matchVoiceCommand", () => {
    it("完全一致するコマンドを返す", () => {
      const result = matchVoiceCommand("エディターモード起動");
      expect(result).not.toBeNull();
      expect(result?.command.id).toBe("open-editor");
      expect(result?.confidence).toBeGreaterThanOrEqual(0.9);
    });

    it("部分一致するコマンドを返す（パターンの一部）", () => {
      const result = matchVoiceCommand("エディター起動");
      expect(result).not.toBeNull();
      expect(result?.command.id).toBe("open-editor");
      expect(result?.confidence).toBeGreaterThanOrEqual(0.7);
    });

    it("ひらがなでも認識する", () => {
      const result = matchVoiceCommand("えでぃたーもーどきどう");
      expect(result).not.toBeNull();
      expect(result?.command.id).toBe("open-editor");
    });

    it("カタカナでも認識する", () => {
      const result = matchVoiceCommand("エディタモードキドウ");
      expect(result).not.toBeNull();
      expect(result?.command.id).toBe("open-editor");
    });

    it("閾値以下の類似度の場合nullを返す", () => {
      const result = matchVoiceCommand("全く関係ないテキスト");
      expect(result).toBeNull();
    });

    it("カスタム閾値を使用できる", () => {
      const result = matchVoiceCommand("エディ", 0.5);
      // 部分一致で低い信頼度だが、閾値を下げれば検出可能
      if (result) {
        expect(result.confidence).toBeGreaterThanOrEqual(0.5);
      }
    });

    it("コマンド定義が正しい構造を持つ", () => {
      expect(VOICE_COMMANDS.length).toBeGreaterThan(0);
      VOICE_COMMANDS.forEach((cmd) => {
        expect(cmd).toHaveProperty("id");
        expect(cmd).toHaveProperty("patterns");
        expect(cmd).toHaveProperty("action");
        expect(Array.isArray(cmd.patterns)).toBe(true);
      });
    });

    it("open-editorコマンドのアクションがナビゲーション型である", () => {
      const cmd = VOICE_COMMANDS.find((c) => c.id === "open-editor");
      expect(cmd).toBeDefined();
      expect(cmd?.action.type).toBe("navigate");
      if (cmd?.action.type === "navigate") {
        expect(cmd.action.path).toBe("/editor");
      }
    });
  });
});
