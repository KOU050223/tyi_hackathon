# アーキテクチャ設計書

## 概要

「璃奈ちゃんボード風 デジタルお面」にドットエディタとクラウド共有機能を追加する。
ユーザーがカスタム表情を作成し、Cloudflareを通じて共有できるプラットフォームを構築する。

## システムアーキテクチャ

```
┌─────────────────────────────────────────────────────────┐
│                    Cloudflare Pages                      │
│              (Viteアプリのホスティング)                   │
│                                                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │ ドットエディタ│  │  ギャラリー   │  │  認証UI      │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└───────────────────────┬─────────────────────────────────┘
                        │ HTTPS API
                        │
┌───────────────────────▼─────────────────────────────────┐
│              Cloudflare Workers (API)                    │
│                                                           │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐        │
│  │ Auth API   │  │Pattern API │  │Gallery API │        │
│  │(OAuth)     │  │(CRUD)      │  │(検索/いいね)│        │
│  └────────────┘  └────────────┘  └────────────┘        │
└───────┬─────────────────┬──────────────────┬───────────┘
        │                 │                  │
        │                 │                  │
┌───────▼────────┐ ┌─────▼─────────┐ ┌─────▼──────────┐
│ GitHub OAuth   │ │ Cloudflare D1 │ │ Cloudflare R2  │
│ (認証連携)     │ │ (SQLite DB)   │ │ (画像保存)     │
└────────────────┘ └───────────────┘ └────────────────┘
```

## 使用技術スタック

### フロントエンド
- **フレームワーク**: Vite 8.x + React 19.x + TypeScript 5.9
- **状態管理**: Zustand 5.x + persist middleware
- **スタイリング**: Tailwind CSS 4.x
- **既存機能**: MediaPipe Face Landmarker + Canvas 2D

### バックエンド (Cloudflare)
- **ホスティング**: Cloudflare Pages（無料）
- **API**: Cloudflare Workers（無料枠: 10万リクエスト/日）
- **データベース**: Cloudflare D1 SQLite（無料枠: 5GB）
- **ストレージ**: Cloudflare R2（無料枠: 10GB）
- **認証**: GitHub OAuth

### 開発ツール
- **Workers開発**: Wrangler CLI
- **API Router**: itty-router
- **JWT**: @tsndr/cloudflare-worker-jwt

## データフロー

### 1. 表情作成フロー
```
ユーザー
  ↓ ドット編集
ドットエディタ
  ↓ 保存
Zustand Store (LocalStorage)
  ↓ アップロード（オプション）
Workers API
  ↓ 保存
D1データベース + R2（プレビュー画像）
```

### 2. ギャラリー閲覧フロー
```
ユーザー
  ↓ 検索/フィルタ
ギャラリーUI
  ↓ API リクエスト
Workers API
  ↓ クエリ
D1データベース
  ↓ レスポンス
ギャラリーUI（カード表示）
  ↓ ダウンロード
Zustand Store（ローカルに追加）
```

### 3. GitHub OAuth フロー
```
ユーザー
  ↓ ログインボタンクリック
Workers (/auth/github)
  ↓ リダイレクト
GitHub OAuth画面
  ↓ 認証後コールバック
Workers (/auth/callback)
  ↓ アクセストークン取得
GitHub API
  ↓ ユーザー情報取得
D1にユーザー保存
  ↓ JWT発行
フロントエンド（トークン保存）
```

## セキュリティ

### 認証・認可
- GitHub OAuthで安全な認証
- JWT（JSON Web Token）でセッション管理
- トークンはhttpOnlyクッキー or LocalStorageに保存
- Workers middlewareでトークン検証

### データ保護
- D1へのアクセスはWorkers経由のみ（外部直接アクセス不可）
- R2バケットはプライベート設定、署名付きURL経由で配信
- CORS設定で許可されたオリジンのみアクセス可能

### バリデーション
- フロントエンド: グリッドサイズ、カラー形式検証
- バックエンド: JSON構造、サイズ制限（例: 最大32x32グリッド）
- Rate Limiting: Workers KV + 429レスポンス

## パフォーマンス最適化

### フロントエンド
- Zustand persist: LocalStorageで即座に利用可能
- React.memo: 不要な再レンダリング防止
- Lazy Loading: ギャラリーの無限スクロール実装

### バックエンド
- Workers Edge Network: 世界中のエッジで高速レスポンス
- D1クエリ最適化: インデックス活用
- R2 CDN: 画像配信の高速化
- キャッシュ: Cache API活用（静的コンテンツ）

## スケーラビリティ

### 無料枠での想定
- **月間アクティブユーザー**: ~10万人
- **1日あたりAPIリクエスト**: 10万リクエスト（Workers無料枠）
- **D1読み取り**: 500万行/月（無料枠）
- **ストレージ**: 10GB（無料枠）

### 拡張戦略
1. Workers有料プラン: 無制限リクエスト
2. D1スケールアップ: 自動シャーディング
3. R2多段キャッシュ: CDN統合
4. 分析: Workers Analytics導入

## デプロイ戦略

### 環境
- **開発**: ローカル（Wrangler dev + Vite dev）
- **ステージング**: Cloudflare Pages（プレビューブランチ）
- **本番**: Cloudflare Pages（mainブランチ）

### CI/CD
```yaml
# .github/workflows/deploy.yml
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Deploy to Cloudflare Pages
        uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
```

## コスト試算

| サービス | 無料枠 | 超過後料金 | 想定使用量 | 月額コスト |
|---------|--------|----------|-----------|----------|
| Cloudflare Pages | 無制限 | 無料 | - | **$0** |
| Workers | 10万req/日 | $0.50/100万req | 10万req/日 | **$0** |
| D1 | 5GB, 500万行読取 | $0.75/100万行 | 100万行/月 | **$0** |
| R2 | 10GB, 100万Class A | $0.015/GB | 5GB | **$0** |
| **合計** | - | - | - | **$0/月** |

※ 月間10万ユーザーまで無料枠内で運用可能

## 監視・運用

### ログ
- Workers Logs: リアルタイムログストリーム
- D1 Query Logs: スロークエリ検出
- R2 Access Logs: アクセスパターン分析

### エラー追跡
- Workers + Sentry統合
- カスタムエラーハンドリング
- ユーザーフィードバック機能

### メトリクス
- Workers Analytics: リクエスト数、レイテンシ
- D1 Analytics: クエリパフォーマンス
- R2 Analytics: ストレージ使用量

## 将来の拡張

### Phase 2機能
- アニメーションパターン（複数フレーム対応）
- コミュニティ機能（コメント、レビュー）
- タグ・カテゴリ管理
- 検索機能強化（全文検索）

### Phase 3機能
- WebRTC: リアルタイム共同編集
- AI生成: テキストから表情パターン生成
- モバイルアプリ: React Native版
- マネタイズ: プレミアムパターン販売

## 参考資料

- [Cloudflare Workers ドキュメント](https://developers.cloudflare.com/workers/)
- [Cloudflare D1 ドキュメント](https://developers.cloudflare.com/d1/)
- [Cloudflare R2 ドキュメント](https://developers.cloudflare.com/r2/)
- [GitHub OAuth ドキュメント](https://docs.github.com/en/apps/oauth-apps)
