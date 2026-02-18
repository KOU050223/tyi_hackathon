export interface VoiceEmotionToggleProps {
  isActive: boolean;
  isConnected: boolean;
  isInitializing: boolean;
  isSpeaking: boolean;
  onToggle: (active: boolean) => void;
}

export function VoiceEmotionToggle({
  isActive,
  isConnected,
  isInitializing,
  isSpeaking,
  onToggle,
}: VoiceEmotionToggleProps) {
  const getButtonStyle = () => {
    if (isInitializing) {
      return "bg-yellow-600 hover:bg-yellow-700 animate-pulse";
    }
    if (isActive && isConnected) {
      return isSpeaking
        ? "bg-green-500 hover:bg-green-600 animate-pulse"
        : "bg-[#E66CBC] hover:bg-[#D55BAB]";
    }
    return "bg-gray-700 hover:bg-gray-600";
  };

  const getStatusText = () => {
    if (isInitializing) return "接続中...";
    if (isActive && isConnected && isSpeaking) return "音声解析中";
    if (isActive && isConnected) return "待機中";
    if (isActive && !isConnected) return "未接続";
    return "音声感情";
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        onClick={() => {
          if (isInitializing) return;
          onToggle(!isActive);
        }}
        disabled={isInitializing}
        aria-pressed={isActive}
        aria-disabled={isInitializing}
        className={`w-16 h-16 rounded-full transition-all duration-200 flex items-center justify-center ${getButtonStyle()}`}
        title={
          isInitializing ? "接続中..." : isActive ? "音声感情モードを停止" : "音声感情モードを開始"
        }
      >
        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          {isActive ? (
            // 波形アイコン（アクティブ）
            <g strokeWidth={2} strokeLinecap="round">
              <line x1="4" y1="8" x2="4" y2="16" />
              <line x1="8" y1="5" x2="8" y2="19" />
              <line x1="12" y1="2" x2="12" y2="22" />
              <line x1="16" y1="5" x2="16" y2="19" />
              <line x1="20" y1="8" x2="20" y2="16" />
            </g>
          ) : (
            // マイク + ハートアイコン
            <g>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
              />
            </g>
          )}
        </svg>
      </button>
      <span className="text-xs text-white">{getStatusText()}</span>
    </div>
  );
}
