import { StrictMode, lazy, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './index.css'
import './i18n'
import App from './App.tsx'

const AdminApp = lazy(() => import('./admin/AdminApp'))
const RoomBrowse = lazy(() => import('./components/RoomBrowse/RoomBrowse'))
const RoomDetail = lazy(() => import('./components/RoomBrowse/RoomDetail'))
const MyRooms = lazy(() => import('./components/RoomLog/MyRooms'))

createRoot(document.getElementById('root')!).render(
  <StrictMode>
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
        <Route path="/*" element={<App />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
