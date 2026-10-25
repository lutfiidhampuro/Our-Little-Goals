import { useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { supabase } from './lib/supabase'
import { useAuthStore } from './stores/authStore'

// Layouts
import AppLayout from './components/layout/AppLayout'
import AuthLayout from './components/layout/AuthLayout'

// Pages
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import DashboardPage from './pages/DashboardPage'
import SavingsGoalsPage from './pages/SavingsGoalsPage'
import GoalDetailPage from './pages/GoalDetailPage'
import AddGoalPage from './pages/AddGoalPage'
import WishlistPage from './pages/WishlistPage'
import WishlistDetailPage from './pages/WishlistDetailPage'
import CalendarPage from './pages/CalendarPage'
import TransactionHistoryPage from './pages/TransactionHistoryPage'
import TreasurerPage from './pages/TreasurerPage'
import NotificationsPage from './pages/NotificationsPage'
import SettingsPage from './pages/SettingsPage'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuthStore()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--color-surface)' }}>
        <div className="text-center">
          <div className="w-10 h-10 border-3 border-coffee-200 border-t-coffee-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-coffee-400 text-sm">Memuat...</p>
        </div>
      </div>
    )
  }

  if (!user) return <Navigate to="/login" replace />
  return <>{children}</>
}

function TreasurerRoute({ children }: { children: React.ReactNode }) {
  const { isTreasurer } = useAuthStore()

  if (!isTreasurer()) {
    return <Navigate to="/dashboard" replace />
  }
  return <>{children}</>
}

export default function App() {
  const { setSession, setLoading, fetchProfile, fetchCoupleData, isDarkMode } = useAuthStore()

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark')
    }
  }, [isDarkMode])

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session) {
        fetchProfile()
        fetchCoupleData()
      }
      setLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session)
        if (session) {
          await fetchProfile()
          await fetchCoupleData()
        } else {
          useAuthStore.getState().reset()
        }
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<LandingPage />} />
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Route>

      {/* Protected routes */}
      <Route element={
        <ProtectedRoute>
          <AppLayout />
        </ProtectedRoute>
      }>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/tabungan" element={<SavingsGoalsPage />} />
        <Route path="/tabungan/:id" element={<GoalDetailPage />} />
        <Route path="/tabungan/tambah" element={<AddGoalPage />} />
        <Route path="/wishlist" element={<WishlistPage />} />
        <Route path="/wishlist/:id" element={<WishlistDetailPage />} />
        <Route path="/kalender" element={<CalendarPage />} />
        <Route path="/riwayat" element={<TransactionHistoryPage />} />
        <Route path="/bendahara" element={
          <TreasurerRoute>
            <TreasurerPage />
          </TreasurerRoute>
        } />
        <Route path="/notifikasi" element={<NotificationsPage />} />
        <Route path="/pengaturan" element={<SettingsPage />} />
      </Route>

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
