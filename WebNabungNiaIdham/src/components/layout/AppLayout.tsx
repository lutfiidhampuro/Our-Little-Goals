import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../stores/authStore'
import { supabase } from '../../lib/supabase'
import {
  LayoutDashboard,
  PiggyBank,
  Heart,
  Calendar,
  History,
  Shield,
  Bell,
  Settings,
  LogOut,
  Moon,
  Sun,
  Menu,
  X,
} from 'lucide-react'
import { useState } from 'react'

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/tabungan', icon: PiggyBank, label: 'Tabungan Bersama' },
  { to: '/wishlist', icon: Heart, label: 'Wishlist Saya' },
  { to: '/kalender', icon: Calendar, label: 'Kalender' },
  { to: '/riwayat', icon: History, label: 'Riwayat' },
]

const mobileNavItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Home' },
  { to: '/tabungan', icon: PiggyBank, label: 'Tabungan' },
  { to: '/wishlist', icon: Heart, label: 'Wishlist' },
  { to: '/kalender', icon: Calendar, label: 'Kalender' },
  { to: '/pengaturan', icon: Settings, label: 'Lainnya' },
]

export default function AppLayout() {
  const { profile, isTreasurer, isDarkMode, toggleDarkMode } = useAuthStore()
  const navigate = useNavigate()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const handleLogout = async () => {
    await supabase.auth.signOut()
    useAuthStore.getState().reset()
    navigate('/')
  }

  const unreadCount = 0 // Will be computed from notifications query

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--color-surface)' }}>
      {/* Desktop Sidebar */}
      <aside
        className="hidden lg:flex flex-col w-64 fixed top-0 left-0 h-full z-40 border-r"
        style={{
          background: 'var(--color-surface-card)',
          borderColor: 'var(--color-border-light)',
        }}
      >
        {/* Logo */}
        <div className="p-6 border-b" style={{ borderColor: 'var(--color-border-light)' }}>
          <h1
            className="text-xl cursor-pointer"
            style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-coffee-700)' }}
            onClick={() => navigate('/dashboard')}
          >
            Our Little Goals
          </h1>
          <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)', fontStyle: 'italic' }}>
            Small Savings, Big Memories
          </p>
        </div>

        {/* Profile Section */}
        <div className="px-4 py-4 border-b" style={{ borderColor: 'var(--color-border-light)' }}>
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm"
              style={{ background: 'var(--color-coffee-400)' }}
            >
              {profile?.full_name?.charAt(0)?.toUpperCase() || '?'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate" style={{ color: 'var(--color-text-primary)' }}>
                {profile?.full_name || 'Pengguna'}
              </p>
              <p className="text-xs truncate" style={{ color: 'var(--color-text-muted)' }}>
                {isTreasurer() ? '🏦 Bendahara Umum' : '💕 Partner'}
              </p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            >
              <item.icon size={18} />
              <span>{item.label}</span>
            </NavLink>
          ))}

          {isTreasurer() && (
            <NavLink
              to="/bendahara"
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            >
              <Shield size={18} />
              <span>Bendahara</span>
            </NavLink>
          )}

          <NavLink
            to="/notifikasi"
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
          >
            <Bell size={18} />
            <span>Notifikasi</span>
            {unreadCount > 0 && (
              <span className="ml-auto px-2 py-0.5 text-xs rounded-full bg-burgundy-500 text-white pulse-dot">
                {unreadCount}
              </span>
            )}
          </NavLink>

          <NavLink
            to="/pengaturan"
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
          >
            <Settings size={18} />
            <span>Pengaturan</span>
          </NavLink>
        </nav>

        {/* Bottom actions */}
        <div className="p-3 border-t space-y-1" style={{ borderColor: 'var(--color-border-light)' }}>
          <button
            onClick={toggleDarkMode}
            className="sidebar-link w-full"
          >
            {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
            <span>{isDarkMode ? 'Mode Terang' : 'Mode Gelap'}</span>
          </button>
          <button
            onClick={handleLogout}
            className="sidebar-link w-full hover:!bg-red-50 hover:!text-red-600"
          >
            <LogOut size={18} />
            <span>Keluar</span>
          </button>
        </div>
      </aside>

      {/* Mobile Header */}
      <header
        className="lg:hidden fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 h-14 border-b"
        style={{
          background: 'var(--color-surface-card)',
          borderColor: 'var(--color-border-light)',
        }}
      >
        <h1
          className="text-lg font-semibold"
          style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-coffee-700)' }}
        >
          Our Little Goals
        </h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/notifikasi')}
            className="p-2 rounded-lg relative"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-burgundy-500 pulse-dot" />
            )}
          </button>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-40" onClick={() => setMobileMenuOpen(false)}>
          <div className="absolute inset-0 bg-black/30" />
          <div
            className="absolute top-14 right-0 w-64 h-full shadow-lg p-4 space-y-1 animate-fade-in-up"
            style={{ background: 'var(--color-surface-card)' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Profile */}
            <div className="flex items-center gap-3 pb-3 mb-3 border-b" style={{ borderColor: 'var(--color-border-light)' }}>
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center text-white font-semibold text-sm"
                style={{ background: 'var(--color-coffee-400)' }}
              >
                {profile?.full_name?.charAt(0)?.toUpperCase() || '?'}
              </div>
              <div>
                <p className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
                  {profile?.full_name || 'Pengguna'}
                </p>
                <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                  {isTreasurer() ? '🏦 Bendahara' : '💕 Partner'}
                </p>
              </div>
            </div>

            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
                onClick={() => setMobileMenuOpen(false)}
              >
                <item.icon size={18} />
                <span>{item.label}</span>
              </NavLink>
            ))}

            {isTreasurer() && (
              <NavLink
                to="/bendahara"
                className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
                onClick={() => setMobileMenuOpen(false)}
              >
                <Shield size={18} />
                <span>Bendahara</span>
              </NavLink>
            )}

            <div className="pt-3 mt-3 border-t space-y-1" style={{ borderColor: 'var(--color-border-light)' }}>
              <button onClick={toggleDarkMode} className="sidebar-link w-full">
                {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
                <span>{isDarkMode ? 'Mode Terang' : 'Mode Gelap'}</span>
              </button>
              <button
                onClick={handleLogout}
                className="sidebar-link w-full hover:!bg-red-50 hover:!text-red-600"
              >
                <LogOut size={18} />
                <span>Keluar</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 lg:ml-64 pb-20 lg:pb-0 pt-14 lg:pt-0 min-h-screen">
        <div className="max-w-6xl mx-auto px-4 lg:px-8 py-6 lg:py-8">
          <Outlet />
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 flex items-center justify-around border-t py-1"
        style={{
          background: 'var(--color-surface-card)',
          borderColor: 'var(--color-border-light)',
        }}
      >
        {mobileNavItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => `bottom-nav-link ${isActive ? 'active' : ''}`}
          >
            <item.icon size={20} />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
