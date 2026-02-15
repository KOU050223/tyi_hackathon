import { useState, useEffect, useRef } from "react";

interface UseCameraReturn {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  stream: MediaStream | null;
  isReady: boolean;
  error: string | null;
  startCamera: () => Promise<void>;
  stopCamera: () => void;
}

/**
 * カメラアクセスと制御を管理するhook
 *
 * @returns カメラ制御用のオブジェクト
 */
export const useCamera = (): UseCameraReturn => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startCamera = async () => {
    try {
      setError(null);

      // リアカメラを優先的に使用
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: "environment", // リアカメラ
          width: { ideal: 640 },
          height: { ideal: 480 },
        },
        audio: false,
      };

      const mediaStream =
        await navigator.mediaDevices.getUserMedia(constraints);
      setStream(mediaStream);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        await videoRef.current.play();
        setIsReady(true);
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "カメラアクセスに失敗しました";
      setError(errorMessage);
      console.error("Camera access error:", err);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
      setIsReady(false);
    }
  };

  // コンポーネントのアンマウント時にカメラを停止
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stream]);

  return {
    videoRef,
    stream,
    isReady,
    error,
    startCamera,
    stopCamera,
  };
};
