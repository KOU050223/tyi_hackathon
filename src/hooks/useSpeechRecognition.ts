/**
 * Web Speech APIをラップする音声認識フック
 */

import { useEffect, useRef, useState, useCallback } from "react";
import type {
  SpeechRecognitionState,
  SpeechRecognitionError,
  RecognitionResult,
  ISpeechRecognition,
  ISpeechRecognitionConstructor,
  SpeechRecognitionEvent,
  SpeechRecognitionErrorEvent,
  WakeWordConfig,
} from "@/types/voice";
import { matchVoiceCommand, detectWakeWord } from "@/utils/voiceCommandMatcher";

/**
 * useSpeechRecognitionのオプション
 */
export interface UseSpeechRecognitionOptions {
  /** 音声認識を有効にするか */
  enabled?: boolean;
  /** 継続的リスニング */
  continuous?: boolean;
  /** 暫定結果を取得するか */
  interimResults?: boolean;
  /** 言語設定 */
  lang?: string;
  /** 最大代替候補数 */
  maxAlternatives?: number;
  /** 認識結果のコールバック */
  onResult?: (result: RecognitionResult) => void;
  /** エラーコールバック */
  onError?: (error: SpeechRecognitionError) => void;
  /** 状態変更コールバック */
  onStateChange?: (state: SpeechRecognitionState) => void;
  /** コマンドマッチングの最小信頼度 */
  minCommandConfidence?: number;
  /** ウェイクワード検出を有効にするか */
  wakeWordEnabled?: boolean;
  /** ウェイクワード設定 */
  wakeWordConfig?: WakeWordConfig;
  /** ウェイクワード検出時のコールバック */
  onWakeWordDetected?: () => void;
}

/**
 * useSpeechRecognitionの返り値
 */
export interface UseSpeechRecognitionReturn {
  /** 現在の状態 */
  state: SpeechRecognitionState;
  /** 最新の認識テキスト */
  transcript: string;
  /** リスニング中かどうか */
  isListening: boolean;
  /** ブラウザがサポートしているか */
  isSupported: boolean;
  /** エラーメッセージ */
  error: SpeechRecognitionError | null;
  /** 認識開始 */
  startListening: () => void;
  /** 認識停止 */
  stopListening: () => void;
  /** ウェイクワード検出後のコマンド待機中 */
  isWaitingForCommand: boolean;
  /** コマンド受付残り時間（ミリ秒、null=非待機中） */
  commandTimeRemaining: number | null;
}

/**
 * Web Speech APIがサポートされているかチェック
 */
function getSpeechRecognition(): ISpeechRecognitionConstructor | null {
  if (typeof window === "undefined") return null;
  return window.SpeechRecognition || window.webkitSpeechRecognition || null;
}

/**
 * 音声認識フック
 */
export function useSpeechRecognition(
  options: UseSpeechRecognitionOptions = {}
): UseSpeechRecognitionReturn {
  const {
    enabled = false,
    continuous = true,
    interimResults = true,
    lang = "ja-JP",
    maxAlternatives = 1,
    onResult,
    onError,
    onStateChange,
    minCommandConfidence = 0.7,
    wakeWordEnabled = false,
    wakeWordConfig,
    onWakeWordDetected,
  } = options;

  const [state, setState] = useState<SpeechRecognitionState>("idle");
  const [transcript, setTranscript] = useState<string>("");
  const [error, setError] = useState<SpeechRecognitionError | null>(null);
  const [isWaitingForCommand, setIsWaitingForCommand] = useState<boolean>(false);
  const [commandTimeRemaining, setCommandTimeRemaining] = useState<number | null>(null);

  const recognitionRef = useRef<ISpeechRecognition | null>(null);
  const isListeningRef = useRef<boolean>(false);
  const commandTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdownIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ブラウザサポートチェック
  const SpeechRecognitionConstructor = getSpeechRecognition();
  const isSupported = SpeechRecognitionConstructor !== null;

  /**
   * 状態更新（コールバック付き)
   */
  const updateState = useCallback(
    (newState: SpeechRecognitionState) => {
      setState(newState);
      onStateChange?.(newState);
    },
    [onStateChange]
  );

  /**
   * エラーハンドリング
   */
  const handleError = useCallback(
    (errorType: SpeechRecognitionError["type"], message: string) => {
      const errorObj: SpeechRecognitionError = { type: errorType, message };
      setError(errorObj);
      updateState("error");
      onError?.(errorObj);
    },
    [onError, updateState]
  );

  /**
   * 認識開始
   */
  const startListening = useCallback(() => {
    if (!isSupported) {
      handleError("not-supported", "Web Speech APIはこのブラウザでサポートされていません");
      return;
    }

    if (isListeningRef.current) {
      console.warn("Already listening");
      return;
    }

    try {
      if (!recognitionRef.current) {
        const recognition = new SpeechRecognitionConstructor();
        recognition.continuous = continuous;
        recognition.interimResults = interimResults;
        recognition.lang = lang;
        recognition.maxAlternatives = maxAlternatives;

        // イベントハンドラ設定
        recognition.onstart = () => {
          isListeningRef.current = true;
          updateState("listening");
          setError(null);
        };

        recognition.onend = () => {
          isListeningRef.current = false;
          if (state !== "error") {
            updateState("idle");
          }

          // 継続的リスニングが有効で、enabledがtrueなら自動再開
          if (continuous && enabled && state !== "error") {
            setTimeout(() => {
              if (enabled && !isListeningRef.current) {
                startListening();
              }
            }, 100);
          }
        };

        recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
          isListeningRef.current = false;

          switch (event.error) {
            case "not-allowed":
            case "service-not-allowed":
              handleError("permission-denied", "マイクへのアクセスが拒否されました");
              break;
            case "no-speech":
              handleError("no-speech", "音声が検出されませんでした");
              // no-speechエラーは自動再開
              if (continuous && enabled) {
                setTimeout(() => {
                  if (enabled && !isListeningRef.current) {
                    startListening();
                  }
                }, 1000);
              }
              break;
            case "network":
              handleError("network", "ネットワークエラーが発生しました");
              break;
            case "audio-capture":
              handleError("audio-capture", "マイクが見つかりません");
              break;
            case "aborted":
              handleError("aborted", "音声認識が中断されました");
              break;
            default:
              handleError("unknown", `音声認識エラー: ${event.error}`);
          }
        };

        recognition.onresult = (event: SpeechRecognitionEvent) => {
          updateState("processing");

          // 最新の結果を取得
          const lastResultIndex = event.results.length - 1;
          const lastResult = event.results[lastResultIndex];
          const alternative = lastResult[0];

          const currentTranscript = alternative.transcript;
          const confidence = alternative.confidence;
          const isFinal = lastResult.isFinal;

          setTranscript(currentTranscript);

          // デバッグログ: 認識結果を常に出力
          console.log(`[音声認識] テキスト: "${currentTranscript}" | 信頼度: ${confidence.toFixed(2)} | 確定: ${isFinal ? "✓" : "×"}`);

          // ウェイクワードモードが有効な場合
          if (wakeWordEnabled) {
            // まだウェイクワードを待っている状態
            if (!isWaitingForCommand) {
              const wakeWordResult = detectWakeWord(currentTranscript, wakeWordConfig);

              // デバッグログ: ウェイクワード判定結果
              console.log(`[ウェイクワード判定] 検出: ${wakeWordResult.detected ? "✓" : "×"} | 信頼度: ${wakeWordResult.confidence.toFixed(2)}`);

              // ウェイクワード検出（isFinalでなくても反応するように変更）
              if (wakeWordResult.detected) {
                // ウェイクワード検出！
                console.log("🎯 ウェイクワード検出成功!", currentTranscript);
                setIsWaitingForCommand(true);
                updateState("wake-word-detected");
                onWakeWordDetected?.();

                // カウントダウン開始
                const timeout = wakeWordConfig?.commandTimeout || 3000;
                setCommandTimeRemaining(timeout);

                // 100ms毎にカウントダウン更新
                countdownIntervalRef.current = setInterval(() => {
                  setCommandTimeRemaining((prev) => {
                    if (prev === null || prev <= 100) {
                      return null;
                    }
                    return prev - 100;
                  });
                }, 100);

                // タイムアウトを設定（3秒後に自動リセット）
                commandTimeoutRef.current = setTimeout(() => {
                  console.log("コマンド受付タイムアウト");
                  setIsWaitingForCommand(false);
                  setCommandTimeRemaining(null);
                  updateState("listening");
                  if (countdownIntervalRef.current) {
                    clearInterval(countdownIntervalRef.current);
                    countdownIntervalRef.current = null;
                  }
                }, timeout);

                return; // ウェイクワードだけでは何もしない
              }
            } else {
              // ウェイクワード検出済み、コマンド待機中
              const matchResult = matchVoiceCommand(currentTranscript, minCommandConfidence);

              // デバッグログ: コマンド判定結果
              if (matchResult) {
                console.log(`[コマンド判定] マッチ: ✓ "${matchResult.command.id}" | 信頼度: ${matchResult.confidence.toFixed(2)}`);
              } else {
                console.log(`[コマンド判定] マッチ: × | テキスト: "${currentTranscript}"`);
              }

              if (matchResult && isFinal) {
                // コマンド検出！タイマーをクリア
                console.log("🚀 コマンド実行:", matchResult.command.id, "→", currentTranscript);
                if (commandTimeoutRef.current) {
                  clearTimeout(commandTimeoutRef.current);
                  commandTimeoutRef.current = null;
                }
                if (countdownIntervalRef.current) {
                  clearInterval(countdownIntervalRef.current);
                  countdownIntervalRef.current = null;
                }

                setIsWaitingForCommand(false);
                setCommandTimeRemaining(null);

                const result: RecognitionResult = {
                  transcript: currentTranscript,
                  confidence,
                  isFinal,
                  matchedCommand: matchResult.command,
                  matchConfidence: matchResult.confidence,
                };

                onResult?.(result);
                updateState("listening");
                return;
              }
            }

            // 最終結果でない場合は現在の状態を維持
            if (!isFinal) {
              if (isWaitingForCommand) {
                updateState("wake-word-detected");
              } else {
                updateState("listening");
              }
            }
          } else {
            // ウェイクワードモード無効時は従来通り
            const matchResult = matchVoiceCommand(currentTranscript, minCommandConfidence);

            const result: RecognitionResult = {
              transcript: currentTranscript,
              confidence,
              isFinal,
              matchedCommand: matchResult?.command,
              matchConfidence: matchResult?.confidence,
            };

            // コールバック実行
            onResult?.(result);

            // 最終結果でない場合はリスニング状態に戻す
            if (!isFinal) {
              updateState("listening");
            }
          }
        };

        recognitionRef.current = recognition;
      }

      recognitionRef.current.start();
    } catch (err) {
      handleError("unknown", `音声認識の開始に失敗しました: ${String(err)}`);
    }
  }, [
    isSupported,
    SpeechRecognitionConstructor,
    continuous,
    interimResults,
    lang,
    maxAlternatives,
    enabled,
    state,
    onResult,
    minCommandConfidence,
    updateState,
    handleError,
  ]);

  /**
   * 認識停止
   */
  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListeningRef.current) {
      recognitionRef.current.stop();
      isListeningRef.current = false;
    }
  }, []);

  /**
   * enabledフラグによる自動開始/停止
   */
  useEffect(() => {
    if (enabled && !isListeningRef.current && state === "idle") {
      startListening();
    } else if (!enabled && isListeningRef.current) {
      stopListening();
    }
  }, [enabled, state, startListening, stopListening]);

  /**
   * クリーンアップ
   */
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
        recognitionRef.current = null;
      }
      if (commandTimeoutRef.current) {
        clearTimeout(commandTimeoutRef.current);
        commandTimeoutRef.current = null;
      }
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
        countdownIntervalRef.current = null;
      }
    };
  }, []);

  return {
    state,
    transcript,
    isListening: isListeningRef.current,
    isSupported,
    error,
    startListening,
    stopListening,
    isWaitingForCommand,
    commandTimeRemaining,
  };
}
