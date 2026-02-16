# デプロイガイド

## 概要

Cloudflareを使用した本番環境へのデプロイ手順を説明します。

## 前提条件

- Cloudflareアカウント（無料）
- GitHubアカウント
- Node.js 20.x以上
- npm または bun

## 1. Cloudflareセットアップ

### 1.1 Wrangler CLIインストール

```bash
npm install -g wrangler
# または
bun add -g wrangler

# ログイン
wrangler login
```

### 1.2 D1データベース作成

```bash
# データベース作成
wrangler d1 create rina-patterns

# 出力例:
# ✅ Successfully created DB 'rina-patterns'
#
# [[d1_databases]]
# binding = "DB"
# database_name = "rina-patterns"
# database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
```

出力された`database_id`をメモ。

### 1.3 R2バケット作成

```bash
# プレビュー画像用バケット作成
wrangler r2 bucket create rina-patterns-previews

# 成功メッセージ:
# ✅ Created bucket 'rina-patterns-previews'
```

## 2. Workers プロジェクトセットアップ

### 2.1 ディレクトリ作成

```bash
cd /Users/uozumikouhei/workspace/tyi_hackathon
mkdir -p workers/src
cd workers
```

### 2.2 package.json作成

```bash
npm init -y
npm install --save-dev wrangler @cloudflare/workers-types
npm install itty-router @tsndr/cloudflare-worker-jwt
```

### 2.3 wrangler.toml作成

```toml
name = "rina-chan-board-api"
main = "src/index.ts"
compatibility_date = "2024-01-01"

# D1データベース
[[d1_databases]]
binding = "DB"
database_name = "rina-patterns"
database_id = "YOUR_DATABASE_ID_HERE"  # 1.2でメモしたIDを記入

# R2ストレージ
[[r2_buckets]]
binding = "R2_BUCKET"
bucket_name = "rina-patterns-previews"

# 環境変数
[vars]
APP_URL = "http://localhost:5173"  # 開発時
GITHUB_CLIENT_ID = ""  # 後で設定

# シークレット（wrangler secret putで設定）
# GITHUB_CLIENT_SECRET
# JWT_SECRET
```

### 2.4 スキーマファイル作成

```bash
# workers/schema.sqlを作成（docs/database-schema.mdの内容をコピー）
cat > schema.sql << 'EOF'
-- users テーブル
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  github_id INTEGER UNIQUE NOT NULL,
  github_username TEXT NOT NULL,
  avatar_url TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- patterns テーブル
CREATE TABLE patterns (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  expression_type TEXT NOT NULL,
  device_type TEXT NOT NULL CHECK(device_type IN ('smartphone', 'tablet')),
  color TEXT NOT NULL,
  grid_data TEXT NOT NULL,
  preview_image_url TEXT,
  is_public BOOLEAN DEFAULT 0,
  downloads INTEGER DEFAULT 0,
  likes INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- likes テーブル
CREATE TABLE likes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  pattern_id INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, pattern_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (pattern_id) REFERENCES patterns(id) ON DELETE CASCADE
);

-- インデックス作成
CREATE INDEX idx_patterns_user ON patterns(user_id);
CREATE INDEX idx_patterns_public ON patterns(is_public);
CREATE INDEX idx_patterns_expression ON patterns(expression_type);
CREATE INDEX idx_likes_pattern ON likes(pattern_id);
EOF
```

### 2.5 マイグレーション実行

```bash
# スキーマ適用
wrangler d1 execute rina-patterns --file=./schema.sql

# 成功メッセージ:
# ✅ Executed 15 commands in 0.123s
```

## 3. GitHub OAuth設定

### 3.1 OAuth Appの作成

1. GitHub → Settings → Developer settings → OAuth Apps → New OAuth App
2. 設定項目:
   - **Application name**: Rina-chan Board
   - **Homepage URL**: `https://your-app.pages.dev`（後で変更可能）
   - **Authorization callback URL**: `https://your-workers.workers.dev/auth/callback`
3. 作成後、**Client ID**と**Client Secret**をメモ

### 3.2 Secretsの設定

```bash
cd workers

# GitHub Client Secret
wrangler secret put GITHUB_CLIENT_SECRET
# プロンプトが表示されたらシークレットを貼り付け

# JWT Secret（ランダム文字列）
wrangler secret put JWT_SECRET
# 例: openssl rand -base64 32 で生成した文字列を貼り付け
```

### 3.3 wrangler.tomlの更新

```toml
[vars]
APP_URL = "https://your-app.pages.dev"  # 本番URL
GITHUB_CLIENT_ID = "your_github_client_id"
```

## 4. Workersコード実装

### 4.1 基本構造

```bash
workers/
├── src/
│   ├── index.ts          # エントリポイント
│   ├── routes/
│   │   ├── auth.ts       # 認証ルート
│   │   ├── patterns.ts   # パターンAPI
│   │   └── users.ts      # ユーザーAPI
│   ├── middleware/
│   │   ├── cors.ts       # CORS設定
│   │   └── auth.ts       # JWT検証
│   └── utils/
│       ├── db.ts         # D1ヘルパー
│       └── r2.ts         # R2ヘルパー
├── schema.sql
├── wrangler.toml
└── package.json
```

### 4.2 index.ts（最小限の例）

```typescript
// workers/src/index.ts
import { Router } from "itty-router";
import { corsHeaders } from "./middleware/cors";

const router = Router();

// CORS Preflight
router.options("*", () => new Response(null, { headers: corsHeaders }));

// Health Check
router.get("/health", () => {
  return new Response(JSON.stringify({ status: "healthy", timestamp: new Date().toISOString() }), {
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });
});

// 404
router.all("*", () => new Response("Not Found", { status: 404 }));

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    return router.handle(request, env);
  },
};
```

## 5. Workersデプロイ

### 5.1 ローカルテスト

```bash
cd workers
wrangler dev

# http://localhost:8787 でテスト
```

### 5.2 本番デプロイ

```bash
wrangler deploy

# 成功メッセージ:
# ✅ Deployed rina-chan-board-api
# 🌍 https://rina-chan-board-api.your-account.workers.dev
```

デプロイされたURLをメモ。

## 6. フロントエンドデプロイ（Cloudflare Pages）

### 6.1 環境変数設定

```bash
# プロジェクトルート/.env.production
cat > .env.production << 'EOF'
VITE_API_URL=https://rina-chan-board-api.your-account.workers.dev
VITE_GITHUB_CLIENT_ID=your_github_client_id
EOF
```

### 6.2 ビルド

```bash
npm run build
# または
bun run build

# dist/ ディレクトリが生成される
```

### 6.3 Pagesデプロイ（初回）

```bash
# Wrangler経由でデプロイ
wrangler pages project create rina-chan-board

# プロダクションブランチ: main
# ビルドコマンド: npm run build
# ビルド出力ディレクトリ: dist

# デプロイ実行
wrangler pages deploy dist --project-name=rina-chan-board

# 成功メッセージ:
# ✅ Deployed to https://rina-chan-board.pages.dev
```

### 6.4 カスタムドメイン設定（オプション）

Cloudflare Dashboard → Pages → rina-chan-board → Custom domains

## 7. GitHub ActionsによるCI/CD

### 7.1 .github/workflows/deploy.yml作成

```yaml
name: Deploy to Cloudflare

on:
  push:
    branches:
      - main

jobs:
  deploy-workers:
    name: Deploy Workers API
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: "20"

      - name: Install dependencies
        working-directory: ./workers
        run: npm ci

      - name: Deploy Workers
        uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          workingDirectory: "workers"

  deploy-pages:
    name: Deploy Frontend
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: "20"

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run build
        env:
          VITE_API_URL: ${{ secrets.VITE_API_URL }}
          VITE_GITHUB_CLIENT_ID: ${{ secrets.VITE_GITHUB_CLIENT_ID }}

      - name: Deploy to Cloudflare Pages
        uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          command: pages deploy dist --project-name=rina-chan-board
```

### 7.2 GitHub Secretsの設定

1. GitHubリポジトリ → Settings → Secrets and variables → Actions
2. 以下を追加:
   - `CLOUDFLARE_API_TOKEN`: Cloudflare API Token
   - `VITE_API_URL`: Workers API URL
   - `VITE_GITHUB_CLIENT_ID`: GitHub OAuth Client ID

### 7.3 Cloudflare API Tokenの取得

1. Cloudflare Dashboard → My Profile → API Tokens
2. Create Token → Edit Cloudflare Workers
3. 権限:
   - Account - Workers Scripts: Edit
   - Account - Cloudflare Pages: Edit
   - Account - D1: Edit
4. トークンをコピーしてGitHub Secretsに保存

## 8. 動作確認

### 8.1 APIヘルスチェック

```bash
curl https://rina-chan-board-api.your-account.workers.dev/health

# レスポンス:
# {"status":"healthy","timestamp":"2024-02-16T10:00:00.000Z"}
```

### 8.2 フロントエンドアクセス

```
https://rina-chan-board.pages.dev
```

ブラウザで開いて、カメラ機能とドットエディタが動作することを確認。

## 9. トラブルシューティング

### D1接続エラー

```bash
# ローカル環境でD1をテスト
wrangler d1 execute rina-patterns --command="SELECT 1"

# 本番環境でテスト
wrangler d1 execute rina-patterns --remote --command="SELECT 1"
```

### CORS エラー

`workers/src/middleware/cors.ts`を確認:

```typescript
export const corsHeaders = {
  "Access-Control-Allow-Origin": "https://rina-chan-board.pages.dev",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};
```

### GitHub OAuth エラー

1. GitHub OAuth App設定でCallback URLが正しいか確認
2. `GITHUB_CLIENT_SECRET`が正しく設定されているか確認:
   ```bash
   wrangler secret list
   ```

## 10. モニタリング

### Cloudflare Workers Logs

```bash
# リアルタイムログ表示
wrangler tail

# 特定の期間
wrangler tail --since 10m
```

### Cloudflare Dashboard

Analytics → Workers & Pages → rina-chan-board-api

- リクエスト数
- エラー率
- レイテンシ

## 11. コスト管理

### 無料枠の確認

Cloudflare Dashboard → Workers & Pages → Plans

- Workers: 10万リクエスト/日
- D1: 5GB, 500万行読取/月
- R2: 10GB, 100万Class A操作/月

### アラート設定

Dashboard → Notifications → Add Notification

- Workers使用率が80%を超えたら通知
- D1容量が4GBを超えたら通知

## 12. スケーリング戦略

### 無料枠を超えた場合

1. **Workers有料プラン**: $5/月
   - 無制限リクエスト
   - より長いCPU時間

2. **D1拡張**: 従量課金
   - $0.75/100万行読取
   - $5.00/100万行書込

3. **R2拡張**: 従量課金
   - $0.015/GB/月
   - $4.50/100万Class A操作

## まとめ

デプロイが完了すると、以下のURLで利用可能:

- **フロントエンド**: https://rina-chan-board.pages.dev
- **API**: https://rina-chan-board-api.your-account.workers.dev
- **自動デプロイ**: mainブランチへのpushで自動デプロイ

次のステップ:

- カスタムドメイン設定
- SSL証明書（自動発行）
- 分析ダッシュボード確認
