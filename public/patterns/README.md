# 表情パターンJSON

このディレクトリには、璃奈ちゃんボード風の表情パターンがJSON形式で格納されています。

## ファイル構成

- `index.json` - 全パターンのインデックス
- `{expression}.json` - 各表情のパターンデータ（21x26）

## データ形式（最適化版）

各表情JSONファイルは以下の構造を持ちます：

```json
{
  "expression": "neutral",
  "color": "#E66CBC",
  "grid": [[0, 0, ...], [0, 0, ...], ...],
  "size": {
    "width": 21,
    "height": 26
  },
  "metadata": {
    "eyeOnlyRows": 14,
    "fullRows": 26,
    "description": "Use first 14 rows for smartphone..."
  }
}
```

### 最適化ポイント 🚀

**従来版**: eyeOnly (21x14) + full (21x26) = ~8KB/ファイル
**最適化版**: 21x26のみ = ~5.4KB/ファイル（**32%削減**）

- **スマートフォン**: `grid`の**上14行のみ**を使用（目のみ）
- **タブレット**: `grid`の**全26行**を使用（目+口）

レンダリング時に行数を制限することで、データ重複を排除しました。

### フィールド説明

- **expression**: 表情名
- **color**: ドットの色（16進数カラーコード）
- **grid**: ドット配列（0=透明、1=塗りつぶし）- 21x26の2次元配列
- **size**: パターンのサイズ（必ず width: 21, height: 26）
- **metadata**: レンダリングのヒント
  - `eyeOnlyRows: 14` - スマホ用は上14行
  - `fullRows: 26` - タブレット用は全26行

## 利用可能な表情

- `neutral.json` - 通常
- `smile.json` - 笑顔
- `surprised.json` - 驚き
- `sad.json` - 悲しみ
- `angry.json` - 怒り
- `confused.json` - 困惑
- `smug.json` - 得意気/ウインク
- `questioning.json` - 疑問
- `embarrassed.json` - 照れ

## JSON生成方法

```bash
npm run export:patterns
```

このコマンドで `src/utils/dotPatterns.ts` からJSONファイルを再生成します。

## 使用例

### JavaScript/TypeScript

```javascript
// 特定の表情を取得
const response = await fetch("/patterns/smile.json");
const pattern = await response.json();

// スマホ用（目のみ）: 上14行だけ使用
const eyeOnlyGrid = pattern.grid.slice(0, 14);
console.log(`Eye-only: ${eyeOnlyGrid.length} rows`); // 14

// タブレット用（全体）: 全26行使用
const fullGrid = pattern.grid;
console.log(`Full: ${fullGrid.length} rows`); // 26

// レンダリング例
function renderPattern(pattern, deviceType) {
  const rows =
    deviceType === "smartphone"
      ? pattern.grid.slice(0, 14) // 上14行のみ
      : pattern.grid; // 全26行

  // Canvasに描画...
  rows.forEach((row, y) => {
    row.forEach((cell, x) => {
      if (cell === 1) {
        ctx.fillStyle = pattern.color;
        ctx.fillRect(x * dotSize, y * dotSize, dotSize, dotSize);
      }
    });
  });
}
```

### インデックスから全表情を取得

```javascript
const index = await fetch("/patterns/index.json").then((r) => r.json());
console.log(
  "Available expressions:",
  index.expressions.map((e) => e.name),
);
console.log("Pattern size:", index.metadata.patternSize); // "21x26"

// 全パターンを順次読み込み
for (const expr of index.expressions) {
  const pattern = await fetch(`/patterns/${expr.file}`).then((r) => r.json());
  // パターンを使用
}
```

## 注意事項

- グリッドの値は 0（透明）または 1（塗りつぶし）のみ
- すべてのパターンは必ず21x26のサイズ
- スマホ表示時は**必ず上14行のみ**を使用すること
- データ効率化のため、eyeOnly専用データは含まれていません
