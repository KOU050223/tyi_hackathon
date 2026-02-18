import { describe, it, expect } from "vitest";
import { ExpressionSmoother } from "@/utils/expressionSmoother";

describe("ExpressionSmoother", () => {
  it("初期状態はneutral", () => {
    const smoother = new ExpressionSmoother();
    const result = smoother.update({
      expression: "neutral",
      confidence: 1.0,
      isSpeaking: false,
      timestamp: 0,
    });
    expect(result).toBe("neutral");
  });

  it("発話中に表情が変わる", () => {
    const smoother = new ExpressionSmoother({ windowSize: 1, minDisplayTime: 0 });
    const result = smoother.update({
      expression: "smile",
      confidence: 0.8,
      isSpeaking: true,
      timestamp: 1000,
    });
    expect(result).toBe("smile");
  });

  it("最小表示時間内は表情が維持される", () => {
    const smoother = new ExpressionSmoother({
      windowSize: 1,
      minDisplayTime: 1500,
    });

    // smileに変更
    smoother.update({
      expression: "smile",
      confidence: 0.8,
      isSpeaking: true,
      timestamp: 1000,
    });

    // 500ms後にangryが来てもsmileを維持
    const result = smoother.update({
      expression: "angry",
      confidence: 0.5,
      isSpeaking: true,
      timestamp: 1500,
    });
    expect(result).toBe("smile");
  });

  it("最小表示時間内でも高信頼度なら上書きされる", () => {
    const smoother = new ExpressionSmoother({
      windowSize: 1,
      minDisplayTime: 1500,
    });

    smoother.update({
      expression: "smile",
      confidence: 0.5,
      isSpeaking: true,
      timestamp: 1000,
    });

    // 高信頼度（0.7超）のangryで上書き
    const result = smoother.update({
      expression: "angry",
      confidence: 0.9,
      isSpeaking: true,
      timestamp: 1500,
    });
    expect(result).toBe("angry");
  });

  it("最小表示時間経過後は表情が更新される", () => {
    const smoother = new ExpressionSmoother({
      windowSize: 1,
      minDisplayTime: 1500,
    });

    smoother.update({
      expression: "smile",
      confidence: 0.8,
      isSpeaking: true,
      timestamp: 1000,
    });

    // 2000ms後（1500ms経過）にangry
    const result = smoother.update({
      expression: "angry",
      confidence: 0.5,
      isSpeaking: true,
      timestamp: 3000,
    });
    expect(result).toBe("angry");
  });

  it("無音Decay: 発話停止後にdecayTimeout経過でneutralに戻る", () => {
    const smoother = new ExpressionSmoother({
      windowSize: 1,
      minDisplayTime: 0,
      decayTimeout: 2000,
    });

    // 発話中にsmile
    smoother.update({
      expression: "smile",
      confidence: 0.8,
      isSpeaking: true,
      timestamp: 1000,
    });

    // 発話停止、decayTimeout未満
    const result1 = smoother.update({
      expression: "smile",
      confidence: 0.8,
      isSpeaking: false,
      timestamp: 2500,
    });
    expect(result1).toBe("smile");

    // decayTimeout経過
    const result2 = smoother.update({
      expression: "smile",
      confidence: 0.8,
      isSpeaking: false,
      timestamp: 3500,
    });
    expect(result2).toBe("neutral");
  });

  it("移動平均: 3フレーム中2フレームがsmileならsmile", () => {
    const smoother = new ExpressionSmoother({
      windowSize: 3,
      minDisplayTime: 0,
      decayTimeout: 10000,
    });

    smoother.update({ expression: "smile", confidence: 0.8, isSpeaking: true, timestamp: 100 });
    smoother.update({ expression: "angry", confidence: 0.5, isSpeaking: true, timestamp: 200 });
    const result = smoother.update({
      expression: "smile",
      confidence: 0.7,
      isSpeaking: true,
      timestamp: 300,
    });
    expect(result).toBe("smile");
  });

  it("resetで初期状態に戻る", () => {
    const smoother = new ExpressionSmoother({ windowSize: 1, minDisplayTime: 0 });

    smoother.update({ expression: "angry", confidence: 0.8, isSpeaking: true, timestamp: 1000 });
    smoother.reset();

    const result = smoother.update({
      expression: "neutral",
      confidence: 1.0,
      isSpeaking: false,
      timestamp: 0,
    });
    expect(result).toBe("neutral");
  });
});
