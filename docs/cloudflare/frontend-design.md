# フロントエンド設計書

## 概要

React 19 + TypeScript + Zustandを使用したフロントエンド設計。
ドットエディタ、ギャラリー、GitHub OAuth認証機能を実装。

## ディレクトリ構成

```
src/
├── components/               # Reactコンポーネント
│   ├── DotEditor/           # ドットエディタ機能
│   │   ├── DotEditorCanvas.tsx    # メインエディタコンポーネント
│   │   ├── DotGrid.tsx            # グリッド編集UI
│   │   ├── ColorPicker.tsx        # カラーピッカー
│   │   ├── ToolBar.tsx            # ツールバー（ペン/消しゴム等）
│   │   ├── ExpressionSelector.tsx # 表情タイプ選択
│   │   ├── DeviceTypeSelector.tsx # デバイスタイプ選択
│   │   ├── PreviewPane.tsx        # リアルタイムプレビュー
│   │   └── SaveDialog.tsx         # 保存ダイアログ
│   ├── PatternGallery/      # ギャラリー機能
│   │   ├── GalleryGrid.tsx        # パターン一覧グリッド
│   │   ├── PatternCard.tsx        # 個別パターンカード
│   │   ├── FilterBar.tsx          # フィルタ/検索バー
│   │   ├── SortSelector.tsx       # ソート選択
│   │   ├── PatternDetail.tsx      # 詳細モーダル
│   │   └── UploadButton.tsx       # クラウドアップロード
│   ├── Auth/                # 認証関連
│   │   ├── LoginButton.tsx        # GitHub OAuth ログイン
│   │   ├── UserProfile.tsx        # ユーザープロフィール
│   │   └── AuthGuard.tsx          # 認証ガード
│   └── common/              # 共通コンポーネント
│       ├── Button.tsx
│       ├── Modal.tsx
│       ├── Toast.tsx
│       └── Loading.tsx
├── stores/                  # Zustand ストア
│   ├── patternStore.ts      # カスタムパターン管理
│   ├── galleryStore.ts      # ギャラリー状態
│   ├── authStore.ts         # 認証状態
│   └── uiStore.ts           # UI状態（モーダル等）
├── hooks/                   # カスタムフック（既存）
│   ├── useCamera.ts
│   ├── useFaceDetection.ts
│   ├── useDeviceType.ts
│   └── useApi.ts            # 新規: API通信フック
├── utils/                   # ユーティリティ
│   ├── patternSerializer.ts # パターンJSON変換
│   ├── patternValidator.ts  # バリデーション
│   ├── canvasToImage.ts     # Canvas→画像変換
│   └── api.ts               # API クライアント
├── types/                   # TypeScript型定義
│   ├── customPattern.ts     # カスタムパターン型
│   ├── gallery.ts           # ギャラリー型
│   ├── auth.ts              # 認証型
│   └── api.ts               # APIレスポンス型
├── styles/                  # スタイル
│   ├── main.css
│   └── editor.css           # エディタ専用スタイル
└── App.tsx                  # ルートコンポーネント
```

## 型定義

### src/types/customPattern.ts

```typescript
import type { Expression } from "./expression";

export interface CustomPattern {
  id?: number;
  userId?: number;
  name: string;
  expressionType: Expression;
  deviceType: "smartphone" | "tablet";
  color: string; // #RRGGBB
  gridData: number[][]; // 0と1の2次元配列
  previewImageUrl?: string;
  isPublic: boolean;
  downloads?: number;
  likes?: number;
  createdAt?: string;
  updatedAt?: string;
  author?: {
    id: number;
    githubUsername: string;
    avatarUrl?: string;
  };
  tags?: string[];
}

export interface PatternDraft {
  name: string;
  expressionType: Expression;
  deviceType: "smartphone" | "tablet";
  color: string;
  gridData: number[][];
  isPublic: boolean;
  tags: string[];
}
```

### src/types/gallery.ts

```typescript
export interface GalleryFilter {
  expressionType?: Expression;
  deviceType?: "smartphone" | "tablet";
  sortBy: "latest" | "popular" | "downloads";
  tags?: string[];
  search?: string;
}

export interface GalleryResponse {
  patterns: CustomPattern[];
  pagination: {
    page: number;
    perPage: number;
    total: number;
    totalPages: number;
  };
}
```

### src/types/auth.ts

```typescript
export interface User {
  id: number;
  githubId: number;
  githubUsername: string;
  avatarUrl?: string;
  createdAt: string;
}

export interface AuthResponse {
  success: boolean;
  token?: string;
  user?: User;
  error?: string;
}
```

## Zustandストア設計

### src/stores/patternStore.ts

```typescript
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CustomPattern, PatternDraft } from "@/types/customPattern";
import { uploadPattern, downloadPattern } from "@/utils/api";

interface PatternState {
  // ローカル保存されたパターン
  localPatterns: CustomPattern[];

  // 現在編集中のパターン
  currentDraft: PatternDraft | null;

  // 編集モード
  isEditing: boolean;

  // アクション
  addLocalPattern: (pattern: CustomPattern) => void;
  updateLocalPattern: (id: number, pattern: Partial<CustomPattern>) => void;
  deleteLocalPattern: (id: number) => void;

  setCurrentDraft: (draft: PatternDraft | null) => void;
  updateDraft: (updates: Partial<PatternDraft>) => void;

  // クラウド連携
  uploadToCloud: (pattern: CustomPattern) => Promise<void>;
  downloadFromCloud: (id: number) => Promise<void>;
}

export const usePatternStore = create<PatternState>()(
  persist(
    (set, get) => ({
      localPatterns: [],
      currentDraft: null,
      isEditing: false,

      addLocalPattern: (pattern) =>
        set((state) => ({
          localPatterns: [...state.localPatterns, { ...pattern, id: Date.now() }],
        })),

      updateLocalPattern: (id, updates) =>
        set((state) => ({
          localPatterns: state.localPatterns.map((p) => (p.id === id ? { ...p, ...updates } : p)),
        })),

      deleteLocalPattern: (id) =>
        set((state) => ({
          localPatterns: state.localPatterns.filter((p) => p.id !== id),
        })),

      setCurrentDraft: (draft) => set({ currentDraft: draft, isEditing: !!draft }),

      updateDraft: (updates) =>
        set((state) => ({
          currentDraft: state.currentDraft ? { ...state.currentDraft, ...updates } : null,
        })),

      uploadToCloud: async (pattern) => {
        const result = await uploadPattern(pattern);
        // アップロード成功後、ローカルパターンに追加
        set((state) => ({
          localPatterns: [...state.localPatterns, result],
        }));
      },

      downloadFromCloud: async (id) => {
        const pattern = await downloadPattern(id);
        set((state) => ({
          localPatterns: [...state.localPatterns, pattern],
        }));
      },
    }),
    {
      name: "pattern-storage",
      partialize: (state) => ({
        localPatterns: state.localPatterns,
      }),
    },
  ),
);
```

### src/stores/galleryStore.ts

```typescript
import { create } from "zustand";
import type { CustomPattern, GalleryFilter } from "@/types/customPattern";
import { fetchPatterns } from "@/utils/api";

interface GalleryState {
  patterns: CustomPattern[];
  filter: GalleryFilter;
  isLoading: boolean;
  error: string | null;
  pagination: {
    page: number;
    perPage: number;
    total: number;
    totalPages: number;
  };

  setFilter: (filter: Partial<GalleryFilter>) => void;
  loadPatterns: () => Promise<void>;
  loadMore: () => Promise<void>;
  likePattern: (id: number) => Promise<void>;
  resetGallery: () => void;
}

export const useGalleryStore = create<GalleryState>((set, get) => ({
  patterns: [],
  filter: {
    sortBy: "latest",
  },
  isLoading: false,
  error: null,
  pagination: {
    page: 1,
    perPage: 20,
    total: 0,
    totalPages: 0,
  },

  setFilter: (newFilter) =>
    set((state) => ({
      filter: { ...state.filter, ...newFilter },
      pagination: { ...state.pagination, page: 1 },
    })),

  loadPatterns: async () => {
    set({ isLoading: true, error: null });
    try {
      const { patterns, pagination } = await fetchPatterns(get().filter, get().pagination.page);
      set({ patterns, pagination, isLoading: false });
    } catch (error) {
      set({ error: error.message, isLoading: false });
    }
  },

  loadMore: async () => {
    const { pagination } = get();
    if (pagination.page >= pagination.totalPages) return;

    set({ isLoading: true });
    try {
      const { patterns: newPatterns, pagination: newPagination } = await fetchPatterns(
        get().filter,
        pagination.page + 1,
      );
      set((state) => ({
        patterns: [...state.patterns, ...newPatterns],
        pagination: newPagination,
        isLoading: false,
      }));
    } catch (error) {
      set({ error: error.message, isLoading: false });
    }
  },

  likePattern: async (id) => {
    // API呼び出し + 楽観的更新
    set((state) => ({
      patterns: state.patterns.map((p) => (p.id === id ? { ...p, likes: (p.likes || 0) + 1 } : p)),
    }));
  },

  resetGallery: () =>
    set({
      patterns: [],
      pagination: { page: 1, perPage: 20, total: 0, totalPages: 0 },
    }),
}));
```

### src/stores/authStore.ts

```typescript
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User } from "@/types/auth";

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;

  setAuth: (user: User, token: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      setAuth: (user, token) =>
        set({
          user,
          token,
          isAuthenticated: true,
        }),

      logout: () =>
        set({
          user: null,
          token: null,
          isAuthenticated: false,
        }),
    }),
    {
      name: "auth-storage",
    },
  ),
);
```

## 主要コンポーネント設計

### 1. DotEditorCanvas（ドットエディタのメイン）

```typescript
// src/components/DotEditor/DotEditorCanvas.tsx
import { useState, useRef, useCallback } from 'react'
import { usePatternStore } from '@/stores/patternStore'
import DotGrid from './DotGrid'
import ColorPicker from './ColorPicker'
import ToolBar from './ToolBar'
import PreviewPane from './PreviewPane'
import SaveDialog from './SaveDialog'

type Tool = 'pen' | 'eraser' | 'fill'

export default function DotEditorCanvas() {
  const { currentDraft, updateDraft } = usePatternStore()
  const [selectedTool, setSelectedTool] = useState<Tool>('pen')
  const [gridSize, setGridSize] = useState({ rows: 10, cols: 12 })
  const [showSaveDialog, setShowSaveDialog] = useState(false)

  const handleCellClick = useCallback((row: number, col: number) => {
    if (!currentDraft) return

    const newGrid = [...currentDraft.gridData]
    if (selectedTool === 'pen') {
      newGrid[row][col] = 1
    } else if (selectedTool === 'eraser') {
      newGrid[row][col] = 0
    }

    updateDraft({ gridData: newGrid })
  }, [currentDraft, selectedTool, updateDraft])

  return (
    <div className="flex gap-4">
      {/* 左パネル: ツール */}
      <div className="w-64 space-y-4">
        <ToolBar
          selectedTool={selectedTool}
          onToolChange={setSelectedTool}
        />
        <ColorPicker
          color={currentDraft?.color || '#00FF00'}
          onChange={(color) => updateDraft({ color })}
        />
        <button
          onClick={() => setShowSaveDialog(true)}
          className="btn btn-primary w-full"
        >
          保存
        </button>
      </div>

      {/* 中央: グリッド */}
      <div className="flex-1">
        <DotGrid
          gridData={currentDraft?.gridData || []}
          color={currentDraft?.color || '#00FF00'}
          onCellClick={handleCellClick}
        />
      </div>

      {/* 右パネル: プレビュー */}
      <div className="w-64">
        <PreviewPane pattern={currentDraft} />
      </div>

      {/* 保存ダイアログ */}
      {showSaveDialog && (
        <SaveDialog
          pattern={currentDraft}
          onClose={() => setShowSaveDialog(false)}
        />
      )}
    </div>
  )
}
```

### 2. DotGrid（グリッド編集UI）

```typescript
// src/components/DotEditor/DotGrid.tsx
import { memo } from 'react'

interface DotGridProps {
  gridData: number[][]
  color: string
  onCellClick: (row: number, col: number) => void
}

function DotGrid({ gridData, color, onCellClick }: DotGridProps) {
  const cellSize = 24 // ピクセル

  return (
    <div
      className="grid gap-1 p-4 border-2 border-green-500"
      style={{
        gridTemplateColumns: `repeat(${gridData[0]?.length || 12}, ${cellSize}px)`
      }}
    >
      {gridData.map((row, rowIndex) =>
        row.map((cell, colIndex) => (
          <button
            key={`${rowIndex}-${colIndex}`}
            className="aspect-square border border-gray-700 hover:border-white transition-colors"
            style={{
              backgroundColor: cell === 1 ? color : 'transparent'
            }}
            onClick={() => onCellClick(rowIndex, colIndex)}
          />
        ))
      )}
    </div>
  )
}

export default memo(DotGrid)
```

### 3. GalleryGrid（ギャラリー一覧）

```typescript
// src/components/PatternGallery/GalleryGrid.tsx
import { useEffect } from 'react'
import { useGalleryStore } from '@/stores/galleryStore'
import PatternCard from './PatternCard'
import FilterBar from './FilterBar'
import Loading from '@/components/common/Loading'

export default function GalleryGrid() {
  const { patterns, isLoading, error, loadPatterns, loadMore } = useGalleryStore()

  useEffect(() => {
    loadPatterns()
  }, [])

  if (error) return <div className="text-red-500">エラー: {error}</div>

  return (
    <div>
      <FilterBar />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-4">
        {patterns.map((pattern) => (
          <PatternCard key={pattern.id} pattern={pattern} />
        ))}
      </div>

      {isLoading && <Loading />}

      {!isLoading && patterns.length > 0 && (
        <button
          onClick={loadMore}
          className="btn btn-secondary mx-auto block mt-4"
        >
          もっと見る
        </button>
      )}
    </div>
  )
}
```

### 4. PatternCard（パターンカード）

```typescript
// src/components/PatternGallery/PatternCard.tsx
import { useState } from 'react'
import type { CustomPattern } from '@/types/customPattern'
import { useGalleryStore } from '@/stores/galleryStore'
import { useAuthStore } from '@/stores/authStore'

interface PatternCardProps {
  pattern: CustomPattern
}

export default function PatternCard({ pattern }: PatternCardProps) {
  const { likePattern } = useGalleryStore()
  const { isAuthenticated } = useAuthStore()
  const [isLiked, setIsLiked] = useState(false)

  const handleLike = async () => {
    if (!isAuthenticated) {
      alert('いいねするにはログインが必要です')
      return
    }

    await likePattern(pattern.id!)
    setIsLiked(true)
  }

  return (
    <div className="border-2 border-green-500 p-4 rounded-lg hover:border-yellow-400 transition-colors">
      {/* プレビュー画像 */}
      {pattern.previewImageUrl && (
        <img
          src={pattern.previewImageUrl}
          alt={pattern.name}
          className="w-full aspect-square object-contain pixel-art mb-2"
        />
      )}

      {/* 情報 */}
      <h3 className="text-lg font-bold text-green-400">{pattern.name}</h3>
      <p className="text-sm text-gray-400">by {pattern.author?.githubUsername}</p>

      {/* タグ */}
      <div className="flex gap-2 mt-2">
        {pattern.tags?.map((tag) => (
          <span key={tag} className="text-xs bg-gray-700 px-2 py-1 rounded">
            #{tag}
          </span>
        ))}
      </div>

      {/* アクション */}
      <div className="flex justify-between items-center mt-4">
        <button
          onClick={handleLike}
          disabled={isLiked}
          className={`btn btn-sm ${isLiked ? 'btn-disabled' : 'btn-primary'}`}
        >
          ♥ {pattern.likes || 0}
        </button>
        <span className="text-sm text-gray-400">
          DL: {pattern.downloads || 0}
        </span>
      </div>
    </div>
  )
}
```

## APIクライアント

### src/utils/api.ts

```typescript
import { useAuthStore } from "@/stores/authStore";
import type { CustomPattern, GalleryFilter, GalleryResponse } from "@/types/customPattern";

const API_BASE = import.meta.env.VITE_API_URL;

async function fetchWithAuth(url: string, options: RequestInit = {}) {
  const token = useAuthStore.getState().token;

  const headers = new Headers(options.headers);
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "API Error");
  }

  return response.json();
}

export async function fetchPatterns(
  filter: GalleryFilter,
  page: number = 1,
): Promise<GalleryResponse> {
  const params = new URLSearchParams({
    page: page.toString(),
    perPage: "20",
    sortBy: filter.sortBy,
    ...(filter.expressionType && { expressionType: filter.expressionType }),
    ...(filter.deviceType && { deviceType: filter.deviceType }),
    ...(filter.search && { search: filter.search }),
  });

  return fetchWithAuth(`/api/patterns?${params}`);
}

export async function uploadPattern(pattern: CustomPattern): Promise<CustomPattern> {
  return fetchWithAuth("/api/patterns", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(pattern),
  });
}

export async function downloadPattern(id: number): Promise<CustomPattern> {
  return fetchWithAuth(`/api/patterns/${id}`);
}

export async function likePattern(id: number): Promise<void> {
  return fetchWithAuth(`/api/patterns/${id}/like`, { method: "POST" });
}
```

## レスポンシブ対応

### Tailwind CSS ブレークポイント

```typescript
// tailwind.config.js
export default {
  theme: {
    extend: {
      screens: {
        xs: "375px", // スマホ
        sm: "640px", // タブレット縦
        md: "768px", // タブレット横
        lg: "1024px", // デスクトップ
        xl: "1280px", // 大画面
      },
    },
  },
};
```

### レスポンシブレイアウト

```typescript
// App.tsx
<div className="
  flex flex-col        /* モバイル: 縦並び */
  md:flex-row         /* タブレット以上: 横並び */
  gap-4
">
  <div className="
    w-full             /* モバイル: 100%幅 */
    md:w-64            /* タブレット以上: 固定幅 */
  ">
    {/* サイドバー */}
  </div>
  <div className="flex-1">
    {/* メインコンテンツ */}
  </div>
</div>
```

## パフォーマンス最適化

### React.memoの活用

```typescript
// DotGrid.tsx
export default memo(DotGrid, (prev, next) => {
  return prev.gridData === next.gridData && prev.color === next.color;
});
```

### 無限スクロール（Intersection Observer）

```typescript
// GalleryGrid.tsx
import { useEffect, useRef } from 'react'

const loadMoreRef = useRef<HTMLDivElement>(null)

useEffect(() => {
  const observer = new IntersectionObserver(
    (entries) => {
      if (entries[0].isIntersecting && !isLoading) {
        loadMore()
      }
    },
    { threshold: 0.5 }
  )

  if (loadMoreRef.current) {
    observer.observe(loadMoreRef.current)
  }

  return () => observer.disconnect()
}, [isLoading, loadMore])

return (
  <>
    {/* パターン一覧 */}
    <div ref={loadMoreRef} className="h-10" />
  </>
)
```
