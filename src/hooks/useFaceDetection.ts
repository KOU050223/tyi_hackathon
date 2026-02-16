import { useEffect, useRef, useState, useCallback } from "react";
import { FaceLandmarker, type FaceDetectionResult } from "../engines/mediapipe/FaceLandmarker";

/**
 * useFaceDetection hookのオプション
 */
export interface UseFaceDetectionOptions {
  /**
   * ビデオ要素への参照
   */
  videoRef: React.RefObject<HTMLVideoElement | null>;

  /**
   * 顔検出を有効化するかどうか
   * デフォルト: true
   */
  enabled?: boolean;

  /**
   * 検出結果のコールバック（オプション）
   */
  onDetection?: (result: FaceDetectionResult) => void;

  /**
   * エラーハンドリングのコールバック（オプション）
   */
  onError?: (error: Error) => void;
}

/**
 * useFaceDetectionの戻り値
 */
export interface UseFaceDetectionReturn {
  /**
   * 最新の顔検出結果
   */
  result: FaceDetectionResult | null;

  /**
   * 初期化中かどうか
   */
  isInitializing: boolean;

  /**
   * 初期化済みかどうか
   */
  isInitialized: boolean;

  /**
   * エラー情報
   */
  error: Error | null;

  /**
   * 検出ループが実行中かどうか
   */
  isDetecting: boolean;

  /**
   * 手動で再初期化
   */
  reinitialize: () => Promise<void>;
}

/**
 * MediaPipe Face Landmarkerを使用した顔検出hook
 * ビデオストリームから継続的に顔を検出し、Blendshapesを取得します
 *
 * @example
 * ```tsx
 * const videoRef = useRef<HTMLVideoElement>(null);
 * const { result, isInitialized, error } = useFaceDetection({
 *   videoRef,
 *   enabled: true,
 *   onDetection: (result) => {
 *     if (result.detected && result.blendshapes) {
 *       console.log('Blendshapes:', result.blendshapes);
 *     }
 *   }
 * });
 * ```
 */
export function useFaceDetection({
  videoRef,
  enabled = true,
  onDetection,
  onError,
}: UseFaceDetectionOptions): UseFaceDetectionReturn {
  const [result, setResult] = useState<FaceDetectionResult | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [isDetecting, setIsDetecting] = useState(false);

  const faceLandmarkerRef = useRef<FaceLandmarker | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  /**
   * MediaPipe Face Landmarkerの初期化
   */
  const initialize = useCallback(async () => {
    if (faceLandmarkerRef.current?.isInitialized()) {
      return;
    }

    setIsInitializing(true);
    setError(null);

    try {
      const landmarker = new FaceLandmarker({
        numFaces: 1,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5,
        outputFaceBlendshapes: true,
      });

      await landmarker.initialize();
      faceLandmarkerRef.current = landmarker;
      setIsInitialized(true);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      onError?.(error);
      console.error("Failed to initialize FaceLandmarker:", error);
    } finally {
      setIsInitializing(false);
    }
  }, [onError]);

  /**
   * 検出ループ
   */
  const detectLoop = useCallback(() => {
    const video = videoRef.current;
    const landmarker = faceLandmarkerRef.current;

    if (!enabled || !video || !landmarker?.isInitialized()) {
      return;
    }

    try {
      // ビデオが再生中の場合のみ検出を実行
      if (video.readyState >= 2 && !video.paused && !video.ended) {
        const detectionResult = landmarker.detectFromVideo(video);
        setResult(detectionResult);
        onDetection?.(detectionResult);
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      console.error("Detection error:", error);
      setError(error);
      onError?.(error);
    }

    // 次のフレームをスケジュール
    animationFrameRef.current = requestAnimationFrame(detectLoop);
  }, [videoRef, enabled, onDetection, onError]);

  /**
   * 検出ループの開始
   */
  const startDetection = useCallback(() => {
    if (isDetecting) return;
    setIsDetecting(true);
    detectLoop();
  }, [detectLoop, isDetecting]);

  /**
   * 検出ループの停止
   */
  const stopDetection = useCallback(() => {
    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    setIsDetecting(false);
  }, []);

  /**
   * 再初期化
   */
  const reinitialize = useCallback(async () => {
    stopDetection();
    faceLandmarkerRef.current?.dispose();
    faceLandmarkerRef.current = null;
    setIsInitialized(false);
    setResult(null);
    await initialize();
  }, [initialize, stopDetection]);

  /**
   * 初期化処理
   */
  useEffect(() => {
    if (enabled && !isInitialized && !isInitializing) {
      initialize();
    }
  }, [enabled, isInitialized, isInitializing, initialize]);

  /**
   * 検出ループの開始/停止
   */
  useEffect(() => {
    if (enabled && isInitialized && !isDetecting) {
      startDetection();
    } else if (!enabled && isDetecting) {
      stopDetection();
    }
  }, [enabled, isInitialized, isDetecting, startDetection, stopDetection]);

  /**
   * クリーンアップ
   */
  useEffect(() => {
    return () => {
      stopDetection();
      faceLandmarkerRef.current?.dispose();
    };
  }, [stopDetection]);

  return {
    result,
    isInitializing,
    isInitialized,
    error,
    isDetecting,
    reinitialize,
  };
}
