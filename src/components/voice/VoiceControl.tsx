/**
 * 音声認識コントロールボタン
 */

import type { SpeechRecognitionState } from "@/types/voice";

export interface VoiceControlProps {
  /** リスニング中かどうか */
  isListening: boolean;
  /** ブラウザがサポートしているか */
  isSupported: boolean;
  /** 現在の状態 */
  state: SpeechRecognitionState;
  /** 開始ボタンクリック時のコールバック */
  onStart: () => void;
  /** 停止ボタンクリック時のコールバック */
  onStop: () => void;
}

/**
 * 音声認識コントロールボタンコンポーネント
 */
export function VoiceControl({
  isListening,
  isSupported,
  state,
  onStart,
  onStop,
}: VoiceControlProps) {
  // ブラウザ非対応の場合
  if (!isSupported) {
    return (
      <div className="flex flex-col items-center gap-2">
        <button
          disabled
          className="w-16 h-16 rounded-full bg-gray-700 cursor-not-allowed flex items-center justify-center"
          title="Web Speech APIはこのブラウザでサポートされていません"
        >
          <svg
            className="w-8 h-8 text-gray-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
            />
            <line x1="3" y1="3" x2="21" y2="21" strokeWidth={2} />
          </svg>
        </button>
        <span className="text-xs text-gray-400">非対応</span>
      </div>
    );
  }

  // 状態に応じたスタイル
  const getButtonStyle = () => {
    if (state === "error") {
      return "bg-red-600 hover:bg-red-700";
    }
    if (isListening || state === "processing") {
      return "bg-[#E66CBC] hover:bg-[#D55BAB] animate-pulse";
    }
    return "bg-gray-700 hover:bg-gray-600";
  };

  // 状態に応じたテキスト
  const getStatusText = () => {
    switch (state) {
      case "listening":
        return "認識中";
      case "processing":
        return "処理中";
      case "error":
        return "エラー";
      default:
        return "音声入力";
    }
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        onClick={isListening ? onStop : onStart}
        className={`w-16 h-16 rounded-full transition-all duration-200 flex items-center justify-center ${getButtonStyle()}`}
        title={isListening ? "音声認識を停止" : "音声認識を開始"}
      >
        <svg
          className="w-8 h-8 text-white"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          {isListening ? (
            // 停止アイコン
            <rect x="6" y="6" width="12" height="12" strokeWidth={2} />
          ) : (
            // マイクアイコン
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
            />
          )}
        </svg>
      </button>
      <span className="text-xs text-white">{getStatusText()}</span>
    </div>
  );
}
