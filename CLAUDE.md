# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## プロジェクト概要

「璃奈ちゃんボード風 デジタルお面」- MediaPipeとReactを使用したリアルタイム表情認識Webアプリケーション。
スマートフォン/タブレットのカメラで顔を認識し、表情に応じてドット絵の表情が変化します。

## 開発コマンド

### 基本的な開発コマンド

```bash
# 開発サーバーを起動（http://localhost:5173）
npm run dev

# プロダクションビルド
npm run build

# プレビュー（ビルド後のプレビュー）
npm run preview

# リント実行
npm run lint

# コードフォーマット
npm run format

# フォーマットチェック（CIで使用）
npm run format:check
```

### テスト関連

```bash
# すべてのテストを実行
npm run test

# ユニットテストのみ実行
npm run test:unit

# 統合テストのみ実行
npm run test:integration

# ビジュアルテストのみ実行
npm run test:visual

# カバレッジレポートを生成
npm run test:coverage

# Watchモードでテスト実行
npm run test:watch
```

## アーキテクチャ

### 主要なディレクトリ構造

```
src/
├── engines/           # コア機能の実装
│   ├── mediapipe/    # MediaPipe Face Landmarker統合
│   └── renderer/     # Canvas 2Dドット絵レンダリング
├── hooks/            # Reactカスタムフック
├── types/            # TypeScript型定義
└── utils/            # ユーティリティ関数
```

### レイヤー構造

1. **検出レイヤー (engines/mediapipe)**
   - `FaceLandmarker.ts`: MediaPipe Face Landmarkerのラッパー
   - 478個の3Dランドマーク + 52個のBlendshapeを取得
   - ビデオストリームからリアルタイム顔検出

2. **変換レイヤー (utils)**
   - `blendshapeConverter.ts`: MediaPipeのBlendshapesを内部形式に変換
   - `expressionDetector.ts`: Blendshapesから10種類の表情を判定
   - 優先度ベースの表情判定ロジック

3. **レンダリングレイヤー (engines/renderer)**
   - `CanvasRenderer.ts`: Canvas 2Dでドット絵を描画
   - 差分レンダリングによる効率的な描画（表情変化時のみ再描画）
   - デバイスタイプ対応（スマホ: 目のみ、タブレット: 目+口）

4. **フックレイヤー (hooks)**
   - `useCamera.ts`: カメラアクセスとビデオストリーム管理
   - `useFaceDetection.ts`: MediaPipe統合とリアルタイム検出
   - `useDeviceType.ts`: レスポンシブ対応（画面幅ベース判定）

### パスエイリアス

`@/`は`./src/`へのエイリアスとして設定されています（vite.config.ts & tsconfig.app.json）。

```typescript
import { detectExpression } from "@/utils/expressionDetector";
import type { Expression } from "@/types/expression";
```

### 技術スタック

- **フレームワーク**: Vite 8.x + React 19.x + TypeScript 5.9
- **顔認識**: MediaPipe Face Landmarker (@mediapipe/tasks-vision ^0.10.32)
  - CDNから動的にWASMとモデルをロード
  - GPU delegate使用（WebGL/WebGPU）
- **レンダリング**: Canvas 2D（ピクセルアート風設定）
- **スタイリング**: Tailwind CSS 4.x
- **状態管理**: Zustand 5.x（将来的な状態管理用）
- **テスト**: Vitest 4.x + Testing Library

### 表情判定ロジック

`expressionDetector.ts`は10種類の表情を優先度順に判定します:

1. **blink** (まばたき) - 最優先: 両目が70%以上閉じている
2. **surprised** (驚き): 口が60%以上開き、眉が50%以上上がっている
3. **angry** (怒り): 眉が50%以上下がっている
4. **smug** (得意気/ウインク): 片目のみ60%以上閉じている
5. **smile** (笑顔): 口角が50%以上上がっている
6. **sad** (悲しみ): 口角が50%以上下がっている
7. **questioning** (疑問): 眉の外側が50%以上上がっている
8. **confused** (困惑): 眉の内側が40%以上上がり、口角は下がっていない
9. **embarrassed** (照れ): 軽い笑顔(30-60%)と眉の動き(20-50%)
10. **neutral** (通常): デフォルト

判定は優先度順に実行され、最初に`minConfidence`（デフォルト: 0.3）を超えた表情が採用されます。

## 開発ガイドライン

### MediaPipe統合時の注意点

- MediaPipeの初期化には数秒かかります（WASM + モデルのダウンロード）
- `FaceLandmarker`は必ず`initialize()`を呼んでから`detectFromVideo()`を使用
- ビデオの`currentTime`を追跡し、同じフレームの重複検出を防ぐ
- リソース解放時は必ず`dispose()`を呼ぶ

### レンダリング最適化

- `CanvasRenderer`は差分レンダリングを実装（同じ表情は再描画しない）
- `imageSmoothingEnabled: false`でピクセルアート風描画
- デバイスタイプに応じてドットパターンを切り替え

### TypeScript設定

- `strict: true`で厳格な型チェック
- `verbatimModuleSyntax: true`でimport/export構文の厳格化
- `erasableSyntaxOnly: true`（React 19の新機能）で型のみのインポートを自動最適化
- パスエイリアス`@/*`を使用して相対パス記述を削減

### テストの構造

- `test/unit/`: ユニットテスト（純粋関数のロジックテスト）
- `test/integration/`: 統合テスト（フック、コンポーネント連携）
- `test/visual/`: ビジュアルテスト（UI表示検証）
- `test/setup.ts`: Testing Libraryとjest-domの初期化

## 注意事項

- MediaPipeはCDNからリソースを取得するため、オフライン動作不可
- カメラアクセスにはHTTPS必須（localhostは例外）
- スマホでのリアカメラ使用時、至近距離（10-20cm）でも顔検出可能
- 表情判定の閾値は`expressionDetector.ts`でチューニング可能
