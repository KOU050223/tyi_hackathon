/**
 * 音声認識機能の型定義
 */

/**
 * 音声認識の状態
 */
export type SpeechRecognitionState =
  | "idle"
  | "listening"
  | "wake-word-detected"
  | "processing"
  | "error";

/**
 * 音声認識エラーの種類
 */
export type SpeechRecognitionErrorType =
  | "not-supported"
  | "permission-denied"
  | "no-speech"
  | "network"
  | "audio-capture"
  | "aborted"
  | "unknown";

/**
 * 音声認識エラー
 */
export interface SpeechRecognitionError {
  type: SpeechRecognitionErrorType;
  message: string;
}

/**
 * 音声コマンドのアクション型
 */
export type VoiceCommandActionType = "navigate" | "callback";

/**
 * ナビゲーションアクション
 */
export interface NavigateAction {
  type: "navigate";
  path: string;
}

/**
 * コールバックアクション
 */
export interface CallbackAction {
  type: "callback";
  callback: () => void | Promise<void>;
}

/**
 * 音声コマンドのアクション
 */
export type VoiceCommandAction = NavigateAction | CallbackAction;

/**
 * コマンドマッチタイプ
 */
export type CommandMatchType = "exact" | "partial" | "fuzzy";

/**
 * 音声コマンド定義
 */
export interface VoiceCommand {
  /** コマンドID（一意） */
  id: string;
  /** マッチパターン（複数指定可能） */
  patterns: string[];
  /** 実行するアクション */
  action: VoiceCommandAction;
  /** マッチタイプ（デフォルト: partial） */
  matchType?: CommandMatchType;
  /** 説明（オプション） */
  description?: string;
}

/**
 * ウェイクワード設定
 */
export interface WakeWordConfig {
  /** ウェイクワード（複数指定可能） */
  keywords: string[];
  /** コマンド受付時間（ミリ秒） */
  commandTimeout: number;
  /** ウェイクワード検出の最小信頼度 */
  minConfidence: number;
}

/**
 * 音声認識結果
 */
export interface RecognitionResult {
  /** 認識されたテキスト */
  transcript: string;
  /** 信頼度（0.0-1.0） */
  confidence: number;
  /** 暫定結果かどうか */
  isFinal: boolean;
  /** マッチしたコマンド（あれば） */
  matchedCommand?: VoiceCommand;
  /** マッチした信頼度（0.0-1.0） */
  matchConfidence?: number;
}

/**
 * Web Speech API - SpeechRecognition型拡張
 * （TypeScriptの標準定義にない型を補完）
 */
export interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

export interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

export interface SpeechRecognitionResult {
  isFinal: boolean;
  length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

export interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

export interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message: string;
}

/**
 * Web Speech API - SpeechRecognitionインターフェース
 */
export interface ISpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  start(): void;
  stop(): void;
  abort(): void;
  onstart: ((this: ISpeechRecognition, ev: Event) => void) | null;
  onend: ((this: ISpeechRecognition, ev: Event) => void) | null;
  onerror: ((this: ISpeechRecognition, ev: SpeechRecognitionErrorEvent) => void) | null;
  onresult: ((this: ISpeechRecognition, ev: SpeechRecognitionEvent) => void) | null;
}

/**
 * SpeechRecognitionコンストラクタ型
 */
export interface ISpeechRecognitionConstructor {
  new (): ISpeechRecognition;
}

/**
 * Windowオブジェクトの拡張（Web Speech API）
 */
declare global {
  interface Window {
    SpeechRecognition?: ISpeechRecognitionConstructor;
    webkitSpeechRecognition?: ISpeechRecognitionConstructor;
  }
}
