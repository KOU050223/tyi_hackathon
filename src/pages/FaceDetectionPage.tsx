import { useEffect, useRef, useState } from "react";
import { useCamera } from "@/hooks/useCamera";
import { useDeviceType } from "@/hooks/useDeviceType";
import { useFaceDetection } from "@/hooks/useFaceDetection";
import { CanvasRenderer } from "@/engines/renderer/CanvasRenderer";
import { detectExpression } from "@/utils/expressionDetector";
import { convertBlendshapes } from "@/utils/blendshapeConverter";
import type { Expression } from "@/types/expression";

export default function FaceDetectionPage() {
  const { videoRef, isReady, error: cameraError, startCamera } = useCamera();
  const deviceType = useDeviceType();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<CanvasRenderer | null>(null);
  const [currentExpression, setCurrentExpression] = useState<Expression>("neutral");
  const [_confidence, setConfidence] = useState<number>(0);

  const {
    result: _faceResult,
    isInitializing,
    isInitialized,
    error: faceError,
    isDetecting,
  } = useFaceDetection({
    videoRef,
    enabled: isReady,
    onDetection: (result) => {
      if (result.detected && result.blendshapes) {
        const blendshapes = convertBlendshapes(result.blendshapes);
        const { expression, confidence } = detectExpression(blendshapes);
        setCurrentExpression(expression);
        setConfidence(confidence);
      }
    },
    onError: (err) => {
      console.error("Face detection error:", err);
    },
  });

  useEffect(() => {
    if (canvasRef.current && !rendererRef.current) {
      rendererRef.current = new CanvasRenderer(canvasRef.current);
    }
  }, []);

  useEffect(() => {
    if (rendererRef.current) {
      rendererRef.current.render(currentExpression, deviceType);
    }
  }, [currentExpression, deviceType]);

  const error = cameraError || faceError?.message;

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
      {/* 非表示のカメラプレビュー */}
      <video
        ref={videoRef}
        style={{
          position: "absolute",
          width: "1px",
          height: "1px",
          opacity: 0,
          pointerEvents: "none",
        }}
      />

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
            transform: "translate(-50%, -50%)",
            imageRendering: "pixelated",
          }}
          className="pixel-art"
        />
      </div>

      {/* 下部のコントロール */}
      <div
        style={{
          position: "fixed",
          bottom: "20px",
          left: "50%",
          transform: "translateX(-50%)",
          textAlign: "center",
          zIndex: 10,
        }}
      >
        {!isReady && (
          <button
            onClick={startCamera}
            style={{
              padding: "15px 30px",
              fontSize: "18px",
              backgroundColor: "#E66CBC",
              color: "#1A1225",
              border: "none",
              cursor: "pointer",
              borderRadius: "8px",
              fontWeight: "bold",
              boxShadow: "0 4px 8px rgba(230, 108, 188, 0.4)",
            }}
          >
            カメラを起動
          </button>
        )}
        {error && <p style={{ color: "#FF5A7E", marginTop: "10px" }}>{error}</p>}
        {isInitializing && (
          <p style={{ color: "#7DD3E8", fontSize: "14px" }}>MediaPipe初期化中...</p>
        )}
        {isReady && (
          <p style={{ fontSize: "12px", color: "#A89BBE" }}>
            {isDetecting ? (
              <>リアルタイム表情認識中</>
            ) : isInitialized ? (
              <>検出待機中</>
            ) : (
              <>初期化中...</>
            )}
          </p>
        )}
      </div>
    </div>
  );
}
