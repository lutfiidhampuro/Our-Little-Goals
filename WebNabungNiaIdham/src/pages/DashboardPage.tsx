import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { supabase } from '../lib/supabase'
import {
  formatRupiah,
  getProgress,
  MOTIVATIONAL_QUOTES,
  getJakartaDate,
  isWeekday,
  getCategoryEmoji,
  formatDateTime,
  type SavingsGoal,
  type SavingsContribution,
  type PersonalWishlist,
  type Couple,
} from '../lib/types'
import {
  PiggyBank,
  Target,
  TrendingUp,
  Calendar,
  Heart,
  ArrowRight,
  Plus,
  Flame,
  Users,
  Copy,
  Check,
} from 'lucide-react'
import { toast } from 'sonner'

export default function DashboardPage() {
  const { profile, couple, coupleMember, user } = useAuthStore()
  const navigate = useNavigate()

  const [goals, setGoals] = useState<SavingsGoal[]>([])
  const [wishlists, setWishlists] = useState<PersonalWishlist[]>([])
  const [recentTransactions, setRecentTransactions] = useState<(SavingsContribution & { profiles?: any; savings_goals?: any })[]>([])
  const [totalCoupleSavings, setTotalCoupleSavings] = useState(0)
  const [totalPersonalSavings, setTotalPersonalSavings] = useState(0)
  const [streak, setStreak] = useState(0)
  const [hasSavedToday, setHasSavedToday] = useState(false)
  const [loading, setLoading] = useState(true)
  const [inviteCode, setInviteCode] = useState('')
  const [joiningCouple, setJoiningCouple] = useState(false)
  const [showCreateCouple, setShowCreateCouple] = useState(false)
  const [coupleName, setCoupleName] = useState('')
  const [creatingCouple, setCreatingCouple] = useState(false)
  const [copiedCode, setCopiedCode] = useState(false)

  const quote = MOTIVATIONAL_QUOTES[Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length)]
  const jakartaDate = getJakartaDate()
  const isSavingDay = isWeekday(jakartaDate)
  const dayName = jakartaDate.toLocaleDateString('id-ID', { weekday: 'long' })

  useEffect(() => {
    if (couple) {
      fetchDashboardData()
    } else {
      setLoading(false)
    }
  }, [couple, user])

  const fetchDashboardData = async () => {
    if (!couple || !user) return
    setLoading(true)

    try {
      // Fetch goals
      const { data: goalsData } = await supabase
        .from('savings_goals')
        .select('*')
        .eq('couple_id', couple.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false })

      if (goalsData) setGoals(goalsData)

      // Fetch total couple savings (verified only)
      const { data: coupleContribs } = await supabase
        .from('savings_contributions')
        .select('amount')
        .eq('couple_id', couple.id)
        .eq('status', 'verified')

      if (coupleContribs) {
        setTotalCoupleSavings(coupleContribs.reduce((sum, c) => sum + c.amount, 0))
      }

      // Fetch wishlists
      const { data: wishlistData } = await supabase
        .from('personal_wishlists')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .order('priority', { ascending: true })
        .limit(3)

      if (wishlistData) setWishlists(wishlistData)

      // Fetch personal savings total
      const { data: personalSavings } = await supabase
        .from('personal_savings')
        .select('amount')
        .eq('user_id', user.id)

      if (personalSavings) {
        setTotalPersonalSavings(personalSavings.reduce((sum, s) => sum + s.amount, 0))
      }

      // Fetch recent transactions
      const { data: recentData } = await supabase
        .from('savings_contributions')
        .select('*, profiles:user_id(full_name), savings_goals:goal_id(name)')
        .eq('couple_id', couple.id)
        .order('created_at', { ascending: false })
        .limit(5)

      if (recentData) setRecentTransactions(recentData as any)

      // Check if user saved today
      const today = jakartaDate.toISOString().split('T')[0]
      const { data: todayActivity } = await supabase
        .from('daily_saving_activity')
        .select('*')
        .eq('user_id', user.id)
        .eq('date', today)
        .single()

      if (todayActivity) {
        setHasSavedToday(todayActivity.has_saved)
      }

      // Calculate streak
      const { data: activities } = await supabase
        .from('daily_saving_activity')
        .select('date, has_saved')
        .eq('user_id', user.id)
        .order('date', { ascending: false })
        .limit(30)

      if (activities) {
        let currentStreak = 0
        for (const act of activities) {
          if (act.has_saved) currentStreak++
          else break
        }
        setStreak(currentStreak)
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    }

    setLoading(false)
  }

  const handleCreateCouple = async () => {
    if (!coupleName.trim() || !user) return
    setCreatingCouple(true)

    const code = Math.random().toString(36).substring(2, 8).toUpperCase()

    const { data: coupleData, error: coupleError } = await supabase
      .from('couples')
      .insert({
        name: coupleName.trim(),
        invite_code: code,
        treasurer_id: null,
      })
      .select()
      .single()

    if (coupleError) {
      toast.error('Gagal membuat ruang tabungan: ' + coupleError.message)
      setCreatingCouple(false)
      return
    }

    // Add creator as member
    await supabase.from('couple_members').insert({
      couple_id: coupleData.id,
      user_id: user.id,
      role: 'partner',
    })

    toast.success('Ruang tabungan berhasil dibuat!')
    setCreatingCouple(false)
    setShowCreateCouple(false)

    // Refresh couple data
    await useAuthStore.getState().fetchCoupleData()
    window.location.reload()
  }

  const handleJoinCouple = async () => {
    if (!inviteCode.trim() || !user) return
    setJoiningCouple(true)

    const { data: coupleData, error: findError } = await supabase
      .from('couples')
      .select('*')
      .eq('invite_code', inviteCode.trim().toUpperCase())
      .single()

    if (findError || !coupleData) {
      toast.error('Kode undangan tidak ditemukan.')
      setJoiningCouple(false)
      return
    }

    // Check if already 2 members
    const { data: members } = await supabase
      .from('couple_members')
      .select('id')
      .eq('couple_id', coupleData.id)

    if (members && members.length >= 2) {
      toast.error('Ruang tabungan ini sudah penuh (2 anggota).')
      setJoiningCouple(false)
      return
    }

    // Join
    const { error: joinError } = await supabase.from('couple_members').insert({
      couple_id: coupleData.id,
      user_id: user.id,
      role: 'partner',
    })

    if (joinError) {
      toast.error('Gagal bergabung: ' + joinError.message)
      setJoiningCouple(false)
      return
    }

    toast.success('Berhasil bergabung!')
    setJoiningCouple(false)
    await useAuthStore.getState().fetchCoupleData()
    window.location.reload()
  }

  const copyInviteCode = () => {
    if (couple?.invite_code) {
      navigator.clipboard.writeText(couple.invite_code)
      setCopiedCode(true)
      toast.success('Kode undangan disalin!')
      setTimeout(() => setCopiedCode(false), 2000)
    }
  }

  // No couple - show setup
  if (!couple) {
    return (
      <div className="max-w-lg mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-semibold" style={{ fontFamily: 'var(--font-heading)' }}>
            Halo, {profile?.full_name?.split(' ')[0] || 'Partner'}! 👋
          </h2>
          <p className="mt-2" style={{ color: 'var(--color-text-secondary)' }}>
            Mulai dengan membuat ruang tabungan bersama atau bergabung ke ruang yang sudah ada.
          </p>
        </div>

        <div className="space-y-4">
          {/* Create couple */}
          <div className="card-static p-6">
            <h3 className="font-semibold mb-3" style={{ fontFamily: 'var(--font-heading)' }}>
              Buat Ruang Tabungan Baru
            </h3>
            {showCreateCouple ? (
              <div className="space-y-3">
                <input
                  type="text"
                  value={coupleName}
                  onChange={(e) => setCoupleName(e.target.value)}
                  className="input-field"
                  placeholder="Nama ruang tabungan (misal: Lutfi & Thania)"
                />
                <div className="flex gap-2">
                  <button onClick={handleCreateCouple} disabled={creatingCouple} className="btn-primary flex-1">
                    {creatingCouple ? 'Membuat...' : 'Buat'}
                  </button>
                  <button onClick={() => setShowCreateCouple(false)} className="btn-secondary">
                    Batal
                  </button>
                </div>
              </div>
            ) : (
              <button onClick={() => setShowCreateCouple(true)} className="btn-primary w-full">
                <Plus size={18} /> Buat Ruang Baru
              </button>
            )}
          </div>

          {/* Join couple */}
          <div className="card-static p-6">
            <h3 className="font-semibold mb-3" style={{ fontFamily: 'var(--font-heading)' }}>
              Bergabung ke Ruang yang Sudah Ada
            </h3>
            <div className="space-y-3">
              <input
                type="text"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                className="input-field text-center tracking-widest font-mono text-lg"
                placeholder="KODE"
                maxLength={6}
              />
              <button
                onClick={handleJoinCouple}
                disabled={joiningCouple || !inviteCode.trim()}
                className="btn-primary w-full"
              >
                {joiningCouple ? 'Bergabung...' : 'Bergabung'}
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="w-10 h-10 border-3 border-coffee-200 border-t-coffee-600 rounded-full animate-spin mx-auto mb-4" />
          <p style={{ color: 'var(--color-text-muted)' }}>Memuat dashboard...</p>
        </div>
      </div>
    )
  }

  const activeGoals = goals.filter((g) => g.status === 'active')
  const nearComplete = goals.filter((g) => getProgress(g.current_amount, g.target_amount) >= 75)

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Greeting & Quote */}
      <div>
        <h2 className="text-2xl lg:text-3xl font-semibold" style={{ fontFamily: 'var(--font-heading)' }}>
          Halo, {profile?.full_name?.split(' ')[0]}! 👋
        </h2>
        <p className="mt-1 text-sm italic" style={{ color: 'var(--color-text-muted)' }}>
          "{quote}"
        </p>
      </div>

      {/* Invite Code Banner */}
      {couple && (
        <div
          className="card-static p-4 flex items-center justify-between gap-3"
          style={{ background: 'var(--color-cream-100)' }}
        >
          <div className="flex items-center gap-3">
            <Users size={18} style={{ color: 'var(--color-coffee-400)' }} />
            <div>
              <p className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
                {couple.name}
              </p>
              <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                Kode undangan: <span className="font-mono font-bold">{couple.invite_code}</span>
              </p>
            </div>
          </div>
          <button onClick={copyInviteCode} className="btn-secondary !py-1.5 !px-3 text-xs">
            {copiedCode ? <Check size={14} /> : <Copy size={14} />}
            {copiedCode ? 'Disalin' : 'Salin'}
          </button>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card-static p-4">
          <div className="flex items-center gap-2 mb-2">
            <PiggyBank size={16} style={{ color: 'var(--color-coffee-400)' }} />
            <span className="text-xs font-medium" style={{ color: 'var(--color-text-muted)' }}>
              Tabungan Bersama
            </span>
          </div>
          <p className="text-lg font-bold" style={{ color: 'var(--color-coffee-700)' }}>
            {formatRupiah(totalCoupleSavings)}
          </p>
          <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>
            (catatan terverifikasi)
          </p>
        </div>

        <div className="card-static p-4">
          <div className="flex items-center gap-2 mb-2">
            <Heart size={16} style={{ color: 'var(--color-pink-500)' }} />
            <span className="text-xs font-medium" style={{ color: 'var(--color-text-muted)' }}>
              Tabungan Pribadi
            </span>
          </div>
          <p className="text-lg font-bold" style={{ color: 'var(--color-coffee-700)' }}>
            {formatRupiah(totalPersonalSavings)}
          </p>
        </div>

        <div className="card-static p-4">
          <div className="flex items-center gap-2 mb-2">
            <Target size={16} style={{ color: 'var(--color-success)' }} />
            <span className="text-xs font-medium" style={{ color: 'var(--color-text-muted)' }}>
              Target Aktif
            </span>
          </div>
          <p className="text-lg font-bold" style={{ color: 'var(--color-coffee-700)' }}>
            {activeGoals.length} tujuan
          </p>
        </div>

        <div className="card-static p-4">
          <div className="flex items-center gap-2 mb-2">
            <Flame size={16} style={{ color: 'var(--color-warning)' }} />
            <span className="text-xs font-medium" style={{ color: 'var(--color-text-muted)' }}>
              Streak
            </span>
          </div>
          <p className="text-lg font-bold" style={{ color: 'var(--color-coffee-700)' }}>
            {streak} hari 🔥
          </p>
        </div>
      </div>

      {/* Today's Status */}
      <div
        className="card-static p-5"
        style={{ background: isSavingDay ? 'var(--color-cream-100)' : 'var(--color-sage-50)' }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Calendar size={20} style={{ color: 'var(--color-coffee-400)' }} />
            <div>
              <p className="font-medium text-sm" style={{ color: 'var(--color-text-primary)' }}>
                {dayName}, Hari Ini
              </p>
              <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                {isSavingDay
                  ? hasSavedToday
                    ? '✅ Target harian selesai! Hebat!'
                    : '💰 Waktunya menabung hari ini'
                  : '☕ Weekend time! Istirahat dulu, Senin kita lanjut menabung.'}
              </p>
            </div>
          </div>
          {isSavingDay && !hasSavedToday && (
            <Link to="/tabungan" className="btn-primary text-sm !py-2">
              Mulai Menabung
            </Link>
          )}
        </div>
      </div>

      {/* Goals Near Complete & Active Goals */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Active Goals */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold" style={{ fontFamily: 'var(--font-heading)' }}>
              Target Tabungan
            </h3>
            <Link to="/tabungan" className="text-sm flex items-center gap-1" style={{ color: 'var(--color-coffee-600)' }}>
              Lihat semua <ArrowRight size={14} />
            </Link>
          </div>

          {activeGoals.length === 0 ? (
            <div className="card-static p-8 text-center">
              <Target size={32} className="mx-auto mb-3" style={{ color: 'var(--color-coffee-200)' }} />
              <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                Belum ada target tabungan.
              </p>
              <Link to="/tabungan/tambah" className="btn-primary text-sm mt-3 inline-flex">
                <Plus size={16} /> Tambah Target
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {activeGoals.slice(0, 3).map((goal) => {
                const progress = getProgress(goal.current_amount, goal.target_amount)
                return (
                  <Link
                    key={goal.id}
                    to={`/tabungan/${goal.id}`}
                    className="card p-4 block"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-medium text-sm">
                          {getCategoryEmoji(goal.category)} {goal.name}
                        </p>
                        <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                          {formatRupiah(goal.current_amount)} / {formatRupiah(goal.target_amount)}
                        </p>
                      </div>
                      <span className="text-sm font-semibold" style={{ color: progress >= 75 ? 'var(--color-success)' : 'var(--color-coffee-600)' }}>
                        {progress}%
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: 'var(--color-cream-200)' }}>
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${progress}%`,
                          background: progress >= 100 ? 'var(--color-success)' : progress >= 75 ? '#5B8C5A' : 'var(--color-coffee-400)',
                        }}
                      />
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </div>

        {/* Wishlist */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold" style={{ fontFamily: 'var(--font-heading)' }}>
              Wishlist Saya
            </h3>
            <Link to="/wishlist" className="text-sm flex items-center gap-1" style={{ color: 'var(--color-coffee-600)' }}>
              Lihat semua <ArrowRight size={14} />
            </Link>
          </div>

          {wishlists.length === 0 ? (
            <div className="card-static p-8 text-center">
              <Heart size={32} className="mx-auto mb-3" style={{ color: 'var(--color-pink-300)' }} />
              <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                Belum ada wishlist. Tambahkan keinginanmu!
              </p>
              <Link to="/wishlist" className="btn-primary text-sm mt-3 inline-flex">
                <Plus size={16} /> Buat Wishlist
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {wishlists.map((w) => {
                const progress = getProgress(w.current_amount, w.target_amount)
                return (
                  <Link
                    key={w.id}
                    to={`/wishlist/${w.id}`}
                    className="card p-4 block"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-medium text-sm">{w.name}</p>
                        <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                          {formatRupiah(w.current_amount)} / {formatRupiah(w.target_amount)}
                        </p>
                      </div>
                      <span className={`badge text-xs ${
                        w.priority === 'tinggi' ? 'badge-rejected' :
                        w.priority === 'sedang' ? 'badge-pending' : 'badge-verified'
                      }`}>
                        {w.priority}
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: 'var(--color-pink-100)' }}>
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${progress}%`, background: 'var(--color-pink-400)' }}
                      />
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Recent Transactions */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold" style={{ fontFamily: 'var(--font-heading)' }}>
            Transaksi Terbaru
          </h3>
          <Link to="/riwayat" className="text-sm flex items-center gap-1" style={{ color: 'var(--color-coffee-600)' }}>
            Lihat semua <ArrowRight size={14} />
          </Link>
        </div>

        {recentTransactions.length === 0 ? (
          <div className="card-static p-6 text-center">
            <TrendingUp size={28} className="mx-auto mb-2" style={{ color: 'var(--color-coffee-200)' }} />
            <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
              Belum ada transaksi.
            </p>
          </div>
        ) : (
          <div className="card-static divide-y" style={{ borderColor: 'var(--color-border-light)' }}>
            {recentTransactions.map((tx) => (
              <div key={tx.id} className="flex items-center justify-between px-4 py-3">
                <div>
                  <p className="text-sm font-medium">
                    {tx.profiles?.full_name || 'Pengguna'}
                  </p>
                  <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                    {tx.savings_goals?.name || 'Tabungan'} • {formatDateTime(tx.created_at)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold" style={{ color: 'var(--color-success)' }}>
                    +{formatRupiah(tx.amount)}
                  </p>
                  <span className={`badge text-xs ${
                    tx.status === 'verified' ? 'badge-verified' :
                    tx.status === 'pending' ? 'badge-pending' :
                    tx.status === 'rejected' ? 'badge-rejected' : 'badge-planned'
                  }`}>
                    {tx.status === 'verified' ? 'Terverifikasi' :
                     tx.status === 'pending' ? 'Menunggu' :
                     tx.status === 'rejected' ? 'Ditolak' : 'Direncanakan'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Disclaimer */}
      <div className="text-xs text-center py-4" style={{ color: 'var(--color-text-muted)' }}>
        ⚠️ Saldo yang ditampilkan merupakan catatan tabungan, bukan bukti saldo rekening bank.
        <br />
        Dana fisik dikelola secara mandiri sesuai kesepakatan bersama.
      </div>
    </div>
  )
}
