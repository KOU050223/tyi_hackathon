# 璃奈ちゃんボード風 デジタルお面

リアルタイム表情連動デジタルお面 - Web技術で実現する「ラブライブ！」璃奈ちゃんボード風アプリ

## 🎯 概要

このプロジェクトは、アニメ『ラブライブ！虹ヶ咲学園スクールアイドル同好会』に登場する「璃奈ちゃんボード」にインスパイアされた、リアルタイム表情認識デジタルお面Webアプリです。

スマートフォンやタブレットのカメラで顔を認識し、表情に応じてドット絵の表情が変化します。

## ✨ 特徴

- 🎥 **リアルタイム顔認識**: MediaPipe Face Landmarkerによる高精度な顔検出
- 😊 **10種類の表情判定**: 笑顔、驚き、怒り、悲しみなど、豊かな表情表現
- 🎨 **ピクセルアートUI**: 璃奈ちゃんボード風のドット絵表示
- 📱 **レスポンシブ対応**: スマホ/タブレットで異なる表示
  - スマホ: 目のみ表示
  - タブレット: 目 + 口表示
- 🇯🇵 **日本語対応**: すべてのUIが日本語
- ⚡ **高パフォーマンス**: 差分レンダリングによる効率的な描画

## 🚀 デモ

```bash
# 開発サーバーを起動
npm run dev

# ブラウザで http://localhost:5173/ にアクセス
```

## 📦 インストール

### 必要な環境

- Node.js 20.x以上
- npm 10.x以上

### セットアップ

```bash
# 依存関係をインストール
npm install

# 開発サーバーを起動
npm run dev
```

## 🎮 使い方

1. ブラウザで http://localhost:5173/ にアクセス
2. 「カメラを起動」ボタンをクリック
3. カメラへのアクセスを許可
4. MediaPipeが初期化されます（数秒かかります）
5. 顔をカメラに向けると、自動的に表情認識が開始されます
6. 様々な表情を試してみてください！

## 😊 対応表情

| 表情        | 説明     | 色       |
| ----------- | -------- | -------- |
| neutral     | 通常     | 緑       |
| smile       | 笑顔     | 黄色     |
| surprised   | 驚き     | オレンジ |
| blink       | まばたき | 緑       |
| sad         | 悲しみ   | 青       |
| angry       | 怒り     | 赤       |
| confused    | 困惑     | オレンジ |
| smug        | 得意気   | マゼンタ |
| questioning | 疑問     | シアン   |
| embarrassed | 照れ     | ピンク   |

## 🛠️ 技術スタック

- **Vite 8.x** + **React 19.x** + **TypeScript 5.9**
- **MediaPipe Face Landmarker** - 顔認識
- **Tailwind CSS 4.x** - スタイリング
- **Vitest 4.x** - テスト

## 🧪 テスト

```bash
# すべてのテストを実行
npm run test

# カバレッジレポートを生成
npm run test:coverage
```

## 📚 詳細ドキュメント

- [実装計画](docs/implementation-plan.md)
- [タスク分解](docs/task-breakdown.md)
- [進捗状況](docs/progress.md)

---

**璃奈ちゃんボード風デジタルお面** - Powered by MediaPipe & React

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(["dist"]),
  {
    files: ["**/*.{ts,tsx}"],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ["./tsconfig.node.json", "./tsconfig.app.json"],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
]);
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from "eslint-plugin-react-x";
import reactDom from "eslint-plugin-react-dom";

export default defineConfig([
  globalIgnores(["dist"]),
  {
    files: ["**/*.{ts,tsx}"],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs["recommended-typescript"],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ["./tsconfig.node.json", "./tsconfig.app.json"],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
]);
```
