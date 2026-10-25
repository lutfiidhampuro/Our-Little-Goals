import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { supabase } from '../lib/supabase'
import { toast } from 'sonner'
import {
  Settings,
  User,
  Heart,
  Bell,
  Moon,
  Sun,
  Shield,
  LogOut,
  Copy,
  Check,
  KeyRound,
  Save,
  Users,
} from 'lucide-react'

export default function SettingsPage() {
  const navigate = useNavigate()
  const {
    user,
    profile,
    couple,
    coupleMember,
    isDarkMode,
    toggleDarkMode,
    fetchProfile,
    fetchCoupleData,
    reset,
  } = useAuthStore()

  // Profile fields
  const [fullName, setFullName] = useState(profile?.full_name || '')
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || '')
  const [savingProfile, setSavingProfile] = useState(false)

  // Notification preferences
  const [reminderEnabled, setReminderEnabled] = useState(true)
  const [reminderTime, setReminderTime] = useState('09:00')
  const [savingPrefs, setSavingPrefs] = useState(false)

  // Password change
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [savingPassword, setSavingPassword] = useState(false)

  // Copy code
  const [copiedCode, setCopiedCode] = useState(false)

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name)
      setAvatarUrl(profile.avatar_url || '')
    }
  }, [profile])

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    if (!fullName.trim()) {
      toast.error('Nama lengkap tidak boleh kosong.')
      return
    }

    setSavingProfile(true)
    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: fullName.trim(),
        avatar_url: avatarUrl.trim() || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id)

    setSavingProfile(false)

    if (error) {
      toast.error('Gagal memperbarui profil: ' + error.message)
      return
    }

    await fetchProfile()
    toast.success('Profil berhasil diperbarui!')
  }

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newPassword || newPassword.length < 6) {
      toast.error('Password baru minimal 6 karakter.')
      return
    }
    if (newPassword !== confirmPassword) {
      toast.error('Konfirmasi password tidak cocok.')
      return
    }

    setSavingPassword(true)
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    })
    setSavingPassword(false)

    if (error) {
      toast.error('Gagal mengganti password: ' + error.message)
      return
    }

    toast.success('Password berhasil diperbarui!')
    setNewPassword('')
    setConfirmPassword('')
  }

  const handleCopyInviteCode = () => {
    if (!couple?.invite_code) return
    navigator.clipboard.writeText(couple.invite_code)
    setCopiedCode(true)
    toast.success('Kode undangan disalin ke clipboard!')
    setTimeout(() => setCopiedCode(false), 2000)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    reset()
    toast.success('Sampai jumpa kembali!')
    navigate('/login')
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in-up">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2" style={{ fontFamily: 'var(--font-heading)' }}>
          <Settings className="text-coffee-600" size={26} />
          Pengaturan Akun & Aplikasi
        </h1>
        <p className="text-sm mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
          Kelola informasi profil, notifikasi, tema tampilan, dan data pasangan
        </p>
      </div>

      {/* 1. Profile Settings */}
      <div className="card-static p-6 space-y-4">
        <h3 className="font-semibold text-base text-gray-800 flex items-center gap-2" style={{ fontFamily: 'var(--font-heading)' }}>
          <User size={18} className="text-coffee-600" />
          Informasi Profil
        </h3>

        <form onSubmit={handleUpdateProfile} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold mb-1 text-gray-700">
                Nama Lengkap
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="input-field text-sm"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1 text-gray-700">
                Email Akun (Read-only)
              </label>
              <input
                type="email"
                value={user?.email || ''}
                disabled
                className="input-field text-sm opacity-60 cursor-not-allowed bg-gray-50"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1 text-gray-700">
              URL Foto Avatar
            </label>
            <input
              type="url"
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              placeholder="https://..."
              className="input-field text-sm"
            />
          </div>

          <div className="flex items-center justify-between pt-2">
            <span className="text-xs text-gray-500">
              Peran: <strong className="text-coffee-700">{profile?.is_treasurer ? 'Partner & Bendahara Umum' : 'Partner'}</strong>
            </span>

            <button
              type="submit"
              className="btn-primary text-xs py-2 px-4 inline-flex items-center gap-1.5"
              disabled={savingProfile}
            >
              <Save size={14} />
              {savingProfile ? 'Menyimpan...' : 'Simpan Profil'}
            </button>
          </div>
        </form>
      </div>

      {/* 2. Couple Room Settings */}
      {couple && (
        <div className="card-static p-6 space-y-4">
          <h3 className="font-semibold text-base text-gray-800 flex items-center gap-2" style={{ fontFamily: 'var(--font-heading)' }}>
            <Heart size={18} className="text-pink-500 fill-pink-500" />
            Ruang Tabungan Pasangan
          </h3>

          <div className="p-4 rounded-xl border border-pink-200/80 bg-pink-50/40 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-xs text-gray-500">Nama Ruang:</span>
                <div className="font-bold text-base text-gray-800">{couple.name}</div>
              </div>

              <div className="bg-white p-2.5 rounded-xl border border-gray-200 flex items-center gap-3">
                <div>
                  <span className="text-[10px] text-gray-400 block font-medium">Kode Undangan Pasangan</span>
                  <span className="font-mono text-sm font-bold text-coffee-800 tracking-wider">
                    {couple.invite_code}
                  </span>
                </div>
                <button
                  onClick={handleCopyInviteCode}
                  className="btn-secondary text-xs py-1.5 px-2.5 inline-flex items-center gap-1"
                >
                  {copiedCode ? <Check size={14} className="text-green-600" /> : <Copy size={14} />}
                  {copiedCode ? 'Disalin' : 'Salin'}
                </button>
              </div>
            </div>

            <p className="text-xs text-gray-600 leading-relaxed">
              Bagikan kode undangan di atas kepada pasanganmu (Lutfi Idham Puro / Thania Al Zahra) agar dapat bergabung ke satu ruang tabungan yang sama.
            </p>
          </div>
        </div>
      )}

      {/* 3. Notification & Daily Habits */}
      <div className="card-static p-6 space-y-4">
        <h3 className="font-semibold text-base text-gray-800 flex items-center gap-2" style={{ fontFamily: 'var(--font-heading)' }}>
          <Bell size={18} className="text-coffee-600" />
          Pengingat Menabung Harian (Senin - Jumat)
        </h3>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold text-gray-800">
                Aktifkan Pengingat Harian
              </div>
              <p className="text-xs text-gray-500">
                Kirim pengingat setiap hari kerja agar kebiasaan menabung tetap konsisten.
              </p>
            </div>
            <input
              type="checkbox"
              checked={reminderEnabled}
              onChange={(e) => setReminderEnabled(e.target.checked)}
              className="w-5 h-5 accent-coffee-600 rounded cursor-pointer"
            />
          </div>

          {reminderEnabled && (
            <div className="flex items-center gap-3 pt-2">
              <label className="text-xs font-semibold text-gray-700">
                Waktu Pengingat:
              </label>
              <input
                type="time"
                value={reminderTime}
                onChange={(e) => setReminderTime(e.target.value)}
                className="input-field text-xs py-1.5 px-3 w-32"
              />
              <span className="text-xs text-gray-400">WIB</span>
            </div>
          )}
        </div>
      </div>

      {/* 4. Appearance & Dark Mode */}
      <div className="card-static p-6 space-y-4">
        <h3 className="font-semibold text-base text-gray-800 flex items-center gap-2" style={{ fontFamily: 'var(--font-heading)' }}>
          {isDarkMode ? <Moon size={18} /> : <Sun size={18} />}
          Tampilan & Tema
        </h3>

        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold text-gray-800">
              Mode Gelap (Dark Mode)
            </div>
            <p className="text-xs text-gray-500">
              Nuansa coffee dark mode yang nyaman dilihat saat malam hari.
            </p>
          </div>

          <button
            onClick={toggleDarkMode}
            className="btn-secondary text-xs py-2 px-3.5 inline-flex items-center gap-2"
          >
            {isDarkMode ? <Sun size={15} /> : <Moon size={15} />}
            {isDarkMode ? 'Beralih ke Terang' : 'Beralih ke Gelap'}
          </button>
        </div>
      </div>

      {/* 5. Security & Password */}
      <div className="card-static p-6 space-y-4">
        <h3 className="font-semibold text-base text-gray-800 flex items-center gap-2" style={{ fontFamily: 'var(--font-heading)' }}>
          <KeyRound size={18} className="text-coffee-600" />
          Keamanan & Kata Sandi
        </h3>

        <form onSubmit={handleUpdatePassword} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold mb-1 text-gray-700">
                Password Baru
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Minimal 6 karakter"
                className="input-field text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1 text-gray-700">
                Konfirmasi Password Baru
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Ulangi password baru"
                className="input-field text-sm"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="btn-secondary text-xs py-2 px-4"
              disabled={savingPassword || !newPassword}
            >
              {savingPassword ? 'Menyimpan...' : 'Ubah Kata Sandi'}
            </button>
          </div>
        </form>
      </div>

      {/* 6. Sign Out */}
      <div className="card-static p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-red-100 bg-red-50/20">
        <div>
          <div className="text-sm font-bold text-red-900">
            Keluar dari Sesi
          </div>
          <p className="text-xs text-red-700/80">
            Keluar dari akun Our Little Goals di perangkat ini.
          </p>
        </div>

        <button
          onClick={handleLogout}
          className="btn-danger text-xs py-2 px-4 inline-flex items-center gap-1.5 self-start sm:self-auto"
        >
          <LogOut size={15} />
          Keluar (Logout)
        </button>
      </div>
    </div>
  )
}
