import { useEffect, useRef, useState, useCallback } from "react";
import { HumeStreamClient } from "@/engines/hume/HumeStreamClient";
import { MicrophoneCapture } from "@/engines/hume/MicrophoneCapture";
import { mapHumeEmotionsToExpression } from "@/utils/humeEmotionMapper";
import { ExpressionSmoother } from "@/utils/expressionSmoother";
import type { Expression } from "@/types/expression";

export interface UseHumeEmotionOptions {
  enabled: boolean;
  onExpressionChange?: (expression: Expression, confidence: number) => void;
  onError?: (error: Error) => void;
}

export interface UseHumeEmotionReturn {
  expression: Expression;
  confidence: number;
  isConnected: boolean;
  isInitializing: boolean;
  isSpeaking: boolean;
  error: Error | null;
  reconnect: () => void;
}

const TOKEN_ENDPOINT = import.meta.env.VITE_HUME_TOKEN_ENDPOINT ?? "/api/hume/token";

async function fetchApiKey(): Promise<string> {
  const response = await fetch(TOKEN_ENDPOINT, { method: "POST" });
  const data: unknown = await response.json();
  if (!response.ok) {
    throw new Error(`Failed to fetch Hume API key: ${response.status} ${JSON.stringify(data)}`);
  }
  if (
    typeof data !== "object" ||
    data === null ||
    !("apiKey" in data) ||
    typeof (data as { apiKey: unknown }).apiKey !== "string"
  ) {
    throw new Error(`Invalid API key response: ${JSON.stringify(data)}`);
  }
  return (data as { apiKey: string }).apiKey;
}

export function useHumeEmotion(options: UseHumeEmotionOptions): UseHumeEmotionReturn {
  const { enabled, onExpressionChange, onError } = options;

  const [expression, setExpression] = useState<Expression>("neutral");
  const [confidence, setConfidence] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const streamClientRef = useRef<HumeStreamClient | null>(null);
  const micCaptureRef = useRef<MicrophoneCapture | null>(null);
  const smootherRef = useRef<ExpressionSmoother>(new ExpressionSmoother());
  const onExpressionChangeRef = useRef(onExpressionChange);
  const onErrorRef = useRef(onError);
  const isSpeakingRef = useRef(false);

  // コールバックrefを最新に保つ
  useEffect(() => {
    onExpressionChangeRef.current = onExpressionChange;
  }, [onExpressionChange]);

  useEffect(() => {
    onErrorRef.current = onError;
  }, [onError]);

  const cleanup = useCallback(() => {
    micCaptureRef.current?.stop();
    micCaptureRef.current = null;
    streamClientRef.current?.disconnect();
    streamClientRef.current = null;
    smootherRef.current.reset();
    setIsConnected(false);
    setIsInitializing(false);
    setIsSpeaking(false);
    isSpeakingRef.current = false;
  }, []);

  const initialize = useCallback(async () => {
    cleanup();
    setError(null);
    setIsInitializing(true);

    try {
      const apiKey = await fetchApiKey();

      const client = new HumeStreamClient({
        apiKey,
        onResult: (result) => {
          const mapped = mapHumeEmotionsToExpression(result.emotions);
          if (import.meta.env.DEV) {
            console.log(
              "[Hume] Mapped expression:",
              mapped.expression,
              "confidence:",
              mapped.confidence.toFixed(3),
            );
          }
          const smoothed = smootherRef.current.update({
            expression: mapped.expression,
            confidence: mapped.confidence,
            isSpeaking: isSpeakingRef.current,
            timestamp: result.timestamp,
          });

          setExpression(smoothed);
          setConfidence(mapped.confidence);
          onExpressionChangeRef.current?.(smoothed, mapped.confidence);
        },
        onError: (err) => {
          setError(err);
          onErrorRef.current?.(err);
        },
        onConnectionChange: (connected) => {
          setIsConnected(connected);
          if (connected) {
            setIsInitializing(false);
          }
        },
      });

      const mic = new MicrophoneCapture({
        onAudioChunk: (base64) => {
          client.sendAudio(base64);
        },
        onSpeakingChange: (speaking) => {
          isSpeakingRef.current = speaking;
          setIsSpeaking(speaking);
        },
      });

      streamClientRef.current = client;
      micCaptureRef.current = mic;

      client.connect();
      await mic.start();
    } catch (err) {
      // mic.start()失敗時にclient.connect()済みのWebSocketをリークさせない
      streamClientRef.current?.disconnect();
      streamClientRef.current = null;
      micCaptureRef.current = null;
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      onErrorRef.current?.(error);
      setIsInitializing(false);
    }
  }, [cleanup]);

  // enabled切り替えで初期化/クリーンアップ
  useEffect(() => {
    if (enabled) {
      initialize();
    } else {
      cleanup();
      setExpression("neutral");
      setConfidence(0);
    }

    return cleanup;
  }, [enabled, initialize, cleanup]);

  const reconnect = useCallback(() => {
    if (enabled) {
      initialize();
    }
  }, [enabled, initialize]);

  return {
    expression,
    confidence,
    isConnected,
    isInitializing,
    isSpeaking,
    error,
    reconnect,
  };
}
