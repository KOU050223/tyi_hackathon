import type { ReactNode, RefObject } from "react";

interface RinaBoardViewProps {
  canvasRef: RefObject<HTMLCanvasElement | null>;
  children?: ReactNode;
}

/**
 * 璃奈ちゃんボード全面表示の共通レイアウト
 * 背景画像 + Canvas + オーバーレイコントロール（children）
 */
export function RinaBoardView({ canvasRef, children }: RinaBoardViewProps) {
  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
      }}
    >
      {/* 璃奈ちゃんボード（メイン表示） */}
      <div
        style={{
          position: "relative",
          width: "100vw",
          height: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <img
          src="/rina-chan-back.png"
          alt="璃奈ちゃんボード"
          style={{
            display: "block",
            width: "100%",
            height: "100%",
            objectFit: "contain",
          }}
        />
        <canvas
          ref={canvasRef}
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -40%)",
            imageRendering: "pixelated",
          }}
          className="pixel-art"
        />
      </div>

      {/* オーバーレイコントロール（各ページから注入） */}
      {children}
    </div>
  );
}
