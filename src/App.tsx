import { lazy, Suspense } from 'react'
import { Routes, Route } from 'react-router-dom'
import { Layout } from '@/components/layout/Layout'
import { useAuthInit } from '@/hooks/useAuthInit'
import { AuthGuard } from '@/components/auth/AuthGuard'

const FaceDetectionPage = lazy(() => import('@/pages/FaceDetectionPage'))
const DotEditorPage = lazy(() => import('@/pages/DotEditorPage'))
const GalleryPage = lazy(() => import('@/pages/GalleryPage'))
const ProfilePage = lazy(() => import('@/pages/ProfilePage'))

function App() {
  useAuthInit()

  return (
    <Layout>
      <Suspense fallback={<div className="loading-page">読み込み中...</div>}>
        <Routes>
          <Route path="/" element={<FaceDetectionPage />} />
          <Route path="/editor" element={<DotEditorPage />} />
          <Route path="/editor/:id" element={<DotEditorPage />} />
          <Route path="/gallery" element={<GalleryPage />} />
          <Route
            path="/profile"
            element={
              <AuthGuard>
                <ProfilePage />
              </AuthGuard>
            }
          />
        </Routes>
      </Suspense>
    </Layout>
  )
}

export default App
