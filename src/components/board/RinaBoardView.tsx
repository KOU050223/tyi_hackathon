import { useEffect, type ReactNode, type RefObject } from "react";
import { useDeviceType } from "@/hooks/useDeviceType";

interface RinaBoardViewProps {
  canvasRef: RefObject<HTMLCanvasElement | null>;
  children?: ReactNode;
}

/**
 * 璃奈ちゃんボード全面表示の共通レイアウト
 * 背景画像 + Canvas + オーバーレイコントロール（children）
 */
export function RinaBoardView({ canvasRef, children }: RinaBoardViewProps) {
  const deviceType = useDeviceType();
  const isSmartphone = deviceType === "smartphone";

  useEffect(() => {
    document.body.classList.add("fullscreen-board");
    return () => {
      document.body.classList.remove("fullscreen-board");
    };
  }, []);

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
        justifyContent: "flex-start",
        overflow: "hidden",
        zIndex: 100,
        backgroundColor: "#1A1225",
      }}
    >
      {/* 璃奈ちゃんボード（メイン表示） */}
      <div
        style={{
          position: "relative",
          width: "100vw",
          height: "100vh",
          overflow: "hidden",
        }}
      >
        <img
          src="/rina-chan-back.png"
          alt="璃奈ちゃんボード"
          style={{
            display: "block",
            width: "100%",
            height: isSmartphone ? "200%" : "100%",
            objectFit: isSmartphone ? "fill" : "contain",
            objectPosition: "top center",
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
