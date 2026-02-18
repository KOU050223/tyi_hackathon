import type { WakeWordConfig, VoiceCommand } from "@/types/voice";

/**
 * ウェイクワード設定
 */
export const WAKE_WORD_CONFIG: WakeWordConfig = {
  keywords: [
    // より短く、認識しやすいパターンを優先
    "りな",
    "リナ",
    "璃奈",
    "りなちゃん",
    "リナちゃん",
    "璃奈ちゃん",
    "璃奈ちゃんボード",
    "りなちゃんぼーど",
    "リナちゃんボード",
    "りなちゃんボード",
  ],
  commandTimeout: 5000, // 5秒
  minConfidence: 0.5, // 0.6 -> 0.5 にさらに緩和（短い単語のため）
};

/**
 * 音声コマンドの定義（拡張可能）
 */
export const VOICE_COMMANDS: VoiceCommand[] = [
  {
    id: "go-home",
    patterns: ["ホーム", "ほーむ", "ホームに戻る", "ほーむにもどる", "戻る", "もどる"],
    action: {
      type: "navigate",
      path: "/",
    },
    matchType: "partial",
    description: "ホーム画面に戻ります",
  },
  {
    id: "face-mode",
    patterns: [
      "表情認識",
      "ひょうじょうにんしき",
      "カメラモード",
      "かめらもーど",
      "表情認識モード",
      "ひょうじょうにんしきもーど",
    ],
    action: {
      type: "navigate",
      path: "/face",
    },
    matchType: "partial",
    description: "表情認識モードを起動します",
  },
  {
    id: "voice-mode",
    patterns: [
      "音声感情",
      "おんせいかんじょう",
      "ボイスモード",
      "ぼいすもーど",
      "音声感情モード",
      "おんせいかんじょうもーど",
    ],
    action: {
      type: "navigate",
      path: "/voice",
    },
    matchType: "partial",
    description: "音声感情モードを起動します",
  },
  {
    id: "open-gallery",
    patterns: ["ギャラリー", "ぎゃらりー", "ギャラリーを開く", "ぎゃらりーをひらく"],
    action: {
      type: "navigate",
      path: "/gallery",
    },
    matchType: "partial",
    description: "ギャラリーを開きます",
  },
  {
    id: "open-editor",
    patterns: [
      "エディターモード起動",
      "えでぃたーもーどきどう",
      "エディタモード起動",
      "えでぃたもーどきどう",
      "エディターモード",
      "えでぃたーもーど",
      "エディター起動",
      "えでぃたーきどう",
      "エディタ起動",
      "えでぃたきどう",
    ],
    action: {
      type: "navigate",
      path: "/editor",
    },
    matchType: "partial",
    description: "ドット絵エディターを起動します",
  },
];
