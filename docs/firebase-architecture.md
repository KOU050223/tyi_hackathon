# Firebase アーキテクチャ設計書

## 概要

Firebase/Firestoreを使用したバックエンド設計。
Cloudflare版よりもシンプルで、認証・DB・ストレージが統合された環境を構築。

## システムアーキテクチャ

```
┌─────────────────────────────────────────────────────────┐
│                  Firebase Hosting                        │
│              (Viteアプリのホスティング)                   │
│                                                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │ ドットエディタ│  │  ギャラリー   │  │  認証UI      │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└───────────────────────┬─────────────────────────────────┘
                        │ Firebase SDK
                        │
┌───────────────────────▼─────────────────────────────────┐
│                   Firebase Services                      │
│                                                           │
│  ┌─────────────────┐  ┌─────────────────┐              │
│  │  Authentication │  │   Firestore     │              │
│  │  (GitHub OAuth) │  │   (NoSQL DB)    │              │
│  └─────────────────┘  └─────────────────┘              │
│                                                           │
│  ┌─────────────────┐  ┌─────────────────┐              │
│  │  Storage        │  │  Cloud Functions│              │
│  │  (画像保存)     │  │  (サーバーロジック)│            │
│  └─────────────────┘  └─────────────────┘              │
└───────────────────────────────────────────────────────┘
```

## 使用するFirebaseサービス

### 1. Firebase Hosting

- **用途**: Viteアプリのホスティング
- **特徴**:
  - 自動SSL証明書
  - グローバルCDN
  - カスタムドメイン対応
- **無料枠**: 10GB/月

### 2. Firebase Authentication

- **用途**: ユーザー認証
- **プロバイダー**: GitHub OAuth
- **特徴**:
  - セッション管理自動
  - トークンリフレッシュ自動
  - セキュリティルール連携
- **無料枠**: 無制限

### 3. Cloud Firestore

- **用途**: パターンデータ、ユーザー情報
- **特徴**:
  - NoSQLドキュメントDB
  - リアルタイムリスナー
  - オフライン対応
  - 複合インデックス自動生成
- **無料枠**: 1GB / 5万読取/日 / 2万書込/日

### 4. Firebase Storage

- **用途**: プレビュー画像保存
- **特徴**:
  - Google Cloud Storage基盤
  - 自動CDN配信
  - セキュリティルール連携
- **無料枠**: 5GB / 1GB転送/日

### 5. Cloud Functions (オプション)

- **用途**: サーバーサイド処理
- **使用例**:
  - 画像リサイズ
  - 統計集計
  - Webhook処理
- **無料枠**: 200万呼び出し/月

## Firestoreデータモデル

### コレクション構造

```
firestore
├── users/{userId}
│   ├── githubId: number
│   ├── githubUsername: string
│   ├── avatarUrl: string
│   ├── createdAt: timestamp
│   └── updatedAt: timestamp
│
├── patterns/{patternId}
│   ├── userId: string (reference to users/{userId})
│   ├── name: string
│   ├── expressionType: string
│   ├── deviceType: 'smartphone' | 'tablet'
│   ├── color: string
│   ├── gridData: array<array<number>>
│   ├── previewImageUrl: string (Storage URL)
│   ├── isPublic: boolean
│   ├── downloads: number
│   ├── likes: number
│   ├── tags: array<string>
│   ├── createdAt: timestamp
│   ├── updatedAt: timestamp
│   │
│   └── likedBy/{userId}  (サブコレクション)
│       └── likedAt: timestamp
│
└── stats/{patternId}  (集計データ - Cloud Functions用)
    ├── viewCount: number
    ├── lastViewed: timestamp
    └── popularityScore: number
```

### インデックス設定

Firebase Consoleで以下の複合インデックスを作成:

```javascript
// patterns コレクション
{
  collectionGroup: 'patterns',
  queryScope: 'COLLECTION',
  fields: [
    { fieldPath: 'isPublic', order: 'ASCENDING' },
    { fieldPath: 'likes', order: 'DESCENDING' },
    { fieldPath: 'createdAt', order: 'DESCENDING' }
  ]
}

{
  collectionGroup: 'patterns',
  queryScope: 'COLLECTION',
  fields: [
    { fieldPath: 'isPublic', order: 'ASCENDING' },
    { fieldPath: 'expressionType', order: 'ASCENDING' },
    { fieldPath: 'createdAt', order: 'DESCENDING' }
  ]
}

{
  collectionGroup: 'patterns',
  queryScope: 'COLLECTION',
  fields: [
    { fieldPath: 'isPublic', order: 'ASCENDING' },
    { fieldPath: 'deviceType', order: 'ASCENDING' },
    { fieldPath: 'likes', order: 'DESCENDING' }
  ]
}
```

## Firestoreセキュリティルール

```javascript
// firestore.rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // ヘルパー関数
    function isAuthenticated() {
      return request.auth != null;
    }

    function isOwner(userId) {
      return isAuthenticated() && request.auth.uid == userId;
    }

    // users コレクション
    match /users/{userId} {
      // 誰でも読取可能（公開プロフィール）
      allow read: if true;

      // 本人のみ作成・更新可能
      allow create: if isOwner(userId);
      allow update: if isOwner(userId);

      // 削除は禁止（Authenticationと連動）
      allow delete: if false;
    }

    // patterns コレクション
    match /patterns/{patternId} {
      // 公開パターンは誰でも読取可能
      allow read: if resource.data.isPublic == true;

      // 非公開パターンは本人のみ読取可能
      allow read: if isOwner(resource.data.userId);

      // 認証済みユーザーのみ作成可能
      allow create: if isAuthenticated()
                    && request.resource.data.userId == request.auth.uid
                    && request.resource.data.keys().hasAll([
                      'name', 'expressionType', 'deviceType',
                      'color', 'gridData', 'isPublic'
                    ]);

      // 本人のみ更新可能
      allow update: if isOwner(resource.data.userId)
                    && request.resource.data.userId == resource.data.userId; // userIdの変更を防ぐ

      // 本人のみ削除可能
      allow delete: if isOwner(resource.data.userId);

      // likedBy サブコレクション
      match /likedBy/{userId} {
        // 誰でも読取可能
        allow read: if true;

        // 本人のみいいね追加可能
        allow create: if isOwner(userId);

        // 本人のみいいね削除可能
        allow delete: if isOwner(userId);

        // 更新は禁止
        allow update: if false;
      }
    }
  }
}
```

## Firebase Storageルール

```javascript
// storage.rules
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {

    // プレビュー画像
    match /previews/{patternId}.png {
      // 誰でも読取可能
      allow read: if true;

      // 認証済みユーザーのみアップロード可能
      allow write: if request.auth != null
                   && request.resource.size < 5 * 1024 * 1024  // 5MB制限
                   && request.resource.contentType.matches('image/png');
    }

    // ユーザーアバター（将来的に使用）
    match /avatars/{userId} {
      allow read: if true;
      allow write: if request.auth != null
                   && request.auth.uid == userId
                   && request.resource.size < 2 * 1024 * 1024;  // 2MB制限
    }
  }
}
```

## データフロー

### 1. 表情パターン作成フロー

```
ユーザー（認証済み）
  ↓
ドットエディタで編集
  ↓
保存ボタンクリック
  ↓
Canvas → PNG変換
  ↓
Firebase Storage.put()
  ↓ (プレビュー画像URL取得)
Firestore.collection('patterns').add()
  ↓
ローカルストア更新（Zustand）
  ↓
UI更新
```

### 2. ギャラリー閲覧フロー

```
ユーザー
  ↓
ギャラリーページ表示
  ↓
Firestore.collection('patterns')
  .where('isPublic', '==', true)
  .orderBy('likes', 'desc')
  .limit(20)
  .get()
  ↓
Zustand Storeに保存
  ↓
PatternCard コンポーネント描画
```

### 3. いいね機能フロー

```
ユーザー（認証済み）
  ↓
♥ボタンクリック
  ↓
Firestore Transaction開始
  ├─ patterns/{id}/likedBy/{userId} 作成
  └─ patterns/{id}.likes カウント+1
  ↓
トランザクションコミット
  ↓
リアルタイムリスナー経由でUI更新
```

### 4. リアルタイム更新フロー

```
Firestore.collection('patterns')
  .where('isPublic', '==', true)
  .onSnapshot((snapshot) => {
    // 変更をリアルタイム検知
    snapshot.docChanges().forEach((change) => {
      if (change.type === 'added') { /* 新規パターン */ }
      if (change.type === 'modified') { /* いいね数更新 */ }
      if (change.type === 'removed') { /* 削除 */ }
    })
  })
```

## 認証フロー（GitHub OAuth）

### 1. Firebase Console設定

```
Firebase Console
  → Authentication
  → Sign-in method
  → GitHub
  → Enable
  → Client ID / Secret 入力
  → 認可コールバックURL: https://your-project.firebaseapp.com/__/auth/handler
```

### 2. フロントエンド実装

```typescript
import { getAuth, signInWithPopup, GithubAuthProvider } from "firebase/auth";

const auth = getAuth();
const provider = new GithubAuthProvider();

// ログイン
async function loginWithGitHub() {
  try {
    const result = await signInWithPopup(auth, provider);
    const user = result.user;

    // Firestoreにユーザー情報保存
    await setDoc(
      doc(db, "users", user.uid),
      {
        githubId: user.providerData[0].uid,
        githubUsername: user.displayName,
        avatarUrl: user.photoURL,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    );
  } catch (error) {
    console.error("Login failed:", error);
  }
}

// ログアウト
async function logout() {
  await auth.signOut();
}

// 認証状態監視
onAuthStateChanged(auth, (user) => {
  if (user) {
    // ログイン済み
  } else {
    // 未ログイン
  }
});
```

## パフォーマンス最適化

### 1. Firestoreクエリ最適化

```typescript
// ❌ 悪い例: 全件取得してフィルタ
const allPatterns = await getDocs(collection(db, "patterns"));
const publicPatterns = allPatterns.docs.filter((doc) => doc.data().isPublic);

// ✅ 良い例: クエリでフィルタ
const q = query(
  collection(db, "patterns"),
  where("isPublic", "==", true),
  orderBy("likes", "desc"),
  limit(20),
);
const snapshot = await getDocs(q);
```

### 2. リアルタイムリスナーの制限

```typescript
// ✅ 必要な範囲のみリスナー設定
const q = query(
  collection(db, "patterns"),
  where("isPublic", "==", true),
  limit(50), // 最大50件まで監視
);

const unsubscribe = onSnapshot(q, (snapshot) => {
  // 更新処理
});

// コンポーネントアンマウント時に解除
useEffect(() => {
  return () => unsubscribe();
}, []);
```

### 3. バッチ書き込み

```typescript
// ✅ 複数の書き込みを1トランザクションで
const batch = writeBatch(db);

batch.set(doc(db, "patterns", patternId, "likedBy", userId), {
  likedAt: serverTimestamp(),
});

batch.update(doc(db, "patterns", patternId), {
  likes: increment(1),
});

await batch.commit();
```

## コスト試算

### 無料枠

| サービス             | 無料枠           | 想定使用量     | 超過後料金  |
| -------------------- | ---------------- | -------------- | ----------- |
| Hosting              | 10GB/月          | ~2GB           | $0.15/GB    |
| Firestore 読取       | 5万/日           | 3万/日         | $0.06/10万  |
| Firestore 書込       | 2万/日           | 5千/日         | $0.18/10万  |
| Firestore ストレージ | 1GB              | 500MB          | $0.18/GB    |
| Storage              | 5GB / 1GB転送/日 | 2GB / 500MB/日 | $0.026/GB   |
| Functions            | 200万/月         | 未使用         | $0.40/100万 |

### 月間コスト試算

**想定**: 月間1万アクティブユーザー、1日あたり:

- ギャラリー閲覧: 3万読取
- パターン作成: 100書込
- いいね: 500書込
- 画像転送: 500MB

**結果**: **月額 $0**（無料枠内）

**スケール時** (10万ユーザー):

- 読取超過: ~$3/月
- 書込超過: ~$2/月
- ストレージ: ~$1/月
- **合計**: ~$6/月

## モニタリング

### Firebase Console

1. **Authentication**: ユーザー数、ログイン方法
2. **Firestore**: 読取/書込数、ストレージ使用量
3. **Storage**: ストレージ使用量、転送量
4. **Hosting**: トラフィック、帯域幅

### Performance Monitoring（オプション）

```typescript
import { getPerformance } from "firebase/performance";

const perf = getPerformance(app);
// 自動的にパフォーマンスデータ収集
```

## セキュリティ

### 1. セキュリティルールのテスト

```bash
# Firebase Emulatorでローカルテスト
firebase emulators:start

# ルールのユニットテスト
npm run test:rules
```

### 2. App Check（推奨）

```typescript
import { initializeAppCheck, ReCaptchaV3Provider } from "firebase/app-check";

const appCheck = initializeAppCheck(app, {
  provider: new ReCaptchaV3Provider("YOUR_RECAPTCHA_SITE_KEY"),
  isTokenAutoRefreshEnabled: true,
});
```

## バックアップ戦略

### 1. Firestoreエクスポート

```bash
# 定期バックアップ（Cloud Schedulerで自動化）
gcloud firestore export gs://your-bucket/backups/$(date +%Y%m%d)
```

### 2. Storageバックアップ

```bash
# gsutilでバックアップ
gsutil -m rsync -r gs://your-project.appspot.com gs://your-backup-bucket
```

## 拡張性

### Phase 2 機能

1. **Cloud Functions活用**
   - 画像自動リサイズ
   - 不適切コンテンツ検出（Vision API）
   - メール通知

2. **Firebase Extensions**
   - Resize Images: アップロード時自動リサイズ
   - Translate Text: 多言語対応
   - Delete User Data: GDPR対応

3. **Firebase Analytics**
   - ユーザー行動分析
   - カスタムイベント追跡
   - A/Bテスト

## まとめ

### Firebaseの利点

✅ **シンプル**: 設定が少なく、すぐに開始可能
✅ **統合**: 認証・DB・ストレージが連携
✅ **リアルタイム**: いいね数の即座反映
✅ **無料枠**: 小〜中規模なら無料
✅ **スケーラブル**: 自動スケーリング

### 次のステップ

1. Firebaseプロジェクト作成
2. Firebase SDK導入
3. Authentication設定
4. Firestore/Storageルール設定
5. フロントエンド実装
6. デプロイ

詳細な実装手順は `firebase-implementation.md` を参照。
