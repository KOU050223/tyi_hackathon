# API仕様書

## 概要

Cloudflare Workersで実装するREST API仕様。
カスタム表情パターンのCRUD、ギャラリー機能、GitHub OAuth認証を提供。

## ベースURL

```
開発: http://localhost:8787
本番: https://rina-chan-board-api.your-workers.dev
```

## 認証

GitHub OAuthとJWTを使用。

### 認証フロー

```
1. GET /auth/github → GitHubへリダイレクト
2. GitHub認証後 → GET /auth/callback?code=xxx
3. レスポンス: JWT発行
4. 以降のリクエスト: Authorization: Bearer {JWT}
```

### JWTペイロード

```json
{
  "sub": "123",           // user_id
  "githubId": 45678901,   // GitHub ID
  "username": "octocat",  // GitHubユーザー名
  "iat": 1234567890,      // 発行時刻
  "exp": 1234671490       // 有効期限（7日間）
}
```

## エンドポイント一覧

### 認証 (Auth)

| メソッド | パス | 認証 | 説明 |
|---------|------|------|------|
| GET | /auth/github | 不要 | GitHub OAuthへリダイレクト |
| GET | /auth/callback | 不要 | OAuthコールバック、JWT発行 |
| GET | /auth/me | 必須 | 現在のユーザー情報取得 |
| POST | /auth/logout | 必須 | ログアウト（トークン無効化） |

### パターン (Patterns)

| メソッド | パス | 認証 | 説明 |
|---------|------|------|------|
| GET | /api/patterns | 不要 | 公開パターン一覧取得 |
| GET | /api/patterns/:id | 不要 | 特定パターンの詳細取得 |
| POST | /api/patterns | 必須 | 新規パターン作成 |
| PUT | /api/patterns/:id | 必須 | パターン更新（作成者のみ） |
| DELETE | /api/patterns/:id | 必須 | パターン削除（作成者のみ） |
| POST | /api/patterns/:id/like | 必須 | いいね追加 |
| DELETE | /api/patterns/:id/like | 必須 | いいね削除 |
| POST | /api/patterns/:id/download | 不要 | ダウンロード数カウント |

### ユーザー (Users)

| メソッド | パス | 認証 | 説明 |
|---------|------|------|------|
| GET | /api/users/:id | 不要 | ユーザー情報取得 |
| GET | /api/users/:id/patterns | 不要 | ユーザーの公開パターン一覧 |
| GET | /api/users/me/patterns | 必須 | 自分のパターン一覧（非公開含む） |

---

## 詳細仕様

### 1. GET /auth/github

GitHub OAuthフローを開始。

**リクエスト例**:
```http
GET /auth/github
```

**レスポンス**:
```http
HTTP/1.1 302 Found
Location: https://github.com/login/oauth/authorize?client_id=xxx&redirect_uri=xxx&scope=read:user
```

---

### 2. GET /auth/callback

GitHub認証後のコールバック処理。

**リクエスト例**:
```http
GET /auth/callback?code=abc123&state=xyz
```

**レスポンス** (成功):
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "githubId": 45678901,
    "githubUsername": "octocat",
    "avatarUrl": "https://avatars.githubusercontent.com/u/45678901"
  }
}
```

**エラーレスポンス**:
```json
{
  "success": false,
  "error": "OAuth authentication failed"
}
```

---

### 3. GET /auth/me

現在ログイン中のユーザー情報を取得。

**リクエスト例**:
```http
GET /auth/me
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**レスポンス** (成功):
```json
{
  "id": 1,
  "githubId": 45678901,
  "githubUsername": "octocat",
  "avatarUrl": "https://avatars.githubusercontent.com/u/45678901",
  "createdAt": "2024-01-15T10:30:00Z"
}
```

**エラーレスポンス** (401):
```json
{
  "error": "Unauthorized"
}
```

---

### 4. GET /api/patterns

公開パターンの一覧を取得（ページネーション、フィルタ、ソート対応）。

**リクエスト例**:
```http
GET /api/patterns?page=1&perPage=20&sortBy=popular&expressionType=smile&deviceType=tablet
```

**クエリパラメータ**:
| パラメータ | 型 | 必須 | デフォルト | 説明 |
|-----------|-----|------|----------|------|
| page | integer | No | 1 | ページ番号 |
| perPage | integer | No | 20 | 1ページあたりの件数（最大100） |
| sortBy | string | No | latest | ソート順（latest/popular/downloads） |
| expressionType | string | No | - | 表情タイプでフィルタ |
| deviceType | string | No | - | デバイスタイプでフィルタ |
| search | string | No | - | 名前で検索 |

**レスポンス** (成功):
```json
{
  "patterns": [
    {
      "id": 123,
      "name": "ニコニコ笑顔",
      "expressionType": "smile",
      "deviceType": "tablet",
      "color": "#FFFF00",
      "gridData": [[0,1,1,...], [1,0,0,...]],
      "previewImageUrl": "https://r2.example.com/previews/123.png",
      "isPublic": true,
      "downloads": 42,
      "likes": 15,
      "createdAt": "2024-02-01T12:00:00Z",
      "author": {
        "id": 1,
        "githubUsername": "octocat",
        "avatarUrl": "https://avatars.githubusercontent.com/u/45678901"
      },
      "tags": ["かわいい", "黄色"]
    }
  ],
  "pagination": {
    "page": 1,
    "perPage": 20,
    "total": 156,
    "totalPages": 8
  }
}
```

---

### 5. GET /api/patterns/:id

特定パターンの詳細情報を取得。

**リクエスト例**:
```http
GET /api/patterns/123
```

**レスポンス** (成功):
```json
{
  "id": 123,
  "name": "ニコニコ笑顔",
  "expressionType": "smile",
  "deviceType": "tablet",
  "color": "#FFFF00",
  "gridData": [
    [0, 1, 1, 0, 0, 1, 1, 0],
    [1, 0, 0, 1, 1, 0, 0, 1]
  ],
  "previewImageUrl": "https://r2.example.com/previews/123.png",
  "isPublic": true,
  "downloads": 42,
  "likes": 15,
  "createdAt": "2024-02-01T12:00:00Z",
  "updatedAt": "2024-02-05T08:30:00Z",
  "author": {
    "id": 1,
    "githubUsername": "octocat",
    "avatarUrl": "https://avatars.githubusercontent.com/u/45678901"
  },
  "tags": ["かわいい", "黄色"],
  "isLikedByMe": false
}
```

**エラーレスポンス** (404):
```json
{
  "error": "Pattern not found"
}
```

---

### 6. POST /api/patterns

新しいパターンを作成。

**リクエスト例**:
```http
POST /api/patterns
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "name": "怒り顔",
  "expressionType": "angry",
  "deviceType": "smartphone",
  "color": "#FF0000",
  "gridData": [
    [1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1],
    [0, 1, 1, 0, 0, 0, 0, 0, 0, 1, 1, 0]
  ],
  "isPublic": true,
  "tags": ["クール", "赤"]
}
```

**バリデーション**:
- `name`: 必須、1-50文字
- `expressionType`: 必須、既定の表情タイプ
- `deviceType`: 必須、smartphone or tablet
- `color`: 必須、#RRGGBB形式
- `gridData`: 必須、2次元配列（最大32x32）
- `isPublic`: オプション、デフォルトfalse
- `tags`: オプション、最大10個

**レスポンス** (成功):
```json
{
  "id": 124,
  "name": "怒り顔",
  "expressionType": "angry",
  "deviceType": "smartphone",
  "color": "#FF0000",
  "gridData": [...],
  "previewImageUrl": "https://r2.example.com/previews/124.png",
  "isPublic": true,
  "downloads": 0,
  "likes": 0,
  "createdAt": "2024-02-16T10:00:00Z",
  "author": {
    "id": 2,
    "githubUsername": "your-username",
    "avatarUrl": "..."
  },
  "tags": ["クール", "赤"]
}
```

**エラーレスポンス** (400):
```json
{
  "error": "Validation failed",
  "details": {
    "name": "Name is required",
    "gridData": "Grid size must be within 32x32"
  }
}
```

**エラーレスポンス** (401):
```json
{
  "error": "Unauthorized"
}
```

---

### 7. PUT /api/patterns/:id

パターンを更新（作成者のみ）。

**リクエスト例**:
```http
PUT /api/patterns/124
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "name": "超怒り顔",
  "isPublic": false
}
```

**更新可能フィールド**:
- `name`
- `color`
- `gridData`
- `isPublic`
- `tags`

**レスポンス** (成功):
```json
{
  "id": 124,
  "name": "超怒り顔",
  "isPublic": false,
  "updatedAt": "2024-02-16T11:00:00Z"
}
```

**エラーレスポンス** (403):
```json
{
  "error": "Forbidden: You are not the owner of this pattern"
}
```

---

### 8. DELETE /api/patterns/:id

パターンを削除（作成者のみ）。

**リクエスト例**:
```http
DELETE /api/patterns/124
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**レスポンス** (成功):
```http
HTTP/1.1 204 No Content
```

**エラーレスポンス** (403):
```json
{
  "error": "Forbidden: You are not the owner of this pattern"
}
```

---

### 9. POST /api/patterns/:id/like

パターンにいいねを追加。

**リクエスト例**:
```http
POST /api/patterns/123/like
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**レスポンス** (成功):
```json
{
  "success": true,
  "likes": 16
}
```

**エラーレスポンス** (409):
```json
{
  "error": "Already liked"
}
```

---

### 10. DELETE /api/patterns/:id/like

いいねを削除。

**リクエスト例**:
```http
DELETE /api/patterns/123/like
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**レスポンス** (成功):
```json
{
  "success": true,
  "likes": 15
}
```

---

### 11. POST /api/patterns/:id/download

ダウンロード数をカウント（認証不要）。

**リクエスト例**:
```http
POST /api/patterns/123/download
```

**レスポンス** (成功):
```json
{
  "success": true,
  "downloads": 43
}
```

---

### 12. GET /api/users/:id/patterns

特定ユーザーの公開パターン一覧。

**リクエスト例**:
```http
GET /api/users/1/patterns?page=1&perPage=10
```

**レスポンス** (成功):
```json
{
  "patterns": [...],
  "pagination": {
    "page": 1,
    "perPage": 10,
    "total": 25,
    "totalPages": 3
  }
}
```

---

### 13. GET /api/users/me/patterns

自分のパターン一覧（非公開含む）。

**リクエスト例**:
```http
GET /api/users/me/patterns
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**レスポンス** (成功):
```json
{
  "patterns": [
    {
      "id": 200,
      "name": "非公開パターン",
      "isPublic": false,
      ...
    },
    {
      "id": 124,
      "name": "公開パターン",
      "isPublic": true,
      ...
    }
  ]
}
```

---

## エラーレスポンス

### 標準エラー形式

```json
{
  "error": "エラーメッセージ",
  "code": "ERROR_CODE",
  "details": {}
}
```

### HTTPステータスコード

| コード | 説明 |
|-------|------|
| 200 | 成功 |
| 201 | 作成成功 |
| 204 | 削除成功（レスポンスボディなし） |
| 400 | バリデーションエラー |
| 401 | 認証エラー |
| 403 | 権限エラー |
| 404 | リソース未検出 |
| 409 | 競合（重複いいね等） |
| 429 | レート制限 |
| 500 | サーバーエラー |

---

## レート制限

| エンドポイント | 制限 |
|--------------|------|
| GET系 | 100リクエスト/分 |
| POST/PUT/DELETE | 30リクエスト/分 |
| /auth/* | 10リクエスト/分 |

**レート制限超過時**:
```http
HTTP/1.1 429 Too Many Requests
Retry-After: 60

{
  "error": "Rate limit exceeded",
  "retryAfter": 60
}
```

---

## CORS設定

```http
Access-Control-Allow-Origin: https://your-app.pages.dev
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization
Access-Control-Max-Age: 86400
```

---

## ヘルスチェック

### GET /health

**レスポンス**:
```json
{
  "status": "healthy",
  "timestamp": "2024-02-16T10:00:00Z",
  "services": {
    "d1": "connected",
    "r2": "connected"
  }
}
```
