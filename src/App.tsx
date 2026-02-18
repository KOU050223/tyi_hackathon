import { lazy, Suspense } from "react";
import { Routes, Route } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { useAuthInit } from "@/hooks/useAuthInit";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { useAsciiArt } from "./hooks/useAsciiArt";

const HomePage = lazy(() => import("@/pages/HomePage"));
const FaceDetectionPage = lazy(() => import("@/pages/FaceDetectionPage"));
const VoiceEmotionPage = lazy(() => import("@/pages/VoiceEmotionPage"));
const ExpressionsPage = lazy(() => import("@/pages/ExpressionsPage"));
const DotEditorPage = lazy(() => import("@/pages/DotEditorPage"));
const GalleryPage = lazy(() => import("@/pages/GalleryPage"));
const DisplayPage = lazy(() => import("@/pages/DisplayPage"));
const ProfilePage = lazy(() => import("@/pages/ProfilePage"));

function App() {
  useAuthInit();
  useAsciiArt();

  return (
    <Layout>
      <Suspense fallback={<div className="loading-page">読み込み中...</div>}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/face" element={<FaceDetectionPage />} />
          <Route path="/voice" element={<VoiceEmotionPage />} />
          <Route path="/expressions" element={<ExpressionsPage />} />
          <Route path="/editor" element={<DotEditorPage />} />
          <Route path="/editor/:id" element={<DotEditorPage />} />
          <Route path="/gallery" element={<GalleryPage />} />
          <Route path="/display/:patternId" element={<DisplayPage />} />
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
  );
}

export default App;
