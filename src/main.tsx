import { StrictMode, lazy, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './index.css'
import './i18n'
import App from './App.tsx'
import { LandingPage } from './components/Landing/LandingPage'
import { AppAuthProvider } from './lib/auth'

const AdminApp = lazy(() => import('./admin/AdminApp'))
const RoomBrowse = lazy(() => import('./components/RoomBrowse/RoomBrowse'))
const RoomDetail = lazy(() => import('./components/RoomBrowse/RoomDetail'))
const MyRooms = lazy(() => import('./components/RoomLog/MyRooms'))
const LegalPage = lazy(() => import('./components/Legal/LegalPage').then(module => ({ default: module.LegalPage })))

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppAuthProvider>
      <BrowserRouter>
        <Routes>
          <Route
            path="/admin/*"
            element={
              <Suspense fallback={<div>Loading admin...</div>}>
                <AdminApp />
              </Suspense>
            }
          />
          <Route
            path="/rooms"
            element={
              <Suspense fallback={<div className="min-h-dvh bg-[#0a0a0f]" />}>
                <RoomBrowse />
              </Suspense>
            }
          />
          <Route
            path="/rooms/:id"
            element={
              <Suspense fallback={<div className="min-h-dvh bg-[#0a0a0f]" />}>
                <RoomDetail />
              </Suspense>
            }
          />
          <Route
            path="/my-rooms"
            element={
              <Suspense fallback={<div className="min-h-dvh bg-[#0a0a0f]" />}>
                <MyRooms />
              </Suspense>
            }
          />
          <Route
            path="/privacy"
            element={
              <Suspense fallback={<div className="min-h-dvh bg-[#0a0a0f]" />}>
                <LegalPage kind="privacy" />
              </Suspense>
            }
          />
          <Route
            path="/terms"
            element={
              <Suspense fallback={<div className="min-h-dvh bg-[#0a0a0f]" />}>
                <LegalPage kind="terms" />
              </Suspense>
            }
          />
          <Route path="/my-card" element={<App />} />
          <Route path="/app" element={<App />} />
          <Route path="/" element={<LandingPage />} />
          <Route path="/*" element={<App />} />
        </Routes>
      </BrowserRouter>
    </AppAuthProvider>
  </StrictMode>,
)
