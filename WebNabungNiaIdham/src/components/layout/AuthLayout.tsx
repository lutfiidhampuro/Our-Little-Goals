import { Outlet, Navigate } from 'react-router-dom'
import { useAuthStore } from '../../stores/authStore'

export default function AuthLayout() {
  const { user, isLoading } = useAuthStore()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--color-surface)' }}>
        <div className="w-10 h-10 border-3 border-coffee-200 border-t-coffee-600 rounded-full animate-spin" />
      </div>
    )
  }

  if (user) return <Navigate to="/dashboard" replace />

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--color-surface)' }}>
      {/* Left decorative panel (desktop only) */}
      <div
        className="hidden lg:flex lg:w-1/2 items-center justify-center relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #6F4E37 0%, #3E2723 100%)' }}
      >
        <div className="relative z-10 text-center px-12 max-w-lg">
          <h1 className="text-4xl font-bold text-white mb-4" style={{ fontFamily: 'var(--font-heading)' }}>
            Our Little Goals
          </h1>
          <p className="text-cream-200 text-lg mb-2 italic" style={{ fontFamily: 'var(--font-heading)' }}>
            Small Savings, Big Memories.
          </p>
          <p className="text-cream-300/80 text-sm mt-6 leading-relaxed">
            Platform menabung bersama pasangan untuk mencapai tujuan dan membangun kenangan indah berdua.
          </p>
          <div className="mt-8 flex items-center justify-center gap-4 text-cream-300/60 text-sm">
            <span>💕</span>
            <span>Menabung Bersama</span>
            <span>•</span>
            <span>Wishlist Pribadi</span>
            <span>•</span>
            <span>Progress Tracking</span>
            <span>💕</span>
          </div>
        </div>

        {/* Decorative circles */}
        <div className="absolute -bottom-20 -left-20 w-60 h-60 rounded-full opacity-10 bg-white" />
        <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full opacity-10 bg-white" />
        <div className="absolute top-1/3 right-10 w-20 h-20 rounded-full opacity-5 bg-white" />
      </div>

      {/* Right auth form panel */}
      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">
          {/* Mobile header */}
          <div className="lg:hidden text-center mb-8">
            <h1 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-coffee-700)' }}>
              Our Little Goals
            </h1>
            <p className="text-sm mt-1 italic" style={{ color: 'var(--color-text-muted)', fontFamily: 'var(--font-heading)' }}>
              Small Savings, Big Memories.
            </p>
          </div>
          <Outlet />
        </div>
      </div>
    </div>
  )
}
