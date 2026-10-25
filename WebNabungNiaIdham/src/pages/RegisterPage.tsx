import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { toast } from 'sonner'
import { Eye, EyeOff, UserPlus } from 'lucide-react'

export default function RegisterPage() {
  const navigate = useNavigate()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!fullName.trim()) {
      toast.error('Nama lengkap harus diisi.')
      return
    }
    if (!email || !password) {
      toast.error('Email dan password harus diisi.')
      return
    }
    if (password.length < 6) {
      toast.error('Password minimal 6 karakter.')
      return
    }
    if (password !== confirmPassword) {
      toast.error('Password tidak cocok.')
      return
    }

    setLoading(true)


const { data, error } = await supabase.auth.signUp({
  email,
  password,
  options: {
    data: {
      full_name: fullName.trim(),
    },
  },
})

if (error) {
  setLoading(false)
  toast.error(error.message)
  return
}

setLoading(false)

if (data.session) {
  toast.success('Akun berhasil dibuat!')
  navigate('/dashboard')
} else {
  toast.success('Akun dibuat! Cek emailmu untuk verifikasi.', {
    duration: 5000,
  })
  navigate('/login')
}
}

  return (
    <div className="animate-fade-in-up">
      <div className="card-static p-8">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-semibold" style={{ fontFamily: 'var(--font-heading)' }}>
            Buat Akun Baru
          </h2>
          <p className="text-sm mt-1" style={{ color: 'var(--color-text-muted)' }}>
            Mulai perjalanan menabung bersama pasanganmu
          </p>
        </div>

        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>
              Nama Lengkap
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="input-field"
              placeholder="Nama lengkapmu"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-field"
              placeholder="nama@email.com"
              required
              autoComplete="email"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field !pr-10"
                placeholder="Minimal 6 karakter"
                required
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2"
                style={{ color: 'var(--color-text-muted)' }}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>
              Konfirmasi Password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="input-field"
              placeholder="Ulangi password"
              required
              autoComplete="new-password"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full !py-3"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <UserPlus size={18} />
                Daftar
              </>
            )}
          </button>
        </form>

        <p className="text-center text-sm mt-6" style={{ color: 'var(--color-text-muted)' }}>
          Sudah punya akun?{' '}
          <Link to="/login" className="font-medium" style={{ color: 'var(--color-coffee-600)' }}>
            Masuk
          </Link>
        </p>
      </div>
    </div>
  )
}
