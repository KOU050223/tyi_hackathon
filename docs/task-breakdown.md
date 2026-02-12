# タスク分解 - デジタルお面プロジェクト

このドキュメントは、Phase 1 MVPの完成に向けたタスク分解です。

## 完了済みタスク ✅

- ✅ プロジェクトセットアップ（Vite + React + TypeScript）
- ✅ 基本的なプロジェクト構造の作成
- ✅ カメラアクセス実装（useCamera hook）
- ✅ デバイスタイプ検出（useDeviceType hook）
- ✅ Canvas 2Dレンダリングエンジン
- ✅ 基本4種類のドット絵パターン（neutral, smile, surprised, blink）
- ✅ 日本語UIの実装

## 並行作業可能なタスク 🔄

### タスク #1: MediaPipe Face Landmarkerの統合とモデルファイル配置
**優先度: 高** | **担当: mediapipe-specialist**

#### 実装内容
- MediaPipeモデルファイル（face_landmarker.task）をpublic/models/に配置
- FaceLandmarker.tsのラッパークラス作成
- useFaceDetection hookの実装
  - MediaPipeの初期化
  - ビデオフレームからの顔検出
  - Blendshapes（52種類）の取得
  - エラーハンドリング

#### 成果物
- `src/engines/mediapipe/FaceLandmarker.ts`
- `src/engines/mediapipe/blendshapes.ts`
- `src/hooks/useFaceDetection.ts`
- `public/models/face_landmarker.task`

#### 技術的詳細
- @mediapipe/tasks-vision ^0.10.18を使用
- runningMode: 'VIDEO'で設定
- outputFaceBlendshapes: trueで有効化
- 検出結果の型安全性を確保

---

### タスク #2: 表情判定アルゴリズム（expressionDetector）の実装
**優先度: 高** | **担当: algorithm-developer**

#### 実装内容
- src/utils/expressionDetector.ts の作成
- 10種類の表情判定ロジック
  - **neutral（通常）**: デフォルト状態
  - **smile（笑顔）**: mouthSmileLeft/Right > 0.5
  - **surprised（驚き）**: jawOpen > 0.6 && browInnerUp > 0.5
  - **blink（まばたき）**: eyeBlinkLeft/Right > 0.7
  - **sad（悲しみ）**: mouthFrownLeft/Right > 0.5
  - **angry（怒り）**: browDownLeft/Right > 0.5
  - **confused（困惑）**: browInnerUp > 0.4 && mouthFrown < 0.3
  - **smug（得意気）**: eyeWideLeft !== eyeWideRight（ウインク）
  - **questioning（疑問）**: browOuterUp > 0.5（片眉上昇）
  - **embarrassed（照れ）**: 特定の組み合わせ

#### 成果物
- `src/utils/expressionDetector.ts`
- `test/unit/expressionDetector.test.ts`（ユニットテスト）

#### 技術的詳細
- Blendshape閾値の調整
- 複合条件の実装（例: 笑顔 = 口角上昇 + 目の形）
- 信頼度フィルタリング（低信頼度データの除外）

---

### タスク #3: 残りの表情パターン（6種類）のドット絵デザイン
**優先度: 中** | **担当: ui-designer**

#### 実装内容
- src/utils/dotPatterns.ts に以下を追加
  - **sad（悲しみ）**: 目が下がり、口が下向き（色: #4444FF 青系）
  - **angry（怒り）**: 眉が下がり、目が鋭く（色: #FF0000 赤）
  - **confused（困惑）**: 眉が八の字、目が点（色: #FFAA00 オレンジ）
  - **smug（得意気）**: 片目ウインク、口角上昇（色: #FF00FF マゼンタ）
  - **questioning（疑問）**: 片眉上昇、目が丸く（色: #00FFFF シアン）
  - **embarrassed（照れ）**: 目が点、頬に斜線（色: #FFAAAA ピンク）

#### デザイン要件
- スマホ用（目のみ）とタブレット用（目+口）の両方
- 12x6～12x11のグリッドサイズ
- ピクセルアート風のシンプルなデザイン
- 各表情に合った色を設定

#### 成果物
- `dotPatterns.ts`の更新
- `test/visual/dotPattern.visual.test.ts`（視覚的テスト）

---

### タスク #5: ユニットテストと統合テストの作成
**優先度: 中** | **担当: test-engineer**

#### 実装内容
- ユニットテスト
  - `test/unit/expressionDetector.test.ts`
  - `test/unit/dotPatterns.test.ts`
  - `test/unit/cameraOptimizer.test.ts`（Phase 2用）
- 統合テスト
  - `test/integration/faceDetection.test.tsx`
  - `test/integration/rendering.test.tsx`
- フィクスチャ
  - `test/fixtures/mock-video-stream.ts`
  - `test/fixtures/mock-landmarks.json`
  - `test/fixtures/mock-blendshapes.json`

#### 成果物
- 各テストファイル
- Vitestの設定調整
- カバレッジレポート

#### 技術的詳細
- Vitestでのモック化
- Testing Libraryでのコンポーネントテスト
- カバレッジ目標: 80%以上

---

### タスク #6: デバッグパネルの実装
**優先度: 低** | **担当: developer**

#### 実装内容
- src/components/DebugPanel.tsx の作成
- 表示情報
  - FPS（フレームレート）
  - 遅延時間（ms）
  - 検出されたランドマーク数
  - 主要なBlendshape値（10種類）
  - 現在の表情
  - デバイスタイプ
- Canvas上へのランドマーク可視化（オプション）
- 開発モード時のみ表示

#### 成果物
- `src/components/DebugPanel.tsx`
- `src/utils/performance.ts`（パフォーマンス測定）

#### 技術的詳細
- performance.now()でFPS計測
- Blendshape値のリアルタイム表示
- トグル表示機能

---

## 依存関係のあるタスク 🔗

### タスク #4: リアルタイム表情認識とレンダリングの統合
**優先度: 最高** | **担当: team-lead**
**依存: タスク #1, #2 完了後**

#### 実装内容
- App.tsxの更新
  - デモモードの削除
  - useFaceDetection hookの統合
  - useExpressionMapper hookの作成
  - requestAnimationFrameでのレンダリングループ
- パフォーマンス最適化
  - 60fps維持
  - 遅延100ms以下を目標

#### 成果物
- `src/App.tsx`（更新）
- `src/hooks/useExpressionMapper.ts`
- `src/hooks/useRenderer.ts`

#### 技術的詳細
- ビデオフレーム → MediaPipe → Blendshapes → 表情判定 → Canvas描画
- フレームレート制御
- メモリリーク対策

---

## 作業の流れ

### 第1フェーズ（並行作業可能）
1. **タスク #1**: MediaPipe統合 ← mediapipe-specialist
2. **タスク #2**: 表情判定ロジック ← algorithm-developer
3. **タスク #3**: ドット絵デザイン ← ui-designer
4. **タスク #5**: テスト作成 ← test-engineer
5. **タスク #6**: デバッグパネル ← developer

### 第2フェーズ（統合）
6. **タスク #4**: リアルタイム統合 ← team-lead（タスク#1,#2完了後）

---

## 推定作業時間

| タスク | 作業時間 | 優先度 |
|--------|----------|--------|
| #1 MediaPipe統合 | 2-3時間 | 高 |
| #2 表情判定アルゴリズム | 1-2時間 | 高 |
| #3 ドット絵デザイン | 2-3時間 | 中 |
| #4 リアルタイム統合 | 2-3時間 | 最高 |
| #5 テスト作成 | 3-4時間 | 中 |
| #6 デバッグパネル | 1-2時間 | 低 |

**合計推定時間**: 11-17時間
**並行作業時の推定時間**: 5-8時間

---

## 次のステップ

1. チームメンバーに各タスクをアサイン
2. 並行作業可能なタスク（#1,#2,#3,#5,#6）を同時開始
3. タスク#1,#2が完了したらタスク#4（統合）を開始
4. 全タスク完了後、Phase 1 MVP完成！
