# Firebase 実装ガイド

## 概要

Firebase/Firestoreを使用したバックエンドの具体的な実装手順。

## 1. Firebaseプロジェクトのセットアップ

### 1.1 Firebaseプロジェクト作成

1. [Firebase Console](https://console.firebase.google.com/) にアクセス
2. 「プロジェクトを追加」をクリック
3. プロジェクト名: `rina-chan-board`
4. Google Analyticsは任意（推奨: 有効化）
5. プロジェクト作成完了

### 1.2 Webアプリの追加

1. プロジェクト概要 → アプリを追加 → Web（</>アイコン）
2. アプリのニックネーム: `rina-chan-board-web`
3. Firebase Hostingも設定: ✅ チェック
4. Firebase SDK設定をコピー（後で使用）

```javascript
// コピーされる設定例
const firebaseConfig = {
  apiKey: 'AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
  authDomain: 'rina-chan-board.firebaseapp.com',
  projectId: 'rina-chan-board',
  storageBucket: 'rina-chan-board.appspot.com',
  messagingSenderId: '123456789012',
  appId: '1:123456789012:web:abcdef1234567890',
}
```

### 1.3 Firebase CLIインストール

```bash
# グローバルインストール
npm install -g firebase-tools

# または
bun add -g firebase-tools

# ログイン
firebase login

# 成功メッセージ:
# ✔ Success! Logged in as your-email@gmail.com
```

### 1.4 プロジェクト初期化

```bash
cd /Users/uozumikouhei/workspace/tyi_hackathon

# Firebase初期化
firebase init

# 選択項目:
# ? Which Firebase features do you want to set up?
#   ◉ Firestore
#   ◉ Storage
#   ◉ Hosting
#   ◉ Emulators
#
# ? Select a default Firebase project:
#   rina-chan-board (選択)
#
# Firestore Setup:
# ? What file should be used for Firestore Rules?
#   firestore.rules (デフォルト)
# ? What file should be used for Firestore indexes?
#   firestore.indexes.json (デフォルト)
#
# Storage Setup:
# ? What file should be used for Storage Rules?
#   storage.rules (デフォルト)
#
# Hosting Setup:
# ? What do you want to use as your public directory?
#   dist
# ? Configure as a single-page app?
#   Yes
# ? Set up automatic builds and deploys with GitHub?
#   Yes (推奨)
#
# Emulators Setup:
# ? Which Firebase emulators do you want to set up?
#   ◉ Authentication Emulator
#   ◉ Firestore Emulator
#   ◉ Storage Emulator
```

生成されるファイル:

```
tyi_hackathon/
├── firebase.json
├── .firebaserc
├── firestore.rules
├── firestore.indexes.json
└── storage.rules
```

## 2. Firebase SDK導入

### 2.1 パッケージインストール

```bash
npm install firebase
# または
bun add firebase
```

### 2.2 Firebase初期化ファイル作成

```typescript
// src/lib/firebase.ts
import { initializeApp } from 'firebase/app'
import { getAuth, connectAuthEmulator } from 'firebase/auth'
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore'
import { getStorage, connectStorageEmulator } from 'firebase/storage'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

// Firebase初期化
export const app = initializeApp(firebaseConfig)

// Authentication
export const auth = getAuth(app)

// Firestore
export const db = getFirestore(app)

// Storage
export const storage = getStorage(app)

// 開発環境ではEmulatorに接続
if (import.meta.env.DEV) {
  connectAuthEmulator(auth, 'http://127.0.0.1:9099')
  connectFirestoreEmulator(db, '127.0.0.1', 8080)
  connectStorageEmulator(storage, '127.0.0.1', 9199)
}
```

### 2.3 環境変数設定

```bash
# .env.local
VITE_FIREBASE_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
VITE_FIREBASE_AUTH_DOMAIN=rina-chan-board.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=rina-chan-board
VITE_FIREBASE_STORAGE_BUCKET=rina-chan-board.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012
VITE_FIREBASE_APP_ID=1:123456789012:web:abcdef1234567890
```

## 3. GitHub OAuth設定

### 3.1 GitHub OAuth App作成

1. GitHub → Settings → Developer settings → OAuth Apps
2. 「New OAuth App」
3. 設定:
   - **Application name**: Rina-chan Board
   - **Homepage URL**: `https://rina-chan-board.web.app`
   - **Authorization callback URL**: `https://rina-chan-board.firebaseapp.com/__/auth/handler`
4. Client IDとClient Secretをコピー

### 3.2 Firebase Console設定

1. Firebase Console → Authentication → Sign-in method
2. GitHub を有効化
3. GitHub Client ID と Client Secret を入力
4. 認可コールバックURLをGitHub OAuth Appに設定（上記で設定済み）

### 3.3 認証ロジック実装

```typescript
// src/lib/auth.ts
import {
  getAuth,
  signInWithPopup,
  GithubAuthProvider,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User,
} from 'firebase/auth'
import { doc, setDoc, serverTimestamp } from 'firebase/firestore'
import { auth, db } from './firebase'

const provider = new GithubAuthProvider()

// GitHub でログイン
export async function signInWithGitHub() {
  try {
    const result = await signInWithPopup(auth, provider)
    const user = result.user

    // Firestoreにユーザー情報を保存
    await setDoc(
      doc(db, 'users', user.uid),
      {
        githubId: user.providerData[0]?.uid,
        githubUsername: user.displayName || 'Anonymous',
        avatarUrl: user.photoURL || '',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    )

    return user
  } catch (error) {
    console.error('GitHub login failed:', error)
    throw error
  }
}

// ログアウト
export async function signOut() {
  await firebaseSignOut(auth)
}

// 認証状態監視
export function onAuthChanged(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback)
}
```

## 4. Firestoreデータ操作

### 4.1 型定義

```typescript
// src/types/firebase.ts
import type { Timestamp } from 'firebase/firestore'
import type { Expression } from './expression'

export interface FirestorePattern {
  userId: string
  name: string
  expressionType: Expression
  deviceType: 'smartphone' | 'tablet'
  color: string
  gridData: number[][]
  previewImageUrl?: string
  isPublic: boolean
  downloads: number
  likes: number
  tags: string[]
  createdAt: Timestamp
  updatedAt: Timestamp
}

export interface FirestoreUser {
  githubId: string
  githubUsername: string
  avatarUrl: string
  createdAt: Timestamp
  updatedAt: Timestamp
}
```

### 4.2 パターンCRUD操作

```typescript
// src/lib/patterns.ts
import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  serverTimestamp,
  increment,
  writeBatch,
  type Query,
  type QueryDocumentSnapshot,
} from 'firebase/firestore'
import { db, auth } from './firebase'
import type { FirestorePattern } from '@/types/firebase'
import type { CustomPattern } from '@/types/customPattern'

const patternsRef = collection(db, 'patterns')

// パターン作成
export async function createPattern(pattern: Omit<CustomPattern, 'id'>) {
  const user = auth.currentUser
  if (!user) throw new Error('Not authenticated')

  const docRef = await addDoc(patternsRef, {
    userId: user.uid,
    name: pattern.name,
    expressionType: pattern.expressionType,
    deviceType: pattern.deviceType,
    color: pattern.color,
    gridData: pattern.gridData,
    previewImageUrl: pattern.previewImageUrl || '',
    isPublic: pattern.isPublic,
    downloads: 0,
    likes: 0,
    tags: pattern.tags || [],
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  } as Omit<FirestorePattern, 'createdAt' | 'updatedAt'> & {
    createdAt: ReturnType<typeof serverTimestamp>
    updatedAt: ReturnType<typeof serverTimestamp>
  })

  return docRef.id
}

// パターン取得（単一）
export async function getPattern(
  patternId: string
): Promise<CustomPattern | null> {
  const docSnap = await getDoc(doc(db, 'patterns', patternId))

  if (!docSnap.exists()) return null

  return {
    id: docSnap.id,
    ...docSnap.data(),
  } as CustomPattern
}

// パターン一覧取得（ギャラリー）
export async function getPublicPatterns(
  sortBy: 'latest' | 'popular' | 'downloads' = 'latest',
  limitCount: number = 20,
  lastDoc?: QueryDocumentSnapshot
): Promise<{
  patterns: CustomPattern[]
  lastDoc: QueryDocumentSnapshot | null
}> {
  let q: Query = query(patternsRef, where('isPublic', '==', true))

  // ソート順
  if (sortBy === 'popular') {
    q = query(q, orderBy('likes', 'desc'), orderBy('createdAt', 'desc'))
  } else if (sortBy === 'downloads') {
    q = query(q, orderBy('downloads', 'desc'), orderBy('createdAt', 'desc'))
  } else {
    q = query(q, orderBy('createdAt', 'desc'))
  }

  // ページネーション
  if (lastDoc) {
    q = query(q, startAfter(lastDoc))
  }

  q = query(q, limit(limitCount))

  const snapshot = await getDocs(q)

  const patterns = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  })) as CustomPattern[]

  return {
    patterns,
    lastDoc: snapshot.docs[snapshot.docs.length - 1] || null,
  }
}

// 自分のパターン一覧
export async function getMyPatterns(): Promise<CustomPattern[]> {
  const user = auth.currentUser
  if (!user) throw new Error('Not authenticated')

  const q = query(
    patternsRef,
    where('userId', '==', user.uid),
    orderBy('createdAt', 'desc')
  )

  const snapshot = await getDocs(q)

  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  })) as CustomPattern[]
}

// パターン更新
export async function updatePattern(
  patternId: string,
  updates: Partial<Omit<CustomPattern, 'id' | 'userId'>>
) {
  const user = auth.currentUser
  if (!user) throw new Error('Not authenticated')

  // 権限チェック
  const pattern = await getPattern(patternId)
  if (!pattern || pattern.userId !== user.uid) {
    throw new Error('Unauthorized')
  }

  await updateDoc(doc(db, 'patterns', patternId), {
    ...updates,
    updatedAt: serverTimestamp(),
  })
}

// パターン削除
export async function deletePattern(patternId: string) {
  const user = auth.currentUser
  if (!user) throw new Error('Not authenticated')

  // 権限チェック
  const pattern = await getPattern(patternId)
  if (!pattern || pattern.userId !== user.uid) {
    throw new Error('Unauthorized')
  }

  await deleteDoc(doc(db, 'patterns', patternId))
}

// いいね追加
export async function likePattern(patternId: string) {
  const user = auth.currentUser
  if (!user) throw new Error('Not authenticated')

  const batch = writeBatch(db)

  // likedBy サブコレクションに追加
  const likeRef = doc(db, 'patterns', patternId, 'likedBy', user.uid)
  batch.set(likeRef, {
    likedAt: serverTimestamp(),
  })

  // likes カウント+1
  const patternRef = doc(db, 'patterns', patternId)
  batch.update(patternRef, {
    likes: increment(1),
  })

  await batch.commit()
}

// いいね削除
export async function unlikePattern(patternId: string) {
  const user = auth.currentUser
  if (!user) throw new Error('Not authenticated')

  const batch = writeBatch(db)

  // likedBy サブコレクションから削除
  const likeRef = doc(db, 'patterns', patternId, 'likedBy', user.uid)
  batch.delete(likeRef)

  // likes カウント-1
  const patternRef = doc(db, 'patterns', patternId)
  batch.update(patternRef, {
    likes: increment(-1),
  })

  await batch.commit()
}

// いいね状態確認
export async function isLikedByMe(patternId: string): Promise<boolean> {
  const user = auth.currentUser
  if (!user) return false

  const likeDoc = await getDoc(
    doc(db, 'patterns', patternId, 'likedBy', user.uid)
  )
  return likeDoc.exists()
}

// ダウンロード数カウント
export async function incrementDownloads(patternId: string) {
  await updateDoc(doc(db, 'patterns', patternId), {
    downloads: increment(1),
  })
}
```

## 5. Firebase Storage操作

### 5.1 画像アップロード

```typescript
// src/lib/storage.ts
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { storage } from './firebase'

// Canvas → Blob変換
export async function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(blob => {
      if (blob) resolve(blob)
      else reject(new Error('Canvas to Blob conversion failed'))
    }, 'image/png')
  })
}

// プレビュー画像アップロード
export async function uploadPreviewImage(
  patternId: string,
  canvas: HTMLCanvasElement
): Promise<string> {
  const blob = await canvasToBlob(canvas)
  const storageRef = ref(storage, `previews/${patternId}.png`)

  await uploadBytes(storageRef, blob, {
    contentType: 'image/png',
    cacheControl: 'public, max-age=31536000', // 1年キャッシュ
  })

  return getDownloadURL(storageRef)
}

// 画像削除
export async function deletePreviewImage(patternId: string) {
  const storageRef = ref(storage, `previews/${patternId}.png`)
  await deleteObject(storageRef)
}
```

## 6. リアルタイムリスナー

### 6.1 パターン一覧のリアルタイム監視

```typescript
// src/hooks/useRealtimePatterns.ts
import { useEffect, useState } from 'react'
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import type { CustomPattern } from '@/types/customPattern'

export function useRealtimePatterns(limitCount: number = 20) {
  const [patterns, setPatterns] = useState<CustomPattern[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    const q = query(
      collection(db, 'patterns'),
      where('isPublic', '==', true),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    )

    const unsubscribe = onSnapshot(
      q,
      snapshot => {
        const newPatterns = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        })) as CustomPattern[]

        setPatterns(newPatterns)
        setLoading(false)
      },
      err => {
        setError(err as Error)
        setLoading(false)
      }
    )

    return () => unsubscribe()
  }, [limitCount])

  return { patterns, loading, error }
}
```

### 6.2 いいね数のリアルタイム更新

```typescript
// src/hooks/useRealtimePattern.ts
import { useEffect, useState } from 'react'
import { doc, onSnapshot } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import type { CustomPattern } from '@/types/customPattern'

export function useRealtimePattern(patternId: string) {
  const [pattern, setPattern] = useState<CustomPattern | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, 'patterns', patternId), doc => {
      if (doc.exists()) {
        setPattern({ id: doc.id, ...doc.data() } as CustomPattern)
      } else {
        setPattern(null)
      }
      setLoading(false)
    })

    return () => unsubscribe()
  }, [patternId])

  return { pattern, loading }
}
```

## 7. Zustandとの統合

```typescript
// src/stores/patternStore.ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { CustomPattern } from '@/types/customPattern'
import { createPattern, uploadPreviewImage } from '@/lib/patterns'

interface PatternState {
  localPatterns: CustomPattern[]
  currentDraft: CustomPattern | null

  addLocalPattern: (pattern: CustomPattern) => void
  setCurrentDraft: (draft: CustomPattern | null) => void

  // Firebaseへアップロード
  uploadPattern: (
    pattern: CustomPattern,
    canvas: HTMLCanvasElement
  ) => Promise<string>
}

export const usePatternStore = create<PatternState>()(
  persist(
    (set, get) => ({
      localPatterns: [],
      currentDraft: null,

      addLocalPattern: pattern =>
        set(state => ({
          localPatterns: [...state.localPatterns, pattern],
        })),

      setCurrentDraft: draft => set({ currentDraft: draft }),

      uploadPattern: async (pattern, canvas) => {
        // 1. Firestoreにパターン作成
        const patternId = await createPattern(pattern)

        // 2. プレビュー画像アップロード
        const previewImageUrl = await uploadPreviewImage(patternId, canvas)

        // 3. パターン更新（画像URL追加）
        await updateDoc(doc(db, 'patterns', patternId), {
          previewImageUrl,
        })

        return patternId
      },
    }),
    {
      name: 'pattern-storage',
      partialize: state => ({ localPatterns: state.localPatterns }),
    }
  )
)
```

## 8. ローカル開発（Emulator）

### 8.1 Emulator起動

```bash
# Emulator起動
firebase emulators:start

# 起動するEmulator:
# - Authentication: http://127.0.0.1:9099
# - Firestore: http://127.0.0.1:8080
# - Storage: http://127.0.0.1:9199
# - Emulator UI: http://127.0.0.1:4000
```

### 8.2 テストデータ投入

Emulator UI（http://127.0.0.1:4000）から:

1. Firestore → Start collection
2. Collection ID: `patterns`
3. Document ID: Auto-ID
4. フィールド追加

または、スクリプトで投入:

```typescript
// scripts/seed-data.ts
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../src/lib/firebase'

async function seedData() {
  const patterns = [
    {
      userId: 'test-user-1',
      name: 'テスト笑顔',
      expressionType: 'smile',
      deviceType: 'tablet',
      color: '#FFFF00',
      gridData: [
        [1, 0, 1],
        [0, 1, 0],
      ],
      isPublic: true,
      downloads: 10,
      likes: 5,
      tags: ['かわいい'],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    },
    // ... 他のテストデータ
  ]

  for (const pattern of patterns) {
    await addDoc(collection(db, 'patterns'), pattern)
  }

  console.log('✅ Test data seeded')
}

seedData()
```

## 9. デプロイ

### 9.1 セキュリティルール確認

```bash
# firestore.rulesとstorage.rulesが正しいか確認
cat firestore.rules
cat storage.rules
```

### 9.2 ビルド

```bash
npm run build
# または
bun run build
```

### 9.3 デプロイ

```bash
# 全てデプロイ
firebase deploy

# または個別に
firebase deploy --only firestore:rules  # Firestoreルールのみ
firebase deploy --only storage:rules    # Storageルールのみ
firebase deploy --only hosting          # Hostingのみ

# 成功メッセージ:
# ✔ Deploy complete!
#
# Hosting URL: https://rina-chan-board.web.app
```

## 10. GitHub Actions CI/CD

```yaml
# .github/workflows/firebase-deploy.yml
name: Deploy to Firebase

on:
  push:
    branches:
      - main

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run build
        env:
          VITE_FIREBASE_API_KEY: ${{ secrets.VITE_FIREBASE_API_KEY }}
          VITE_FIREBASE_AUTH_DOMAIN: ${{ secrets.VITE_FIREBASE_AUTH_DOMAIN }}
          VITE_FIREBASE_PROJECT_ID: ${{ secrets.VITE_FIREBASE_PROJECT_ID }}
          VITE_FIREBASE_STORAGE_BUCKET: ${{ secrets.VITE_FIREBASE_STORAGE_BUCKET }}
          VITE_FIREBASE_MESSAGING_SENDER_ID: ${{ secrets.VITE_FIREBASE_MESSAGING_SENDER_ID }}
          VITE_FIREBASE_APP_ID: ${{ secrets.VITE_FIREBASE_APP_ID }}

      - name: Deploy to Firebase
        uses: FirebaseExtended/action-hosting-deploy@v0
        with:
          repoToken: '${{ secrets.GITHUB_TOKEN }}'
          firebaseServiceAccount: '${{ secrets.FIREBASE_SERVICE_ACCOUNT }}'
          projectId: rina-chan-board
          channelId: live
```

### GitHub Secrets設定

1. GitHubリポジトリ → Settings → Secrets and variables → Actions
2. 以下を追加:
   - `VITE_FIREBASE_API_KEY`
   - `VITE_FIREBASE_AUTH_DOMAIN`
   - `VITE_FIREBASE_PROJECT_ID`
   - `VITE_FIREBASE_STORAGE_BUCKET`
   - `VITE_FIREBASE_MESSAGING_SENDER_ID`
   - `VITE_FIREBASE_APP_ID`
   - `FIREBASE_SERVICE_ACCOUNT`（Firebase Consoleから生成）

## まとめ

これでFirebase/Firestoreの実装が完了です！

✅ Authentication（GitHub OAuth）
✅ Firestore（パターンDB）
✅ Storage（画像）
✅ Hosting（デプロイ）
✅ CI/CD（GitHub Actions）

次のステップ:

- フロントエンドUIの実装（`frontend-design.md`参照）
- ドットエディタコンポーネント作成
- ギャラリーUI実装
