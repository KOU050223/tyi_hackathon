import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { useCamera } from "@/hooks/useCamera";
import { useDeviceType } from "@/hooks/useDeviceType";
import { useFaceDetection } from "@/hooks/useFaceDetection";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { CanvasRenderer } from "@/engines/renderer/CanvasRenderer";
import { detectExpression } from "@/utils/expressionDetector";
import { convertBlendshapes } from "@/utils/blendshapeConverter";
import { VoiceControl } from "@/components/voice/VoiceControl";
import { VoiceIndicator } from "@/components/voice/VoiceIndicator";
import type { Expression } from "@/types/expression";
import { registerDefaultPatterns } from "@/lib/registerDefaultPatterns";

export default function FaceDetectionPage() {
  const navigate = useNavigate();
  const { videoRef, isReady, error: cameraError, startCamera } = useCamera();
  const deviceType = useDeviceType();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<CanvasRenderer | null>(null);
  const [currentExpression, setCurrentExpression] = useState<Expression>("neutral");
  const [_confidence, setConfidence] = useState<number>(0);
  const [voiceEnabled, setVoiceEnabled] = useState<boolean>(false);
  const [isRegistering, setIsRegistering] = useState<boolean>(false);

  // 音声認識デバッグモード（開発環境のみ有効）
  const isVoiceIndicatorDebug = import.meta.env.DEV;

  // 許可されたナビゲーションパス
  const ALLOWED_PATHS = ["/", "/gallery", "/editor", "/settings"];

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

  // 音声認識
  const {
    isListening,
    isSupported,
    state: voiceState,
    transcript,
    error: voiceError,
    isWaitingForCommand,
    commandTimeRemaining,
    startListening: _startListening,
    stopListening,
  } = useSpeechRecognition({
    enabled: voiceEnabled && isReady,
    continuous: true,
    interimResults: true,
    lang: "ja-JP",
    wakeWordEnabled: true, // ウェイクワードモードを有効化
    onWakeWordDetected: () => {
      if (import.meta.env.DEV) {
        console.log("ウェイクワード検出！コマンド待機中...");
      }
    },
    onResult: (result) => {
      if (import.meta.env.DEV) {
        console.log("Voice recognition result:", result);
      }
      if (result.matchedCommand && result.isFinal) {
        if (import.meta.env.DEV) {
          console.log("Command matched:", result.matchedCommand);
        }
        if (result.matchedCommand.action.type === "navigate") {
          const targetPath = result.matchedCommand.action.path;
          // パスホワイトリストで検証
          if (ALLOWED_PATHS.includes(targetPath)) {
            navigate(targetPath);
          } else {
            if (import.meta.env.DEV) {
              console.warn(`不正なナビゲーションパス: ${targetPath}`);
            }
          }
        }
      }
    },
    onError: (err) => {
      console.error("Voice recognition error:", err);
    },
  });

  useEffect(() => {
    if (canvasRef.current && !rendererRef.current) {
      rendererRef.current = new CanvasRenderer(canvasRef.current);
    }
  }, []);

  useEffect(() => {
    if (rendererRef.current) {
      // renderが非同期になったため、awaitして実行
      rendererRef.current.render(currentExpression, deviceType).catch((err) => {
        console.error("Failed to render expression:", err);
      });
    }
  }, [currentExpression, deviceType]);

  const error = cameraError || faceError?.message || voiceError?.message;

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
            transform: "translate(-50%, -40%)",
            imageRendering: "pixelated",
          }}
          className="pixel-art"
        />
      </div>

      {/* 音声認識インジケーター */}
      <VoiceIndicator
        transcript={transcript}
        show={isListening}
        isWaitingForCommand={isWaitingForCommand}
        commandTimeRemaining={commandTimeRemaining}
        debug={isVoiceIndicatorDebug}
      />

      {/* 右下のコントロール */}
      <div
        style={{
          position: "fixed",
          bottom: "20px",
          right: "20px",
          textAlign: "right",
          zIndex: 10,
        }}
      >
        <div
          style={{ display: "flex", flexDirection: "column", gap: "12px", alignItems: "flex-end" }}
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
          {isReady && (
            <VoiceControl
              isListening={isListening}
              isSupported={isSupported}
              state={voiceState}
              onStart={() => setVoiceEnabled(true)}
              onStop={() => {
                setVoiceEnabled(false);
                stopListening();
              }}
            />
          )}
          {error && (
            <p style={{ color: "#FF5A7E", fontSize: "14px", maxWidth: "300px" }}>{error}</p>
          )}
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
    </div>
  );
}
