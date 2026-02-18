import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { useDeviceType } from "@/hooks/useDeviceType";
import { useHumeEmotion } from "@/hooks/useHumeEmotion";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { CanvasRenderer } from "@/engines/renderer/CanvasRenderer";
import { VoiceControl } from "@/components/voice/VoiceControl";
import { VoiceIndicator } from "@/components/voice/VoiceIndicator";
import { VoiceEmotionToggle } from "@/components/voice/VoiceEmotionToggle";
import { RinaBoardView } from "@/components/board/RinaBoardView";
import type { Expression } from "@/types/expression";

export default function VoiceEmotionPage() {
  const navigate = useNavigate();
  const deviceType = useDeviceType();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<CanvasRenderer | null>(null);
  const [currentExpression, setCurrentExpression] = useState<Expression>("neutral");
  const [_confidence, setConfidence] = useState<number>(0);
  const [micStarted, setMicStarted] = useState<boolean>(false);
  const [voiceEnabled, setVoiceEnabled] = useState<boolean>(false);

  const isVoiceIndicatorDebug = import.meta.env.DEV;

  const ALLOWED_PATHS = ["/", "/face", "/voice", "/gallery", "/editor", "/settings"];

  // Hume AI 音声感情解析（カメラ不要、micStarted で制御）
  const {
    isConnected: isHumeConnected,
    isInitializing: isHumeInitializing,
    isSpeaking: isHumeSpeaking,
    error: humeError,
  } = useHumeEmotion({
    enabled: micStarted,
    onExpressionChange: (expression, confidence) => {
      setCurrentExpression(expression);
      setConfidence(confidence);
    },
    onError: (err) => {
      console.error("Hume emotion error:", err);
    },
  });

  // 音声認識（音声コマンド用）
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
    enabled: voiceEnabled && micStarted,
    continuous: true,
    interimResults: true,
    lang: "ja-JP",
    wakeWordEnabled: true,
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
      rendererRef.current.render(currentExpression, deviceType).catch((err) => {
        console.error("Failed to render expression:", err);
      });
    }
  }, []);

  useEffect(() => {
    if (rendererRef.current) {
      rendererRef.current.render(currentExpression, deviceType).catch((err) => {
        console.error("Failed to render expression:", err);
      });
    }
  }, [currentExpression, deviceType]);

  const statusText = useMemo(() => {
    if (isHumeConnected) {
      return isHumeSpeaking ? "音声感情解析中" : "音声待機中";
    }
    return isHumeInitializing ? "Hume AI接続中..." : "音声感情モード";
  }, [isHumeConnected, isHumeSpeaking, isHumeInitializing]);

  const error = humeError?.message || voiceError?.message;

  return (
    <RinaBoardView canvasRef={canvasRef}>
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
          {!micStarted && (
            <button
              onClick={() => setMicStarted(true)}
              style={{
                padding: "15px 30px",
                fontSize: "18px",
                backgroundColor: "#7DD3E8",
                color: "#1A1225",
                border: "none",
                cursor: "pointer",
                borderRadius: "8px",
                fontWeight: "bold",
                boxShadow: "0 4px 8px rgba(125, 211, 232, 0.4)",
              }}
            >
              マイクを起動
            </button>
          )}
          {micStarted && (
            <div style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
              <VoiceEmotionToggle
                isActive={micStarted}
                isConnected={isHumeConnected}
                isInitializing={isHumeInitializing}
                isSpeaking={isHumeSpeaking}
                onToggle={(active) => setMicStarted(active)}
              />
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
            </div>
          )}
          {error && (
            <p style={{ color: "#FF5A7E", fontSize: "14px", maxWidth: "300px" }}>{error}</p>
          )}
          {micStarted && <p style={{ fontSize: "12px", color: "#A89BBE" }}>{statusText}</p>}
        </div>
      </div>
    </RinaBoardView>
  );
}
