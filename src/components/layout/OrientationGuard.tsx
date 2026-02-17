import { useOrientationLock } from "@/hooks/useOrientationLock";

/**
 * スマートフォンで縦画面のとき、横画面への回転を促すオーバーレイを表示するコンポーネント
 * タブレット（幅 >= 768px）ではオーバーレイを表示しない
 */
export function OrientationGuard() {
  const isPortrait = useOrientationLock();

  // タブレット以上の幅ではチェック不要（CSS側でも制御）
  // isPortraitがfalse（横画面）なら何も表示しない
  if (!isPortrait) return null;

  return (
    <>
      {/* スマートフォンの縦画面のみ表示（CSSでタブレット以上を非表示） */}
      <div
        className="orientation-guard"
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 9999,
          backgroundColor: "#1a1225",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "24px",
          color: "#f5f0ff",
          fontFamily: "'DotGothic16', 'Courier New', monospace",
        }}
      >
        {/* 回転アイコン（CSSアニメーション） */}
        <div
          style={{
            fontSize: "64px",
            animation: "rotate-hint 2s ease-in-out infinite",
          }}
        >
          📱
        </div>
        <p
          style={{
            fontSize: "18px",
            fontWeight: "bold",
            color: "#e66cbc",
            textAlign: "center",
            margin: 0,
            textShadow: "0 0 8px rgba(230, 108, 188, 0.5)",
          }}
        >
          横画面にしてください
        </p>
        <p
          style={{
            fontSize: "14px",
            color: "#a89bbe",
            textAlign: "center",
            margin: 0,
          }}
        >
          このアプリは横画面専用です
        </p>
        <style>{`
          @keyframes rotate-hint {
            0%, 100% { transform: rotate(0deg); }
            40% { transform: rotate(90deg); }
            60% { transform: rotate(90deg); }
          }
          /* タブレット以上ではオーバーレイを非表示 */
          @media (min-width: 768px) {
            .orientation-guard {
              display: none !important;
            }
          }
        `}</style>
      </div>
    </>
  );
}
