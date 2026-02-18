import { describe, it, expect } from "vitest";
import {
  mapHumeEmotionsToExpression,
  emotionsToMap,
  type HumeEmotion,
} from "@/utils/humeEmotionMapper";

function makeEmotions(overrides: Record<string, number>): HumeEmotion[] {
  return Object.entries(overrides).map(([name, score]) => ({ name, score }));
}

describe("emotionsToMap", () => {
  it("空配列の場合は空のMapを返す", () => {
    const map = emotionsToMap([]);
    expect(map.size).toBe(0);
    expect(map.get("Joy")).toBeUndefined();
  });

  it("配列をMapに変換する", () => {
    const emotions: HumeEmotion[] = [
      { name: "Joy", score: 0.8 },
      { name: "Anger", score: 0.2 },
    ];
    const map = emotionsToMap(emotions);
    expect(map.get("Joy")).toBe(0.8);
    expect(map.get("Anger")).toBe(0.2);
    expect(map.get("Sadness")).toBeUndefined();
  });
});

describe("mapHumeEmotionsToExpression", () => {
  it("空配列の場合はneutralを返す", () => {
    const result = mapHumeEmotionsToExpression([]);
    expect(result.expression).toBe("neutral");
    expect(result.confidence).toBe(1.0);
  });

  it("全スコア低い場合はneutralを返す", () => {
    const result = mapHumeEmotionsToExpression(
      makeEmotions({ Joy: 0.01, Anger: 0.01, Sadness: 0.01 }),
    );
    expect(result.expression).toBe("neutral");
  });

  it("Joy高スコアでsmileを返す", () => {
    const result = mapHumeEmotionsToExpression(makeEmotions({ Joy: 0.15, Amusement: 0.05 }));
    expect(result.expression).toBe("smile");
  });

  it("Anger高スコアでangryを返す", () => {
    const result = mapHumeEmotionsToExpression(makeEmotions({ Anger: 0.15 }));
    expect(result.expression).toBe("angry");
  });

  it("Sadness高スコアでsadを返す", () => {
    const result = mapHumeEmotionsToExpression(
      makeEmotions({ Sadness: 0.12, Disappointment: 0.05 }),
    );
    expect(result.expression).toBe("sad");
  });

  it("Confusion高スコアでconfusedを返す", () => {
    const result = mapHumeEmotionsToExpression(makeEmotions({ Confusion: 0.2 }));
    expect(result.expression).toBe("confused");
  });

  it("Interest + Doubt でquestioningを返す", () => {
    const result = mapHumeEmotionsToExpression(makeEmotions({ Interest: 0.1, Doubt: 0.08 }));
    expect(result.expression).toBe("questioning");
  });

  it("複数グループが閾値超えの場合、合算スコアが最も高い表情を返す", () => {
    const result = mapHumeEmotionsToExpression(
      makeEmotions({
        Confusion: 0.15,
        Interest: 0.25,
        Doubt: 0.1,
        Contemplation: 0.05,
      }),
    );
    // questioning合算: 0.25+0.1+0.05 = 0.40 > confused合算: 0.15
    expect(result.expression).toBe("questioning");
  });

  it("Triumph高スコアでsmugを返す", () => {
    // 閾値0.08に対して合算0.15で十分なマージンを確保
    const result = mapHumeEmotionsToExpression(makeEmotions({ Triumph: 0.1, Pride: 0.05 }));
    expect(result.expression).toBe("smug");
  });

  it("Embarrassment高スコアでembarrassedを返す", () => {
    // 閾値0.08に対して合算0.15で十分なマージンを確保
    const result = mapHumeEmotionsToExpression(makeEmotions({ Embarrassment: 0.1, Shame: 0.05 }));
    expect(result.expression).toBe("embarrassed");
  });

  it("confidenceは1.0を超えない", () => {
    const result = mapHumeEmotionsToExpression(
      makeEmotions({ Joy: 0.5, Amusement: 0.4, Excitement: 0.3, Contentment: 0.2, Love: 0.1 }),
    );
    expect(result.expression).toBe("smile");
    expect(result.confidence).toBeLessThanOrEqual(1.0);
  });

  it("実際のprosodyレスポンスに近いスコア分布で正しく判定する", () => {
    // 実際のログ: Confusion: 0.321, Interest: 0.183, Doubt: 0.136
    const result = mapHumeEmotionsToExpression(
      makeEmotions({
        Confusion: 0.321,
        Interest: 0.183,
        Doubt: 0.136,
        Contemplation: 0.069,
        Calmness: 0.054,
      }),
    );
    // questioning合算: 0.183+0.136+0.069 = 0.388
    // confused合算: 0.321
    // questioningが高い
    expect(result.expression).toBe("questioning");
  });
});
