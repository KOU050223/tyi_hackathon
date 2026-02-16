/**
 * useSpeechRecognitionの統合テスト
 *
 * 注: Web Speech APIはブラウザネイティブAPIのため、完全なモック化は困難です。
 * このテストは基本的なフックの動作のみを確認します。
 * 実際の音声認識機能は実機でのE2Eテストで確認する必要があります。
 */

import { describe, it, expect, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";

describe("useSpeechRecognition", () => {
  it("初期状態がidleである", () => {
    const { result } = renderHook(() => useSpeechRecognition());
    expect(result.current.state).toBe("idle");
    expect(result.current.isListening).toBe(false);
    expect(result.current.transcript).toBe("");
  });

  it("ブラウザサポートを検出する", () => {
    const { result } = renderHook(() => useSpeechRecognition());
    // JSDOMではWeb Speech APIはサポートされないため、false
    expect(result.current.isSupported).toBe(false);
  });

  it("フックが正しいインターフェースを返す", () => {
    const { result } = renderHook(() => useSpeechRecognition());

    // 必要なプロパティがすべて存在するか確認
    expect(result.current).toHaveProperty("state");
    expect(result.current).toHaveProperty("transcript");
    expect(result.current).toHaveProperty("isListening");
    expect(result.current).toHaveProperty("isSupported");
    expect(result.current).toHaveProperty("error");
    expect(result.current).toHaveProperty("startListening");
    expect(result.current).toHaveProperty("stopListening");
    expect(result.current).toHaveProperty("isWaitingForCommand");
    expect(result.current).toHaveProperty("commandTimeRemaining");

    // 関数型であることを確認
    expect(typeof result.current.startListening).toBe("function");
    expect(typeof result.current.stopListening).toBe("function");

    // 型のチェック
    expect(typeof result.current.isWaitingForCommand).toBe("boolean");
    expect(typeof result.current.commandTimeRemaining === "number" || result.current.commandTimeRemaining === null).toBe(true);
  });

  it("オプションが正しく受け入れられる", () => {
    const onResult = vi.fn();
    const onError = vi.fn();
    const onStateChange = vi.fn();

    const { result } = renderHook(() =>
      useSpeechRecognition({
        enabled: false,
        continuous: true,
        interimResults: true,
        lang: "ja-JP",
        onResult,
        onError,
        onStateChange,
      }),
    );

    // フックが初期化されることを確認
    expect(result.current.state).toBe("idle");
  });

  it("enabledがfalseの場合は自動開始しない", () => {
    const { result } = renderHook(() =>
      useSpeechRecognition({
        enabled: false,
      }),
    );

    expect(result.current.isListening).toBe(false);
    expect(result.current.state).toBe("idle");
  });
});
