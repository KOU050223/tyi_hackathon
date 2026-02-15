# データベーススキーマ設計

## 概要

Cloudflare D1（SQLite）を使用したデータベース設計。
カスタム表情パターンの管理、ユーザー情報、いいね機能、タグ付けをサポート。

## ER図

```
┌─────────────────┐
│     users       │
├─────────────────┤
│ id (PK)         │
│ github_id (UQ)  │
│ github_username │
│ avatar_url      │
│ created_at      │
│ updated_at      │
└────────┬────────┘
         │
         │ 1:N
         │
┌────────▼────────────────┐
│      patterns           │
├─────────────────────────┤
│ id (PK)                 │
│ user_id (FK)            │
│ name                    │
│ expression_type         │
│ device_type             │
│ color                   │
│ grid_data (JSON)        │
│ preview_image_url       │
│ is_public               │
│ downloads               │
│ likes                   │
│ created_at              │
│ updated_at              │
└────────┬────────────────┘
         │
         ├─────────┐
         │         │
         │ N:M     │ N:M
         │         │
┌────────▼────┐ ┌──▼────────────┐
│   likes     │ │ pattern_tags  │
├─────────────┤ ├───────────────┤
│ id (PK)     │ │ pattern_id(FK)│
│ user_id(FK) │ │ tag_id (FK)   │
│ pattern_id  │ └───────┬───────┘
│ created_at  │         │
└─────────────┘         │
                        │
                 ┌──────▼──────┐
                 │    tags     │
                 ├─────────────┤
                 │ id (PK)     │
                 │ name (UQ)   │
                 └─────────────┘
```

## テーブル定義

### 1. users（ユーザー情報）

GitHub OAuthで認証されたユーザーの情報を保存。

```sql
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  github_id INTEGER UNIQUE NOT NULL,
  github_username TEXT NOT NULL,
  avatar_url TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_github_id ON users(github_id);
```

| カラム名        | 型       | 制約               | 説明                  |
| --------------- | -------- | ------------------ | --------------------- |
| id              | INTEGER  | PK, AUTO_INCREMENT | 内部ID                |
| github_id       | INTEGER  | UNIQUE, NOT NULL   | GitHub User ID        |
| github_username | TEXT     | NOT NULL           | GitHubユーザー名      |
| avatar_url      | TEXT     | NULL               | GitHubアバター画像URL |
| created_at      | DATETIME | DEFAULT NOW        | 作成日時              |
| updated_at      | DATETIME | DEFAULT NOW        | 更新日時              |

### 2. patterns（カスタム表情パターン）

ユーザーが作成したドットパターンを保存。

```sql
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

CREATE INDEX idx_patterns_user ON patterns(user_id);
CREATE INDEX idx_patterns_public ON patterns(is_public);
CREATE INDEX idx_patterns_expression ON patterns(expression_type);
CREATE INDEX idx_patterns_downloads ON patterns(downloads);
CREATE INDEX idx_patterns_likes ON patterns(likes);
CREATE INDEX idx_patterns_created ON patterns(created_at);
```

| カラム名          | 型       | 制約                   | 説明                                |
| ----------------- | -------- | ---------------------- | ----------------------------------- |
| id                | INTEGER  | PK, AUTO_INCREMENT     | パターンID                          |
| user_id           | INTEGER  | FK(users.id), NOT NULL | 作成者ID                            |
| name              | TEXT     | NOT NULL               | パターン名（例: "ニコニコ笑顔"）    |
| expression_type   | TEXT     | NOT NULL               | 表情タイプ（neutral/smile/angry等） |
| device_type       | TEXT     | CHECK                  | デバイスタイプ（smartphone/tablet） |
| color             | TEXT     | NOT NULL               | カラーコード（#RRGGBB形式）         |
| grid_data         | TEXT     | NOT NULL               | ドットパターン（JSON配列）          |
| preview_image_url | TEXT     | NULL                   | R2のプレビュー画像URL               |
| is_public         | BOOLEAN  | DEFAULT 0              | 公開フラグ（0: 非公開, 1: 公開）    |
| downloads         | INTEGER  | DEFAULT 0              | ダウンロード数                      |
| likes             | INTEGER  | DEFAULT 0              | いいね数（非正規化）                |
| created_at        | DATETIME | DEFAULT NOW            | 作成日時                            |
| updated_at        | DATETIME | DEFAULT NOW            | 更新日時                            |

**grid_data形式例**:

```json
[
  [0, 0, 1, 1, 0, 0, 0, 0, 1, 1, 0, 0],
  [0, 1, 1, 1, 1, 0, 0, 1, 1, 1, 1, 0],
  [1, 1, 0, 0, 1, 1, 1, 1, 0, 0, 1, 1]
]
```

### 3. likes（いいね）

ユーザーがパターンに「いいね」した記録。

```sql
CREATE TABLE likes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  pattern_id INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, pattern_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (pattern_id) REFERENCES patterns(id) ON DELETE CASCADE
);

CREATE INDEX idx_likes_user ON likes(user_id);
CREATE INDEX idx_likes_pattern ON likes(pattern_id);
```

| カラム名   | 型       | 制約                      | 説明                 |
| ---------- | -------- | ------------------------- | -------------------- |
| id         | INTEGER  | PK, AUTO_INCREMENT        | いいねID             |
| user_id    | INTEGER  | FK(users.id), NOT NULL    | いいねしたユーザー   |
| pattern_id | INTEGER  | FK(patterns.id), NOT NULL | いいねされたパターン |
| created_at | DATETIME | DEFAULT NOW               | いいね日時           |

**制約**: (user_id, pattern_id)の組み合わせは一意（重複いいね防止）

### 4. tags（タグ）

パターンを分類するためのタグマスタ。

```sql
CREATE TABLE tags (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT UNIQUE NOT NULL
);

CREATE INDEX idx_tags_name ON tags(name);
```

| カラム名 | 型      | 制約               | 説明                               |
| -------- | ------- | ------------------ | ---------------------------------- |
| id       | INTEGER | PK, AUTO_INCREMENT | タグID                             |
| name     | TEXT    | UNIQUE, NOT NULL   | タグ名（例: "かわいい", "クール"） |

### 5. pattern_tags（パターンとタグの関連）

パターンとタグの多対多リレーション。

```sql
CREATE TABLE pattern_tags (
  pattern_id INTEGER NOT NULL,
  tag_id INTEGER NOT NULL,
  PRIMARY KEY (pattern_id, tag_id),
  FOREIGN KEY (pattern_id) REFERENCES patterns(id) ON DELETE CASCADE,
  FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
);

CREATE INDEX idx_pattern_tags_pattern ON pattern_tags(pattern_id);
CREATE INDEX idx_pattern_tags_tag ON pattern_tags(tag_id);
```

| カラム名   | 型      | 制約                      | 説明       |
| ---------- | ------- | ------------------------- | ---------- |
| pattern_id | INTEGER | FK(patterns.id), NOT NULL | パターンID |
| tag_id     | INTEGER | FK(tags.id), NOT NULL     | タグID     |

## よくあるクエリ例

### 1. ギャラリー一覧取得（人気順）

```sql
SELECT
  p.id,
  p.name,
  p.expression_type,
  p.device_type,
  p.color,
  p.preview_image_url,
  p.downloads,
  p.likes,
  p.created_at,
  u.github_username,
  u.avatar_url
FROM patterns p
JOIN users u ON p.user_id = u.id
WHERE p.is_public = 1
ORDER BY p.likes DESC, p.created_at DESC
LIMIT 20 OFFSET ?;
```

### 2. 特定ユーザーの作品一覧

```sql
SELECT * FROM patterns
WHERE user_id = ?
ORDER BY created_at DESC;
```

### 3. いいね追加（重複防止付き）

```sql
-- いいね追加
INSERT OR IGNORE INTO likes (user_id, pattern_id)
VALUES (?, ?);

-- カウント更新
UPDATE patterns
SET likes = (SELECT COUNT(*) FROM likes WHERE pattern_id = ?)
WHERE id = ?;
```

### 4. タグ検索

```sql
SELECT DISTINCT p.*
FROM patterns p
JOIN pattern_tags pt ON p.id = pt.pattern_id
JOIN tags t ON pt.tag_id = t.id
WHERE t.name IN ('かわいい', 'クール')
  AND p.is_public = 1
ORDER BY p.likes DESC;
```

### 5. ダウンロード数の更新

```sql
UPDATE patterns
SET downloads = downloads + 1,
    updated_at = CURRENT_TIMESTAMP
WHERE id = ?;
```

## データ整合性

### CASCADE削除

- ユーザー削除 → 関連するpatterns, likesも自動削除
- パターン削除 → 関連するlikes, pattern_tagsも自動削除

### 非正規化

- `patterns.likes`: 高速化のため、いいね数を非正規化
- 更新タイミング: いいね追加/削除時にトリガー or アプリケーション層で更新

### 制約

- `device_type`: CHECK制約でsmartphone/tabletのみ許可
- `likes.user_id, pattern_id`: UNIQUE制約で重複いいね防止
- `tags.name`: UNIQUE制約で重複タグ防止

## マイグレーション戦略

### 初期マイグレーション

```bash
# D1データベース作成
npx wrangler d1 create rina_patterns

# スキーマ適用
npx wrangler d1 execute rina_patterns --file=./workers/schema.sql
```

### 将来のマイグレーション

バージョン管理されたマイグレーションファイル:

```
workers/migrations/
├── 001_initial_schema.sql
├── 002_add_tags.sql
└── 003_add_analytics.sql
```

適用スクリプト:

```bash
#!/bin/bash
for migration in workers/migrations/*.sql; do
  echo "Applying $migration..."
  npx wrangler d1 execute rina_patterns --file="$migration"
done
```

## パフォーマンス最適化

### インデックス戦略

- 頻繁に検索されるカラムにインデックス作成済み
- 複合インデックスは不要（D1の制約上、単一カラムで十分）

### クエリ最適化

- WHERE句でis_public = 1を先に評価（インデックス活用）
- JOINは必要最小限（N+1問題を防ぐ）
- LIMIT/OFFSETでページネーション実装

### キャッシュ戦略

- 人気パターンはWorkers KVにキャッシュ
- TTL: 1時間（頻繁に変わらないデータ）
- いいね/ダウンロード更新時にキャッシュ無効化

## データサイズ見積もり

### 1パターンあたり

- メタデータ: ~200 bytes
- grid_data (12x10): ~300 bytes
- **合計**: ~500 bytes

### 容量計算

- 10万パターン: 50 MB
- 100万パターン: 500 MB
- **D1無料枠（5GB）**: 最大1000万パターンまで保存可能

### R2ストレージ（プレビュー画像）

- 1画像あたり: ~10 KB (PNG, 128x128)
- 10万パターン: 1 GB
- **R2無料枠（10GB）**: 最大100万パターンまで対応可能
