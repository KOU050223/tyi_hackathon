/**
 * 音声認識インジケーター
 */

export interface VoiceIndicatorProps {
  /** 認識テキスト */
  transcript: string;
  /** 表示するかどうか */
  show: boolean;
  /** ウェイクワード検出後のコマンド待機中 */
  isWaitingForCommand?: boolean;
  /** コマンド受付残り時間（ミリ秒） */
  commandTimeRemaining?: number | null;
  /** デバッグモード（テキストを表示） */
  debug?: boolean;
}

/**
 * 音声認識インジケーターコンポーネント
 */
export function VoiceIndicator({
  transcript,
  show,
  isWaitingForCommand = false,
  commandTimeRemaining = null,
  debug = false,
}: VoiceIndicatorProps) {
  if (!show) {
    return null;
  }

  // ウェイクワード検出後の表示
  if (isWaitingForCommand && commandTimeRemaining !== null) {
    const secondsRemaining = Math.ceil(commandTimeRemaining / 1000);

    return (
      <div className="fixed bottom-24 right-4 z-50">
        <div className="bg-[#E66CBC] rounded-full px-8 py-4 shadow-2xl animate-bounce">
          <div className="flex items-center gap-4">
            {/* 璃奈ちゃんカラーのアイコン */}
            <svg
              className="w-6 h-6 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>

            <span className="text-white text-xl font-bold">コマンドをどうぞ！</span>

            {/* カウントダウン */}
            <span className="text-white text-3xl font-mono tabular-nums min-w-[2ch] text-center">
              {secondsRemaining}
            </span>
          </div>
        </div>

        {/* デバッグモード時のテキスト表示 */}
        {debug && transcript && (
          <div className="mt-2 bg-black/70 backdrop-blur-sm rounded-lg px-4 py-2 text-white text-sm text-center">
            {transcript}
          </div>
        )}
      </div>
    );
  }

  // 通常のリスニング表示
  return (
    <div className="fixed bottom-24 right-4 z-50">
      <div className="bg-[#E66CBC]/90 backdrop-blur-sm rounded-full px-6 py-3 shadow-lg flex items-center gap-3 animate-pulse">
        {/* マイクアイコン */}
        <svg
          className="w-5 h-5 text-white"
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
        </svg>

        {/* テキスト */}
        <span className="text-white font-medium">
          {debug && transcript ? transcript : "音声を認識中..."}
        </span>

        {/* パルスアニメーション */}
        <div className="flex gap-1">
          <div className="w-1 h-4 bg-white rounded-full animate-pulse" style={{ animationDelay: "0ms" }} />
          <div className="w-1 h-4 bg-white rounded-full animate-pulse" style={{ animationDelay: "150ms" }} />
          <div className="w-1 h-4 bg-white rounded-full animate-pulse" style={{ animationDelay: "300ms" }} />
        </div>
      </div>

      {/* デバッグモード時のテキスト表示 */}
      {debug && transcript && (
        <div className="mt-2 bg-black/70 backdrop-blur-sm rounded-lg px-4 py-2 text-white text-sm text-center">
          {transcript}
        </div>
      )}
    </div>
  );
}
